const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../middleware/authMiddleware');

module.exports = (pool) => {

    // Follow a user
    router.post('/follow/:userId', verifyToken, asyncHandler(async (req, res) => {
        const followerUserId = req.user.userId;
        const followingUserId = parseInt(req.params.userId);

        if (followerUserId === followingUserId) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        try {
            await pool.query(
                'INSERT INTO user_follows (follower_user_id, following_user_id) VALUES (?, ?)',
                [followerUserId, followingUserId]
            );

            // Update stats
            await updateUserStats(pool, followerUserId);
            await updateUserStats(pool, followingUserId);

            // Create notification
            await pool.query(
                `INSERT INTO notifications (user_id, actor_user_id, notification_type, reference_type, message) 
                 VALUES (?, ?, 'follow', 'profile', 'started following you')`,
                [followingUserId, followerUserId]
            );

            res.json({ message: 'Successfully followed user', following: true });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Already following this user' });
            }
            throw error;
        }
    }));

    // Unfollow a user
    router.delete('/follow/:userId', verifyToken, asyncHandler(async (req, res) => {
        const followerUserId = req.user.userId;
        const followingUserId = parseInt(req.params.userId);

        await pool.query(
            'DELETE FROM user_follows WHERE follower_user_id = ? AND following_user_id = ?',
            [followerUserId, followingUserId]
        );

        // Update stats
        await updateUserStats(pool, followerUserId);
        await updateUserStats(pool, followingUserId);

        res.json({ message: 'Successfully unfollowed user', following: false });
    }));

    // Get follow status
    router.get('/follow-status/:userId', verifyToken, asyncHandler(async (req, res) => {
        const followerUserId = req.user.userId;
        const followingUserId = parseInt(req.params.userId);

        const [rows] = await pool.query(
            'SELECT * FROM user_follows WHERE follower_user_id = ? AND following_user_id = ?',
            [followerUserId, followingUserId]
        );

        res.json({ following: rows.length > 0 });
    }));

    // Get user's followers
    router.get('/followers/:userId', asyncHandler(async (req, res) => {
        const userId = parseInt(req.params.userId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [followers] = await pool.query(
            `SELECT u.user_id, u.full_name, u.email, u.profile_pic_url, u.bio, u.job_title, u.company
             FROM user_follows uf
             JOIN users u ON uf.follower_user_id = u.user_id
             WHERE uf.following_user_id = ?
             ORDER BY uf.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM user_follows WHERE following_user_id = ?',
            [userId]
        );

        res.json({
            followers,
            total: countResult[0].total,
            page,
            totalPages: Math.ceil(countResult[0].total / limit)
        });
    }));

    // Get user's following
    router.get('/following/:userId', asyncHandler(async (req, res) => {
        const userId = parseInt(req.params.userId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [following] = await pool.query(
            `SELECT u.user_id, u.full_name, u.email, u.profile_pic_url, u.bio, u.job_title, u.company
             FROM user_follows uf
             JOIN users u ON uf.following_user_id = u.user_id
             WHERE uf.follower_user_id = ?
             ORDER BY uf.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM user_follows WHERE follower_user_id = ?',
            [userId]
        );

        res.json({
            following,
            total: countResult[0].total,
            page,
            totalPages: Math.ceil(countResult[0].total / limit)
        });
    }));

    // Get user's social profile
    router.get('/profile/:userId', asyncHandler(async (req, res) => {
        const userId = parseInt(req.params.userId);

        // Get user basic info
        const [userRows] = await pool.query(
            `SELECT user_id, full_name, email, profile_pic_url, bio, job_title, company, 
                    city, country, linkedin_profile, graduation_year, major, verification_status, created_at
             FROM users WHERE user_id = ?`,
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0];

        // Get or create social stats
        await ensureUserStats(pool, userId);
        const [statsRows] = await pool.query(
            'SELECT * FROM user_social_stats WHERE user_id = ?',
            [userId]
        );
        const stats = statsRows[0] || {};

        // Get user's threads count
        const [threadsCount] = await pool.query(
            'SELECT COUNT(*) as count FROM threads WHERE user_id = ?',
            [userId]
        );

        // Get user's active stories count
        const [storiesCount] = await pool.query(
            'SELECT COUNT(*) as count FROM stories WHERE user_id = ? AND expires_at > NOW()',
            [userId]
        );

        // Get highlights
        const [highlights] = await pool.query(
            `SELECT h.highlight_id, h.highlight_name, h.cover_image_url, h.created_at,
                    COUNT(DISTINCT hi.story_id) as story_count
             FROM story_highlights h
             LEFT JOIN story_highlight_items hi ON h.highlight_id = hi.highlight_id
             WHERE h.user_id = ?
             GROUP BY h.highlight_id
             ORDER BY h.created_at DESC`,
            [userId]
        );

        res.json({
            user,
            stats: {
                followers: stats.followers_count || 0,
                following: stats.following_count || 0,
                threads: threadsCount[0].count,
                stories: storiesCount[0].count,
                likes_received: stats.total_likes_received || 0,
                comments_received: stats.total_comments_received || 0
            },
            highlights
        });
    }));

    // Get user's threads with stats
    router.get('/threads/:userId', asyncHandler(async (req, res) => {
        const userId = parseInt(req.params.userId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [threads] = await pool.query(
            `SELECT 
                t.thread_id, 
                t.content, 
                t.media_url, 
                t.media_type, 
                t.media_caption,
                t.location,
                t.created_at,
                u.full_name AS author, 
                u.email as author_email,
                u.profile_pic_url,
                u.user_id,
                (SELECT COUNT(*) FROM thread_likes tl WHERE tl.thread_id = t.thread_id) as like_count,
                (SELECT COUNT(*) FROM thread_comments tc WHERE tc.thread_id = t.thread_id) as comment_count,
                (SELECT COUNT(*) FROM thread_shares ts WHERE ts.thread_id = t.thread_id) as share_count
            FROM threads t 
            JOIN users u ON t.user_id = u.user_id 
            WHERE t.user_id = ?
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM threads WHERE user_id = ?',
            [userId]
        );

        res.json({
            threads,
            total: countResult[0].total,
            page,
            totalPages: Math.ceil(countResult[0].total / limit)
        });
    }));

    // Get user's story highlights with stories
    router.get('/highlights/:userId', asyncHandler(async (req, res) => {
        const userId = parseInt(req.params.userId);

        const [highlights] = await pool.query(
            `SELECT h.highlight_id, h.highlight_name, h.cover_image_url, h.created_at
             FROM story_highlights h
             WHERE h.user_id = ?
             ORDER BY h.created_at DESC`,
            [userId]
        );

        // Get stories for each highlight
        for (let highlight of highlights) {
            const [stories] = await pool.query(
                `SELECT s.story_id, s.content, s.media_url, s.media_type, s.background_color, 
                        s.story_type, s.created_at
                 FROM story_highlight_items hi
                 JOIN stories s ON hi.story_id = s.story_id
                 WHERE hi.highlight_id = ?
                 ORDER BY hi.added_at DESC`,
                [highlight.highlight_id]
            );
            highlight.stories = stories;
        }

        res.json({ highlights });
    }));

    // Create a story highlight
    router.post('/highlights', verifyToken, asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const { highlight_name, story_ids } = req.body;

        if (!highlight_name || !story_ids || !Array.isArray(story_ids)) {
            return res.status(400).json({ message: 'Invalid request data' });
        }

        // Create highlight
        const [result] = await pool.query(
            'INSERT INTO story_highlights (user_id, highlight_name) VALUES (?, ?)',
            [userId, highlight_name]
        );

        const highlightId = result.insertId;

        // Add stories to highlight
        for (let storyId of story_ids) {
            await pool.query(
                'INSERT INTO story_highlight_items (highlight_id, story_id) VALUES (?, ?)',
                [highlightId, storyId]
            );
        }

        res.json({ message: 'Highlight created successfully', highlight_id: highlightId });
    }));

    // Delete a story highlight
    router.delete('/highlights/:highlightId', verifyToken, asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const highlightId = parseInt(req.params.highlightId);

        // Verify ownership
        const [highlight] = await pool.query(
            'SELECT * FROM story_highlights WHERE highlight_id = ? AND user_id = ?',
            [highlightId, userId]
        );

        if (highlight.length === 0) {
            return res.status(404).json({ message: 'Highlight not found or unauthorized' });
        }

        await pool.query('DELETE FROM story_highlights WHERE highlight_id = ?', [highlightId]);

        res.json({ message: 'Highlight deleted successfully' });
    }));

    // Get notifications for current user
    router.get('/notifications', verifyToken, asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [notifications] = await pool.query(
            `SELECT n.*, u.full_name as actor_name, u.profile_pic_url as actor_pic
             FROM notifications n
             LEFT JOIN users u ON n.actor_user_id = u.user_id
             WHERE n.user_id = ?
             ORDER BY n.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
            [userId]
        );

        res.json({
            notifications,
            total: countResult[0].total,
            unread: notifications.filter(n => !n.is_read).length
        });
    }));

    // Mark notification as read
    router.put('/notifications/:notificationId/read', verifyToken, asyncHandler(async (req, res) => {
        const notificationId = parseInt(req.params.notificationId);
        const userId = req.user.userId;

        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
            [notificationId, userId]
        );

        res.json({ message: 'Notification marked as read' });
    }));

    return router;
};

// Helper function to update user stats
async function updateUserStats(pool, userId) {
    // Ensure stats row exists
    await ensureUserStats(pool, userId);

    // Update followers count
    const [followersCount] = await pool.query(
        'SELECT COUNT(*) as count FROM user_follows WHERE following_user_id = ?',
        [userId]
    );

    // Update following count
    const [followingCount] = await pool.query(
        'SELECT COUNT(*) as count FROM user_follows WHERE follower_user_id = ?',
        [userId]
    );

    // Update threads count
    const [threadsCount] = await pool.query(
        'SELECT COUNT(*) as count FROM threads WHERE user_id = ?',
        [userId]
    );

    // Update stories count
    const [storiesCount] = await pool.query(
        'SELECT COUNT(*) as count FROM stories WHERE user_id = ? AND expires_at > NOW()',
        [userId]
    );

    // Update total likes received
    const [likesCount] = await pool.query(
        'SELECT COUNT(*) as count FROM thread_likes tl JOIN threads t ON tl.thread_id = t.thread_id WHERE t.user_id = ?',
        [userId]
    );

    // Update total comments received
    const [commentsCount] = await pool.query(
        'SELECT COUNT(*) as count FROM thread_comments tc JOIN threads t ON tc.thread_id = t.thread_id WHERE t.user_id = ?',
        [userId]
    );

    await pool.query(
        `UPDATE user_social_stats 
         SET followers_count = ?, following_count = ?, threads_count = ?, 
             stories_count = ?, total_likes_received = ?, total_comments_received = ?
         WHERE user_id = ?`,
        [
            followersCount[0].count,
            followingCount[0].count,
            threadsCount[0].count,
            storiesCount[0].count,
            likesCount[0].count,
            commentsCount[0].count,
            userId
        ]
    );
}

// Helper function to ensure user stats row exists
async function ensureUserStats(pool, userId) {
    const [existing] = await pool.query(
        'SELECT * FROM user_social_stats WHERE user_id = ?',
        [userId]
    );

    if (existing.length === 0) {
        await pool.query(
            'INSERT INTO user_social_stats (user_id) VALUES (?)',
            [userId]
        );
    }
}
