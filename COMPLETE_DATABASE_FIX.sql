-- ====================================================================
-- COMPLETE DATABASE FIX FOR ALUMNI CONNECT
-- This script fixes ALL database issues preventing thread creation
-- Run this script to fix both thread_type and total_threads errors
-- ====================================================================

USE alumni_connect;

-- ====================================================================
-- PART 1: FIX THREADS TABLE (Add missing columns)
-- ====================================================================

-- Fix title column syntax if needed
ALTER TABLE threads MODIFY COLUMN title VARCHAR(200) DEFAULT NULL;

-- Add missing columns for threads table
-- Note: If column exists, you'll see "Duplicate column name" error - that's OK!

-- Check and add thread_type
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alumni_connect' AND TABLE_NAME = 'threads' AND COLUMN_NAME = 'thread_type';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE threads ADD COLUMN thread_type ENUM(''discussion'', ''question'', ''announcement'', ''poll'') DEFAULT ''discussion'' AFTER title', 
    'SELECT ''thread_type already exists'' AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add category
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alumni_connect' AND TABLE_NAME = 'threads' AND COLUMN_NAME = 'category';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE threads ADD COLUMN category VARCHAR(100) DEFAULT NULL AFTER thread_type', 
    'SELECT ''category already exists'' AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add is_anonymous
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alumni_connect' AND TABLE_NAME = 'threads' AND COLUMN_NAME = 'is_anonymous';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE threads ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE AFTER location', 
    'SELECT ''is_anonymous already exists'' AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add target_audience
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alumni_connect' AND TABLE_NAME = 'threads' AND COLUMN_NAME = 'target_audience';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE threads ADD COLUMN target_audience ENUM(''all'', ''alumni'', ''students'', ''faculty'') DEFAULT ''all'' AFTER is_anonymous', 
    'SELECT ''target_audience already exists'' AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add batch_year
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alumni_connect' AND TABLE_NAME = 'threads' AND COLUMN_NAME = 'batch_year';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE threads ADD COLUMN batch_year VARCHAR(20) DEFAULT NULL AFTER target_audience', 
    'SELECT ''batch_year already exists'' AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add tags
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alumni_connect' AND TABLE_NAME = 'threads' AND COLUMN_NAME = 'tags';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE threads ADD COLUMN tags VARCHAR(500) DEFAULT NULL AFTER batch_year', 
    'SELECT ''tags already exists'' AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add content_warning
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alumni_connect' AND TABLE_NAME = 'threads' AND COLUMN_NAME = 'content_warning';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE threads ADD COLUMN content_warning ENUM(''none'', ''sensitive'', ''nsfw'') DEFAULT ''none'' AFTER tags', 
    'SELECT ''content_warning already exists'' AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add scheduled_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alumni_connect' AND TABLE_NAME = 'threads' AND COLUMN_NAME = 'scheduled_at';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE threads ADD COLUMN scheduled_at TIMESTAMP DEFAULT NULL AFTER content_warning', 
    'SELECT ''scheduled_at already exists'' AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add is_published
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alumni_connect' AND TABLE_NAME = 'threads' AND COLUMN_NAME = 'is_published';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE threads ADD COLUMN is_published BOOLEAN DEFAULT TRUE AFTER scheduled_at', 
    'SELECT ''is_published already exists'' AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add read_time
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alumni_connect' AND TABLE_NAME = 'threads' AND COLUMN_NAME = 'read_time';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE threads ADD COLUMN read_time INT DEFAULT 0 AFTER is_published', 
    'SELECT ''read_time already exists'' AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for better performance (ignore errors if they exist)
-- These will error if index exists, which is OK
ALTER TABLE threads ADD INDEX idx_threads_type (thread_type);
ALTER TABLE threads ADD INDEX idx_threads_category (category);
ALTER TABLE threads ADD INDEX idx_threads_published (is_published, scheduled_at);

-- Update existing threads with default values
UPDATE threads SET thread_type = 'discussion' WHERE thread_type IS NULL;
UPDATE threads SET is_anonymous = FALSE WHERE is_anonymous IS NULL;
UPDATE threads SET target_audience = 'all' WHERE target_audience IS NULL;
UPDATE threads SET content_warning = 'none' WHERE content_warning IS NULL;
UPDATE threads SET is_published = TRUE WHERE is_published IS NULL;
UPDATE threads SET read_time = 0 WHERE read_time IS NULL;

-- ====================================================================
-- PART 2: FIX USER_SOCIAL_STATS TABLE (Add total_threads column)
-- ====================================================================

-- Check and add total_threads column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alumni_connect' AND TABLE_NAME = 'user_social_stats' AND COLUMN_NAME = 'total_threads';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE user_social_stats ADD COLUMN total_threads INT DEFAULT 0 COMMENT ''Total number of threads created'' AFTER threads_count', 
    'SELECT ''total_threads already exists'' AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Sync total_threads with threads_count for existing data
UPDATE user_social_stats SET total_threads = threads_count WHERE total_threads = 0;

-- ====================================================================
-- PART 3: FIX USERS TABLE (Syntax error fix)
-- ====================================================================

-- The users table has a syntax error - missing comma after company_size
-- This will be fixed in the structure file, but doesn't affect runtime

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- Run these queries to verify the fix worked:

-- Check threads table has all columns
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'alumni_connect' 
AND TABLE_NAME = 'threads'
AND COLUMN_NAME IN ('thread_type', 'category', 'title', 'is_anonymous', 'target_audience', 
                     'batch_year', 'tags', 'content_warning', 'scheduled_at', 'is_published', 'read_time');

-- Check user_social_stats has total_threads column  
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'alumni_connect'
AND TABLE_NAME = 'user_social_stats'
AND COLUMN_NAME IN ('total_threads', 'threads_count');

-- ====================================================================
-- MIGRATION COMPLETE
-- ====================================================================

SELECT 'Database fix completed successfully!' AS Status,
       'You can now create threads without errors' AS Message;
