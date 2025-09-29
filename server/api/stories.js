const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../middleware/authMiddleware');
const path = require('path');
const fs = require('fs').promises;

module.exports = (pool, upload) => {

    // GET all active stories (not expired)
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
                s.expires_at,
                s.created_at,
                u.full_name AS author,
                u.email as author_email,
                u.profile_pic_url,
                (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.story_id) as view_count
            FROM stories s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.expires_at > NOW()
            ORDER BY s.created_at DESC
        `);
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
                s.expires_at,
                s.created_at,
                (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.story_id) as view_count
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
                    expires_at,
                    created_at
                FROM stories
                WHERE user_id = ? AND expires_at > NOW()
                ORDER BY created_at ASC
            `, [user.user_id]);
            
            user.stories = userStories;
        }

        res.json(users);
    }));

    // GET single story
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
                s.expires_at,
                s.created_at,
                u.full_name AS author,
                u.email as author_email,
                u.profile_pic_url,
                (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.story_id) as view_count
            FROM stories s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.story_id = ? AND s.expires_at > NOW()
        `, [req.params.id]);
        
        if (story.length === 0) {
            return res.status(404).json({ message: 'Story not found or expired' });
        }
        
        res.json(story[0]);
    }));

    // POST create new story
    router.post('/', verifyToken, upload.single('story_media'), asyncHandler(async (req, res) => {
        const { content, background_color, text_color } = req.body;
        const user_id = req.user.userId;
        
        if (!content && !req.file) {
            return res.status(400).json({ message: 'Story must have content or media' });
        }

        let media_url = null;
        let media_type = null;
        
        if (req.file) {
            media_url = `uploads/stories/${req.file.filename}`;
            media_type = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        }

        // Stories expire after 24 hours
        const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const [result] = await pool.query(
            `INSERT INTO stories (user_id, content, media_url, media_type, background_color, text_color, expires_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [user_id, content, media_url, media_type, background_color, text_color, expires_at]
        );
        
        res.status(201).json({ 
            message: 'Story created successfully',
            storyId: result.insertId,
            expires_at: expires_at
        });
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

        // Delete story views and story
        await pool.query('DELETE FROM story_views WHERE story_id = ?', [story_id]);
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

        // Delete expired stories and their views
        const [result] = await pool.query('DELETE FROM stories WHERE expires_at < NOW()');
        
        res.json({ 
            message: 'Expired stories cleaned up',
            deletedCount: result.affectedRows
        });
    }));

    return router;
};