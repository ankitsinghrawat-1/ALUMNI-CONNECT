const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

module.exports = (pool) => {
    router.post('/login', asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials or not an admin' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            const payload = { userId: user.user_id, email: user.email, role: user.role };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
            res.status(200).json({ message: 'Admin login successful', token, role: user.role, email: user.email });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    }));
    
    router.use(verifyToken, isAdmin);

    router.get('/stats', asyncHandler(async (req, res) => {
        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        const [events] = await pool.query('SELECT COUNT(*) as count FROM events');
        const [jobs] = await pool.query('SELECT COUNT(*) as count FROM jobs');
        const [applications] = await pool.query('SELECT COUNT(*) as count FROM job_applications');
        res.json({
            totalUsers: users[0].count,
            totalEvents: events[0].count,
            totalJobs: jobs[0].count,
            totalApplications: applications[0].count
        });
    }));

    router.get('/analytics/signups', asyncHandler(async (req, res) => {
        const [rows] = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM users WHERE created_at >= CURDATE() - INTERVAL 30 DAY
            GROUP BY DATE(created_at) ORDER BY date ASC
        `);
        res.json(rows);
    }));

    router.get('/analytics/content-overview', asyncHandler(async (req, res) => {
        const [[blogs]] = await pool.query('SELECT COUNT(*) as count FROM blogs');
        const [[jobs]] = await pool.query('SELECT COUNT(*) as count FROM jobs');
        const [[events]] = await pool.query('SELECT COUNT(*) as count FROM events');
        res.json({ blogs: blogs.count, jobs: jobs.count, events: events.count });
    }));

    router.get('/applications', asyncHandler(async (req, res) => {
        const [rows] = await pool.query(`
            SELECT ja.application_id, ja.full_name, ja.user_email, ja.resume_path,
                   ja.application_date, ja.status, ja.admin_notes, j.title AS job_title
            FROM job_applications ja JOIN jobs j ON ja.job_id = j.job_id
            ORDER BY ja.application_date DESC
        `);
        res.json(rows);
    }));

    router.post('/applications/:id/process', asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status, admin_notes } = req.body;
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }
        
        const [application] = await pool.query(
            'SELECT ja.user_email, j.title FROM job_applications ja JOIN jobs j ON ja.job_id = j.job_id WHERE ja.application_id = ?',
            [id]
        );
        if (application.length === 0) {
            return res.status(404).json({ message: 'Application not found.' });
        }
        
        const { user_email, title } = application[0];
        const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [user_email]);
        if (user.length > 0) {
            const user_id = user[0].user_id;
            let message = `Your application for "${title}" has been ${status}.`;
            if (admin_notes) message += ` Note from admin: "${admin_notes}"`;
            await pool.query('INSERT INTO notifications (user_id, message, link) VALUES (?, ?, ?)', [user_id, message, '/jobs.html']);
        }

        await pool.query('UPDATE job_applications SET status = ?, admin_notes = ? WHERE application_id = ?', [status, admin_notes, id]);
        res.status(200).json({ message: `Application has been ${status}.` });
    }));

    router.get('/verification-requests', asyncHandler(async (req, res) => {
        const [rows] = await pool.query("SELECT user_id, full_name, email FROM users WHERE verification_status = 'pending'");
        res.json(rows);
    }));

    router.get('/users', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT user_id, full_name, email, role, verification_status FROM users');
        res.json(rows);
    }));

    router.post('/users/:id/update-status', asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        if (!['verified', 'unverified'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }
        await pool.query('UPDATE users SET verification_status = ? WHERE user_id = ?', [status, id]);
        res.status(200).json({ message: 'User verification status updated.' });
    }));

    router.delete('/users/:id', asyncHandler(async (req, res) => {
        await pool.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
        res.status(200).json({ message: 'User deleted successfully' });
    }));

    return router;
};