-- ==============================================================================
-- SOCIAL FEED ENHANCEMENTS - DATABASE UPDATES
-- ==============================================================================
-- This file contains database schema updates for the social feed feature
-- enhancement including follow system, social stats, and enhanced notifications.
-- 
-- IMPORTANT: Run this file AFTER ensuring your database matches database_structure.txt
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USER FOLLOWS TABLE - New table for followers/following system
-- ------------------------------------------------------------------------------
-- This table manages the follower/following relationships between users
-- allowing users to follow each other for social networking features.

CREATE TABLE IF NOT EXISTS user_follows (
    follow_id INT AUTO_INCREMENT PRIMARY KEY,
    follower_user_id INT NOT NULL COMMENT 'User who is following',
    following_user_id INT NOT NULL COMMENT 'User being followed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_user_id, following_user_id),
    INDEX idx_follower (follower_user_id),
    INDEX idx_following (following_user_id),
    CHECK (follower_user_id != following_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Manages follower/following relationships between users';


-- ------------------------------------------------------------------------------
-- 2. USER SOCIAL STATS TABLE - New table for performance optimization
-- ------------------------------------------------------------------------------
-- This table caches social statistics for each user to improve performance
-- and reduce the need for complex aggregation queries on every page load.

CREATE TABLE IF NOT EXISTS user_social_stats (
    user_id INT PRIMARY KEY,
    followers_count INT DEFAULT 0 COMMENT 'Number of followers',
    following_count INT DEFAULT 0 COMMENT 'Number of users being followed',
    threads_count INT DEFAULT 0 COMMENT 'Number of threads created',
    stories_count INT DEFAULT 0 COMMENT 'Number of active stories',
    total_likes_received INT DEFAULT 0 COMMENT 'Total likes received on all content',
    total_comments_received INT DEFAULT 0 COMMENT 'Total comments received on all content',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_stats_updated (last_updated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cached social statistics for performance optimization';


-- ------------------------------------------------------------------------------
-- 3. NOTIFICATIONS TABLE ENHANCEMENTS - Alter existing table
-- ------------------------------------------------------------------------------
-- The notifications table already exists in the database. We need to add
-- new columns to support social interactions (follows, likes, comments, etc.)
-- This uses IF NOT EXISTS checks to avoid errors if columns already exist.

-- Add actor_user_id column (who performed the action)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS actor_user_id INT NULL COMMENT 'User who triggered the notification' AFTER user_id,
ADD CONSTRAINT fk_notifications_actor 
    FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Add notification_type column (type of notification)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) NULL COMMENT 'Type: follow, like, comment, mention, reply, share' AFTER actor_user_id;

-- Add reference_id column (ID of related object)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS reference_id INT NULL COMMENT 'ID of the related object (thread, comment, story)' AFTER notification_type;

-- Add reference_type column (type of related object)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50) NULL COMMENT 'Type: thread, comment, story, profile' AFTER reference_id;

-- Add indexes for better performance
ALTER TABLE notifications 
ADD INDEX IF NOT EXISTS idx_user_notifications (user_id, is_read, created_at);

ALTER TABLE notifications 
ADD INDEX IF NOT EXISTS idx_notification_type (notification_type);

ALTER TABLE notifications 
ADD INDEX IF NOT EXISTS idx_actor_user (actor_user_id);


-- ------------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ------------------------------------------------------------------------------
-- Run these queries after applying the updates to verify the changes:
--
-- 1. Verify user_follows table:
--    DESCRIBE user_follows;
--    SELECT COUNT(*) as follows_table_exists FROM information_schema.tables 
--    WHERE table_schema = DATABASE() AND table_name = 'user_follows';
--
-- 2. Verify user_social_stats table:
--    DESCRIBE user_social_stats;
--    SELECT COUNT(*) as stats_table_exists FROM information_schema.tables 
--    WHERE table_schema = DATABASE() AND table_name = 'user_social_stats';
--
-- 3. Verify notifications table updates:
--    DESCRIBE notifications;
--    SHOW INDEX FROM notifications;
--
-- ------------------------------------------------------------------------------
