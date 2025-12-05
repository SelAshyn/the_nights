-- ============================================
-- LEARNING PLANS DATABASE SCHEMA
-- ============================================
-- Description: Tables for study scheles and milestones
-- Version: 1.0
-- Last Updated: 2024
-- ============================================

-- ============================================
-- 1. STUDY SCHEDULES TABLE
-- ============================================
-- Stores weekly study schedules with time slots
CREATE TABLE IF NOT EXISTS study_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slots JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one schedule per user
  CONSTRAINT unique_user_schedule UNIQUE (user_id)
);

-- ============================================
-- 2. MILESTONES TABLE
-- ============================================
-- Stores learning milestones and progress tracking
CREATE TABLE IF NOT EXISTS milestones (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not-started',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. PROFILES TABLE (if not exists)
-- ============================================
-- Stores user profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'mentee',
  grade TEXT,
  interests TEXT[],
  profession TEXT,
  experience TEXT,
  verification_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_study_schedules_user ON study_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Study Schedules Policies
DROP POLICY IF EXISTS "Users can view their own schedule" ON study_schedules;
CREATE POLICY "Users can view their own schedule"
  ON study_schedules FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own schedule" ON study_schedules;
CREATE POLICY "Users can insert their own schedule"
  ON study_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own schedule" ON study_schedules;
CREATE POLICY "Users can update their own schedule"
  ON study_schedules FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own schedule" ON study_schedules;
CREATE POLICY "Users can delete their own schedule"
  ON study_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Mentors can view mentee schedules (through conversations)
DROP POLICY IF EXISTS "Mentors can view mentee schedules" ON study_schedules;
DROP POLICY IF EXISTS "Anyone can view schedules" ON study_schedules;

-- Simplified: Allow viewing schedules if user has conversation with schedule owner
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

-- Milestones Policies
DROP POLICY IF EXISTS "Users can view their own milestones" ON milestones;
CREATE POLICY "Users can view their own milestones"
  ON milestones FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own milestones" ON milestones;
CREATE POLICY "Users can insert their own milestones"
  ON milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own milestones" ON milestones;
CREATE POLICY "Users can update their own milestones"
  ON milestones FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own milestones" ON milestones;
CREATE POLICY "Users can delete their own milestones"
  ON milestones FOR DELETE
  USING (auth.uid() = user_id);

-- Mentors can view mentee milestones (through conversations)
DROP POLICY IF EXISTS "Mentors can view mentee milestones" ON milestones;
DROP POLICY IF EXISTS "Anyone can view milestones" ON milestones;

-- Simplified: Allow viewing milestones if user has conversation with milestone owner
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

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Mentors can view mentee profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- Allow anyone to view all profiles (simplified for functionality)
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Update timestamp on schedule update
CREATE OR REPLACE FUNCTION update_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_schedule_timestamp ON study_schedules;
CREATE TRIGGER trigger_update_schedule_timestamp
BEFORE UPDATE ON study_schedules
FOR EACH ROW
EXECUTE FUNCTION update_schedule_timestamp();

-- Update timestamp on milestone update
CREATE OR REPLACE FUNCTION update_milestone_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_milestone_timestamp ON milestones;
CREATE TRIGGER trigger_update_milestone_timestamp
BEFORE UPDATE ON milestones
FOR EACH ROW
EXECUTE FUNCTION update_milestone_timestamp();

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Get user's schedule
CREATE OR REPLACE FUNCTION get_user_schedule(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  slots JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    study_schedules.id,
    study_schedules.slots,
    study_schedules.created_at,
    study_schedules.updated_at
  FROM study_schedules
  WHERE study_schedules.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's milestones
CREATE OR REPLACE FUNCTION get_user_milestones(p_user_id UUID)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  description TEXT,
  status TEXT,
  progress INTEGER,
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    milestones.id,
    milestones.title,
    milestones.description,
    milestones.status,
    milestones.progress,
    milestones.target_date,
    milestones.created_at,
    milestones.updated_at
  FROM milestones
  WHERE milestones.user_id = p_user_id
  ORDER BY milestones.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTES
-- ============================================
-- 1. Run this file in Supabase SQL Editor
-- 2. Make sure to run 01-chat-tables.sql first (for conversations table)
-- 3. The slots column in study_schedules stores JSON array of schedule slots
-- 4. Mentors can view schedules/milestones of mentees they have conversations with
-- 5. All users can view all profiles (for browsing)

