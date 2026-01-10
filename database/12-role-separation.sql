-- Role Separation and Security Enhancements
-- This file ensures that mentor and mentee roles are properly separated

-- Create a function to validate user roles
CREATE OR REPLACE FUNCTION validate_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure role is either 'mentor' or 'mentee'
  IF NEW.raw_user_meta_data->>'role' NOT IN ('mentor', 'mentee') THEN
    RAISE EXCEPTION 'Invalid role. Must be either mentor or mentee.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to validate roles on user creation/update
DROP TRIGGER IF EXISTS validate_user_role_trigger ON auth.users;
CREATE TRIGGER validate_user_role_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_role();

-- Create a function to prevent role switching
CREATE OR REPLACE FUNCTION prevent_role_switching()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is an update and the role is changing, prevent it
  IF TG_OP = 'UPDATE' AND
     OLD.raw_user_meta_data->>'role' IS NOT NULL AND
     NEW.raw_user_meta_data->>'role' IS NOT NULL AND
     OLD.raw_user_meta_data->>'role' != NEW.raw_user_meta_data->>'role' THEN
    RAISE EXCEPTION 'Role switching is not allowed. Current role: %, Attempted role: %',
                    OLD.raw_user_meta_data->>'role',
                    NEW.raw_user_meta_data->>'role';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent role switching
DROP TRIGGER IF EXISTS prevent_role_switching_trigger ON auth.users;
CREATE TRIGGER prevent_role_switching_trigger
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_switching();

-- Update RLS policies to include role-based access

-- Profiles table - users can only access profiles of their own role type
DROP POLICY IF EXISTS "Users can view profiles of same role" ON profiles;
CREATE POLICY "Users can view profiles of same role" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR
    (
      SELECT auth.jwt() ->> 'role' = role
    )
  );

-- Conversations - ensure mentors and mentees can only chat with each other
DROP POLICY IF EXISTS "Users can access their conversations" ON conversations;
CREATE POLICY "Users can access their conversations" ON conversations
  FOR ALL USING (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );

-- Messages - users can only access messages in their conversations
DROP POLICY IF EXISTS "Users can access messages in their conversations" ON messages;
CREATE POLICY "Users can access messages in their conversations" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- Chat requests - ensure proper role-based access
DROP POLICY IF EXISTS "Users can manage their chat requests" ON chat_requests;
CREATE POLICY "Users can manage their chat requests" ON chat_requests
  FOR ALL USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id
  );

-- User quiz results - mentees only
DROP POLICY IF EXISTS "Mentees can manage their quiz results" ON user_quiz_results;
CREATE POLICY "Mentees can manage their quiz results" ON user_quiz_results
  FOR ALL USING (
    auth.uid() = user_id AND
    (SELECT auth.jwt() ->> 'role') = 'mentee'
  );

-- Study schedules - mentees only
DROP POLICY IF EXISTS "Mentees can manage their study schedules" ON study_schedules;
CREATE POLICY "Mentees can manage their study schedules" ON study_schedules
  FOR ALL USING (
    auth.uid() = user_id AND
    (SELECT auth.jwt() ->> 'role') = 'mentee'
  );

-- Saved careers - mentees only
DROP POLICY IF EXISTS "Mentees can manage their saved careers" ON saved_careers;
CREATE POLICY "Mentees can manage their saved careers" ON saved_careers
  FOR ALL USING (
    auth.uid() = user_id AND
    (SELECT auth.jwt() ->> 'role') = 'mentee'
  );

-- Milestones - mentees only
DROP POLICY IF EXISTS "Mentees can manage their milestones" ON milestones;
CREATE POLICY "Mentees can manage their milestones" ON milestones
  FOR ALL USING (
    auth.uid() = user_id AND
    (SELECT auth.jwt() ->> 'role') = 'mentee'
  );

-- Create indexes for better performance on role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users USING gin ((raw_user_meta_data->>'role'));
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);

-- Create a view for safe user information sharing
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'profession' as profession,
  raw_user_meta_data->>'experience' as experience,
  created_at,
  updated_at
FROM auth.users
WHERE raw_user_meta_data->>'role' IN ('mentor', 'mentee');

-- Grant access to the view
GRANT SELECT ON public.user_profiles TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.user_profiles SET (security_barrier = true);

COMMENT ON VIEW public.user_profiles IS 'Safe view of user profiles with role-based access control';
