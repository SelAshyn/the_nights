-- ============================================
-- QUICK FIX FOR MENTOR VIEWING MENTEE DATA
-- ============================================
-- Run this in Supabase SQL Editor to fix RLS policies
-- This allows mentors to view their mentees' profiles, schedules, and milestones
-- ============================================

-- Fix Profiles Table Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Mentors can view mentee profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- Allow anyone to view all profiles (for browsing mentors/mentees)
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can still update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Fix Study Schedules Policies
DROP POLICY IF EXISTS "Mentors can view mentee schedules" ON study_schedules;
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

-- Fix Milestones Policies
DROP POLICY IF EXISTS "Mentors can view mentee milestones" ON milestones;
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

-- Verify the policies are working
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'study_schedules', 'milestones')
ORDER BY tablename, policyname;
