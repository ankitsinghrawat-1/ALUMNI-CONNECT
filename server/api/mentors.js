const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../middleware/authMiddleware');

module.exports = (pool) => {

    router.get('/', asyncHandler(async (req, res) => {
        const [mentors] = await pool.query(`
            SELECT 
                u.user_id, u.full_name, u.job_title, u.company, u.profile_pic_url, u.email, 
                m.expertise_areas, m.industry, m.experience_years, m.bio, m.skills, m.languages,
                m.mentoring_style, m.hourly_rate, m.is_premium, m.average_rating, m.total_reviews,
                m.response_time_hours, m.verification_level, u.verification_status
            FROM mentors m 
            JOIN users u ON m.user_id = u.user_id 
            WHERE m.is_available = TRUE
            ORDER BY m.verification_level DESC, m.average_rating DESC, m.total_reviews DESC
        `);
        res.json(mentors);
    }));

    // This route is protected by verifyToken
    router.use(verifyToken);

    router.post('/', asyncHandler(async (req, res) => {
        const { expertise_areas } = req.body;
        const user_id = req.user.userId;
        const [existingMentor] = await pool.query('SELECT * FROM mentors WHERE user_id = ?', [user_id]);
        if (existingMentor.length > 0) {
            return res.status(409).json({ message: 'You are already registered as a mentor.' });
        }
        await pool.query('INSERT INTO mentors (user_id, expertise_areas) VALUES (?, ?)', [user_id, expertise_areas]);
        res.status(201).json({ message: 'Successfully registered as a mentor!' });
    }));

    // Enhanced mentor registration endpoint
    router.post('/enhanced', asyncHandler(async (req, res) => {
        const {
            industry, experience_years, bio, timezone, expertise_areas, skills, languages,
            linkedin_url, github_url, portfolio_url, mentoring_style, communication_methods,
            availability, response_time_hours, max_mentees, video_intro_url, is_premium,
            hourly_rate, notification_email, auto_accept_requests
        } = req.body;
        
        const user_id = req.user.userId;
        
        // Check if user is already a mentor
        const [existingMentor] = await pool.query('SELECT * FROM mentors WHERE user_id = ?', [user_id]);
        if (existingMentor.length > 0) {
            return res.status(409).json({ message: 'You are already registered as a mentor.' });
        }

        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Insert main mentor record
            const [mentorResult] = await connection.query(`
                INSERT INTO mentors (
                    user_id, industry, experience_years, bio, expertise_areas, skills, languages,
                    timezone, linkedin_url, github_url, portfolio_url, mentoring_style,
                    communication_methods, response_time_hours, is_premium, hourly_rate,
                    video_intro_url, verification_level
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                user_id, industry, experience_years, bio, expertise_areas, skills, languages,
                timezone, linkedin_url, github_url, portfolio_url, mentoring_style,
                JSON.stringify(communication_methods), response_time_hours, is_premium, hourly_rate,
                video_intro_url, 'basic'
            ]);

            const mentor_id = mentorResult.insertId;

            // Insert availability records
            if (availability && availability.length > 0) {
                const availabilityValues = availability.map(av => [
                    mentor_id, av.day_of_week, av.start_time, av.end_time
                ]);
                
                await connection.query(`
                    INSERT INTO mentor_availability (mentor_id, day_of_week, start_time, end_time)
                    VALUES ?
                `, [availabilityValues]);
            }

            // Insert mentor preferences
            await connection.query(`
                INSERT INTO mentor_preferences (
                    mentor_id, notification_email, auto_accept_requests, max_mentees_active,
                    preferred_session_length, advance_booking_days
                ) VALUES (?, ?, ?, ?, 60, 7)
            `, [mentor_id, notification_email, auto_accept_requests, max_mentees]);

            // Parse and insert skills as specializations
            if (skills) {
                const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
                if (skillsArray.length > 0) {
                    const specializationValues = skillsArray.map(skill => [
                        mentor_id, skill, 'intermediate', Math.min(experience_years, 10)
                    ]);
                    
                    await connection.query(`
                        INSERT INTO mentor_specializations (mentor_id, specialization, proficiency_level, years_experience)
                        VALUES ?
                    `, [specializationValues]);
                }
            }

            await connection.commit();

            res.status(201).json({ 
                message: 'Successfully registered as an enhanced mentor! Your profile is now live and visible to potential mentees.',
                mentor_id: mentor_id
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }));

    // Get mentor details with enhanced information
    router.get('/detailed/:mentorId', asyncHandler(async (req, res) => {
        const { mentorId } = req.params;
        
        // Get main mentor info
        const [mentor] = await pool.query(`
            SELECT 
                u.user_id, u.full_name, u.job_title, u.company, u.profile_pic_url, u.email,
                m.*, 
                COUNT(mr.request_id) as total_requests,
                COUNT(CASE WHEN mr.status = 'accepted' THEN 1 END) as accepted_requests
            FROM mentors m 
            JOIN users u ON m.user_id = u.user_id 
            LEFT JOIN mentor_requests mr ON m.mentor_id = mr.mentor_user_id
            WHERE m.mentor_id = ?
            GROUP BY m.mentor_id
        `, [mentorId]);

        if (mentor.length === 0) {
            return res.status(404).json({ message: 'Mentor not found' });
        }

        // Get specializations
        const [specializations] = await pool.query(`
            SELECT specialization, proficiency_level, years_experience
            FROM mentor_specializations
            WHERE mentor_id = ?
        `, [mentorId]);

        // Get availability
        const [availability] = await pool.query(`
            SELECT day_of_week, start_time, end_time
            FROM mentor_availability
            WHERE mentor_id = ? AND is_available = TRUE
        `, [mentorId]);

        // Get reviews (latest 5)
        const [reviews] = await pool.query(`
            SELECT mr.rating, mr.review_text, mr.created_at, u.full_name as reviewer_name
            FROM mentor_reviews mr
            JOIN users u ON mr.reviewer_user_id = u.user_id
            WHERE mr.mentor_id = ? 
            ORDER BY mr.created_at DESC
            LIMIT 5
        `, [mentorId]);

        // Get achievements
        const [achievements] = await pool.query(`
            SELECT achievement_type, title, description, issuer_organization, achievement_date
            FROM mentor_achievements
            WHERE mentor_id = ?
            ORDER BY achievement_date DESC
        `, [mentorId]);

        res.json({
            mentor: mentor[0],
            specializations,
            availability,
            reviews,
            achievements
        });
    }));

    // Original routes maintained for backward compatibility
    router.post('/request', asyncHandler(async (req, res) => {
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
    
    // UPDATED: Now returns status and message for each sent request
    router.get('/requests/sent', asyncHandler(async (req, res) => {
        const mentee_user_id = req.user.userId;
        const [requests] = await pool.query(
            "SELECT mentor_user_id, status, request_message FROM mentor_requests WHERE mentee_user_id = ?",
            [mentee_user_id]
        );
        res.json(requests);
    }));
    
    // NEW: Route to update a pending request message
    router.put('/requests/sent/:mentorId', asyncHandler(async (req, res) => {
        const { message } = req.body;
        const { mentorId } = req.params;
        const mentee_user_id = req.user.userId;
        
        const [result] = await pool.query(
            "UPDATE mentor_requests SET request_message = ? WHERE mentee_user_id = ? AND mentor_user_id = ? AND status = 'pending'",
            [message, mentee_user_id, mentorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No pending request found to update.' });
        }
        res.status(200).json({ message: 'Mentorship request updated successfully!' });
    }));

    // NEW: Route to cancel (delete) a pending request
    router.delete('/requests/sent/:mentorId', asyncHandler(async (req, res) => {
        const { mentorId } = req.params;
        const mentee_user_id = req.user.userId;

        const [result] = await pool.query(
            "DELETE FROM mentor_requests WHERE mentee_user_id = ? AND mentor_user_id = ? AND status = 'pending'",
            [mentee_user_id, mentorId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No pending request found to cancel.' });
        }
        res.status(200).json({ message: 'Mentorship request canceled.' });
    }));

    router.get('/requests', asyncHandler(async (req, res) => {
        const mentor_user_id = req.user.userId;
        const [requests] = await pool.query(`
            SELECT mr.request_id, mr.request_message, mr.created_at, u.full_name as mentee_name, u.email as mentee_email, u.profile_pic_url 
            FROM mentor_requests mr
            JOIN users u ON mr.mentee_user_id = u.user_id
            WHERE mr.mentor_user_id = ? AND mr.status = 'pending'
        `, [mentor_user_id]);
        res.json(requests);
    }));

    router.post('/requests/:requestId/respond', asyncHandler(async (req, res) => {
        const { requestId } = req.params;
        const { action } = req.body;
        if (!['accepted', 'declined'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action.' });
        }
        await pool.query('UPDATE mentor_requests SET status = ? WHERE request_id = ?', [action, requestId]);
        res.status(200).json({ message: `Request has been ${action}.` });
    }));
    
    router.get('/status', asyncHandler(async (req, res) => {
        const user_id = req.user.userId;
        const [mentor] = await pool.query('SELECT mentor_id FROM mentors WHERE user_id = ?', [user_id]);
        res.json({ isMentor: mentor.length > 0, mentor_id: mentor.length > 0 ? mentor[0].mentor_id : null });
    }));

    router.get('/profile', asyncHandler(async (req, res) => {
        const user_id = req.user.userId;
        const [mentor] = await pool.query(`
            SELECT m.*, mp.notification_email, mp.auto_accept_requests, mp.max_mentees_active
            FROM mentors m
            LEFT JOIN mentor_preferences mp ON m.mentor_id = mp.mentor_id
            WHERE m.user_id = ?
        `, [user_id]);
        
        if (mentor.length === 0) {
            return res.status(404).json({ message: 'Mentor profile not found' });
        }
        
        // Get availability
        const [availability] = await pool.query(`
            SELECT day_of_week, start_time, end_time
            FROM mentor_availability
            WHERE mentor_id = ? AND is_available = TRUE
        `, [mentor[0].mentor_id]);
        
        res.json({
            ...mentor[0],
            availability
        });
    }));

    router.put('/profile', asyncHandler(async (req, res) => {
        const { expertise_areas } = req.body;
        const user_id = req.user.userId;
        const [result] = await pool.query('UPDATE mentors SET expertise_areas = ? WHERE user_id = ?', [expertise_areas, user_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Mentor profile not found to update.' });
        }
        res.status(200).json({ message: 'Mentor profile updated successfully!' });
    }));

    router.delete('/profile', asyncHandler(async (req, res) => {
        const user_id = req.user.userId;
        await pool.query('DELETE FROM mentors WHERE user_id = ?', [user_id]);
        res.status(200).json({ message: 'You have been unlisted as a mentor.' });
    }));

    return router;
};