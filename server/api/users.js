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
        const {
            full_name, email, password, role, dob, address,
            city, country, phone_number, linkedin_profile,
            graduation_year, major, job_title, company,
            department, institute_name, industry, website,
            bio, skills
        } = req.body;

        if (!full_name || !email || !password || !role) {
            return res.status(400).json({ message: 'Required fields are missing.' });
        }

        const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newUser = {
            full_name,
            email,
            password_hash,
            role,
            dob: dob || null,
            address: address || null,
            city: city || null,
            country: country || null,
            phone_number: phone_number || null,
            linkedin_profile: linkedin_profile || null,
            graduation_year: graduation_year || null,
            major: major || null,
            job_title: job_title || null,
            company: company || null,
            department: department || null,
            institute_name: institute_name || null,
            industry: industry || null,
            website: website || null,
            bio: bio || null,
            skills: skills || null,
            onboarding_complete: true // Set onboarding to complete on signup
        };

        await pool.query('INSERT INTO users SET ?', newUser);
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
            res.status(200).json({ 
                message: 'Login successful', 
                token, 
                role: user.role, 
                email: user.email, 
                user_id: user.user_id, 
                full_name: user.full_name 
            });
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
        res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }));

    router.get('/directory', asyncHandler(async (req, res) => {
        const { query, major, graduation_year, city, industry, skills, company, availability, page, limit } = req.query;
        
        // Pagination parameters
        const currentPage = parseInt(page) || 1;
        const itemsPerPage = parseInt(limit) || 12; // Default 12 items per page
        const offset = (currentPage - 1) * itemsPerPage;
        
        let sql = `SELECT user_id, full_name, email, profile_pic_url, verification_status, job_title, company, major, graduation_year, city, role, availability_status, is_email_visible, is_company_visible, is_location_visible 
                   FROM users WHERE is_profile_public = TRUE AND role != 'admin'`;
        const params = [];

        if (query) {
            sql += ' AND (full_name LIKE ? OR company LIKE ?)';
            params.push(`%${query}%`, `%${query}%`);
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
        if (company) {
            sql += ' AND company LIKE ?';
            params.push(`%${company}%`);
        }
        if (availability) {
            sql += ' AND availability_status = ?';
            params.push(availability);
        }

        // Get total count for pagination
        const countSql = sql.replace('SELECT user_id, full_name, email, profile_pic_url, verification_status, job_title, company, major, graduation_year, city, role, availability_status, is_email_visible, is_company_visible, is_location_visible', 'SELECT COUNT(*) as total');
        const [countResult] = await pool.query(countSql, params);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Add pagination to query
        sql += ' ORDER BY user_id DESC LIMIT ? OFFSET ?';
        params.push(itemsPerPage, offset);

        const [rows] = await pool.query(sql, params);
        
        const publicProfiles = rows.map(user => ({
            user_id: user.user_id,
            full_name: user.full_name,
            profile_pic_url: user.profile_pic_url,
            verification_status: user.verification_status,
            job_title: user.is_company_visible ? user.job_title : 'N/A',
            current_company: user.is_company_visible ? user.company : 'N/A',
            major: user.major,
            graduation_year: user.graduation_year,
            email: user.is_email_visible ? user.email : null,
            role: user.role, // Include role for badge display
            availability_status: user.availability_status, // Include availability status
        }));
        
        res.json({
            data: publicProfiles,
            pagination: {
                currentPage,
                totalPages,
                totalItems,
                itemsPerPage,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1
            }
        });
    }));

    router.get('/profile/:email', asyncHandler(async (req, res) => {
         const { email } = req.params;
         const [rows] = await pool.query('SELECT user_id, full_name, email, profile_pic_url, verification_status, job_title, company, city, bio, linkedin_profile, institute_name, major, graduation_year, department, is_profile_public, is_email_visible, is_company_visible, is_location_visible FROM users WHERE email = ?', [email]);
         if (rows.length === 0) {
             return res.status(404).json({ message: 'Profile not found' });
         }
         const user = rows[0];
         
         if (!user.is_profile_public) {
             return res.status(200).json({ 
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
            current_company: user.is_company_visible ? user.company : null,
            city: user.is_location_visible ? user.city : null,
            bio: user.bio,
            linkedin: user.linkedin_profile,
            university: user.institute_name,
            major: user.major,
            graduation_year: user.graduation_year,
            degree: user.department,
            email: user.is_email_visible ? user.email : null,
         };
         res.json(publicProfile);
    }));

    // --- PROTECTED USER ROUTES (Require a valid token) ---
    router.use(verifyToken);

    router.post('/change-password', asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;
        const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (rows.length === 0) { return res.status(404).json({ message: 'User not found' }); }
        const user = rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) { return res.status(400).json({ message: 'Incorrect current password.' }); }
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newPasswordHash, userId]);
        res.status(200).json({ message: 'Password updated successfully!' });
    }));

    // *** CORRECTED VERIFICATION REQUEST ENDPOINT ***
    router.post('/request-verification', asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // First, check if the user can submit a request
            const [userRows] = await connection.query("SELECT verification_status FROM users WHERE user_id = ? FOR UPDATE", [userId]);
            if (userRows.length === 0 || userRows[0].verification_status !== 'unverified') {
                await connection.rollback();
                return res.status(400).json({ message: 'Could not submit request. You may have already submitted one or are already verified.' });
            }

            // Update the users table
            await connection.query("UPDATE users SET verification_status = 'pending' WHERE user_id = ?", [userId]);

            // Create a corresponding record in the verification_requests table
            await connection.query(
                "INSERT INTO verification_requests (user_id, status, document_path, document_url) VALUES (?, ?, ?, ?)",
                [userId, 'pending', 'User-initiated request', 'N/A']
            );

            await connection.commit();
            res.status(200).json({ message: 'Verification request submitted successfully!' });

        } catch (error) {
            await connection.rollback();
            console.error("Error in /request-verification:", error);
            res.status(500).json({ message: "An internal error occurred." });
        } finally {
            connection.release();
        }
    }));

    router.get('/profile', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.user.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        const user = rows[0];
        delete user.password_hash;
        res.json(user);
    }));

    router.put('/profile', upload.single('profile_picture'), asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const { 
            full_name, bio, company, job_title, city, linkedin_profile, institute_name, major, graduation_year, 
            department, industry, skills, phone_number, website, experience_years, specialization, 
            current_position, research_interests, achievements, certifications, languages, current_year, 
            gpa, expected_graduation, company_size, founded_year, student_count
        } = req.body;
        let profile_pic_url = req.file ? `uploads/${req.file.filename}` : undefined;

        const [userRows] = await pool.query('SELECT profile_pic_url FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) { return res.status(404).json({ message: 'User not found' }); }
        const user = userRows[0];
        
        const updateFields = { 
            full_name, bio, company, job_title, city, linkedin_profile, institute_name, major, graduation_year, 
            department, industry, skills, phone_number, website, experience_years, specialization, 
            current_position, research_interests, achievements, certifications, languages, current_year, 
            gpa, expected_graduation, company_size, founded_year, student_count
        };
        
        // Handle empty values - don't set full_name to null as it's required
        for (const key in updateFields) {
            if (updateFields[key] === '' || updateFields[key] === null || updateFields[key] === undefined) {
                if (key === 'full_name') {
                    // Don't update full_name if it's empty - keep the existing value
                    delete updateFields[key];
                } else {
                    updateFields[key] = null;
                }
            }
        }
        
        // Ensure full_name is never null, undefined, or empty string
        if (updateFields.hasOwnProperty('full_name') && (!updateFields.full_name || updateFields.full_name.trim() === '')) {
            delete updateFields.full_name;
        }
        
        if (profile_pic_url) {
            updateFields.profile_pic_url = profile_pic_url;
            if (user.profile_pic_url) {
                const oldPicPath = path.join(__dirname, '..','..', user.profile_pic_url);
                fs.unlink(oldPicPath).catch(err => console.error("Failed to delete old profile pic:", err));
            }
        }

        await pool.query('UPDATE users SET ? WHERE user_id = ?', [updateFields, userId]);

        const [updatedUserRows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
        const updatedUser = updatedUserRows[0];
        delete updatedUser.password_hash;

        res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    }));
    
    router.get('/privacy', asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const [rows] = await pool.query('SELECT is_profile_public, is_email_visible, is_company_visible, is_location_visible FROM users WHERE user_id = ?', [userId]);
        if (rows.length === 0) { return res.status(404).json({ message: 'User not found' }); }
        res.json(rows[0]);
    }));

    router.put('/privacy', asyncHandler(async (req, res) => {
        const { is_profile_public, is_email_visible, is_company_visible, is_location_visible } = req.body;
        const userId = req.user.userId;
        await pool.query(
            'UPDATE users SET is_profile_public = ?, is_email_visible = ?, is_company_visible = ?, is_location_visible = ? WHERE user_id = ?',
            [is_profile_public, is_email_visible, is_company_visible, is_location_visible, userId]
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

    router.get('/dashboard-stats', asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const [userRows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userRows[0];
        
        // Role-specific profile fields configuration
        // NOTE: This configuration is duplicated in client/js/profile.js (line ~109)
        // Any changes here MUST be synchronized with the client-side definition
        const roleFieldsConfig = {
            alumni: ['full_name', 'bio', 'city', 'phone_number', 'linkedin_profile', 'company', 'job_title', 'industry', 'skills', 'institute_name', 'major', 'graduation_year', 'department', 'experience_years', 'specialization', 'achievements', 'certifications', 'languages'],
            student: ['full_name', 'bio', 'city', 'phone_number', 'linkedin_profile', 'skills', 'institute_name', 'major', 'graduation_year', 'department', 'expected_graduation', 'current_year', 'gpa', 'research_interests', 'languages'],
            faculty: ['full_name', 'bio', 'city', 'phone_number', 'linkedin_profile', 'company', 'job_title', 'industry', 'skills', 'department', 'experience_years', 'specialization', 'current_position', 'research_interests', 'achievements', 'certifications', 'languages'],
            employer: ['full_name', 'bio', 'city', 'phone_number', 'industry', 'website', 'company_size', 'founded_year', 'languages'],
            institute: ['full_name', 'bio', 'city', 'phone_number', 'website', 'founded_year', 'student_count', 'languages']
        };
        
        const profileFields = roleFieldsConfig[user.role] || roleFieldsConfig.alumni;
        let completedFields = 0;
        profileFields.forEach(field => {
            if (user[field] && user[field].toString().trim() !== '') {
                completedFields++;
            }
        });
        const profileCompletion = Math.round((completedFields / profileFields.length) * 100);
        const [eventsRsvpd] = await pool.query('SELECT COUNT(*) as count FROM event_rsvps WHERE user_id = ?', [userId]);
        const [blogsPosted] = await pool.query('SELECT COUNT(*) as count FROM blogs WHERE author_id = ?', [userId]);

        res.json({
            profileCompletion,
            eventsRsvpd: eventsRsvpd[0].count,
            blogsPosted: blogsPosted[0].count
        });
    }));

    router.get('/dashboard-recommendations', asyncHandler(async (req, res) => {
        const [featuredMentor] = await pool.query(`
            SELECT u.user_id, u.full_name, u.job_title, u.profile_pic_url, m.expertise_areas
            FROM mentors m JOIN users u ON m.user_id = u.user_id 
            WHERE m.is_available = TRUE ORDER BY RAND() LIMIT 1
        `);
        const [recommendedEvent] = await pool.query('SELECT * FROM events WHERE date >= CURDATE() ORDER BY date ASC LIMIT 1');

        res.json({
            featuredMentor: featuredMentor.length > 0 ? featuredMentor[0] : null,
            recommendedEvent: recommendedEvent.length > 0 ? recommendedEvent[0] : null
        });
    }));

    router.get('/dashboard-activity', asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const [blogs] = await pool.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count 
            FROM blogs WHERE author_id = ? AND created_at >= CURDATE() - INTERVAL 6 MONTH
            GROUP BY month ORDER BY month ASC
        `, [userId]);
        const [rsvps] = await pool.query(`
            SELECT DATE_FORMAT(rsvp_date, '%Y-%m') as month, COUNT(*) as count 
            FROM event_rsvps WHERE user_id = ? AND rsvp_date >= CURDATE() - INTERVAL 6 MONTH
            GROUP BY month ORDER BY month ASC
        `, [userId]);
        res.json({ blogs, rsvps });
    }));

    router.get('/announcements', asyncHandler(async (req, res) => {
        const [announcements] = await pool.query(`
            SELECT a.announcement_id, a.title, a.content, a.created_at, u.full_name as author
            FROM announcements a
            JOIN users u ON a.author_id = u.user_id
            ORDER BY a.created_at DESC
            LIMIT 5
        `);
        res.json(announcements);
    }));

    // Connection request endpoints for directory feature
    router.post('/connect-request', asyncHandler(async (req, res) => {
        const fromUserId = req.user.userId;
        const { to_email } = req.body;

        if (!to_email) {
            return res.status(400).json({ message: 'to_email is required' });
        }

        // Get the to_user_id from email
        const [toUserRows] = await pool.query('SELECT user_id FROM users WHERE email = ?', [to_email]);
        if (toUserRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const toUserId = toUserRows[0].user_id;

        // Prevent users from connecting to themselves
        if (fromUserId === toUserId) {
            return res.status(400).json({ message: 'Cannot send connection request to yourself' });
        }

        // Check if connection already exists
        const minId = Math.min(fromUserId, toUserId);
        const maxId = Math.max(fromUserId, toUserId);
        const [existingConnection] = await pool.query(
            'SELECT * FROM connections WHERE user1_id = ? AND user2_id = ?',
            [minId, maxId]
        );
        if (existingConnection.length > 0) {
            return res.status(400).json({ message: 'Already connected' });
        }

        // Check if request already exists
        const [existingRequest] = await pool.query(
            'SELECT * FROM connection_requests WHERE from_user_id = ? AND to_user_id = ?',
            [fromUserId, toUserId]
        );
        if (existingRequest.length > 0) {
            if (existingRequest[0].status === 'pending') {
                return res.status(400).json({ message: 'Connection request already sent' });
            } else if (existingRequest[0].status === 'rejected') {
                // Update the rejected request to pending
                await pool.query(
                    'UPDATE connection_requests SET status = ?, updated_at = NOW() WHERE from_user_id = ? AND to_user_id = ?',
                    ['pending', fromUserId, toUserId]
                );
                return res.status(200).json({ message: 'Connection request sent successfully' });
            }
        }

        // Check for reverse request (if they sent us a request, auto-accept and create connection)
        const [reverseRequest] = await pool.query(
            'SELECT * FROM connection_requests WHERE from_user_id = ? AND to_user_id = ? AND status = ?',
            [toUserId, fromUserId, 'pending']
        );
        
        if (reverseRequest.length > 0) {
            // Auto-accept the reverse request and create connection
            await pool.query(
                'UPDATE connection_requests SET status = ?, updated_at = NOW() WHERE request_id = ?',
                ['accepted', reverseRequest[0].request_id]
            );
            await pool.query(
                'INSERT INTO connections (user1_id, user2_id) VALUES (?, ?)',
                [minId, maxId]
            );
            
            // Create notification for the other user
            await pool.query(
                'INSERT INTO notifications (user_id, actor_user_id, notification_type, message, link) VALUES (?, ?, ?, ?, ?)',
                [toUserId, fromUserId, 'connection_accepted', 'accepted your connection request', `/view-profile.html?email=${req.user.email}`]
            );
            
            return res.status(200).json({ message: 'Connection created successfully', status: 'connected' });
        }

        // Create new connection request
        await pool.query(
            'INSERT INTO connection_requests (from_user_id, to_user_id, status) VALUES (?, ?, ?)',
            [fromUserId, toUserId, 'pending']
        );

        // Create notification for the recipient
        await pool.query(
            'INSERT INTO notifications (user_id, actor_user_id, notification_type, message, link) VALUES (?, ?, ?, ?, ?)',
            [toUserId, fromUserId, 'connection_request', 'sent you a connection request', `/view-profile.html?email=${req.user.email}`]
        );

        res.status(201).json({ message: 'Connection request sent successfully' });
    }));

    // Get connection status with another user
    router.get('/connection-status/:email', asyncHandler(async (req, res) => {
        const currentUserId = req.user.userId;
        const { email } = req.params;

        // Get the other user's ID
        const [otherUserRows] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (otherUserRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const otherUserId = otherUserRows[0].user_id;

        // Check if connected
        const minId = Math.min(currentUserId, otherUserId);
        const maxId = Math.max(currentUserId, otherUserId);
        const [connection] = await pool.query(
            'SELECT * FROM connections WHERE user1_id = ? AND user2_id = ?',
            [minId, maxId]
        );
        if (connection.length > 0) {
            return res.json({ status: 'connected' });
        }

        // Check for pending request (from current user)
        const [sentRequest] = await pool.query(
            'SELECT * FROM connection_requests WHERE from_user_id = ? AND to_user_id = ? AND status = ?',
            [currentUserId, otherUserId, 'pending']
        );
        if (sentRequest.length > 0) {
            return res.json({ status: 'pending' });
        }

        // Check for pending request (from other user)
        const [receivedRequest] = await pool.query(
            'SELECT * FROM connection_requests WHERE from_user_id = ? AND to_user_id = ? AND status = ?',
            [otherUserId, currentUserId, 'pending']
        );
        if (receivedRequest.length > 0) {
            return res.json({ status: 'received' });
        }

        res.json({ status: 'not_connected' });
    }));

    // Accept connection request
    router.post('/accept-connection/:requestId', asyncHandler(async (req, res) => {
        const currentUserId = req.user.userId;
        const { requestId } = req.params;

        // Get the request
        const [requestRows] = await pool.query(
            'SELECT * FROM connection_requests WHERE request_id = ? AND to_user_id = ? AND status = ?',
            [requestId, currentUserId, 'pending']
        );
        if (requestRows.length === 0) {
            return res.status(404).json({ message: 'Connection request not found' });
        }

        const request = requestRows[0];
        const minId = Math.min(request.from_user_id, request.to_user_id);
        const maxId = Math.max(request.from_user_id, request.to_user_id);

        // Update request status
        await pool.query(
            'UPDATE connection_requests SET status = ?, updated_at = NOW() WHERE request_id = ?',
            ['accepted', requestId]
        );

        // Create connection
        await pool.query(
            'INSERT INTO connections (user1_id, user2_id) VALUES (?, ?)',
            [minId, maxId]
        );

        // Create notification for the requester
        await pool.query(
            'INSERT INTO notifications (user_id, actor_user_id, notification_type, message, link) VALUES (?, ?, ?, ?, ?)',
            [request.from_user_id, currentUserId, 'connection_accepted', 'accepted your connection request', `/view-profile.html?email=${req.user.email}`]
        );

        res.json({ message: 'Connection request accepted' });
    }));

    // Reject connection request
    router.post('/reject-connection/:requestId', asyncHandler(async (req, res) => {
        const currentUserId = req.user.userId;
        const { requestId } = req.params;

        // Get the request
        const [requestRows] = await pool.query(
            'SELECT * FROM connection_requests WHERE request_id = ? AND to_user_id = ? AND status = ?',
            [requestId, currentUserId, 'pending']
        );
        if (requestRows.length === 0) {
            return res.status(404).json({ message: 'Connection request not found' });
        }

        // Update request status
        await pool.query(
            'UPDATE connection_requests SET status = ?, updated_at = NOW() WHERE request_id = ?',
            ['rejected', requestId]
        );

        res.json({ message: 'Connection request rejected' });
    }));

    return router;
};