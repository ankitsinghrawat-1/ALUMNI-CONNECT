-- Enhanced Stories Database Structure for Advanced Features

-- Update existing stories table to add new columns
ALTER TABLE stories ADD COLUMN story_type ENUM('text', 'photo', 'video', 'poll') DEFAULT 'text';
ALTER TABLE stories ADD COLUMN privacy_level ENUM('public', 'alumni', 'close-friends', 'private') DEFAULT 'public';
ALTER TABLE stories ADD COLUMN allow_reactions BOOLEAN DEFAULT TRUE;
ALTER TABLE stories ADD COLUMN allow_replies BOOLEAN DEFAULT TRUE;
ALTER TABLE stories ADD COLUMN allow_screenshot BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN location VARCHAR(255) DEFAULT NULL;
ALTER TABLE stories ADD COLUMN text_effect ENUM('none', 'shadow', 'outline', 'glow') DEFAULT 'none';

-- Poll-specific columns
ALTER TABLE stories ADD COLUMN poll_question TEXT DEFAULT NULL;
ALTER TABLE stories ADD COLUMN poll_options JSON DEFAULT NULL;
ALTER TABLE stories ADD COLUMN poll_allow_multiple BOOLEAN DEFAULT FALSE;

-- Story likes table
CREATE TABLE IF NOT EXISTS story_likes (
    like_id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(story_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_story_like (story_id, user_id),
    INDEX idx_story_likes_story_id (story_id),
    INDEX idx_story_likes_user_id (user_id)
);

-- Story replies table
CREATE TABLE IF NOT EXISTS story_replies (
    reply_id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(story_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_story_replies_story_id (story_id),
    INDEX idx_story_replies_user_id (user_id)
);

-- Story mentions table
CREATE TABLE IF NOT EXISTS story_mentions (
    mention_id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    mentioned_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(story_id) ON DELETE CASCADE,
    FOREIGN KEY (mentioned_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_story_mention (story_id, mentioned_user_id),
    INDEX idx_story_mentions_story_id (story_id),
    INDEX idx_story_mentions_user_id (mentioned_user_id)
);

-- Story poll votes table
CREATE TABLE IF NOT EXISTS story_poll_votes (
    vote_id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    user_id INT NOT NULL,
    option_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(story_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_story_poll_votes_story_id (story_id),
    INDEX idx_story_poll_votes_user_id (user_id)
);

-- Story reactions table (for future emoji reactions)
CREATE TABLE IF NOT EXISTS story_reactions (
    reaction_id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction_type ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry', 'fire', 'clap') DEFAULT 'like',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(story_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_story_reaction (story_id, user_id, reaction_type),
    INDEX idx_story_reactions_story_id (story_id),
    INDEX idx_story_reactions_user_id (user_id)
);

-- Story templates table (for predefined templates)
CREATE TABLE IF NOT EXISTS story_templates (
    template_id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    template_type ENUM('graduation', 'achievement', 'networking', 'career', 'announcement', 'celebration') NOT NULL,
    background_color VARCHAR(7) NOT NULL,
    text_color VARCHAR(7) NOT NULL,
    text_effect ENUM('none', 'shadow', 'outline', 'glow') DEFAULT 'none',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_story_templates_type (template_type)
);

-- Insert default story templates
INSERT INTO story_templates (template_name, template_type, background_color, text_color, text_effect) VALUES
('Graduation Blue', 'graduation', '#4facfe', '#ffffff', 'glow'),
('Achievement Gold', 'achievement', '#fa709a', '#ffffff', 'shadow'),
('Networking Green', 'networking', '#a8edea', '#333333', 'outline'),
('Career Purple', 'career', '#ff9a9e', '#ffffff', 'none'),
('Announcement Orange', 'announcement', '#ffc3a0', '#333333', 'shadow'),
('Celebration Pink', 'celebration', '#fd746c', '#ffffff', 'glow');

-- Story drafts table (for saved drafts)
CREATE TABLE IF NOT EXISTS story_drafts (
    draft_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    story_type ENUM('text', 'photo', 'video', 'poll') DEFAULT 'text',
    content TEXT DEFAULT NULL,
    background_color VARCHAR(7) DEFAULT NULL,
    text_color VARCHAR(7) DEFAULT NULL,
    text_effect ENUM('none', 'shadow', 'outline', 'glow') DEFAULT 'none',
    privacy_level ENUM('public', 'alumni', 'close-friends', 'private') DEFAULT 'public',
    location VARCHAR(255) DEFAULT NULL,
    poll_question TEXT DEFAULT NULL,
    poll_options JSON DEFAULT NULL,
    mentioned_users JSON DEFAULT NULL,
    settings JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_story_drafts_user_id (user_id)
);

-- Story analytics table (for detailed analytics)
CREATE TABLE IF NOT EXISTS story_analytics (
    analytics_id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    total_views INT DEFAULT 0,
    total_likes INT DEFAULT 0,
    total_replies INT DEFAULT 0,
    total_shares INT DEFAULT 0,
    unique_viewers INT DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(story_id) ON DELETE CASCADE,
    UNIQUE KEY unique_story_analytics (story_id)
);

-- Story shares table (for tracking shares)
CREATE TABLE IF NOT EXISTS story_shares (
    share_id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    user_id INT NOT NULL,
    share_type ENUM('direct', 'external', 'embed') DEFAULT 'direct',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(story_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_story_shares_story_id (story_id),
    INDEX idx_story_shares_user_id (user_id)
);

-- Close friends list table
CREATE TABLE IF NOT EXISTS user_close_friends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    friend_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (friend_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_close_friend (user_id, friend_user_id),
    INDEX idx_close_friends_user_id (user_id),
    INDEX idx_close_friends_friend_id (friend_user_id)
);

-- Story highlights table (for saving stories permanently)
CREATE TABLE IF NOT EXISTS story_highlights (
    highlight_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    highlight_name VARCHAR(100) NOT NULL,
    cover_image_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_story_highlights_user_id (user_id)
);

-- Story highlight items table
CREATE TABLE IF NOT EXISTS story_highlight_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    highlight_id INT NOT NULL,
    story_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (highlight_id) REFERENCES story_highlights(highlight_id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(story_id) ON DELETE CASCADE,
    UNIQUE KEY unique_highlight_story (highlight_id, story_id),
    INDEX idx_highlight_items_highlight_id (highlight_id),
    INDEX idx_highlight_items_story_id (story_id)
);

-- Create indexes for better performance
CREATE INDEX idx_stories_type_privacy ON stories(story_type, privacy_level);
CREATE INDEX idx_stories_user_created ON stories(user_id, created_at);
CREATE INDEX idx_stories_expires_created ON stories(expires_at, created_at);

-- Create triggers to automatically update story analytics
DELIMITER //

CREATE TRIGGER update_story_analytics_after_view
AFTER INSERT ON story_views
FOR EACH ROW
BEGIN
    INSERT INTO story_analytics (story_id, total_views, unique_viewers)
    VALUES (NEW.story_id, 1, 1)
    ON DUPLICATE KEY UPDATE
        total_views = total_views + 1,
        unique_viewers = (SELECT COUNT(DISTINCT viewer_user_id) FROM story_views WHERE story_id = NEW.story_id);
END//

CREATE TRIGGER update_story_analytics_after_like
AFTER INSERT ON story_likes
FOR EACH ROW
BEGIN
    INSERT INTO story_analytics (story_id, total_likes)
    VALUES (NEW.story_id, 1)
    ON DUPLICATE KEY UPDATE
        total_likes = total_likes + 1;
END//

CREATE TRIGGER update_story_analytics_after_unlike
AFTER DELETE ON story_likes
FOR EACH ROW
BEGIN
    UPDATE story_analytics
    SET total_likes = total_likes - 1
    WHERE story_id = OLD.story_id;
END//

CREATE TRIGGER update_story_analytics_after_reply
AFTER INSERT ON story_replies
FOR EACH ROW
BEGIN
    INSERT INTO story_analytics (story_id, total_replies)
    VALUES (NEW.story_id, 1)
    ON DUPLICATE KEY UPDATE
        total_replies = total_replies + 1;
END//

DELIMITER ;