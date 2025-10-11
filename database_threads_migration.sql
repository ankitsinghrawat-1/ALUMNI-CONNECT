-- ====================================================================
-- THREADS TABLE MIGRATION
-- Adds missing columns required by the threads API
-- Run this if you have an existing threads table
-- ====================================================================

-- Fix the title column if it exists with wrong syntax
ALTER TABLE threads MODIFY COLUMN title VARCHAR(200) NOT NULL;

-- Add missing columns (IF NOT EXISTS equivalent - will fail silently if column exists)
ALTER TABLE threads ADD COLUMN IF NOT EXISTS thread_type ENUM('discussion', 'question', 'announcement', 'poll') DEFAULT 'discussion' AFTER title;

ALTER TABLE threads ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT NULL AFTER thread_type;

ALTER TABLE threads ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE AFTER location;

ALTER TABLE threads ADD COLUMN IF NOT EXISTS target_audience ENUM('all', 'alumni', 'students', 'faculty') DEFAULT 'all' AFTER is_anonymous;

ALTER TABLE threads ADD COLUMN IF NOT EXISTS batch_year VARCHAR(20) DEFAULT NULL AFTER target_audience;

ALTER TABLE threads ADD COLUMN IF NOT EXISTS tags VARCHAR(500) DEFAULT NULL AFTER batch_year;

ALTER TABLE threads ADD COLUMN IF NOT EXISTS content_warning ENUM('none', 'sensitive', 'nsfw') DEFAULT 'none' AFTER tags;

ALTER TABLE threads ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP DEFAULT NULL AFTER content_warning;

ALTER TABLE threads ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE AFTER scheduled_at;

ALTER TABLE threads ADD COLUMN IF NOT EXISTS read_time INT DEFAULT 0 AFTER is_published;

-- Add new indexes for better performance
ALTER TABLE threads ADD INDEX IF NOT EXISTS idx_threads_type (thread_type);

ALTER TABLE threads ADD INDEX IF NOT EXISTS idx_threads_category (category);

ALTER TABLE threads ADD INDEX IF NOT EXISTS idx_threads_published (is_published, scheduled_at);

-- Update existing threads to have default values
UPDATE threads SET thread_type = 'discussion' WHERE thread_type IS NULL;
UPDATE threads SET is_anonymous = FALSE WHERE is_anonymous IS NULL;
UPDATE threads SET target_audience = 'all' WHERE target_audience IS NULL;
UPDATE threads SET content_warning = 'none' WHERE content_warning IS NULL;
UPDATE threads SET is_published = TRUE WHERE is_published IS NULL;
UPDATE threads SET read_time = 0 WHERE read_time IS NULL;

-- ====================================================================
-- MIGRATION COMPLETE
-- Your threads table now has all required columns
-- ====================================================================
