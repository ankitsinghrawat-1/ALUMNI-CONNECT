const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

module.exports = (pool) => {

    router.post('/', verifyToken, asyncHandler(async (req, res) => {
        if (req.user.role !== 'admin' && req.user.role !== 'institute') {
            return res.status(403).json({ message: 'You are not authorized to create campaigns.' });
        }
        const { title, description, goal_amount, start_date, end_date, image_url } = req.body;
        const created_by = req.user.userId;
        await pool.query(
            'INSERT INTO campaigns (title, description, goal_amount, start_date, end_date, image_url, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, goal_amount, start_date, end_date, image_url, created_by, 'pending']
        );
        res.status(201).json({ message: 'Campaign submitted for approval!' });
    }));
    
    router.get('/', asyncHandler(async (req, res) => {
        const [rows] = await pool.query(`
            SELECT c.*, COUNT(DISTINCT d.user_id) as donor_count
            FROM campaigns c
            LEFT JOIN donations d ON c.campaign_id = d.campaign_id
            WHERE c.status = 'approved'
            GROUP BY c.campaign_id
            ORDER BY c.end_date DESC
        `);
        res.json(rows);
    }));

    // UPDATED: Now also fetches recent donors for the details page
    router.get('/:id', asyncHandler(async (req, res) => {
        const campaignId = req.params.id;
        const [campaignRows] = await pool.query('SELECT * FROM campaigns WHERE campaign_id = ?', [campaignId]);
        if (campaignRows.length === 0) {
            return res.status(404).json({ message: 'Campaign not found' });
        }
        
        const [donorRows] = await pool.query(`
            SELECT d.amount, u.full_name, u.profile_pic_url
            FROM donations d
            JOIN users u ON d.user_id = u.user_id
            WHERE d.campaign_id = ?
            ORDER BY d.donation_date DESC
            LIMIT 10
        `, [campaignId]);

        res.json({
            campaign: campaignRows[0],
            donors: donorRows
        });
    }));

    router.put('/:id', verifyToken, isAdmin, asyncHandler(async (req, res) => {
        const { title, description, goal_amount, start_date, end_date, image_url } = req.body;
        await pool.query(
            'UPDATE campaigns SET title = ?, description = ?, goal_amount = ?, start_date = ?, end_date = ?, image_url = ?, status = "pending" WHERE campaign_id = ?',
            [title, description, goal_amount, start_date, end_date, image_url, req.params.id]
        );
        res.status(200).json({ message: 'Campaign updated and resubmitted for approval!' });
    }));

    router.delete('/:id', verifyToken, isAdmin, asyncHandler(async (req, res) => {
        await pool.query('DELETE FROM campaigns WHERE campaign_id = ?', [req.params.id]);
        res.status(200).json({ message: 'Campaign deleted successfully' });
    }));
    
    router.post('/:id/donations', verifyToken, asyncHandler(async (req, res) => {
        const { amount } = req.body;
        const campaign_id = req.params.id;
        const user_id = req.user.userId;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid donation amount.' });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query(
                'INSERT INTO donations (campaign_id, user_id, amount) VALUES (?, ?, ?)',
                [campaign_id, user_id, amount]
            );

            await connection.query(
                'UPDATE campaigns SET current_amount = current_amount + ? WHERE campaign_id = ?',
                [amount, campaign_id]
            );

            await connection.commit();
            res.status(201).json({ message: 'Thank you for your generous donation!' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }));


    return router;
};