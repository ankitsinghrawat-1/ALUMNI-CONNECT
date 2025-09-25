const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

module.exports = (pool) => {

    // GET all blogs (Public)
    router.get('/', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT b.blog_id, b.title, b.content, u.full_name AS author, b.created_at FROM blogs b JOIN users u ON b.author_id = u.user_id ORDER BY b.created_at DESC');
        res.json(rows);
    }));
    
    // GET blogs for the currently logged-in user (Protected)
    // MOVED THIS ROUTE UP so it's matched before '/user/:email'
    router.get('/user/my-blogs', verifyToken, asyncHandler(async (req, res) => {
        const author_id = req.user.userId;
        const [rows] = await pool.query('SELECT blog_id, title, created_at FROM blogs WHERE author_id = ? ORDER BY created_at DESC', [author_id]);
        res.json(rows);
    }));

    // GET all blogs by a specific user (Public)
    router.get('/user/:email', asyncHandler(async (req, res) => {
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
        const [rows] = await pool.query('SELECT b.blog_id, b.title, b.content, u.full_name AS author, u.email as author_email, b.created_at FROM blogs b JOIN users u ON b.author_id = u.user_id WHERE b.blog_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Blog post not found' });
        }
        res.json(rows[0]);
    }));

    // POST a new blog (Protected)
    router.post('/', verifyToken, asyncHandler(async (req, res) => {
        const { title, content } = req.body;
        const author_id = req.user.userId;
        await pool.query('INSERT INTO blogs (title, content, author_id) VALUES (?, ?, ?)', [title, content, author_id]);
        res.status(201).json({ message: 'Blog post created successfully' });
    }));

    // PUT (update) a blog post (Protected)
    router.put('/:id', verifyToken, asyncHandler(async (req, res) => {
        const { title, content } = req.body;
        const blog_id = req.params.id;
        const current_user_id = req.user.userId;
        const user_role = req.user.role;

        const [blog] = await pool.query('SELECT author_id FROM blogs WHERE blog_id = ?', [blog_id]);
        if (blog.length === 0) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        if (blog[0].author_id !== current_user_id && user_role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to edit this post.' });
        }

        await pool.query('UPDATE blogs SET title = ?, content = ? WHERE blog_id = ?', [title, content, blog_id]);
        res.status(200).json({ message: 'Blog post updated successfully!' });
    }));

    // DELETE a blog post (Protected)
    router.delete('/:id', verifyToken, asyncHandler(async (req, res) => {
        const blog_id = req.params.id;
        const current_user_id = req.user.userId;
        const user_role = req.user.role;

        const [blog] = await pool.query('SELECT author_id FROM blogs WHERE blog_id = ?', [blog_id]);
        if (blog.length === 0) {
            return res.status(200).json({ message: 'Blog post already deleted.' });
        }

        if (blog[0].author_id !== current_user_id && user_role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to delete this post.' });
        }

        await pool.query('DELETE FROM blogs WHERE blog_id = ?', [blog_id]);
        res.status(200).json({ message: 'Blog post deleted successfully' });
    }));

    return router;
};