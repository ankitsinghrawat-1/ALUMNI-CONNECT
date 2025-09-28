const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../middleware/authMiddleware');
const path = require('path');
const fs = require('fs').promises;

module.exports = (pool, upload) => {

    // GET all threads with user info, stats (Public)
    router.get('/', asyncHandler(async (req, res) => {
        const [rows] = await pool.query(`
            SELECT 
                t.thread_id, 
                t.content, 
                t.media_url, 
                t.media_type, 
                t.created_at,
                u.full_name AS author, 
                u.email as author_email,
                u.profile_pic_url,
                (SELECT COUNT(*) FROM thread_likes tl WHERE tl.thread_id = t.thread_id) as like_count,
                (SELECT COUNT(*) FROM thread_comments tc WHERE tc.thread_id = t.thread_id) as comment_count,
                (SELECT COUNT(*) FROM thread_shares ts WHERE ts.thread_id = t.thread_id) as share_count
            FROM threads t 
            JOIN users u ON t.user_id = u.user_id 
            ORDER BY t.created_at DESC
        `);
        res.json(rows);
    }));

    // GET threads by current user
    router.get('/user/my-threads', verifyToken, asyncHandler(async (req, res) => {
        const user_id = req.user.userId;
        const [rows] = await pool.query(`
            SELECT 
                t.thread_id, 
                t.content, 
                t.media_url, 
                t.media_type, 
                t.created_at,
                (SELECT COUNT(*) FROM thread_likes tl WHERE tl.thread_id = t.thread_id) as like_count,
                (SELECT COUNT(*) FROM thread_comments tc WHERE tc.thread_id = t.thread_id) as comment_count,
                (SELECT COUNT(*) FROM thread_shares ts WHERE ts.thread_id = t.thread_id) as share_count
            FROM threads t 
            WHERE t.user_id = ? 
            ORDER BY t.created_at DESC
        `, [user_id]);
        res.json(rows);
    }));

    // GET threads by specific user email
    router.get('/by-author/:email', asyncHandler(async (req, res) => {
        const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [req.params.email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const author_id = user[0].user_id;
        const [threads] = await pool.query(`
            SELECT 
                t.thread_id, 
                t.content, 
                t.media_url, 
                t.media_type, 
                t.created_at,
                (SELECT COUNT(*) FROM thread_likes tl WHERE tl.thread_id = t.thread_id) as like_count,
                (SELECT COUNT(*) FROM thread_comments tc WHERE tc.thread_id = t.thread_id) as comment_count,
                (SELECT COUNT(*) FROM thread_shares ts WHERE ts.thread_id = t.thread_id) as share_count
            FROM threads t 
            WHERE t.user_id = ? 
            ORDER BY t.created_at DESC
        `, [author_id]);
        res.json(threads);
    }));

    // GET a single thread with full details (Public)
    router.get('/:id', asyncHandler(async (req, res) => {
        const [rows] = await pool.query(`
            SELECT 
                t.thread_id, 
                t.content, 
                t.media_url, 
                t.media_type, 
                t.created_at,
                u.full_name AS author, 
                u.email as author_email,
                u.profile_pic_url,
                (SELECT COUNT(*) FROM thread_likes tl WHERE tl.thread_id = t.thread_id) as like_count,
                (SELECT COUNT(*) FROM thread_comments tc WHERE tc.thread_id = t.thread_id) as comment_count,
                (SELECT COUNT(*) FROM thread_shares ts WHERE ts.thread_id = t.thread_id) as share_count
            FROM threads t 
            JOIN users u ON t.user_id = u.user_id 
            WHERE t.thread_id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Thread not found' });
        }
        res.json(rows[0]);
    }));

    // POST a new thread (Protected & handles media upload)
    router.post('/', verifyToken, upload.single('thread_media'), asyncHandler(async (req, res) => {
        const { content } = req.body;
        const user_id = req.user.userId;
        
        if (!content && !req.file) {
            return res.status(400).json({ message: 'Thread must have content or media' });
        }

        let media_url = null;
        let media_type = null;
        
        if (req.file) {
            media_url = `uploads/threads/${req.file.filename}`;
            media_type = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        }

        const [result] = await pool.query(
            'INSERT INTO threads (user_id, content, media_url, media_type) VALUES (?, ?, ?, ?)', 
            [user_id, content, media_url, media_type]
        );
        
        res.status(201).json({ 
            message: 'Thread posted successfully',
            threadId: result.insertId 
        });
    }));

    // PUT (update) a thread (Protected & handles media upload)
    router.put('/:id', verifyToken, upload.single('thread_media'), asyncHandler(async (req, res) => {
        const { content } = req.body;
        const thread_id = req.params.id;
        const current_user_id = req.user.userId;
        const user_role = req.user.role;

        const [thread] = await pool.query('SELECT user_id, media_url FROM threads WHERE thread_id = ?', [thread_id]);
        if (thread.length === 0) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        if (thread[0].user_id !== current_user_id && user_role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to edit this thread.' });
        }

        let new_media_url = thread[0].media_url;
        let media_type = null;
        
        if (req.file) {
            new_media_url = `uploads/threads/${req.file.filename}`;
            media_type = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
            
            // Delete old media file if exists
            if (thread[0].media_url) {
                const oldMediaPath = path.join(__dirname, '..', '..', thread[0].media_url);
                fs.unlink(oldMediaPath).catch(err => console.error("Failed to delete old thread media:", err));
            }
        }

        await pool.query(
            'UPDATE threads SET content = ?, media_url = ?, media_type = ?, updated_at = CURRENT_TIMESTAMP WHERE thread_id = ?', 
            [content, new_media_url, media_type, thread_id]
        );
        res.status(200).json({ message: 'Thread updated successfully!' });
    }));

    // DELETE a thread (Protected)
    router.delete('/:id', verifyToken, asyncHandler(async (req, res) => {
        const thread_id = req.params.id;
        const current_user_id = req.user.userId;
        const user_role = req.user.role;

        const [thread] = await pool.query('SELECT user_id, media_url FROM threads WHERE thread_id = ?', [thread_id]);
        if (thread.length === 0) {
            return res.status(200).json({ message: 'Thread already deleted.' });
        }

        if (thread[0].user_id !== current_user_id && user_role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to delete this thread.' });
        }

        // Delete media file if exists
        if (thread[0].media_url) {
            const mediaPath = path.join(__dirname, '..', '..', thread[0].media_url);
            fs.unlink(mediaPath).catch(err => console.error("Failed to delete thread media:", err));
        }

        // Delete related data (likes, comments, shares)
        await pool.query('DELETE FROM thread_likes WHERE thread_id = ?', [thread_id]);
        await pool.query('DELETE FROM thread_comments WHERE thread_id = ?', [thread_id]);
        await pool.query('DELETE FROM thread_shares WHERE thread_id = ?', [thread_id]);
        await pool.query('DELETE FROM threads WHERE thread_id = ?', [thread_id]);
        
        res.status(200).json({ message: 'Thread deleted successfully' });
    }));

    // --- LIKE/UNLIKE FUNCTIONALITY ---

    // POST like/unlike a thread
    router.post('/:id/like', verifyToken, asyncHandler(async (req, res) => {
        const thread_id = req.params.id;
        const user_id = req.user.userId;

        // Check if thread exists
        const [thread] = await pool.query('SELECT thread_id FROM threads WHERE thread_id = ?', [thread_id]);
        if (thread.length === 0) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        // Check if already liked
        const [existingLike] = await pool.query(
            'SELECT like_id FROM thread_likes WHERE thread_id = ? AND user_id = ?',
            [thread_id, user_id]
        );

        if (existingLike.length > 0) {
            // Unlike - remove the like
            await pool.query('DELETE FROM thread_likes WHERE thread_id = ? AND user_id = ?', [thread_id, user_id]);
            res.status(200).json({ message: 'Thread unliked', liked: false });
        } else {
            // Like - add the like
            await pool.query('INSERT INTO thread_likes (thread_id, user_id) VALUES (?, ?)', [thread_id, user_id]);
            res.status(201).json({ message: 'Thread liked', liked: true });
        }
    }));

    // GET check if user liked a thread
    router.get('/:id/like-status', verifyToken, asyncHandler(async (req, res) => {
        const thread_id = req.params.id;
        const user_id = req.user.userId;

        const [like] = await pool.query(
            'SELECT like_id FROM thread_likes WHERE thread_id = ? AND user_id = ?',
            [thread_id, user_id]
        );

        res.json({ liked: like.length > 0 });
    }));

    // --- COMMENT FUNCTIONALITY ---

    // GET all comments for a thread
    router.get('/:id/comments', asyncHandler(async (req, res) => {
        const { id } = req.params;
        const [comments] = await pool.query(`
            SELECT 
                tc.comment_id, 
                tc.content, 
                tc.created_at, 
                u.full_name as author, 
                u.email as author_email,
                u.profile_pic_url
            FROM thread_comments tc
            JOIN users u ON tc.user_id = u.user_id
            WHERE tc.thread_id = ?
            ORDER BY tc.created_at ASC
        `, [id]);
        res.json(comments);
    }));

    // POST a new comment on a thread
    router.post('/:id/comments', verifyToken, asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { content } = req.body;
        const user_id = req.user.userId;

        if (!content) {
            return res.status(400).json({ message: 'Comment content cannot be empty.' });
        }

        // Check if thread exists
        const [thread] = await pool.query('SELECT thread_id FROM threads WHERE thread_id = ?', [id]);
        if (thread.length === 0) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        await pool.query(
            'INSERT INTO thread_comments (thread_id, user_id, content) VALUES (?, ?, ?)',
            [id, user_id, content]
        );
        res.status(201).json({ message: 'Comment posted successfully!' });
    }));

    // --- SHARE FUNCTIONALITY ---

    // POST share/unshare a thread
    router.post('/:id/share', verifyToken, asyncHandler(async (req, res) => {
        const thread_id = req.params.id;
        const user_id = req.user.userId;

        // Check if thread exists
        const [thread] = await pool.query('SELECT thread_id FROM threads WHERE thread_id = ?', [thread_id]);
        if (thread.length === 0) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        // Check if already shared
        const [existingShare] = await pool.query(
            'SELECT share_id FROM thread_shares WHERE thread_id = ? AND user_id = ?',
            [thread_id, user_id]
        );

        if (existingShare.length > 0) {
            // Unshare - remove the share
            await pool.query('DELETE FROM thread_shares WHERE thread_id = ? AND user_id = ?', [thread_id, user_id]);
            res.status(200).json({ message: 'Thread unshared', shared: false });
        } else {
            // Share - add the share
            await pool.query('INSERT INTO thread_shares (thread_id, user_id) VALUES (?, ?)', [thread_id, user_id]);
            res.status(201).json({ message: 'Thread shared', shared: true });
        }
    }));

    // GET check if user shared a thread
    router.get('/:id/share-status', verifyToken, asyncHandler(async (req, res) => {
        const thread_id = req.params.id;
        const user_id = req.user.userId;

        const [share] = await pool.query(
            'SELECT share_id FROM thread_shares WHERE thread_id = ? AND user_id = ?',
            [thread_id, user_id]
        );

        res.json({ shared: share.length > 0 });
    }));

    return router;
};