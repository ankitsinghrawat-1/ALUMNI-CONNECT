# Social Feed Feature Documentation

## Overview
The social feed feature is a comprehensive social networking system within the AlumniConnect platform that allows users to:
- Create and share posts (threads)
- View and interact with stories
- Follow other users
- Organize stories into highlights
- Track social engagement metrics

## New Database Tables

### 1. user_follows
Manages follower/following relationships between users.

```sql
CREATE TABLE IF NOT EXISTS user_follows (
    follow_id INT AUTO_INCREMENT PRIMARY KEY,
    follower_user_id INT NOT NULL,
    following_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_user_id, following_user_id),
    CHECK (follower_user_id != following_user_id)
);
```

### 2. user_social_stats
Caches social statistics for each user for performance.

```sql
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
```

### 3. notifications
Tracks social interactions and alerts users.

```sql
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
    FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

## API Endpoints

### Social Profile Endpoints

#### GET /api/social/profile/:userId
Get a user's complete social profile including stats and highlights.

**Response:**
```json
{
  "user": {
    "user_id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "bio": "Software Engineer",
    "profile_pic_url": "uploads/profile-pic.jpg",
    "verification_status": "verified"
  },
  "stats": {
    "followers": 150,
    "following": 200,
    "threads": 45,
    "stories": 12,
    "likes_received": 1200,
    "comments_received": 450
  },
  "highlights": [...]
}
```

#### POST /api/social/follow/:userId
Follow a user. Requires authentication.

**Response:**
```json
{
  "message": "Successfully followed user",
  "following": true
}
```

#### DELETE /api/social/follow/:userId
Unfollow a user. Requires authentication.

**Response:**
```json
{
  "message": "Successfully unfollowed user",
  "following": false
}
```

#### GET /api/social/follow-status/:userId
Check if current user follows a specific user. Requires authentication.

**Response:**
```json
{
  "following": true
}
```

#### GET /api/social/followers/:userId
Get a user's followers list with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "followers": [...],
  "total": 150,
  "page": 1,
  "totalPages": 8
}
```

#### GET /api/social/following/:userId
Get a user's following list with pagination.

#### GET /api/social/threads/:userId
Get all threads created by a user with pagination.

#### GET /api/social/highlights/:userId
Get a user's story highlights with associated stories.

**Response:**
```json
{
  "highlights": [
    {
      "highlight_id": 1,
      "highlight_name": "Travel",
      "cover_image_url": "...",
      "stories": [...]
    }
  ]
}
```

#### POST /api/social/highlights
Create a new story highlight. Requires authentication.

**Request Body:**
```json
{
  "highlight_name": "My Travels",
  "story_ids": [1, 2, 3, 4]
}
```

#### DELETE /api/social/highlights/:highlightId
Delete a story highlight. Requires authentication.

#### GET /api/social/notifications
Get notifications for the current user. Requires authentication.

**Response:**
```json
{
  "notifications": [...],
  "total": 50,
  "unread": 12
}
```

#### PUT /api/social/notifications/:notificationId/read
Mark a notification as read. Requires authentication.

## Pages

### social-profile.html
The main social profile page that displays:
- User profile header with cover photo
- Profile picture, name, and verification badge
- Bio and job information
- Social statistics (posts, followers, following, likes)
- Follow/unfollow button
- Message button
- Link to full profile
- Story highlights section
- Tabbed interface with:
  - Posts: Grid view of all user posts
  - Threads: List view of all user threads
  - Stories: Active stories from the user
  - Activity: Engagement statistics

### Integration Points

#### threads.html
- Updated to link user avatars and names to social profiles
- Click on any user's avatar or name opens their social profile

#### thread-detail.html
- Author information links to social profile
- Added button to view social profile alongside full profile

#### view-profile.html
- Added "View Social Profile" button
- Links to social-profile.html with user ID

## CSS Styling

### social-profile.css
Comprehensive responsive styling for the social profile page including:
- Profile header with gradient cover
- Floating profile avatar
- Stats section with hover effects
- Story highlights carousel
- Tabbed navigation
- Post grid layout
- Activity cards
- Connection modals
- Responsive breakpoints for mobile devices

## JavaScript Files

### social-profile.js
Main functionality for the social profile page:
- Load user profile data
- Handle follow/unfollow interactions
- Display posts in grid format
- Show followers/following lists
- Manage story highlights
- Tab switching logic
- Modal interactions

## Usage

### Viewing a Social Profile
```javascript
// Navigate to social profile
window.location.href = `social-profile.html?userId=${userId}`;
```

### Following a User
```javascript
// Follow a user
await window.api.post(`/social/follow/${userId}`);

// Unfollow a user
await window.api.delete(`/social/follow/${userId}`);
```

### Creating a Highlight
```javascript
await window.api.post('/social/highlights', {
  highlight_name: 'Best Moments',
  story_ids: [1, 2, 3]
});
```

## Features Implemented

### Core Features
- ✅ User following system
- ✅ Social profile page with comprehensive user information
- ✅ Followers/following lists with pagination
- ✅ Story highlights system
- ✅ Post grid view
- ✅ Thread list view
- ✅ Activity statistics
- ✅ Follow/unfollow functionality
- ✅ Notification system for social interactions
- ✅ Integration with existing threads and stories
- ✅ Responsive design for mobile and desktop

### User Interface
- ✅ Modern, clean design with smooth animations
- ✅ Profile cover with gradient overlay
- ✅ Floating profile picture
- ✅ Verification badge display
- ✅ Interactive statistics
- ✅ Tabbed content organization
- ✅ Modal dialogs for connections
- ✅ Loading states and skeleton screens
- ✅ Empty states with helpful messages

### Performance
- ✅ Cached social statistics
- ✅ Paginated API responses
- ✅ Optimized database queries
- ✅ Lazy loading for images

## Next Steps

### Planned Enhancements
- Add suggested users feature
- Implement mutual followers
- Add privacy controls for profile visibility
- Implement blocking/muting functionality
- Add activity timeline
- Create trending posts algorithm
- Add post statistics dashboard
- Implement content moderation tools
- Add search functionality
- Create mobile app views

## Database Updates Required

To use this feature, run the SQL script:
```bash
mysql -u your_username -p your_database < database_updates.sql
```

Or manually execute the SQL commands in the database_updates.sql file.

## Configuration

No additional configuration is required. The feature uses the existing authentication and API infrastructure.

## Security

- All protected endpoints require JWT authentication
- User can only follow/unfollow when logged in
- Users can only create/delete their own highlights
- Input validation on all endpoints
- SQL injection prevention through parameterized queries
- XSS prevention through HTML sanitization

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome for Android)

## Troubleshooting

### Common Issues

1. **Profile not loading**
   - Ensure user_id parameter is provided in URL
   - Check database tables are created
   - Verify API endpoints are accessible

2. **Follow button not working**
   - Ensure user is logged in
   - Check JWT token is valid
   - Verify user_follows table exists

3. **Stats not updating**
   - Stats are cached and update on follow/unfollow actions
   - Manually refresh stats if needed through social stats update

## Support

For issues or questions, please contact the development team or create an issue in the repository.
