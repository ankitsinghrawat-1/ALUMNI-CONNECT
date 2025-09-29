const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../middleware/authMiddleware');
const path = require('path');
const fs = require('fs').promises;

module.exports = (pool, upload) => {

    // GET all active stories (not expired) with enhanced data
    router.get('/', asyncHandler(async (req, res) => {
        const [stories] = await pool.query(`
            SELECT 
                s.story_id,
                s.user_id,
                s.content,
                s.media_url,
                s.media_type,
                s.background_color,
                s.text_color,
                s.story_type,
                s.privacy_level,
                s.allow_reactions,
                s.allow_replies,
                s.allow_screenshot,
                s.location,
                s.expires_at,
                s.created_at,
                u.full_name AS author,
                u.email as author_email,
                u.profile_pic_url,
                (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.story_id) as view_count,
                (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.story_id) as like_count,
                (SELECT COUNT(*) FROM story_replies sr WHERE sr.story_id = s.story_id) as reply_count
            FROM stories s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.expires_at > NOW()
            ORDER BY s.created_at DESC
        `);

        // Get mentions for each story
        for (let story of stories) {
            const [mentions] = await pool.query(`
                SELECT u.user_id, u.full_name, u.email
                FROM story_mentions sm
                JOIN users u ON sm.mentioned_user_id = u.user_id
                WHERE sm.story_id = ?
            `, [story.story_id]);
            story.mentions = mentions;
        }

        res.json(stories);
    }));

    // GET stories by user
    router.get('/user/:userId', asyncHandler(async (req, res) => {
        const { userId } = req.params;
        
        const [stories] = await pool.query(`
            SELECT 
                s.story_id,
                s.user_id,
                s.content,
                s.media_url,
                s.media_type,
                s.background_color,
                s.text_color,
                s.story_type,
                s.privacy_level,
                s.location,
                s.expires_at,
                s.created_at,
                (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.story_id) as view_count,
                (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.story_id) as like_count,
                (SELECT COUNT(*) FROM story_replies sr WHERE sr.story_id = s.story_id) as reply_count
            FROM stories s
            WHERE s.user_id = ? AND s.expires_at > NOW()
            ORDER BY s.created_at DESC
        `, [userId]);
        
        res.json(stories);
    }));

    // GET stories grouped by user (for stories feed)
    router.get('/feed', asyncHandler(async (req, res) => {
        const [users] = await pool.query(`
            SELECT DISTINCT
                u.user_id,
                u.full_name,
                u.email,
                u.profile_pic_url,
                COUNT(s.story_id) as story_count,
                MAX(s.created_at) as latest_story
            FROM users u
            JOIN stories s ON u.user_id = s.user_id
            WHERE s.expires_at > NOW()
            GROUP BY u.user_id, u.full_name, u.email, u.profile_pic_url
            ORDER BY latest_story DESC
        `);

        // Get stories for each user
        for (let user of users) {
            const [userStories] = await pool.query(`
                SELECT 
                    story_id,
                    content,
                    media_url,
                    media_type,
                    background_color,
                    text_color,
                    story_type,
                    location,
                    expires_at,
                    created_at,
                    (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = stories.story_id) as view_count,
                    (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = stories.story_id) as like_count
                FROM stories
                WHERE user_id = ? AND expires_at > NOW()
                ORDER BY created_at ASC
            `, [user.user_id]);
            
            user.stories = userStories;
        }

        res.json(users);
    }));

    // GET single story with full details
    router.get('/:id', asyncHandler(async (req, res) => {
        const [story] = await pool.query(`
            SELECT 
                s.story_id,
                s.user_id,
                s.content,
                s.media_url,
                s.media_type,
                s.background_color,
                s.text_color,
                s.story_type,
                s.privacy_level,
                s.allow_reactions,
                s.allow_replies,
                s.allow_screenshot,
                s.location,
                s.poll_question,
                s.poll_options,
                s.poll_allow_multiple,
                s.expires_at,
                s.created_at,
                u.full_name AS author,
                u.email as author_email,
                u.profile_pic_url,
                (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.story_id) as view_count,
                (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.story_id) as like_count,
                (SELECT COUNT(*) FROM story_replies sr WHERE sr.story_id = s.story_id) as reply_count
            FROM stories s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.story_id = ? AND s.expires_at > NOW()
        `, [req.params.id]);
        
        if (story.length === 0) {
            return res.status(404).json({ message: 'Story not found or expired' });
        }

        // Get mentions
        const [mentions] = await pool.query(`
            SELECT u.user_id, u.full_name, u.email
            FROM story_mentions sm
            JOIN users u ON sm.mentioned_user_id = u.user_id
            WHERE sm.story_id = ?
        `, [req.params.id]);
        story[0].mentions = mentions;

        // Get poll votes if it's a poll
        if (story[0].story_type === 'poll') {
            const [votes] = await pool.query(`
                SELECT option_index, COUNT(*) as vote_count
                FROM story_poll_votes
                WHERE story_id = ?
                GROUP BY option_index
            `, [req.params.id]);
            story[0].poll_votes = votes;
        }
        
        res.json(story[0]);
    }));

    // POST create new story with enhanced features
    router.post('/create', verifyToken, upload.single('story_media'), asyncHandler(async (req, res) => {
        const { 
            type, content, background_color, text_color, text_effect,
            privacy, duration_hours, location, mentions,
            allow_reactions, allow_replies, allow_screenshot,
            poll_question, poll_options, poll_allow_multiple
        } = req.body;
        
        const user_id = req.user.userId;
        
        // Validate required content based on type
        if (type === 'text' && (!content || content.trim().length === 0)) {
            return res.status(400).json({ message: 'Text story must have content' });
        }
        
        if ((type === 'photo' || type === 'video') && !req.file && !content) {
            return res.status(400).json({ message: 'Media story must have file or caption' });
        }
        
        if (type === 'poll' && (!poll_question || !poll_options)) {
            return res.status(400).json({ message: 'Poll story must have question and options' });
        }

        let media_url = null;
        let media_type = null;
        
        if (req.file) {
            media_url = `uploads/stories/${req.file.filename}`;
            media_type = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        }

        // Calculate expiry based on duration
        const durationHours = parseInt(duration_hours) || 24;
        const expires_at = new Date(Date.now() + durationHours * 60 * 60 * 1000);

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert story
            const [storyResult] = await connection.query(
                `INSERT INTO stories (
                    user_id, content, media_url, media_type, background_color, text_color, 
                    story_type, privacy_level, allow_reactions, allow_replies, allow_screenshot,
                    location, poll_question, poll_options, poll_allow_multiple, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [
                    user_id, content, media_url, media_type, background_color, text_color,
                    type, privacy || 'public', allow_reactions !== 'false', allow_replies !== 'false', 
                    allow_screenshot === 'true', location, poll_question, poll_options, 
                    poll_allow_multiple === 'true', expires_at
                ]
            );

            const story_id = storyResult.insertId;

            // Process mentions if provided
            if (mentions) {
                const mentionList = Array.isArray(mentions) ? mentions : JSON.parse(mentions);
                
                for (const mentionEmail of mentionList) {
                    // Get user ID by email
                    const [user] = await connection.query(
                        'SELECT user_id FROM users WHERE email = ?',
                        [mentionEmail]
                    );
                    
                    if (user.length > 0) {
                        await connection.query(
                            'INSERT INTO story_mentions (story_id, mentioned_user_id) VALUES (?, ?)',
                            [story_id, user[0].user_id]
                        );
                    }
                }
            }

            await connection.commit();
            
            res.status(201).json({ 
                message: 'Story created successfully',
                storyId: story_id,
                expires_at: expires_at
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }));

    // POST like/unlike story
    router.post('/:id/like', verifyToken, asyncHandler(async (req, res) => {
        const story_id = req.params.id;
        const user_id = req.user.userId;

        // Check if story exists and is not expired
        const [story] = await pool.query(
            'SELECT story_id FROM stories WHERE story_id = ? AND expires_at > NOW()',
            [story_id]
        );
        
        if (story.length === 0) {
            return res.status(404).json({ message: 'Story not found or expired' });
        }

        // Check if already liked
        const [existingLike] = await pool.query(
            'SELECT like_id FROM story_likes WHERE story_id = ? AND user_id = ?',
            [story_id, user_id]
        );

        if (existingLike.length > 0) {
            // Unlike
            await pool.query(
                'DELETE FROM story_likes WHERE story_id = ? AND user_id = ?',
                [story_id, user_id]
            );
            res.json({ message: 'Story unliked', liked: false });
        } else {
            // Like
            await pool.query(
                'INSERT INTO story_likes (story_id, user_id) VALUES (?, ?)',
                [story_id, user_id]
            );
            res.json({ message: 'Story liked', liked: true });
        }
    }));

    // GET story likes
    router.get('/:id/likes', verifyToken, asyncHandler(async (req, res) => {
        const story_id = req.params.id;

        const [likes] = await pool.query(`
            SELECT 
                u.user_id,
                u.full_name,
                u.email,
                u.profile_pic_url,
                sl.created_at
            FROM story_likes sl
            JOIN users u ON sl.user_id = u.user_id
            WHERE sl.story_id = ?
            ORDER BY sl.created_at DESC
        `, [story_id]);

        res.json(likes);
    }));

    // POST reply to story
    router.post('/:id/reply', verifyToken, asyncHandler(async (req, res) => {
        const story_id = req.params.id;
        const user_id = req.user.userId;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Reply content is required' });
        }

        // Check if story exists and allows replies
        const [story] = await pool.query(
            'SELECT allow_replies FROM stories WHERE story_id = ? AND expires_at > NOW()',
            [story_id]
        );
        
        if (story.length === 0) {
            return res.status(404).json({ message: 'Story not found or expired' });
        }

        if (!story[0].allow_replies) {
            return res.status(403).json({ message: 'Replies are not allowed for this story' });
        }

        const [result] = await pool.query(
            'INSERT INTO story_replies (story_id, user_id, content) VALUES (?, ?, ?)',
            [story_id, user_id, content]
        );

        res.status(201).json({ 
            message: 'Reply added successfully',
            replyId: result.insertId
        });
    }));

    // GET story replies
    router.get('/:id/replies', verifyToken, asyncHandler(async (req, res) => {
        const story_id = req.params.id;

        const [replies] = await pool.query(`
            SELECT 
                sr.reply_id,
                sr.content,
                sr.created_at,
                u.user_id,
                u.full_name,
                u.email,
                u.profile_pic_url
            FROM story_replies sr
            JOIN users u ON sr.user_id = u.user_id
            WHERE sr.story_id = ?
            ORDER BY sr.created_at ASC
        `, [story_id]);

        res.json(replies);
    }));

    // POST vote in poll story
    router.post('/:id/vote', verifyToken, asyncHandler(async (req, res) => {
        const story_id = req.params.id;
        const user_id = req.user.userId;
        const { option_index } = req.body;

        // Check if story is a poll and not expired
        const [story] = await pool.query(
            'SELECT story_type, poll_allow_multiple FROM stories WHERE story_id = ? AND expires_at > NOW() AND story_type = "poll"',
            [story_id]
        );
        
        if (story.length === 0) {
            return res.status(404).json({ message: 'Poll story not found or expired' });
        }

        // Check if user already voted (if multiple votes not allowed)
        if (!story[0].poll_allow_multiple) {
            const [existingVote] = await pool.query(
                'SELECT vote_id FROM story_poll_votes WHERE story_id = ? AND user_id = ?',
                [story_id, user_id]
            );

            if (existingVote.length > 0) {
                return res.status(400).json({ message: 'You have already voted in this poll' });
            }
        }

        await pool.query(
            'INSERT INTO story_poll_votes (story_id, user_id, option_index) VALUES (?, ?, ?)',
            [story_id, user_id, option_index]
        );

        res.json({ message: 'Vote recorded successfully' });
    }));

    // POST mark story as viewed
    router.post('/:id/view', verifyToken, asyncHandler(async (req, res) => {
        const story_id = req.params.id;
        const viewer_user_id = req.user.userId;

        // Check if story exists and is not expired
        const [story] = await pool.query(
            'SELECT story_id FROM stories WHERE story_id = ? AND expires_at > NOW()',
            [story_id]
        );
        
        if (story.length === 0) {
            return res.status(404).json({ message: 'Story not found or expired' });
        }

        // Insert view record (ignore if already viewed)
        await pool.query(
            'INSERT IGNORE INTO story_views (story_id, viewer_user_id) VALUES (?, ?)',
            [story_id, viewer_user_id]
        );

        res.status(200).json({ message: 'Story view recorded' });
    }));

    // GET story viewers (for story owner)
    router.get('/:id/viewers', verifyToken, asyncHandler(async (req, res) => {
        const story_id = req.params.id;
        const current_user_id = req.user.userId;

        // Check if current user owns the story
        const [story] = await pool.query(
            'SELECT user_id FROM stories WHERE story_id = ?',
            [story_id]
        );
        
        if (story.length === 0) {
            return res.status(404).json({ message: 'Story not found' });
        }
        
        if (story[0].user_id !== current_user_id) {
            return res.status(403).json({ message: 'You can only view your own story viewers' });
        }

        const [viewers] = await pool.query(`
            SELECT 
                u.user_id,
                u.full_name,
                u.email,
                u.profile_pic_url,
                sv.viewed_at
            FROM story_views sv
            JOIN users u ON sv.viewer_user_id = u.user_id
            WHERE sv.story_id = ?
            ORDER BY sv.viewed_at DESC
        `, [story_id]);

        res.json(viewers);
    }));

    // GET story analytics (for story owner)
    router.get('/:id/analytics', verifyToken, asyncHandler(async (req, res) => {
        const story_id = req.params.id;
        const current_user_id = req.user.userId;

        // Check if current user owns the story
        const [story] = await pool.query(
            'SELECT user_id FROM stories WHERE story_id = ?',
            [story_id]
        );
        
        if (story.length === 0) {
            return res.status(404).json({ message: 'Story not found' });
        }
        
        if (story[0].user_id !== current_user_id) {
            return res.status(403).json({ message: 'You can only view your own story analytics' });
        }

        // Get comprehensive analytics
        const [analytics] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM story_views WHERE story_id = ?) as total_views,
                (SELECT COUNT(*) FROM story_likes WHERE story_id = ?) as total_likes,
                (SELECT COUNT(*) FROM story_replies WHERE story_id = ?) as total_replies,
                (SELECT COUNT(DISTINCT viewer_user_id) FROM story_views WHERE story_id = ?) as unique_viewers
        `, [story_id, story_id, story_id, story_id]);

        res.json(analytics[0]);
    }));

    // DELETE story (by owner only)
    router.delete('/:id', verifyToken, asyncHandler(async (req, res) => {
        const story_id = req.params.id;
        const current_user_id = req.user.userId;

        const [story] = await pool.query(
            'SELECT user_id, media_url FROM stories WHERE story_id = ?',
            [story_id]
        );
        
        if (story.length === 0) {
            return res.status(404).json({ message: 'Story not found' });
        }

        if (story[0].user_id !== current_user_id) {
            return res.status(403).json({ message: 'You can only delete your own stories' });
        }

        // Delete media file if exists
        if (story[0].media_url) {
            const mediaPath = path.join(__dirname, '..', '..', story[0].media_url);
            fs.unlink(mediaPath).catch(err => console.error("Failed to delete story media:", err));
        }

        // Delete all related data
        await pool.query('DELETE FROM story_views WHERE story_id = ?', [story_id]);
        await pool.query('DELETE FROM story_likes WHERE story_id = ?', [story_id]);
        await pool.query('DELETE FROM story_replies WHERE story_id = ?', [story_id]);
        await pool.query('DELETE FROM story_mentions WHERE story_id = ?', [story_id]);
        await pool.query('DELETE FROM story_poll_votes WHERE story_id = ?', [story_id]);
        await pool.query('DELETE FROM stories WHERE story_id = ?', [story_id]);
        
        res.status(200).json({ message: 'Story deleted successfully' });
    }));

    // POST cleanup expired stories (can be called periodically)
    router.post('/cleanup', asyncHandler(async (req, res) => {
        // Get expired stories with media
        const [expiredStories] = await pool.query(`
            SELECT story_id, media_url 
            FROM stories 
            WHERE expires_at < NOW()
        `);

        // Delete media files
        for (const story of expiredStories) {
            if (story.media_url) {
                const mediaPath = path.join(__dirname, '..', '..', story.media_url);
                fs.unlink(mediaPath).catch(err => console.error("Failed to delete expired story media:", err));
            }
        }

        // Delete expired stories and all related data
        const [result] = await pool.query('DELETE FROM stories WHERE expires_at < NOW()');
        
        res.json({ 
            message: 'Expired stories cleaned up',
            deletedCount: result.affectedRows
        });
    }));

    return router;
};