-- ====================================================================
-- SOCIAL FEED FEATURE ENHANCEMENT DATABASE SCHEMA
-- Professional Social Network Features inspired by LinkedIn and X
-- ====================================================================

-- 1. Thread Bookmarks Table
CREATE TABLE IF NOT EXISTS thread_bookmarks (
    bookmark_id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id INT NOT NULL,
    user_id INT NOT NULL,
    collection_name VARCHAR(100) DEFAULT 'Saved',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_bookmark (thread_id, user_id),
    INDEX idx_thread_bookmarks_user (user_id, created_at),
    INDEX idx_thread_bookmarks_collection (user_id, collection_name)
);

-- 2. Thread Views Table
CREATE TABLE IF NOT EXISTS thread_views (
    view_id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    view_duration_seconds INT DEFAULT 0,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_thread_views_thread (thread_id, viewed_at),
    INDEX idx_thread_views_user (user_id, viewed_at)
);

-- 3. Thread Reports Table
CREATE TABLE IF NOT EXISTS thread_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id INT NOT NULL,
    reporter_user_id INT NOT NULL,
    reason ENUM('spam', 'harassment', 'hate-speech', 'misinformation', 'inappropriate', 'other') NOT NULL,
    description TEXT DEFAULT NULL,
    status ENUM('pending', 'reviewing', 'resolved', 'dismissed') DEFAULT 'pending',
    reviewed_by INT DEFAULT NULL,
    reviewed_at TIMESTAMP DEFAULT NULL,
    resolution_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_thread_reports_status (status, created_at),
    INDEX idx_thread_reports_thread (thread_id)
);

-- 4. Thread Drafts Table
CREATE TABLE IF NOT EXISTS thread_drafts (
    draft_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT DEFAULT NULL,
    media_url VARCHAR(255) DEFAULT NULL,
    media_type ENUM('image', 'video') DEFAULT NULL,
    media_caption TEXT DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    hashtags TEXT DEFAULT NULL,
    mentions TEXT DEFAULT NULL,
    visibility ENUM('public', 'alumni', 'followers', 'private') DEFAULT 'public',
    scheduled_at TIMESTAMP DEFAULT NULL,
    last_edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_thread_drafts_user (user_id, last_edited_at)
);

-- 5. Story Bookmarks Table
CREATE TABLE IF NOT EXISTS story_bookmarks (
    bookmark_id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(story_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_story_bookmark (story_id, user_id),
    INDEX idx_story_bookmarks_user (user_id, created_at)
);

-- 6. User Feed Preferences Table
CREATE TABLE IF NOT EXISTS user_feed_preferences (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    feed_algorithm ENUM('latest', 'trending', 'following', 'recommended') DEFAULT 'recommended',
    show_reposts BOOLEAN DEFAULT TRUE,
    show_replies BOOLEAN DEFAULT TRUE,
    content_filter ENUM('all', 'safe', 'strict') DEFAULT 'safe',
    muted_words TEXT DEFAULT NULL,
    preferred_categories JSON DEFAULT NULL,
    notification_frequency ENUM('instant', 'hourly', 'daily', 'weekly') DEFAULT 'instant',
    email_digest BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 7. Thread Analytics Table
CREATE TABLE IF NOT EXISTS thread_analytics (
    analytics_id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id INT NOT NULL,
    date DATE NOT NULL,
    views_count INT DEFAULT 0,
    unique_views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    bookmarks_count INT DEFAULT 0,
    avg_read_time_seconds INT DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    reach_count INT DEFAULT 0,
    impression_count INT DEFAULT 0,
    click_through_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    UNIQUE KEY unique_thread_analytics (thread_id, date),
    INDEX idx_thread_analytics_date (date),
    INDEX idx_thread_analytics_engagement (engagement_rate DESC)
);

-- 8. Engagement Metrics Table
CREATE TABLE IF NOT EXISTS engagement_metrics (
    metric_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('thread', 'story', 'comment', 'profile') NOT NULL,
    entity_id INT NOT NULL,
    user_id INT NOT NULL,
    action_type ENUM('view', 'like', 'comment', 'share', 'bookmark', 'click', 'hover') NOT NULL,
    duration_seconds INT DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_engagement_entity (entity_type, entity_id, action_type),
    INDEX idx_engagement_user (user_id, created_at),
    INDEX idx_engagement_action (action_type, created_at)
);

-- 9. Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    notify_on_follow BOOLEAN DEFAULT TRUE,
    notify_on_like BOOLEAN DEFAULT TRUE,
    notify_on_comment BOOLEAN DEFAULT TRUE,
    notify_on_mention BOOLEAN DEFAULT TRUE,
    notify_on_share BOOLEAN DEFAULT TRUE,
    notify_on_reply BOOLEAN DEFAULT TRUE,
    notify_on_story_view BOOLEAN DEFAULT FALSE,
    notify_on_story_reaction BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME DEFAULT NULL,
    quiet_hours_end TIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 10. Trending Topics Table
CREATE TABLE IF NOT EXISTS trending_topics (
    trending_id INT AUTO_INCREMENT PRIMARY KEY,
    hashtag_id INT NOT NULL,
    date DATE NOT NULL,
    mention_count INT DEFAULT 0,
    thread_count INT DEFAULT 0,
    user_count INT DEFAULT 0,
    engagement_score INT DEFAULT 0,
    rank_position INT DEFAULT NULL,
    category VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hashtag_id) REFERENCES hashtags(hashtag_id) ON DELETE CASCADE,
    UNIQUE KEY unique_trending (hashtag_id, date),
    INDEX idx_trending_date (date, rank_position),
    INDEX idx_trending_score (engagement_score DESC)
);

-- 11. Thread Reactions Table (Multiple reaction types)
CREATE TABLE IF NOT EXISTS thread_reactions (
    reaction_id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction_type ENUM('like', 'love', 'insightful', 'celebrate', 'support', 'funny') NOT NULL DEFAULT 'like',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_thread_reaction (thread_id, user_id, reaction_type),
    INDEX idx_thread_reactions_thread (thread_id, reaction_type),
    INDEX idx_thread_reactions_user (user_id, created_at)
);

-- 12. Comment Reactions Table
CREATE TABLE IF NOT EXISTS comment_reactions (
    reaction_id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction_type ENUM('like', 'love', 'insightful', 'funny') NOT NULL DEFAULT 'like',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES thread_comments(comment_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_comment_reaction (comment_id, user_id, reaction_type),
    INDEX idx_comment_reactions_comment (comment_id),
    INDEX idx_comment_reactions_user (user_id)
);

-- 13. User Blocked Users Table
CREATE TABLE IF NOT EXISTS user_blocks (
    block_id INT AUTO_INCREMENT PRIMARY KEY,
    blocker_user_id INT NOT NULL,
    blocked_user_id INT NOT NULL,
    reason VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blocker_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_block (blocker_user_id, blocked_user_id),
    INDEX idx_user_blocks_blocker (blocker_user_id),
    INDEX idx_user_blocks_blocked (blocked_user_id)
);

-- 14. User Muted Users Table
CREATE TABLE IF NOT EXISTS user_mutes (
    mute_id INT AUTO_INCREMENT PRIMARY KEY,
    muter_user_id INT NOT NULL,
    muted_user_id INT NOT NULL,
    mute_duration ENUM('temporary', 'permanent') DEFAULT 'permanent',
    unmute_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (muter_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (muted_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_mute (muter_user_id, muted_user_id),
    INDEX idx_user_mutes_muter (muter_user_id),
    INDEX idx_user_mutes_unmute (unmute_at)
);

-- 15. Pinned Threads Table
CREATE TABLE IF NOT EXISTS pinned_threads (
    pin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    thread_id INT NOT NULL,
    pin_order INT DEFAULT 1,
    pinned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    UNIQUE KEY unique_pinned_thread (user_id, thread_id),
    INDEX idx_pinned_threads_user (user_id, pin_order)
);

-- 16. Thread Polls Table
CREATE TABLE IF NOT EXISTS thread_polls (
    poll_id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id INT NOT NULL,
    question TEXT NOT NULL,
    options JSON NOT NULL,
    allow_multiple BOOLEAN DEFAULT FALSE,
    duration_hours INT DEFAULT 24,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    INDEX idx_thread_polls_thread (thread_id),
    INDEX idx_thread_polls_expires (expires_at)
);

-- 17. Poll Votes Table
CREATE TABLE IF NOT EXISTS poll_votes (
    vote_id INT AUTO_INCREMENT PRIMARY KEY,
    poll_id INT NOT NULL,
    user_id INT NOT NULL,
    option_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES thread_polls(poll_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_poll_votes_poll (poll_id),
    INDEX idx_poll_votes_user (user_id)
);

-- 18. Scheduled Threads Table
CREATE TABLE IF NOT EXISTS scheduled_threads (
    scheduled_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    media_url VARCHAR(255) DEFAULT NULL,
    media_type ENUM('image', 'video') DEFAULT NULL,
    media_caption TEXT DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    hashtags TEXT DEFAULT NULL,
    visibility ENUM('public', 'alumni', 'followers', 'private') DEFAULT 'public',
    scheduled_for TIMESTAMP NOT NULL,
    status ENUM('pending', 'posted', 'failed', 'cancelled') DEFAULT 'pending',
    posted_thread_id INT DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (posted_thread_id) REFERENCES threads(thread_id) ON DELETE SET NULL,
    INDEX idx_scheduled_threads_user (user_id, scheduled_for),
    INDEX idx_scheduled_threads_status (status, scheduled_for)
);

-- 19. Thread Tags Table (Categories)
CREATE TABLE IF NOT EXISTS thread_tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(50) NOT NULL UNIQUE,
    tag_slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    icon VARCHAR(50) DEFAULT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    thread_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_thread_tags_slug (tag_slug),
    INDEX idx_thread_tags_active (is_active, thread_count DESC)
);

-- 20. Thread Tag Junction Table
CREATE TABLE IF NOT EXISTS thread_tag_junction (
    thread_id INT NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (thread_id, tag_id),
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES thread_tags(tag_id) ON DELETE CASCADE,
    INDEX idx_thread_tag_junction_tag (tag_id, created_at)
);

-- ====================================================================
-- ALTER EXISTING TABLES TO ADD NEW FIELDS
-- ====================================================================

-- Add new fields to threads table
ALTER TABLE threads 
ADD COLUMN IF NOT EXISTS visibility ENUM('public', 'alumni', 'followers', 'private') DEFAULT 'public' AFTER media_caption,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE AFTER visibility,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE AFTER is_pinned,
ADD COLUMN IF NOT EXISTS edit_count INT DEFAULT 0 AFTER is_featured,
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP DEFAULT NULL AFTER edit_count,
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0 AFTER last_edited_at,
ADD COLUMN IF NOT EXISTS engagement_score INT DEFAULT 0 AFTER view_count,
ADD INDEX idx_threads_visibility (visibility, created_at),
ADD INDEX idx_threads_featured (is_featured, created_at),
ADD INDEX idx_threads_engagement (engagement_score DESC);

-- Add new fields to stories table
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0 AFTER expires_at,
ADD COLUMN IF NOT EXISTS screenshot_count INT DEFAULT 0 AFTER view_count,
ADD COLUMN IF NOT EXISTS share_count INT DEFAULT 0 AFTER screenshot_count,
ADD INDEX idx_stories_view_count (view_count DESC);

-- Add new fields to thread_comments table
ALTER TABLE thread_comments
ADD COLUMN IF NOT EXISTS parent_comment_id INT DEFAULT NULL AFTER thread_id,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE AFTER content,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP DEFAULT NULL AFTER is_edited,
ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0 AFTER edited_at,
ADD FOREIGN KEY (parent_comment_id) REFERENCES thread_comments(comment_id) ON DELETE CASCADE,
ADD INDEX idx_thread_comments_parent (parent_comment_id, created_at);

-- Add new fields to user_social_stats table
ALTER TABLE user_social_stats
ADD COLUMN IF NOT EXISTS total_views INT DEFAULT 0 AFTER total_stories,
ADD COLUMN IF NOT EXISTS total_bookmarks_received INT DEFAULT 0 AFTER total_views,
ADD COLUMN IF NOT EXISTS avg_engagement_rate DECIMAL(5,2) DEFAULT 0.00 AFTER total_bookmarks_received,
ADD COLUMN IF NOT EXISTS profile_views INT DEFAULT 0 AFTER avg_engagement_rate,
ADD COLUMN IF NOT EXISTS reach_count INT DEFAULT 0 AFTER profile_views;

-- ====================================================================
-- INSERT DEFAULT DATA
-- ====================================================================

-- Insert default thread tags
INSERT INTO thread_tags (tag_name, tag_slug, description, icon, color) VALUES
('Career Advice', 'career-advice', 'Career guidance and professional development', 'fa-briefcase', '#3B82F6'),
('Networking', 'networking', 'Connect with alumni and professionals', 'fa-handshake', '#10B981'),
('Industry Insights', 'industry-insights', 'Latest trends and industry news', 'fa-chart-line', '#8B5CF6'),
('Entrepreneurship', 'entrepreneurship', 'Startup and business discussions', 'fa-rocket', '#F59E0B'),
('Job Opportunities', 'job-opportunities', 'Job postings and career opportunities', 'fa-user-tie', '#EF4444'),
('Mentorship', 'mentorship', 'Mentoring and guidance', 'fa-user-graduate', '#06B6D4'),
('Events', 'events', 'Alumni events and meetups', 'fa-calendar', '#EC4899'),
('Success Stories', 'success-stories', 'Alumni achievements and success', 'fa-trophy', '#F97316'),
('Q&A', 'qa', 'Questions and answers', 'fa-question-circle', '#14B8A6'),
('General', 'general', 'General discussions', 'fa-comments', '#6B7280')
ON DUPLICATE KEY UPDATE tag_name = VALUES(tag_name);

-- ====================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ====================================================================

-- Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_thread_views_thread_user ON thread_views(thread_id, user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_composite ON engagement_metrics(entity_type, entity_id, user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_thread_analytics_thread_date ON thread_analytics(thread_id, date DESC);

-- ====================================================================
-- CREATE TRIGGERS FOR AUTO-UPDATE
-- ====================================================================

DELIMITER //

-- Trigger to update thread engagement score
CREATE TRIGGER IF NOT EXISTS update_thread_engagement_score
AFTER INSERT ON thread_likes
FOR EACH ROW
BEGIN
    UPDATE threads 
    SET engagement_score = (
        SELECT COUNT(*) * 10 FROM thread_likes WHERE thread_id = NEW.thread_id
    ) + (
        SELECT COUNT(*) * 5 FROM thread_comments WHERE thread_id = NEW.thread_id
    ) + (
        SELECT COUNT(*) * 3 FROM thread_shares WHERE thread_id = NEW.thread_id
    ) + (
        SELECT COUNT(*) * 2 FROM thread_bookmarks WHERE thread_id = NEW.thread_id
    )
    WHERE thread_id = NEW.thread_id;
END//

-- Trigger to update user social stats
CREATE TRIGGER IF NOT EXISTS update_user_stats_on_thread
AFTER INSERT ON threads
FOR EACH ROW
BEGIN
    INSERT INTO user_social_stats (user_id, total_threads)
    VALUES (NEW.user_id, 1)
    ON DUPLICATE KEY UPDATE 
        total_threads = total_threads + 1,
        last_updated = CURRENT_TIMESTAMP;
END//

DELIMITER ;

-- ====================================================================
-- END OF SOCIAL FEED ENHANCEMENT DATABASE SCHEMA
-- ====================================================================
