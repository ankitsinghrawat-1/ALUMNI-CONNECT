// server/api/social-feed-phase2.js
// Phase 2: Advanced Social Feed Features - Backend API
// Real-time features, reactions, quality tracking, and co-authoring

const express = require('express');
const router = express.Router();
const pool = require('../server');
const { verifyToken } = require('../middleware/authMiddleware');

// ====================================================================
// THREAD REACTIONS API
// ====================================================================

/**
 * Add or update a reaction to a thread
 * POST /api/social-feed-phase2/threads/:threadId/react
 */
router.post('/threads/:threadId/react', verifyToken, async (req, res) => {
    const { threadId } = req.params;
    const { reaction_type } = req.body; // like, love, insightful, celebrate, support, funny
    const userId = req.user.userId;

    try {
        // Check if thread exists
        const [threads] = await pool.query(
            'SELECT thread_id FROM threads WHERE thread_id = ?',
            [threadId]
        );

        if (threads.length === 0) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        // Check if user already reacted
        const [existing] = await pool.query(
            'SELECT reaction_id, reaction_type FROM thread_reactions WHERE thread_id = ? AND user_id = ?',
            [threadId, userId]
        );

        if (existing.length > 0) {
            // If same reaction, remove it (toggle off)
            if (existing[0].reaction_type === reaction_type) {
                await pool.query(
                    'DELETE FROM thread_reactions WHERE reaction_id = ?',
                    [existing[0].reaction_id]
                );

                // Get updated counts
                const [counts] = await pool.query(
                    'SELECT reaction_type, COUNT(*) as count FROM thread_reactions WHERE thread_id = ? GROUP BY reaction_type',
                    [threadId]
                );

                return res.json({
                    message: 'Reaction removed',
                    removed: true,
                    reaction_type,
                    counts: counts.reduce((acc, row) => {
                        acc[row.reaction_type] = parseInt(row.count);
                        return acc;
                    }, {})
                });
            }

            // Update to new reaction type
            await pool.query(
                'UPDATE thread_reactions SET reaction_type = ?, created_at = NOW() WHERE reaction_id = ?',
                [reaction_type, existing[0].reaction_id]
            );
        } else {
            // Create new reaction
            await pool.query(
                'INSERT INTO thread_reactions (thread_id, user_id, reaction_type) VALUES (?, ?, ?)',
                [threadId, userId, reaction_type]
            );
        }

        // Get updated counts
        const [counts] = await pool.query(
            'SELECT reaction_type, COUNT(*) as count FROM thread_reactions WHERE thread_id = ? GROUP BY reaction_type',
            [threadId]
        );

        // Get total reactions
        const [total] = await pool.query(
            'SELECT COUNT(*) as total FROM thread_reactions WHERE thread_id = ?',
            [threadId]
        );

        res.json({
            message: 'Reaction added successfully',
            reaction_type,
            total_reactions: parseInt(total[0].total),
            counts: counts.reduce((acc, row) => {
                acc[row.reaction_type] = parseInt(row.count);
                return acc;
            }, {})
        });

    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({ message: 'Failed to add reaction' });
    }
});

/**
 * Get reactions for a thread
 * GET /api/social-feed-phase2/threads/:threadId/reactions
 */
router.get('/threads/:threadId/reactions', async (req, res) => {
    const { threadId } = req.params;

    try {
        // Get reaction counts
        const [counts] = await pool.query(
            'SELECT reaction_type, COUNT(*) as count FROM thread_reactions WHERE thread_id = ? GROUP BY reaction_type',
            [threadId]
        );

        // Get total
        const [total] = await pool.query(
            'SELECT COUNT(*) as total FROM thread_reactions WHERE thread_id = ?',
            [threadId]
        );

        // Get user's reaction if authenticated
        let userReaction = null;
        if (req.user) {
            const [user] = await pool.query(
                'SELECT reaction_type FROM thread_reactions WHERE thread_id = ? AND user_id = ?',
                [threadId, req.user.userId]
            );
            if (user.length > 0) {
                userReaction = user[0].reaction_type;
            }
        }

        res.json({
            total_reactions: parseInt(total[0].total),
            counts: counts.reduce((acc, row) => {
                acc[row.reaction_type] = parseInt(row.count);
                return acc;
            }, {}),
            user_reaction: userReaction
        });

    } catch (error) {
        console.error('Error fetching reactions:', error);
        res.status(500).json({ message: 'Failed to fetch reactions' });
    }
});

// ====================================================================
// THREAD CO-AUTHORING API
// ====================================================================

/**
 * Add co-author to a thread
 * POST /api/social-feed-phase2/threads/:threadId/co-authors
 */
router.post('/threads/:threadId/co-authors', verifyToken, async (req, res) => {
    const { threadId } = req.params;
    const { user_id } = req.body;
    const requesterId = req.user.userId;

    try {
        // Check if thread exists and requester is the author
        const [threads] = await pool.query(
            'SELECT user_id FROM threads WHERE thread_id = ?',
            [threadId]
        );

        if (threads.length === 0) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        // Check if requester is author or already a co-author
        const [coauthors] = await pool.query(
            'SELECT * FROM thread_coauthors WHERE thread_id = ? AND user_id = ?',
            [threadId, requesterId]
        );

        if (threads[0].user_id !== requesterId && coauthors.length === 0) {
            return res.status(403).json({ message: 'Only authors can add co-authors' });
        }

        // Check if user is already a co-author
        const [existing] = await pool.query(
            'SELECT * FROM thread_coauthors WHERE thread_id = ? AND user_id = ?',
            [threadId, user_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'User is already a co-author' });
        }

        // Add co-author
        await pool.query(
            'INSERT INTO thread_coauthors (thread_id, user_id, added_by) VALUES (?, ?, ?)',
            [threadId, user_id, requesterId]
        );

        // Get co-author details
        const [user] = await pool.query(
            'SELECT user_id, name, email, profile_picture, department FROM users WHERE user_id = ?',
            [user_id]
        );

        res.json({
            message: 'Co-author added successfully',
            coauthor: user[0]
        });

    } catch (error) {
        console.error('Error adding co-author:', error);
        res.status(500).json({ message: 'Failed to add co-author' });
    }
});

/**
 * Get co-authors for a thread
 * GET /api/social-feed-phase2/threads/:threadId/co-authors
 */
router.get('/threads/:threadId/co-authors', async (req, res) => {
    const { threadId } = req.params;

    try {
        const [coauthors] = await pool.query(`
            SELECT u.user_id, u.name, u.email, u.profile_picture, u.department, tc.added_at
            FROM thread_coauthors tc
            JOIN users u ON tc.user_id = u.user_id
            WHERE tc.thread_id = ?
            ORDER BY tc.added_at ASC
        `, [threadId]);

        res.json(coauthors);

    } catch (error) {
        console.error('Error fetching co-authors:', error);
        res.status(500).json({ message: 'Failed to fetch co-authors' });
    }
});

// ====================================================================
// CONTENT QUALITY TRACKING API
// ====================================================================

/**
 * Save content quality score
 * POST /api/social-feed-phase2/threads/:threadId/quality
 */
router.post('/threads/:threadId/quality', verifyToken, async (req, res) => {
    const { threadId } = req.params;
    const { quality_score, word_count, hashtag_count, mention_count, has_media } = req.body;
    const userId = req.user.userId;

    try {
        // Verify thread ownership
        const [threads] = await pool.query(
            'SELECT user_id FROM threads WHERE thread_id = ?',
            [threadId]
        );

        if (threads.length === 0) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        if (threads[0].user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Insert or update quality score
        await pool.query(`
            INSERT INTO thread_quality_scores 
            (thread_id, quality_score, word_count, hashtag_count, mention_count, has_media)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            quality_score = VALUES(quality_score),
            word_count = VALUES(word_count),
            hashtag_count = VALUES(hashtag_count),
            mention_count = VALUES(mention_count),
            has_media = VALUES(has_media),
            updated_at = NOW()
        `, [threadId, quality_score, word_count, hashtag_count, mention_count, has_media]);

        res.json({ message: 'Quality score saved successfully' });

    } catch (error) {
        console.error('Error saving quality score:', error);
        res.status(500).json({ message: 'Failed to save quality score' });
    }
});

/**
 * Get quality score for a thread
 * GET /api/social-feed-phase2/threads/:threadId/quality
 */
router.get('/threads/:threadId/quality', async (req, res) => {
    const { threadId } = req.params;

    try {
        const [scores] = await pool.query(
            'SELECT * FROM thread_quality_scores WHERE thread_id = ?',
            [threadId]
        );

        if (scores.length === 0) {
            return res.json({ quality_score: null });
        }

        res.json(scores[0]);

    } catch (error) {
        console.error('Error fetching quality score:', error);
        res.status(500).json({ message: 'Failed to fetch quality score' });
    }
});

// ====================================================================
// LIVE VIEWER TRACKING API
// ====================================================================

/**
 * Track thread view with duration
 * POST /api/social-feed-phase2/threads/:threadId/view
 */
router.post('/threads/:threadId/view', async (req, res) => {
    const { threadId } = req.params;
    const { duration } = req.body; // view duration in seconds
    const userId = req.user ? req.user.userId : null;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    try {
        await pool.query(
            'INSERT INTO thread_views (thread_id, user_id, ip_address, user_agent, view_duration_seconds) VALUES (?, ?, ?, ?, ?)',
            [threadId, userId, ipAddress, userAgent, duration || 0]
        );

        res.json({ message: 'View tracked successfully' });

    } catch (error) {
        console.error('Error tracking view:', error);
        res.status(500).json({ message: 'Failed to track view' });
    }
});

/**
 * Get analytics for a thread
 * GET /api/social-feed-phase2/threads/:threadId/analytics
 */
router.get('/threads/:threadId/analytics', verifyToken, async (req, res) => {
    const { threadId } = req.params;
    const userId = req.user.userId;

    try {
        // Verify thread ownership
        const [threads] = await pool.query(
            'SELECT user_id FROM threads WHERE thread_id = ?',
            [threadId]
        );

        if (threads.length === 0) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        if (threads[0].user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to view analytics' });
        }

        // Get view count
        const [views] = await pool.query(
            'SELECT COUNT(*) as total_views, AVG(view_duration_seconds) as avg_duration FROM thread_views WHERE thread_id = ?',
            [threadId]
        );

        // Get reaction counts
        const [reactions] = await pool.query(
            'SELECT COUNT(*) as total_reactions FROM thread_reactions WHERE thread_id = ?',
            [threadId]
        );

        // Get comment count
        const [comments] = await pool.query(
            'SELECT COUNT(*) as total_comments FROM thread_comments WHERE thread_id = ?',
            [threadId]
        );

        // Get bookmark count
        const [bookmarks] = await pool.query(
            'SELECT COUNT(*) as total_bookmarks FROM thread_bookmarks WHERE thread_id = ?',
            [threadId]
        );

        res.json({
            total_views: parseInt(views[0].total_views),
            avg_view_duration: parseFloat(views[0].avg_duration) || 0,
            total_reactions: parseInt(reactions[0].total_reactions),
            total_comments: parseInt(comments[0].total_comments),
            total_bookmarks: parseInt(bookmarks[0].total_bookmarks)
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
});

// ====================================================================
// HASHTAG SEARCH API
// ====================================================================

/**
 * Search hashtags with usage statistics
 * GET /api/social-feed-phase2/hashtags/search?q=query
 */
router.get('/hashtags/search', async (req, res) => {
    const { q } = req.query;

    if (!q || q.length < 2) {
        return res.json([]);
    }

    try {
        // Search in thread content for hashtags
        const [results] = await pool.query(`
            SELECT 
                SUBSTRING_INDEX(SUBSTRING_INDEX(content, '#', -1), ' ', 1) as name,
                COUNT(*) as usage_count
            FROM threads
            WHERE content LIKE ? AND content LIKE '%#%'
            GROUP BY name
            ORDER BY usage_count DESC
            LIMIT 10
        `, [`%#${q}%`]);

        res.json(results.map(r => ({
            name: r.name.replace(/[^\w]/g, ''),
            usage_count: parseInt(r.usage_count)
        })).filter(r => r.name.toLowerCase().startsWith(q.toLowerCase())));

    } catch (error) {
        console.error('Error searching hashtags:', error);
        res.status(500).json({ message: 'Failed to search hashtags' });
    }
});

// ====================================================================
// USER SEARCH FOR MENTIONS API
// ====================================================================

/**
 * Search users for mentions
 * GET /api/social-feed-phase2/users/search?q=query
 */
router.get('/users/search', async (req, res) => {
    const { q } = req.query;

    if (!q || q.length < 2) {
        return res.json([]);
    }

    try {
        const [users] = await pool.query(`
            SELECT 
                user_id, name, email, profile_picture, department,
                CASE WHEN role = 'alumni' THEN 1 ELSE 0 END as is_verified
            FROM users
            WHERE (name LIKE ? OR email LIKE ?)
            AND role != 'admin'
            ORDER BY name ASC
            LIMIT 10
        `, [`%${q}%`, `%${q}%`]);

        res.json(users);

    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Failed to search users' });
    }
});

module.exports = router;
