-- ============================================
-- UPDATE SAVED CAREERS TABLE
-- ============================================
-- Add new columns to saved_careers table
-- Run this if the table already exists
-- ============================================

-- Add new columns if they don't exist
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

-- Remove old columns that are replaced
ALTER TABLE saved_careers
DROP COLUMN IF EXISTS skills_required;

SELECT 'Saved careers table updated successfully!' as status;
