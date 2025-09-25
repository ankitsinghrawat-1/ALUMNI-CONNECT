const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

module.exports = (pool, upload, createGlobalNotification) => {

    router.post('/:job_id/apply', upload.single('resume'), asyncHandler(async (req, res) => {
        const { job_id } = req.params;
        const { email, full_name, cover_letter } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'A resume file is required.' });
        }
        const resume_path = `uploads/resumes/${req.file.filename}`;
        await pool.query(
            'INSERT INTO job_applications (job_id, user_email, full_name, resume_path, cover_letter) VALUES (?, ?, ?, ?, ?)',
            [job_id, email, full_name, resume_path, cover_letter]
        );
        res.status(201).json({ message: 'Application submitted successfully!' });
    }));

    router.get('/recent', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT job_id, title, company, location FROM jobs ORDER BY created_at DESC LIMIT 3');
        res.json(rows);
    }));

    router.get('/', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
        res.json(rows);
    }));

    router.get('/:id', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT * FROM jobs WHERE job_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.json(rows[0]);
    }));

    router.post('/', verifyToken, isAdmin, asyncHandler(async (req, res) => {
        const { title, company, location, description, contact_email } = req.body;
        await pool.query('INSERT INTO jobs (title, company, location, description, contact_email) VALUES (?, ?, ?, ?, ?)', [title, company, location, description, contact_email]);
        await createGlobalNotification(`A new job has been posted: "${title}" at ${company}.`, '/jobs.html');
        res.status(201).json({ message: 'Job added successfully' });
    }));

    router.put('/:id', verifyToken, isAdmin, asyncHandler(async (req, res) => {
        const { title, description, company, location, contact_email } = req.body;
        await pool.query(
            'UPDATE jobs SET title = ?, description = ?, company = ?, location = ?, contact_email = ? WHERE job_id = ?',
            [title, description, company, location, contact_email, req.params.id]
        );
        res.status(200).json({ message: 'Job updated successfully!' });
    }));

    router.delete('/:id', verifyToken, isAdmin, asyncHandler(async (req, res) => {
        await pool.query('DELETE FROM job_applications WHERE job_id = ?', [req.params.id]);
        await pool.query('DELETE FROM jobs WHERE job_id = ?', [req.params.id]);
        res.status(200).json({ message: 'Job and related applications deleted successfully.' });
    }));

    return router;
};