-- ============================================
ENTORS TABLE
-- ============================================
-- Description: Allows users to save/bookmark mentors
-- Version: 1.0
-- ============================================

-- Create saved_mentors table
CREATE TABLE IF NOT EXISTS saved_mentors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure a user can't save the same mentor twice
  CONSTRAINT unique_saved_mentor UNIQUE (user_id, mentor_id),

  -- Ensure user can't save themselves
  CONSTRAINT no_self_save CHECK (user_id != mentor_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_mentors_user ON saved_mentors(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_mentors_mentor ON saved_mentors(mentor_id);
CREATE INDEX IF NOT EXISTS idx_saved_mentors_created ON saved_mentors(created_at DESC);

-- Enable RLS
ALTER TABLE saved_mentors ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own saved mentors" ON saved_mentors;
CREATE POLICY "Users can view their own saved mentors"
  ON saved_mentors FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save mentors" ON saved_mentors;
CREATE POLICY "Users can save mentors"
  ON saved_mentors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove saved mentors" ON saved_mentors;
CREATE POLICY "Users can remove saved mentors"
  ON saved_mentors FOR DELETE
  USING (auth.uid() = user_id);
