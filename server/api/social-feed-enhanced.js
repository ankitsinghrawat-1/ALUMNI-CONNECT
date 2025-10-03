/**
 * Enhanced Social Feed API Routes
 * Professional features for threads, stories, and social interactions
 */

const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../middleware/authMiddleware');

module.exports = (pool) => {
    
    // ====================================================================
    // BOOKMARKS
    // ====================================================================
    
    // Toggle thread bookmark
    router.post('/threads/:threadId/bookmark', verifyToken, asyncHandler(async (req, res) => {
        const { threadId } = req.params;
        const userId = req.user.userId;
        
        // Check if already bookmarked
        const [existing] = await pool.query(
            'SELECT * FROM thread_bookmarks WHERE thread_id = ? AND user_id = ?',
            [threadId, userId]
        );
        
        if (existing.length > 0) {
            // Remove bookmark
            await pool.query(
                'DELETE FROM thread_bookmarks WHERE thread_id = ? AND user_id = ?',
                [threadId, userId]
            );
            res.json({ bookmarked: false, message: 'Bookmark removed' });
        } else {
            // Add bookmark
            await pool.query(
                'INSERT INTO thread_bookmarks (thread_id, user_id) VALUES (?, ?)',
                [threadId, userId]
            );
            res.json({ bookmarked: true, message: 'Thread bookmarked' });
        }
    }));
    
    // Get user's bookmarks
    router.get('/bookmarks', verifyToken, asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const [bookmarks] = await pool.query(`
            SELECT 
                t.*,
                u.full_name as author,
                u.profile_pic_url,
                u.email as author_email,
                tb.created_at as bookmarked_at,
                (SELECT COUNT(*) FROM thread_likes WHERE thread_id = t.thread_id) as like_count,
                (SELECT COUNT(*) FROM thread_comments WHERE thread_id = t.thread_id) as comment_count,
                (SELECT COUNT(*) FROM thread_shares WHERE thread_id = t.thread_id) as share_count
            FROM thread_bookmarks tb
            JOIN threads t ON tb.thread_id = t.thread_id
            JOIN users u ON t.user_id = u.user_id
            WHERE tb.user_id = ?
            ORDER BY tb.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);
        
        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM thread_bookmarks WHERE user_id = ?',
            [userId]
        );
        
        res.json({
            bookmarks,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    }));
    
    // ====================================================================
    // REACTIONS
    // ====================================================================
    
    // Add or update thread reaction
    router.post('/threads/:threadId/react', verifyToken, asyncHandler(async (req, res) => {
        const { threadId } = req.params;
        const { reactionType } = req.body; // 'like', 'love', 'insightful', 'celebrate', 'support', 'funny'
        const userId = req.user.userId;
        
        // Check if already reacted
        const [existing] = await pool.query(
            'SELECT * FROM thread_reactions WHERE thread_id = ? AND user_id = ? AND reaction_type = ?',
            [threadId, userId, reactionType]
        );
        
        if (existing.length > 0) {
            // Remove reaction
            await pool.query(
                'DELETE FROM thread_reactions WHERE thread_id = ? AND user_id = ? AND reaction_type = ?',
                [threadId, userId, reactionType]
            );
            res.json({ reacted: false, message: 'Reaction removed' });
        } else {
            // Remove any other reactions from this user
            await pool.query(
                'DELETE FROM thread_reactions WHERE thread_id = ? AND user_id = ?',
                [threadId, userId]
            );
            
            // Add new reaction
            await pool.query(
                'INSERT INTO thread_reactions (thread_id, user_id, reaction_type) VALUES (?, ?, ?)',
                [threadId, userId, reactionType]
            );
            res.json({ reacted: true, reactionType, message: 'Reaction added' });
        }
    }));
    
    // Get thread reactions summary
    router.get('/threads/:threadId/reactions', asyncHandler(async (req, res) => {
        const { threadId } = req.params;
        
        const [reactions] = await pool.query(`
            SELECT 
                reaction_type,
                COUNT(*) as count
            FROM thread_reactions
            WHERE thread_id = ?
            GROUP BY reaction_type
            ORDER BY count DESC
        `, [threadId]);
        
        const [total] = await pool.query(
            'SELECT COUNT(*) as total FROM thread_reactions WHERE thread_id = ?',
            [threadId]
        );
        
        res.json({
            reactions,
            total: total[0].total
        });
    }));
    
    // ====================================================================
    // THREAD VIEWS
    // ====================================================================
    
    // Record thread view
    router.post('/threads/:threadId/view', asyncHandler(async (req, res) => {
        const { threadId } = req.params;
        const userId = req.user?.userId || null;
        const ipAddress = req.ip;
        const userAgent = req.get('user-agent');
        
        // Check if already viewed recently (within last hour)
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        const [existing] = await pool.query(
            'SELECT * FROM thread_views WHERE thread_id = ? AND (user_id = ? OR ip_address = ?) AND viewed_at > ?',
            [threadId, userId, ipAddress, oneHourAgo]
        );
        
        if (existing.length === 0) {
            await pool.query(
                'INSERT INTO thread_views (thread_id, user_id, ip_address, user_agent) VALUES (?, ?, ?, ?)',
                [threadId, userId, ipAddress, userAgent]
            );
            
            // Update view count in threads table
            await pool.query(
                'UPDATE threads SET view_count = view_count + 1 WHERE thread_id = ?',
                [threadId]
            );
        }
        
        res.json({ success: true });
    }));
    
    // ====================================================================
    // TRENDING & DISCOVERY
    // ====================================================================
    
    // Get trending threads
    router.get('/trending', asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const timeRange = req.query.timeRange || 'week'; // 'day', 'week', 'month'
        
        let dateFilter = '';
        switch(timeRange) {
            case 'day':
                dateFilter = 'AND t.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)';
                break;
            case 'week':
                dateFilter = 'AND t.created_at > DATE_SUB(NOW(), INTERVAL 1 WEEK)';
                break;
            case 'month':
                dateFilter = 'AND t.created_at > DATE_SUB(NOW(), INTERVAL 1 MONTH)';
                break;
        }
        
        const [threads] = await pool.query(`
            SELECT 
                t.*,
                u.full_name as author,
                u.profile_pic_url,
                u.email as author_email,
                (SELECT COUNT(*) FROM thread_likes WHERE thread_id = t.thread_id) as like_count,
                (SELECT COUNT(*) FROM thread_comments WHERE thread_id = t.thread_id) as comment_count,
                (SELECT COUNT(*) FROM thread_shares WHERE thread_id = t.thread_id) as share_count,
                t.engagement_score
            FROM threads t
            JOIN users u ON t.user_id = u.user_id
            WHERE 1=1 ${dateFilter}
            ORDER BY t.engagement_score DESC, t.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        res.json({ threads });
    }));
    
    // Get trending hashtags
    router.get('/trending/hashtags', asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 10;
        
        const [hashtags] = await pool.query(`
            SELECT 
                h.tag_name,
                h.hashtag_id,
                COUNT(DISTINCT th.thread_id) as thread_count,
                COUNT(DISTINCT t.user_id) as user_count
            FROM hashtags h
            JOIN thread_hashtags th ON h.hashtag_id = th.hashtag_id
            JOIN threads t ON th.thread_id = t.thread_id
            WHERE t.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY h.hashtag_id, h.tag_name
            ORDER BY thread_count DESC, user_count DESC
            LIMIT ?
        `, [limit]);
        
        res.json({ hashtags });
    }));
    
    // ====================================================================
    // REPORTS
    // ====================================================================
    
    // Report a thread
    router.post('/threads/:threadId/report', verifyToken, asyncHandler(async (req, res) => {
        const { threadId } = req.params;
        const { reason, description } = req.body;
        const userId = req.user.userId;
        
        // Check if already reported
        const [existing] = await pool.query(
            'SELECT * FROM thread_reports WHERE thread_id = ? AND reporter_user_id = ?',
            [threadId, userId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ message: 'You have already reported this thread' });
        }
        
        await pool.query(
            'INSERT INTO thread_reports (thread_id, reporter_user_id, reason, description) VALUES (?, ?, ?, ?)',
            [threadId, userId, reason, description]
        );
        
        res.json({ message: 'Thread reported successfully' });
    }));
    
    // ====================================================================
    // ANALYTICS
    // ====================================================================
    
    // Get thread analytics
    router.get('/threads/:threadId/analytics', verifyToken, asyncHandler(async (req, res) => {
        const { threadId } = req.params;
        const userId = req.user.userId;
        
        // Check if user owns the thread
        const [thread] = await pool.query(
            'SELECT user_id FROM threads WHERE thread_id = ?',
            [threadId]
        );
        
        if (thread.length === 0) {
            return res.status(404).json({ message: 'Thread not found' });
        }
        
        if (thread[0].user_id !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        // Get analytics data
        const [analytics] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM thread_views WHERE thread_id = ?) as total_views,
                (SELECT COUNT(DISTINCT user_id) FROM thread_views WHERE thread_id = ? AND user_id IS NOT NULL) as unique_views,
                (SELECT COUNT(*) FROM thread_likes WHERE thread_id = ?) as total_likes,
                (SELECT COUNT(*) FROM thread_comments WHERE thread_id = ?) as total_comments,
                (SELECT COUNT(*) FROM thread_shares WHERE thread_id = ?) as total_shares,
                (SELECT COUNT(*) FROM thread_bookmarks WHERE thread_id = ?) as total_bookmarks,
                (SELECT engagement_score FROM threads WHERE thread_id = ?) as engagement_score
        `, [threadId, threadId, threadId, threadId, threadId, threadId, threadId]);
        
        // Get views over time (last 7 days)
        const [viewsOverTime] = await pool.query(`
            SELECT 
                DATE(viewed_at) as date,
                COUNT(*) as views
            FROM thread_views
            WHERE thread_id = ? AND viewed_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(viewed_at)
            ORDER BY date ASC
        `, [threadId]);
        
        res.json({
            ...analytics[0],
            viewsOverTime
        });
    }));
    
    // ====================================================================
    // SEARCH
    // ====================================================================
    
    // Advanced thread search
    router.get('/search', asyncHandler(async (req, res) => {
        const query = req.query.q || '';
        const category = req.query.category;
        const sortBy = req.query.sortBy || 'relevance'; // 'relevance', 'latest', 'popular'
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        let orderBy = 't.created_at DESC';
        if (sortBy === 'popular') {
            orderBy = 't.engagement_score DESC, t.created_at DESC';
        } else if (sortBy === 'latest') {
            orderBy = 't.created_at DESC';
        }
        
        let categoryFilter = '';
        if (category && category !== '') {
            categoryFilter = 'AND t.location = ?';
        }
        
        const queryParams = category && category !== '' 
            ? [`%${query}%`, `%${query}%`, category, limit, offset]
            : [`%${query}%`, `%${query}%`, limit, offset];
        
        const [threads] = await pool.query(`
            SELECT 
                t.*,
                u.full_name as author,
                u.profile_pic_url,
                u.email as author_email,
                (SELECT COUNT(*) FROM thread_likes WHERE thread_id = t.thread_id) as like_count,
                (SELECT COUNT(*) FROM thread_comments WHERE thread_id = t.thread_id) as comment_count,
                (SELECT COUNT(*) FROM thread_shares WHERE thread_id = t.thread_id) as share_count
            FROM threads t
            JOIN users u ON t.user_id = u.user_id
            WHERE (t.content LIKE ? OR u.full_name LIKE ?)
            ${categoryFilter}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `, queryParams);
        
        res.json({ threads, page, limit });
    }));
    
    // Search users for mentions
    router.get('/users/search', asyncHandler(async (req, res) => {
        const query = req.query.q || '';
        const limit = parseInt(req.query.limit) || 10;
        
        const [users] = await pool.query(`
            SELECT 
                user_id,
                full_name,
                email,
                profile_pic_url,
                job_title,
                company
            FROM users
            WHERE full_name LIKE ? OR email LIKE ?
            LIMIT ?
        `, [`%${query}%`, `%${query}%`, limit]);
        
        res.json({ users });
    }));
    
    // Search hashtags
    router.get('/hashtags/search', asyncHandler(async (req, res) => {
        const query = req.query.q || '';
        const limit = parseInt(req.query.limit) || 10;
        
        const [hashtags] = await pool.query(`
            SELECT 
                h.hashtag_id,
                h.tag_name,
                COUNT(DISTINCT th.thread_id) as thread_count
            FROM hashtags h
            LEFT JOIN thread_hashtags th ON h.hashtag_id = th.hashtag_id
            WHERE h.tag_name LIKE ?
            GROUP BY h.hashtag_id, h.tag_name
            ORDER BY thread_count DESC
            LIMIT ?
        `, [`%${query}%`, limit]);
        
        res.json({ hashtags });
    }));
    
    // ====================================================================
    // THREAD DRAFTS
    // ====================================================================
    
    // Save thread draft
    router.post('/drafts', verifyToken, asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const { content, media_url, media_type, location, hashtags, mentions, visibility } = req.body;
        
        await pool.query(
            `INSERT INTO thread_drafts (user_id, content, media_url, media_type, location, hashtags, mentions, visibility)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, content, media_url, media_type, location, hashtags, mentions, visibility]
        );
        
        res.json({ message: 'Draft saved successfully' });
    }));
    
    // Get user's drafts
    router.get('/drafts', verifyToken, asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        
        const [drafts] = await pool.query(`
            SELECT * FROM thread_drafts
            WHERE user_id = ?
            ORDER BY last_edited_at DESC
        `, [userId]);
        
        res.json({ drafts });
    }));
    
    // Delete draft
    router.delete('/drafts/:draftId', verifyToken, asyncHandler(async (req, res) => {
        const { draftId } = req.params;
        const userId = req.user.userId;
        
        await pool.query(
            'DELETE FROM thread_drafts WHERE draft_id = ? AND user_id = ?',
            [draftId, userId]
        );
        
        res.json({ message: 'Draft deleted successfully' });
    }));
    
    return router;
};
