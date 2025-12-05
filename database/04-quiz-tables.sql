-- ============================================
-- QUIZ SYSTEM DATABASE SCHEMA
-- ============================================
-- Description: Tables for storing uresults
-- Version: 1.0
-- ============================================

-- ============================================
-- 1. USER QUIZ RESULTS TABLE
-- ============================================
-- Stores quiz responses and career profile data per user
CREATE TABLE IF NOT EXISTS user_quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,

  -- Basic Info
  grade TEXT,
  career_interest TEXT,

  -- Academic Profile (stored as JSONB for flexibility)
  academic_interests JSONB DEFAULT '[]'::jsonb,
  academic_strengths JSONB DEFAULT '[]'::jsonb,

  -- Preferences
  preferred_environment TEXT,
  task_preference TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  tech_confidence TEXT,
  work_life TEXT,
  career_motivation TEXT,
  study_goal TEXT,

  -- Career Suggestions (cached AI results)
  career_suggestions JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one active quiz result per user
  CONSTRAINT unique_user_quiz UNIQUE (user_id)
);

-- ============================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quiz_user_id ON user_quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_created ON user_quiz_results(created_at DESC);

-- ============================================
-- 3. TRIGGER: UPDATE TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION update_quiz_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quiz_timestamp
BEFORE UPDATE ON user_quiz_results
FOR EACH ROW
EXECUTE FUNCTION update_quiz_timestamp();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE user_quiz_results ENABLE ROW LEVEL SECURITY;

-- Users can only read their own quiz results
CREATE POLICY "Users can view own quiz results"
  ON user_quiz_results
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own quiz results
CREATE POLICY "Users can insert own quiz results"
  ON user_quiz_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own quiz results
CREATE POLICY "Users can update own quiz results"
  ON user_quiz_results
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own quiz results
CREATE POLICY "Users can delete own quiz results"
  ON user_quiz_results
  FOR DELETE
  USING (auth.uid() = user_id);

