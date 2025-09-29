# Database Migrations for Enhanced Thread and Story Features

## Overview
This document outlines the database schema changes required to implement enhanced thread functionality and story features for the Alumni Connect platform.

## Migration 1: Enhanced Thread Features

### 1.1 Modify Threads Table
Add new columns to support enhanced thread features:

```sql
-- Add new columns to threads table
ALTER TABLE threads 
ADD COLUMN media_caption TEXT DEFAULT NULL AFTER media_type,
ADD COLUMN location VARCHAR(255) DEFAULT NULL AFTER media_caption,
ADD INDEX idx_location (location);
```

### 1.2 Create Hashtags System

```sql
-- Create hashtags table
CREATE TABLE IF NOT EXISTS hashtags (
    hashtag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tag_name (tag_name)
);

-- Create thread hashtags junction table
CREATE TABLE IF NOT EXISTS thread_hashtags (
    thread_id INT NOT NULL,
    hashtag_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (thread_id, hashtag_id),
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (hashtag_id) REFERENCES hashtags(hashtag_id) ON DELETE CASCADE,
    INDEX idx_thread_id (thread_id),
    INDEX idx_hashtag_id (hashtag_id)
);
```

### 1.3 Create Mentions System

```sql
-- Create thread mentions table
CREATE TABLE IF NOT EXISTS thread_mentions (
    mention_id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id INT NOT NULL,
    mentioned_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (mentioned_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_mention (thread_id, mentioned_user_id),
    INDEX idx_thread_id (thread_id),
    INDEX idx_mentioned_user_id (mentioned_user_id)
);
```

## Migration 2: Story Features

### 2.1 Create Stories System

```sql
-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
    story_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT DEFAULT NULL,
    media_url VARCHAR(255) DEFAULT NULL,
    media_type ENUM('image', 'video') DEFAULT NULL,
    background_color VARCHAR(7) DEFAULT NULL,
    text_color VARCHAR(7) DEFAULT '#FFFFFF',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at)
);

-- Create story views tracking table
CREATE TABLE IF NOT EXISTS story_views (
    view_id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    viewer_user_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(story_id) ON DELETE CASCADE,
    FOREIGN KEY (viewer_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_view (story_id, viewer_user_id),
    INDEX idx_story_id (story_id),
    INDEX idx_viewer_user_id (viewer_user_id)
);
```

## Key Features Enabled

### Thread Enhancements
1. **Media Captions**: Users can add descriptive captions to their media uploads
2. **Location Tagging**: Users can add location information to their posts
3. **Hashtags**: Support for discoverable hashtags (#example)
4. **Mentions**: Support for mentioning other users (@username)

### Story Features
1. **Temporary Content**: Stories expire after 24 hours
2. **Media Stories**: Support for image and video stories
3. **Text Stories**: Support for text-only stories with custom backgrounds
4. **View Tracking**: Track who has viewed each story
5. **Story Discovery**: Stories appear in a horizontal feed

## Data Relationships

### Hashtags
- Many-to-many relationship between threads and hashtags
- Hashtags are reusable across multiple threads
- Automatic hashtag extraction from thread content

### Mentions
- Many-to-many relationship between threads and users
- Notifications can be sent to mentioned users
- Automatic mention extraction from thread content

### Stories
- One-to-many relationship between users and stories
- Stories automatically expire after 24 hours
- View tracking for engagement metrics

## Indexing Strategy

### Performance Optimizations
- Index on thread location for location-based queries
- Index on hashtag names for hashtag searches
- Index on story expiration times for cleanup operations
- Composite indexes for junction tables

### Query Optimization
- Efficient hashtag trending queries
- Fast mention lookups
- Optimized story feed generation
- Location-based thread discovery

## Migration Steps

1. **Backup Database**: Always backup before migrations
2. **Apply in Order**: Execute migrations in the order specified
3. **Test Functionality**: Verify all features work after migration
4. **Monitor Performance**: Check query performance after adding indexes
5. **Cleanup**: Remove expired stories periodically

## Rollback Plan

If rollback is needed:
1. Drop new tables in reverse order
2. Remove new columns from existing tables
3. Restore from backup if necessary

## Future Considerations

### Potential Enhancements
- Story reactions/emojis
- Story highlights (permanent stories)
- Location-based story discovery
- Hashtag trending algorithms
- Advanced mention notifications