-- ====================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- Run this if you get "Unknown column" errors
-- ====================================================================

-- Add total_stories column to user_social_stats if it doesn't exist
ALTER TABLE user_social_stats
ADD COLUMN total_stories INT DEFAULT 0 AFTER stories_count;

-- This command is safe to run multiple times as it will error if column exists
-- Ignore "Duplicate column name" errors if the column already exists
