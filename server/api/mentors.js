const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../middleware/authMiddleware');

module.exports = (pool) => {

    router.get('/', asyncHandler(async (req, res) => {
        const [mentors] = await pool.query(`
            SELECT u.user_id, u.full_name, u.job_title, u.current_company, u.profile_pic_url, u.email, m.expertise_areas, u.verification_status
            FROM mentors m JOIN users u ON m.user_id = u.user_id WHERE m.is_available = TRUE
        `);
        res.json(mentors);
    }));

    router.post('/', verifyToken, asyncHandler(async (req, res) => {
        const { expertise_areas } = req.body;
        const user_id = req.user.userId;
        const [existingMentor] = await pool.query('SELECT * FROM mentors WHERE user_id = ?', [user_id]);
        if (existingMentor.length > 0) {
            return res.status(409).json({ message: 'You are already registered as a mentor.' });
        }
        await pool.query('INSERT INTO mentors (user_id, expertise_areas) VALUES (?, ?)', [user_id, expertise_areas]);
        res.status(201).json({ message: 'Successfully registered as a mentor!' });
    }));

    router.post('/request', verifyToken, asyncHandler(async (req, res) => {
        const { mentor_id, message } = req.body;
        const mentee_user_id = req.user.userId;
        try {
            await pool.query(
                'INSERT INTO mentor_requests (mentor_user_id, mentee_user_id, request_message) VALUES (?, ?, ?)',
                [mentor_id, mentee_user_id, message]
            );
            res.status(201).json({ message: 'Mentorship request sent successfully!' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'You have already sent a request to this mentor.' });
            }
            throw error;
        }
    }));

    router.get('/requests', verifyToken, asyncHandler(async (req, res) => {
        const mentor_user_id = req.user.userId;
        const [requests] = await pool.query(`
            SELECT mr.request_id, mr.request_message, mr.created_at, u.full_name as mentee_name, u.email as mentee_email, u.profile_pic_url 
            FROM mentor_requests mr
            JOIN users u ON mr.mentee_user_id = u.user_id
            WHERE mr.mentor_user_id = ? AND mr.status = 'pending'
        `, [mentor_user_id]);
        res.json(requests);
    }));

    router.post('/requests/:requestId/respond', verifyToken, asyncHandler(async (req, res) => {
        const { requestId } = req.params;
        const { action } = req.body;
        if (!['accepted', 'declined'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action.' });
        }
        await pool.query('UPDATE mentor_requests SET status = ? WHERE request_id = ?', [action, requestId]);
        res.status(200).json({ message: `Request has been ${action}.` });
    }));
    
    router.get('/status', verifyToken, asyncHandler(async (req, res) => {
        const user_id = req.user.userId;
        const [mentor] = await pool.query('SELECT * FROM mentors WHERE user_id = ?', [user_id]);
        res.json({ isMentor: mentor.length > 0 });
    }));

    router.get('/profile', verifyToken, asyncHandler(async (req, res) => {
        const user_id = req.user.userId;
        const [mentor] = await pool.query('SELECT expertise_areas FROM mentors WHERE user_id = ?', [user_id]);
        if (mentor.length === 0) {
            return res.status(404).json({ message: 'Mentor profile not found' });
        }
        res.json(mentor[0]);
    }));

    router.put('/profile', verifyToken, asyncHandler(async (req, res) => {
        const { expertise_areas } = req.body;
        const user_id = req.user.userId;
        const [result] = await pool.query('UPDATE mentors SET expertise_areas = ? WHERE user_id = ?', [expertise_areas, user_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Mentor profile not found to update.' });
        }
        res.status(200).json({ message: 'Mentor profile updated successfully!' });
    }));

    router.delete('/profile', verifyToken, asyncHandler(async (req, res) => {
        const user_id = req.user.userId;
        await pool.query('DELETE FROM mentors WHERE user_id = ?', [user_id]);
        res.status(200).json({ message: 'You have been unlisted as a mentor.' });
    }));

    return router;
};