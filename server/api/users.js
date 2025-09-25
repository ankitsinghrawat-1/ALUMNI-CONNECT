const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../middleware/authMiddleware');

module.exports = (pool, upload) => {

    // --- PUBLIC AUTHENTICATION & DIRECTORY ROUTES ---
    router.post('/signup', asyncHandler(async (req, res) => {
        const { full_name, email, password } = req.body;
        if (!full_name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Email already registered' });
        }
        const password_hash = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)', [full_name, email, password_hash]);
        res.status(201).json({ message: 'User registered successfully' });
    }));

    router.post('/login', asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            const payload = { userId: user.user_id, email: user.email, role: user.role };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
            res.status(200).json({ message: 'Login successful', token, role: user.role, email: user.email });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    }));

    router.post('/logout', (req, res) => {
        res.status(200).json({ message: 'Logout successful' });
    });

    router.post('/forgot-password', asyncHandler(async (req, res) => {
        const { email } = req.body;
        const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length > 0) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
            await pool.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?', [resetToken, resetTokenExpiry, email]);
            const resetLink = `http://localhost:3000/reset-password.html?token=${resetToken}`;
            console.log(`Password reset link for ${email}: ${resetLink}`);
        }
        // Always send a generic success message for security
        res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }));

    router.get('/directory', asyncHandler(async (req, res) => {
        const { query, university, major, graduation_year, city, industry, skills } = req.query;
        let sql = `SELECT user_id, full_name, email, profile_pic_url, verification_status, job_title, current_company, major, graduation_year, city, is_email_visible, is_company_visible, is_location_visible 
                   FROM users WHERE is_profile_public = TRUE`;
        const params = [];

        if (query) {
            sql += ' AND (full_name LIKE ? OR current_company LIKE ?)';
            params.push(`%${query}%`, `%${query}%`);
        }
        if (university) {
            sql += ' AND university LIKE ?';
            params.push(`%${university}%`);
        }
        if (major) {
            sql += ' AND major LIKE ?';
            params.push(`%${major}%`);
        }
        if (graduation_year) {
            sql += ' AND graduation_year = ?';
            params.push(graduation_year);
        }
        if (city) {
            sql += ' AND city LIKE ?';
            params.push(`%${city}%`);
        }
        if (industry) {
            sql += ' AND industry LIKE ?';
            params.push(`%${industry}%`);
        }
        if (skills) {
            sql += ' AND skills LIKE ?';
            params.push(`%${skills}%`);
        }

        const [rows] = await pool.query(sql, params);
        
        const publicProfiles = rows.map(user => ({
            user_id: user.user_id,
            full_name: user.full_name,
            profile_pic_url: user.profile_pic_url,
            verification_status: user.verification_status,
            job_title: user.is_company_visible ? user.job_title : 'N/A',
            current_company: user.is_company_visible ? user.current_company : 'N/A',
            major: user.major,
            graduation_year: user.graduation_year,
            email: user.is_email_visible ? user.email : null,
        }));
        res.json(publicProfiles);
    }));

    router.get('/profile/:email', asyncHandler(async (req, res) => {
         const { email } = req.params;
         const [rows] = await pool.query('SELECT user_id, full_name, email, profile_pic_url, verification_status, job_title, current_company, city, bio, linkedin, university, major, graduation_year, degree, is_profile_public, is_email_visible, is_company_visible, is_location_visible FROM users WHERE email = ?', [email]);
         if (rows.length === 0) {
             return res.status(404).json({ message: 'Profile not found' });
         }
         const user = rows[0];
         
         if (!user.is_profile_public) {
             return res.status(403).json({ 
                 message: 'This profile is private.',
                 full_name: user.full_name,
                 profile_pic_url: user.profile_pic_url,
                 verification_status: user.verification_status
             });
         }
         
         const publicProfile = {
            full_name: user.full_name,
            profile_pic_url: user.profile_pic_url,
            verification_status: user.verification_status,
            job_title: user.is_company_visible ? user.job_title : null,
            current_company: user.is_company_visible ? user.current_company : null,
            city: user.is_location_visible ? user.city : null,
            bio: user.bio,
            linkedin: user.linkedin,
            university: user.university,
            major: user.major,
            graduation_year: user.graduation_year,
            degree: user.degree,
            email: user.is_email_visible ? user.email : null,
         };
         res.json(publicProfile);
    }));

    // --- PROTECTED USER ROUTES (Require a valid token) ---
    // All routes defined after this middleware will be protected
    router.use(verifyToken);

    router.post('/change-password', asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        const email = req.user.email;
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) { return res.status(404).json({ message: 'User not found' }); }
        const user = rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) { return res.status(400).json({ message: 'Incorrect current password.' }); }
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [newPasswordHash, email]);
        res.status(200).json({ message: 'Password updated successfully!' });
    }));

    router.post('/request-verification', asyncHandler(async (req, res) => {
        const email = req.user.email;
        const [result] = await pool.query("UPDATE users SET verification_status = 'pending' WHERE email = ? AND verification_status = 'unverified'", [email]);
        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'Could not submit request. You may have already submitted one or are already verified.' });
        }
        res.status(200).json({ message: 'Verification request submitted successfully!' });
    }));

    router.post('/onboard', asyncHandler(async (req, res) => {
        const { university, university_email, city, graduation_year, major, degree, current_company, job_title, bio, linkedin } = req.body;
        const email = req.user.email;
        await pool.query(
            'UPDATE users SET university = ?, university_email = ?, city = ?, graduation_year = ?, major = ?, degree = ?, current_company = ?, job_title = ?, bio = ?, linkedin = ?, onboarding_complete = TRUE WHERE email = ?',
            [university, university_email || null, city, graduation_year || null, major, degree, current_company, job_title, bio, linkedin || null, email]
        );
        res.status(200).json({ message: 'Onboarding complete' });
    }));

    // This single route handles getting the logged-in user's own profile
    router.get('/profile', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.user.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        const user = rows[0];
        delete user.password_hash; // Never send the hash
        res.json(user);
    }));

    // This route handles updating the logged-in user's own profile
    router.put('/profile', upload.single('profile_picture'), asyncHandler(async (req, res) => {
        const email = req.user.email;
        const { full_name, bio, current_company, job_title, city, linkedin, university, major, graduation_year, degree, industry, skills } = req.body;
        let profile_pic_url = req.file ? `uploads/${req.file.filename}` : undefined;

        const [userRows] = await pool.query('SELECT profile_pic_url FROM users WHERE email = ?', [email]);
        if (userRows.length === 0) { return res.status(404).json({ message: 'User not found' }); }
        const user = userRows[0];
        
        const updateFields = { full_name, bio, current_company, job_title, city, linkedin, university, major, graduation_year, degree, industry, skills };
        
        // Sanitize empty strings to null for the database
        for (const key in updateFields) {
            if (updateFields[key] === '') {
                updateFields[key] = null;
            }
        }
        
        if (profile_pic_url) {
            updateFields.profile_pic_url = profile_pic_url;
            if (user.profile_pic_url) {
                const oldPicPath = path.join(__dirname, '..','..', user.profile_pic_url);
                fs.unlink(oldPicPath).catch(err => console.error("Failed to delete old profile pic:", err));
            }
        }

        await pool.query('UPDATE users SET ? WHERE email = ?', [updateFields, email]);
        res.status(200).json({ message: 'Profile updated successfully' });
    }));
    
    router.get('/privacy', asyncHandler(async (req, res) => {
        const email = req.user.email;
        const [rows] = await pool.query('SELECT is_profile_public, is_email_visible, is_company_visible, is_location_visible FROM users WHERE email = ?', [email]);
        if (rows.length === 0) { return res.status(404).json({ message: 'User not found' }); }
        res.json(rows[0]);
    }));

    router.put('/privacy', asyncHandler(async (req, res) => {
        const { is_profile_public, is_email_visible, is_company_visible, is_location_visible } = req.body;
        const email = req.user.email;
        await pool.query(
            'UPDATE users SET is_profile_public = ?, is_email_visible = ?, is_company_visible = ?, is_location_visible = ? WHERE email = ?',
            [is_profile_public, is_email_visible, is_company_visible, is_location_visible, email]
        );
        res.status(200).json({ message: 'Privacy settings updated successfully' });
    }));
    
    router.get('/conversations', asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const [conversations] = await pool.query(`
            SELECT c.conversation_id, u.user_id, u.full_name, u.email AS other_user_email, u.profile_pic_url,
                   (SELECT content FROM messages WHERE conversation_id = c.conversation_id ORDER BY created_at DESC LIMIT 1) AS last_message
            FROM conversations c
            JOIN conversation_participants cp ON c.conversation_id = cp.conversation_id
            JOIN users u ON u.user_id = cp.user_id
            WHERE c.conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = ?) AND cp.user_id != ?
        `, [userId, userId]);
        res.json(conversations);
    }));

    return router;
};