const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../middleware/authMiddleware');
const path = require('path');
const fs = require('fs').promises;

module.exports = (pool, upload) => {

    // GET all blogs (Public)
    router.get('/', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT b.blog_id, b.title, b.content, b.image_url, u.full_name AS author, u.email as author_email, b.created_at FROM blogs b JOIN users u ON b.author_id = u.user_id ORDER BY b.created_at DESC');
        res.json(rows);
    }));
    
    router.get('/user/my-blogs', verifyToken, asyncHandler(async (req, res) => {
        const author_id = req.user.userId;
        const [rows] = await pool.query('SELECT blog_id, title, created_at FROM blogs WHERE author_id = ? ORDER BY created_at DESC', [author_id]);
        res.json(rows);
    }));

    router.get('/by-author/:email', asyncHandler(async (req, res) => {
        const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [req.params.email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const author_id = user[0].user_id;
        const [blogs] = await pool.query(
            'SELECT blog_id, title, content, created_at FROM blogs WHERE author_id = ? ORDER BY created_at DESC',
            [author_id]
        );
        res.json(blogs);
    }));

    // GET a single blog post (Public)
    router.get('/:id', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT b.blog_id, b.title, b.content, b.image_url, u.full_name AS author, u.email as author_email, b.created_at FROM blogs b JOIN users u ON b.author_id = u.user_id WHERE b.blog_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Blog post not found' });
        }
        res.json(rows[0]);
    }));

    // POST a new blog (Protected & handles image upload)
    router.post('/', verifyToken, upload.single('blog_image'), asyncHandler(async (req, res) => {
        const { title, content } = req.body;
        const author_id = req.user.userId;
        const image_url = req.file ? `uploads/blogs/${req.file.filename}` : null;

        await pool.query('INSERT INTO blogs (title, content, image_url, author_id) VALUES (?, ?, ?, ?)', [title, content, image_url, author_id]);
        res.status(201).json({ message: 'Blog post created successfully' });
    }));

    // PUT (update) a blog post (Protected & handles image upload)
    router.put('/:id', verifyToken, upload.single('blog_image'), asyncHandler(async (req, res) => {
        const { title, content } = req.body;
        const blog_id = req.params.id;
        const current_user_id = req.user.userId;
        const user_role = req.user.role;

        const [blog] = await pool.query('SELECT author_id, image_url FROM blogs WHERE blog_id = ?', [blog_id]);
        if (blog.length === 0) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        if (blog[0].author_id !== current_user_id && user_role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to edit this post.' });
        }

        let new_image_url = blog[0].image_url;
        if (req.file) {
            new_image_url = `uploads/blogs/${req.file.filename}`;
            if (blog[0].image_url) {
                const oldImagePath = path.join(__dirname, '..', '..', blog[0].image_url);
                fs.unlink(oldImagePath).catch(err => console.error("Failed to delete old blog image:", err));
            }
        }

        await pool.query('UPDATE blogs SET title = ?, content = ?, image_url = ? WHERE blog_id = ?', [title, content, new_image_url, blog_id]);
        res.status(200).json({ message: 'Blog post updated successfully!' });
    }));

    // DELETE a blog post (Protected)
    router.delete('/:id', verifyToken, asyncHandler(async (req, res) => {
        const blog_id = req.params.id;
        const current_user_id = req.user.userId;
        const user_role = req.user.role;

        const [blog] = await pool.query('SELECT author_id, image_url FROM blogs WHERE blog_id = ?', [blog_id]);
        if (blog.length === 0) {
            return res.status(200).json({ message: 'Blog post already deleted.' });
        }

        if (blog[0].author_id !== current_user_id && user_role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to delete this post.' });
        }

        if (blog[0].image_url) {
            const imagePath = path.join(__dirname, '..', '..', blog[0].image_url);
            fs.unlink(imagePath).catch(err => console.error("Failed to delete blog image:", err));
        }

        await pool.query('DELETE FROM blogs WHERE blog_id = ?', [blog_id]);
        res.status(200).json({ message: 'Blog post deleted successfully' });
    }));

    // --- NEW BLOG COMMENT ROUTES ---

    // GET all comments for a blog post
    router.get('/:id/comments', asyncHandler(async (req, res) => {
        const { id } = req.params;
        const [comments] = await pool.query(`
            SELECT bc.comment_id, bc.content, bc.created_at, u.full_name as author, u.profile_pic_url
            FROM blog_comments bc
            JOIN users u ON bc.user_id = u.user_id
            WHERE bc.blog_id = ?
            ORDER BY bc.created_at ASC
        `, [id]);
        res.json(comments);
    }));

    // POST a new comment on a blog post
    router.post('/:id/comments', verifyToken, asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { content } = req.body;
        const user_id = req.user.userId;

        if (!content) {
            return res.status(400).json({ message: 'Comment content cannot be empty.' });
        }

        await pool.query(
            'INSERT INTO blog_comments (blog_id, user_id, content) VALUES (?, ?, ?)',
            [id, user_id, content]
        );
        res.status(201).json({ message: 'Comment posted successfully!' });
    }));


    return router;
};