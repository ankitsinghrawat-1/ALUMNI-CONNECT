-- ====================================================================
-- THREADS TABLE MIGRATION (SAFE VERSION - Compatible with all MySQL versions)
-- Adds missing columns required by the threads API
-- Run this if you have an existing threads table
-- NOTE: Errors for existing columns are normal and can be ignored
-- ====================================================================

-- Fix the title column syntax
ALTER TABLE threads MODIFY COLUMN title VARCHAR(200) NOT NULL;

-- Add missing columns (one at a time - will error if column exists, which is fine)
ALTER TABLE threads ADD COLUMN thread_type ENUM('discussion', 'question', 'announcement', 'poll') DEFAULT 'discussion' AFTER title;

ALTER TABLE threads ADD COLUMN category VARCHAR(100) DEFAULT NULL AFTER thread_type;

ALTER TABLE threads ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE AFTER location;

ALTER TABLE threads ADD COLUMN target_audience ENUM('all', 'alumni', 'students', 'faculty') DEFAULT 'all' AFTER is_anonymous;

ALTER TABLE threads ADD COLUMN batch_year VARCHAR(20) DEFAULT NULL AFTER target_audience;

ALTER TABLE threads ADD COLUMN tags VARCHAR(500) DEFAULT NULL AFTER batch_year;

ALTER TABLE threads ADD COLUMN content_warning ENUM('none', 'sensitive', 'nsfw') DEFAULT 'none' AFTER tags;

ALTER TABLE threads ADD COLUMN scheduled_at TIMESTAMP DEFAULT NULL AFTER content_warning;

ALTER TABLE threads ADD COLUMN is_published BOOLEAN DEFAULT TRUE AFTER scheduled_at;

ALTER TABLE threads ADD COLUMN read_time INT DEFAULT 0 AFTER is_published;

-- Add new indexes for better performance
ALTER TABLE threads ADD INDEX idx_threads_type (thread_type);

ALTER TABLE threads ADD INDEX idx_threads_category (category);

ALTER TABLE threads ADD INDEX idx_threads_published (is_published, scheduled_at);

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
-- 
-- NOTE: If you see "Duplicate column name" errors, that's normal!
-- It means those columns already exist in your table.
-- ====================================================================
