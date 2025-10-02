-- Additional tables for social feed enhancements

-- User follows table for followers/following system
CREATE TABLE IF NOT EXISTS user_follows (
    follow_id INT AUTO_INCREMENT PRIMARY KEY,
    follower_user_id INT NOT NULL,
    following_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_user_id, following_user_id),
    INDEX idx_follower (follower_user_id),
    INDEX idx_following (following_user_id),
    CHECK (follower_user_id != following_user_id)
);

-- User social stats cache table for performance
CREATE TABLE IF NOT EXISTS user_social_stats (
    user_id INT PRIMARY KEY,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    threads_count INT DEFAULT 0,
    stories_count INT DEFAULT 0,
    total_likes_received INT DEFAULT 0,
    total_comments_received INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Notifications table for social interactions
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    actor_user_id INT,
    notification_type ENUM('follow', 'like', 'comment', 'mention', 'reply', 'share') NOT NULL,
    reference_id INT,
    reference_type ENUM('thread', 'comment', 'story', 'profile'),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_notifications (user_id, is_read, created_at),
    INDEX idx_notification_type (notification_type)
);
