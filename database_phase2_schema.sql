-- ====================================================================
-- SOCIAL FEED PHASE 2 DATABASE SCHEMA
-- Real-time features, reactions, quality tracking, and co-authoring
-- ====================================================================

-- 1. Thread Reactions Table
CREATE TABLE IF NOT EXISTS thread_reactions (
    reaction_id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction_type ENUM('like', 'love', 'insightful', 'celebrate', 'support', 'funny') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_reaction (thread_id, user_id),
    INDEX idx_thread_reactions_thread (thread_id, created_at),
    INDEX idx_thread_reactions_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Thread Co-Authors Table
CREATE TABLE IF NOT EXISTS thread_coauthors (
    coauthor_id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id INT NOT NULL,
    user_id INT NOT NULL,
    added_by INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_coauthor (thread_id, user_id),
    INDEX idx_thread_coauthors_thread (thread_id),
    INDEX idx_thread_coauthors_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Thread Quality Scores Table
CREATE TABLE IF NOT EXISTS thread_quality_scores (
    score_id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id INT NOT NULL UNIQUE,
    quality_score INT NOT NULL,
    word_count INT DEFAULT 0,
    hashtag_count INT DEFAULT 0,
    mention_count INT DEFAULT 0,
    has_media BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    INDEX idx_quality_scores_score (quality_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Comment Reactions Table
CREATE TABLE IF NOT EXISTS comment_reactions (
    reaction_id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction_type ENUM('like', 'love', 'insightful', 'celebrate', 'support', 'funny') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES thread_comments(comment_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_comment_reaction (comment_id, user_id),
    INDEX idx_comment_reactions_comment (comment_id, created_at),
    INDEX idx_comment_reactions_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Milestone Tracking Table
CREATE TABLE IF NOT EXISTS user_milestones (
    milestone_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    thread_id INT DEFAULT NULL,
    milestone_type ENUM('promotion', 'new_job', 'graduation', 'certification', 'award', 'publication', 'patent', 'founded', 'launched', 'other') NOT NULL,
    milestone_title VARCHAR(255) NOT NULL,
    milestone_description TEXT DEFAULT NULL,
    celebration_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE SET NULL,
    INDEX idx_milestones_user (user_id, created_at),
    INDEX idx_milestones_type (milestone_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Real-time Activity Log Table
CREATE TABLE IF NOT EXISTS realtime_activity_log (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_type ENUM('view', 'typing', 'reaction', 'comment', 'share') NOT NULL,
    thread_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    session_id VARCHAR(100) DEFAULT NULL,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_activity_thread (thread_id, created_at),
    INDEX idx_activity_user (user_id, created_at),
    INDEX idx_activity_type (activity_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Hashtag Statistics Table
CREATE TABLE IF NOT EXISTS hashtag_statistics (
    hashtag_id INT AUTO_INCREMENT PRIMARY KEY,
    hashtag VARCHAR(100) NOT NULL UNIQUE,
    usage_count INT DEFAULT 1,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    trending_score FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_hashtags_usage (usage_count DESC),
    INDEX idx_hashtags_trending (trending_score DESC),
    INDEX idx_hashtags_recent (last_used_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. User Engagement Metrics Table (for analytics)
CREATE TABLE IF NOT EXISTS user_engagement_metrics (
    metric_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    threads_created INT DEFAULT 0,
    comments_made INT DEFAULT 0,
    reactions_given INT DEFAULT 0,
    reactions_received INT DEFAULT 0,
    threads_viewed INT DEFAULT 0,
    time_spent_minutes INT DEFAULT 0,
    engagement_score FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date),
    INDEX idx_engagement_user (user_id, date),
    INDEX idx_engagement_score (engagement_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================

-- Add indexes to existing tables for better query performance
ALTER TABLE threads ADD INDEX idx_threads_created (created_at DESC);
ALTER TABLE threads ADD INDEX idx_threads_user (user_id, created_at DESC);
ALTER TABLE thread_comments ADD INDEX idx_comments_thread (thread_id, created_at DESC);

-- ====================================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- ====================================================================

-- Procedure to increment hashtag usage
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS increment_hashtag_usage(IN hashtag_text VARCHAR(100))
BEGIN
    INSERT INTO hashtag_statistics (hashtag, usage_count, last_used_at)
    VALUES (hashtag_text, 1, NOW())
    ON DUPLICATE KEY UPDATE
        usage_count = usage_count + 1,
        last_used_at = NOW(),
        trending_score = trending_score + (1.0 / TIMESTAMPDIFF(HOUR, last_used_at, NOW()) + 1);
END//
DELIMITER ;

-- Procedure to update user engagement metrics
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS update_user_engagement(
    IN p_user_id INT,
    IN p_date DATE,
    IN p_threads INT,
    IN p_comments INT,
    IN p_reactions_given INT,
    IN p_reactions_received INT
)
BEGIN
    INSERT INTO user_engagement_metrics (
        user_id, date, threads_created, comments_made, 
        reactions_given, reactions_received, engagement_score
    )
    VALUES (
        p_user_id, p_date, p_threads, p_comments,
        p_reactions_given, p_reactions_received,
        (p_threads * 10 + p_comments * 5 + p_reactions_given * 2 + p_reactions_received * 3)
    )
    ON DUPLICATE KEY UPDATE
        threads_created = threads_created + p_threads,
        comments_made = comments_made + p_comments,
        reactions_given = reactions_given + p_reactions_given,
        reactions_received = reactions_received + p_reactions_received,
        engagement_score = engagement_score + (p_threads * 10 + p_comments * 5 + p_reactions_given * 2 + p_reactions_received * 3);
END//
DELIMITER ;

-- ====================================================================
-- DATA MIGRATION NOTES
-- ====================================================================
-- After running this script, you may want to:
-- 1. Migrate existing thread likes to thread_reactions table
-- 2. Calculate initial quality scores for existing threads
-- 3. Extract and populate hashtag_statistics from existing thread content
-- 4. Set up scheduled jobs to update trending scores

-- Example migration query for likes:
-- INSERT INTO thread_reactions (thread_id, user_id, reaction_type)
-- SELECT thread_id, user_id, 'like'
-- FROM thread_likes
-- ON DUPLICATE KEY UPDATE reaction_type = 'like';

-- ====================================================================
-- INDEXES COMPLETE - DATABASE READY FOR PHASE 2
-- ====================================================================
