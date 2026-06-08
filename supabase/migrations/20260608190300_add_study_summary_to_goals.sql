-- ============================================================
-- Add study_summary column to goals table to store AI summaries
-- ============================================================

ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS study_summary TEXT;
