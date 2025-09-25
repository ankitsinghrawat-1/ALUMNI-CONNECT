const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

module.exports = (pool) => {

    router.post('/', verifyToken, isAdmin, asyncHandler(async (req, res) => {
        const { title, description, goal_amount, start_date, end_date, image_url } = req.body;
        const created_by = req.user.userId;
        await pool.query(
            'INSERT INTO campaigns (title, description, goal_amount, start_date, end_date, image_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, goal_amount, start_date, end_date, image_url, created_by]
        );
        res.status(201).json({ message: 'Campaign created successfully!' });
    }));

    router.get('/', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT * FROM campaigns ORDER BY end_date DESC');
        res.json(rows);
    }));

    router.get('/:id', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT * FROM campaigns WHERE campaign_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Campaign not found' });
        }
        res.json(rows[0]);
    }));

    router.put('/:id', verifyToken, isAdmin, asyncHandler(async (req, res) => {
        const { title, description, goal_amount, start_date, end_date, image_url } = req.body;
        await pool.query(
            'UPDATE campaigns SET title = ?, description = ?, goal_amount = ?, start_date = ?, end_date = ?, image_url = ? WHERE campaign_id = ?',
            [title, description, goal_amount, start_date, end_date, image_url, req.params.id]
        );
        res.status(200).json({ message: 'Campaign updated successfully!' });
    }));

    router.delete('/:id', verifyToken, isAdmin, asyncHandler(async (req, res) => {
        await pool.query('DELETE FROM campaigns WHERE campaign_id = ?', [req.params.id]);
        res.status(200).json({ message: 'Campaign deleted successfully' });
    }));

    return router;
};