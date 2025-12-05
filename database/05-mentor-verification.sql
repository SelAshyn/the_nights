-- ============================================
-- MENTOR VERIFICATION SYSTEM
-- ============================================
-- Description: Tables for mentor veri approval
-- Version: 1.0
-- ============================================

-- ============================================
-- 1. MENTOR VERIFICATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS mentor_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  profession TEXT NOT NULL,
  experience TEXT NOT NULL,
  company TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  credentials TEXT,

  -- Verification status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_mentor_verifications_user_id ON mentor_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_verifications_status ON mentor_verifications(status);
CREATE INDEX IF NOT EXISTS idx_mentor_verifications_created ON mentor_verifications(created_at DESC);

-- ============================================
-- 3. TRIGGER: UPDATE TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION update_mentor_verification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mentor_verification_timestamp
BEFORE UPDATE ON mentor_verifications
FOR EACH ROW
EXECUTE FUNCTION update_mentor_verification_timestamp();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE mentor_verifications ENABLE ROW LEVEL SECURITY;

-- Mentors can view their own verification status
CREATE POLICY "Mentors can view own verification"
  ON mentor_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Mentors can insert their own verification request
CREATE POLICY "Mentors can insert own verification"
  ON mentor_verifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update verification status (you'll need to create admin role)
-- For now, we'll allow service role to update
CREATE POLICY "Service role can update verifications"
  ON mentor_verifications
  FOR UPDATE
  USING (true);

-- ============================================
-- 5. FUNCTION: CHECK MENTOR VERIFICATION STATUS
-- ============================================
CREATE OR REPLACE FUNCTION get_mentor_verification_status(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
  FROM mentor_verifications
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_status, 'not_submitted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

