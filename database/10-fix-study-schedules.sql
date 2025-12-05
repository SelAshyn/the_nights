-- ============================================
-- FIX STUDY SCHEDULES TABLE
-- ============================================
-- Add missing columns to study_schedules
-- ============================================

-- Add slots column as JSONB to store schedule data
ALTER TABLE study_schedules
ADD COLUMN IF NOT EXISTS slots JSONB DEFAULT '[]'::jsonb;

-- Add updated_at column
ALTER TABLE study_schedules
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have empty slots if null
UPDATE study_schedules
SET slots = '[]'::jsonb
WHERE slots IS NULL;

-- Update existing records to have current timestamp if null
UPDATE study_schedules
SET updated_at = NOW()
WHERE updated_at IS NULL;

SELECT 'Study schedules table fixed!' as status;
