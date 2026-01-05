-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR NOW
-- ============================================
-- This will fix all permission issues AND create profiles for existing users
-- Copy everything below and paste in Supabase SQL Editor, then click RUN
-- ============================================

-- ============================================
-- PART 1: AUTO-CREATE PROFILES TRIGGER
-- ============================================
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'mentee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PART 2: BACKFILL EXISTING USERS
-- ============================================
-- Create profiles for any existing users who don't have one
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  COALESCE(u.raw_user_meta_data->>'role', 'mentee')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PART 3: POLICIES
-- ============================================
-- 1. Allow everyone to view profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- 2. Allow viewing schedules if you own it or have a conversation
DROP POLICY IF EXISTS "Anyone can view schedules" ON study_schedules;
CREATE POLICY "Anyone can view schedules"
  ON study_schedules FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM conversations
      WHERE (user1_id = auth.uid() AND user2_id = study_schedules.user_id)
         OR (user2_id = auth.uid() AND user1_id = study_schedules.user_id)
    )
  );

-- 3. Allow viewing milestones if you own it or have a conversation
DROP POLICY IF EXISTS "Anyone can view milestones" ON milestones;
CREATE POLICY "Anyone can view milestones"
  ON milestones FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM conversations
      WHERE (user1_id = auth.uid() AND user2_id = milestones.user_id)
         OR (user2_id = auth.uid() AND user1_id = milestones.user_id)
    )
  );

-- 4. Allow users to insert their own schedule
DROP POLICY IF EXISTS "Users can insert their own schedule" ON study_schedules;
CREATE POLICY "Users can insert their own schedule"
  ON study_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Allow users to update their own schedule
DROP POLICY IF EXISTS "Users can update their own schedule" ON study_schedules;
CREATE POLICY "Users can update their own schedule"
  ON study_schedules FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Allow users to insert their own milestones
DROP POLICY IF EXISTS "Users can insert their own milestones" ON milestones;
CREATE POLICY "Users can insert their own milestones"
  ON milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. Allow users to update their own milestones
DROP POLICY IF EXISTS "Users can update their own milestones" ON milestones;
CREATE POLICY "Users can update their own milestones"
  ON milestones FOR UPDATE
  USING (auth.uid() = user_id);

-- 8. Allow users to delete their own milestones
DROP POLICY IF EXISTS "Users can delete their own milestones" ON milestones;
CREATE POLICY "Users can delete their own milestones"
  ON milestones FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PART 4: SAVED CAREERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_careers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  career_title TEXT NOT NULL,
  career_description TEXT,
  education TEXT,
  field_of_study TEXT,
  top_skills TEXT[],
  certifications TEXT[],
  possible_job_titles TEXT[],
  universities TEXT[],
  extracurriculars TEXT[],
  financial_guidance TEXT[],
  career_path TEXT,
  salary_range TEXT,
  growth_potential TEXT,
  fit_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_careers_user ON saved_careers(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_careers_created ON saved_careers(created_at DESC);

-- Saved careers policies
DROP POLICY IF EXISTS "Users can view their own saved careers" ON saved_careers;
CREATE POLICY "Users can view their own saved careers"
  ON saved_careers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save careers" ON saved_careers;
CREATE POLICY "Users can save careers"
  ON saved_careers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove saved careers" ON saved_careers;
CREATE POLICY "Users can remove saved careers"
  ON saved_careers FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PART 5: ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_careers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 5: CHAT FUNCTIONS
-- ============================================
-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM messages m
  INNER JOIN conversations c ON m.conversation_id = c.id
  WHERE (c.user1_id = p_user_id OR c.user2_id = p_user_id)
    AND m.sender_id != p_user_id
    AND m.is_read = FALSE;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET is_read = TRUE
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user1_id UUID,
  p_user2_id UUID,
  p_user1_name TEXT DEFAULT NULL,
  p_user2_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_smaller_id UUID;
  v_larger_id UUID;
BEGIN
  -- Ensure consistent ordering (smaller UUID first)
  IF p_user1_id < p_user2_id THEN
    v_smaller_id := p_user1_id;
    v_larger_id := p_user2_id;
  ELSE
    v_smaller_id := p_user2_id;
    v_larger_id := p_user1_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE (user1_id = v_smaller_id AND user2_id = v_larger_id)
     OR (user1_id = v_larger_id AND user2_id = v_smaller_id);

  -- If not found, create new conversation
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id, user1_name, user2_name)
    VALUES (v_smaller_id, v_larger_id, p_user1_name, p_user2_name)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: VERIFY IT WORKED
-- ============================================
SELECT 'All fixes applied successfully!' as status;

-- Check your data
SELECT
  'Profiles' as table_name,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT
  'Conversations' as table_name,
  COUNT(*) as count
FROM conversations
UNION ALL
SELECT
  'Milestones' as table_name,
  COUNT(*) as count
FROM milestones
UNION ALL
SELECT
  'Schedules' as table_name,
  COUNT(*) as count
FROM study_schedules;

-- Debug: Show all conversations (to verify they exist)
SELECT
  c.id,
  p1.full_name as user1_name,
  p1.email as user1_email,
  p2.full_name as user2_name,
  p2.email as user2_email,
  c.created_at
FROM conversations c
LEFT JOIN profiles p1 ON c.user1_id = p1.id
LEFT JOIN profiles p2 ON c.user2_id = p2.id
ORDER BY c.created_at DESC;
