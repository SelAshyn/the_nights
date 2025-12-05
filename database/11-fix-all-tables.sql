-- ============================================
-- FIX ALL TABLES - ADD MISSING COLUMNS
-- ============================================
-- Run this to add all missing columns at once
-- ============================================

-- Fix study_schedules table
ALTER TABLE study_schedules
ADD COLUMN IF NOT EXISTS slots JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix milestones table
ALTER TABLE milestones
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix saved_careers table
ALTER TABLE saved_careers
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS field_of_study TEXT,
ADD COLUMN IF NOT EXISTS top_skills TEXT[],
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS possible_job_titles TEXT[],
ADD COLUMN IF NOT EXISTS universities TEXT[],
ADD COLUMN IF NOT EXISTS extracurriculars TEXT[],
ADD COLUMN IF NOT EXISTS financial_guidance TEXT[],
ADD COLUMN IF NOT EXISTS fit_score INTEGER;

-- Remove old column from saved_careers
ALTER TABLE saved_careers
DROP COLUMN IF EXISTS skills_required;

-- Update existing records with default values
UPDATE study_schedules
SET slots = '[]'::jsonb
WHERE slots IS NULL;

UPDATE study_schedules
SET updated_at = NOW()
WHERE updated_at IS NULL;

UPDATE milestones
SET updated_at = NOW()
WHERE updated_at IS NULL;

SELECT 'All tables fixed successfully!' as status;
