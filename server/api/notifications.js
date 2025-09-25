const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../middleware/authMiddleware');

module.exports = (pool) => {
    
    router.get('/', verifyToken, asyncHandler(async (req, res) => {
        const user_id = req.user.userId;
        const [notifications] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
        res.json(notifications);
    }));

    router.post('/mark-read', verifyToken, asyncHandler(async (req, res) => {
        const user_id = req.user.userId;
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [user_id]);
        res.status(200).json({ message: 'Notifications marked as read.' });
    }));

    router.delete('/:id', verifyToken, asyncHandler(async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.userId;
        const [result] = await pool.query('DELETE FROM notifications WHERE notification_id = ? AND user_id = ?', [id, user_id]);
        if (result.affectedRows === 0) {
            return res.status(403).json({ message: 'You are not authorized to delete this notification.' });
        }
        res.status(200).json({ message: 'Notification deleted.' });
    }));

    return router;
};