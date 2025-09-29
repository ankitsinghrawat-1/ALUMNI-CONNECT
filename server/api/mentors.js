const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../middleware/authMiddleware');

module.exports = (pool) => {

    // Enhanced mentor listing with comprehensive profile data, filtering, and search
    router.get('/', asyncHandler(async (req, res) => {
        const { 
            search, 
            industry, 
            experience_min, 
            experience_max, 
            rating_min, 
            hourly_rate_max, 
            mentoring_style, 
            languages, 
            specialization,
            availability,
            verification_level,
            sort = 'rating',
            order = 'desc',
            page = 1,
            limit = 12
        } = req.query;

        let query = `
            SELECT 
                m.mentor_id,
                u.user_id, 
                u.full_name, 
                u.job_title, 
                u.company, 
                u.profile_pic_url, 
                u.email, 
                u.verification_status,
                m.expertise_areas,
                m.industry,
                m.experience_years,
                m.hourly_rate,
                m.bio,
                m.skills,
                m.languages,
                m.timezone,
                m.mentoring_style,
                m.verification_level,
                m.total_mentees,
                m.total_sessions,
                m.average_rating,
                m.total_reviews,
              m.is_premium,
                m.response_time_hours,
                m.success_rate,
                GROUP_CONCAT(DISTINCT ms.specialization) as specializations
            FROM mentors m 
            JOIN users u ON m.user_id = u.user_id 
            LEFT JOIN mentor_specializations ms ON m.mentor_id = ms.mentor_id
            WHERE m.is_available = TRUE
        `;

        const queryParams = [];

        // Search functionality
        if (search) {
            query += ` AND (
                u.full_name LIKE ? OR 
                u.job_title LIKE ? OR 
                u.company LIKE ? OR 
                m.expertise_areas LIKE ? OR 
                m.bio LIKE ? OR 
                m.skills LIKE ? OR
                ms.specialization LIKE ?
            )`;
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Industry filter
        if (industry) {
            query += ` AND m.industry = ?`;
            queryParams.push(industry);
        }

        // Experience range filter
        if (experience_min) {
            query += ` AND m.experience_years >= ?`;
            queryParams.push(parseInt(experience_min));
        }
        if (experience_max) {
            query += ` AND m.experience_years <= ?`;
            queryParams.push(parseInt(experience_max));
        }

        // Rating filter
        if (rating_min) {
            query += ` AND m.average_rating >= ?`;
            queryParams.push(parseFloat(rating_min));
        }

        // Hourly rate filter
        if (hourly_rate_max) {
            query += ` AND (m.hourly_rate <= ? OR m.hourly_rate = 0)`;
            queryParams.push(parseFloat(hourly_rate_max));
        }

        // Mentoring style filter
        if (mentoring_style) {
            query += ` AND m.mentoring_style = ?`;
            queryParams.push(mentoring_style);
        }

        // Languages filter
        if (languages) {
            query += ` AND m.languages LIKE ?`;
            queryParams.push(`%${languages}%`);
        }

        // Specialization filter
        if (specialization) {
            query += ` AND ms.specialization LIKE ?`;
            queryParams.push(`%${specialization}%`);
        }

        // Verification level filter
        if (verification_level) {
            query += ` AND m.verification_level = ?`;
            queryParams.push(verification_level);
        }

        query += ` GROUP BY m.mentor_id, u.user_id`;

        // Sorting
        const validSortFields = ['rating', 'experience', 'reviews', 'response_time', 'created_at', 'hourly_rate'];
        const validOrders = ['asc', 'desc'];
        
        if (validSortFields.includes(sort) && validOrders.includes(order.toLowerCase())) {
            const sortMap = {
                'rating': 'm.average_rating',
                'experience': 'm.experience_years',
                'reviews': 'm.total_reviews',
                'response_time': 'm.response_time_hours',
                'created_at': 'm.created_at',
                'hourly_rate': 'm.hourly_rate'
            };
            query += ` ORDER BY ${sortMap[sort]} ${order.toUpperCase()}`;
        } else {
            query += ` ORDER BY m.average_rating DESC, m.total_reviews DESC`;
        }

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), offset);

        const [mentors] = await pool.query(query, queryParams);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(DISTINCT m.mentor_id) as total
            FROM mentors m 
            JOIN users u ON m.user_id = u.user_id 
            LEFT JOIN mentor_specializations ms ON m.mentor_id = ms.mentor_id
            WHERE m.is_available = TRUE
        `;
        
        const countParams = queryParams.slice(0, -2); // Remove limit and offset
        if (search) {
            countQuery += ` AND (
                u.full_name LIKE ? OR 
                u.job_title LIKE ? OR 
                u.company LIKE ? OR 
                m.expertise_areas LIKE ? OR 
                m.bio LIKE ? OR 
                m.skills LIKE ? OR
                ms.specialization LIKE ?
            )`;
        }
        if (industry) countQuery += ` AND m.industry = ?`;
        if (experience_min) countQuery += ` AND m.experience_years >= ?`;
        if (experience_max) countQuery += ` AND m.experience_years <= ?`;
        if (rating_min) countQuery += ` AND m.average_rating >= ?`;
        if (hourly_rate_max) countQuery += ` AND (m.hourly_rate <= ? OR m.hourly_rate = 0)`;
        if (mentoring_style) countQuery += ` AND m.mentoring_style = ?`;
        if (languages) countQuery += ` AND m.languages LIKE ?`;
        if (specialization) countQuery += ` AND ms.specialization LIKE ?`;
        if (verification_level) countQuery += ` AND m.verification_level = ?`;

        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            mentors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            filters: {
                search,
                industry,
                experience_min,
                experience_max,
                rating_min,
                hourly_rate_max,
                mentoring_style,
                languages,
                specialization,
                verification_level
            }
        });
    }));

    // Get mentor details with comprehensive profile data
    router.get('/:mentorId', asyncHandler(async (req, res) => {
        const { mentorId } = req.params;
        
        // Get mentor basic info
        const [mentors] = await pool.query(`
            SELECT 
                m.mentor_id,
                u.user_id, 
                u.full_name, 
                u.job_title, 
                u.company, 
                u.profile_pic_url, 
                u.email, 
                u.verification_status,
                u.linkedin_profile,
                m.expertise_areas,
                m.industry,
                m.experience_years,
                m.hourly_rate,
                m.bio,
                m.skills,
                m.languages,
                m.timezone,
                m.video_intro_url,
                m.linkedin_url,
                m.github_url,
                m.portfolio_url,
                m.mentoring_style,
                m.communication_methods,
                m.verification_level,
                m.total_mentees,
                m.total_sessions,
                m.average_rating,
                m.total_reviews,
                m.is_premium,
                m.response_time_hours,
                m.success_rate,
                m.created_at
            FROM mentors m 
            JOIN users u ON m.user_id = u.user_id 
            WHERE m.mentor_id = ? AND m.is_available = TRUE
        `, [mentorId]);

        if (mentors.length === 0) {
            return res.status(404).json({ message: 'Mentor not found' });
        }

        const mentor = mentors[0];

        // Get specializations
        const [specializations] = await pool.query(`
            SELECT specialization, proficiency_level, years_experience
            FROM mentor_specializations 
            WHERE mentor_id = ?
            ORDER BY proficiency_level DESC, years_experience DESC
        `, [mentorId]);

        // Get availability
        const [availability] = await pool.query(`
            SELECT day_of_week, start_time, end_time, is_available
            FROM mentor_availability 
            WHERE mentor_id = ? AND is_available = TRUE
            ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
        `, [mentorId]);

        // Get recent reviews (limit to 5)
        const [reviews] = await pool.query(`
            SELECT 
                mr.rating,
                mr.review_text,
                mr.session_quality,
                mr.communication_rating,
                mr.helpfulness_rating,
                mr.would_recommend,
                mr.created_at,
                u.full_name as reviewer_name,
                u.profile_pic_url as reviewer_photo
            FROM mentor_reviews mr
            JOIN users u ON mr.reviewer_user_id = u.user_id
            WHERE mr.mentor_id = ?
            ORDER BY mr.created_at DESC
            LIMIT 5
        `, [mentorId]);

        // Get achievements
        const [achievements] = await pool.query(`
            SELECT achievement_type, title, description, issuer_organization, 
                   achievement_date, verification_url, image_url, is_featured
            FROM mentor_achievements 
            WHERE mentor_id = ?
            ORDER BY is_featured DESC, achievement_date DESC
        `, [mentorId]);

        // Get portfolio
        const [portfolio] = await pool.query(`
            SELECT project_title, project_description, project_url, image_url,
                   technologies_used, project_type, completion_date, is_featured
            FROM mentor_portfolio 
            WHERE mentor_id = ?
            ORDER BY is_featured DESC, display_order ASC, completion_date DESC
        `, [mentorId]);

        // Get pricing tiers
        const [pricingTiers] = await pool.query(`
            SELECT tier_name, tier_description, price_per_hour, 
                   session_duration_minutes, features, max_mentees_per_month
            FROM mentor_pricing_tiers 
            WHERE mentor_id = ? AND is_active = TRUE
            ORDER BY price_per_hour ASC
        `, [mentorId]);

        res.json({
            ...mentor,
            specializations,
            availability,
            reviews,
            achievements,
            portfolio,
            pricingTiers: pricingTiers.map(tier => ({
                ...tier,
                features: tier.features ? JSON.parse(tier.features) : []
            }))
        });
    }));

    // Get mentor statistics for filters and search
    router.get('/stats/overview', asyncHandler(async (req, res) => {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_mentors,
                COUNT(DISTINCT m.industry) as total_industries,
                AVG(m.average_rating) as avg_rating,
                MIN(m.hourly_rate) as min_rate,
                MAX(m.hourly_rate) as max_rate,
                AVG(m.hourly_rate) as avg_rate,
                SUM(m.total_sessions) as total_sessions_completed
            FROM mentors m 
            WHERE m.is_available = TRUE
        `);

        const [industries] = await pool.query(`
            SELECT m.industry, COUNT(*) as mentor_count
            FROM mentors m 
            WHERE m.is_available = TRUE AND m.industry IS NOT NULL
            GROUP BY m.industry 
            ORDER BY mentor_count DESC
        `);

        const [specializations] = await pool.query(`
            SELECT ms.specialization, COUNT(*) as mentor_count
            FROM mentor_specializations ms
            JOIN mentors m ON ms.mentor_id = m.mentor_id
            WHERE m.is_available = TRUE
            GROUP BY ms.specialization 
            ORDER BY mentor_count DESC
            LIMIT 20
        `);

        res.json({
            overview: stats[0],
            top_industries: industries,
            top_specializations: specializations
        });
    }));

    // This route is protected by verifyToken
    router.use(verifyToken);

    // Enhanced mentor registration with comprehensive profile data
    router.post('/', asyncHandler(async (req, res) => {
        const { 
            expertise_areas,
            industry,
            experience_years,
            hourly_rate = 0,
            bio,
            skills,
            languages = 'English',
            timezone = 'UTC',
            mentoring_style = 'one_on_one',
            communication_methods = [],
            linkedin_url,
            github_url,
            portfolio_url,
            specializations = [],
            availability = []
        } = req.body;
        
        const user_id = req.user.userId;
        
        const [existingMentor] = await pool.query('SELECT * FROM mentors WHERE user_id = ?', [user_id]);
        if (existingMentor.length > 0) {
            return res.status(409).json({ message: 'You are already registered as a mentor.' });
        }

        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Insert mentor profile
            const [mentorResult] = await connection.query(`
                INSERT INTO mentors (
                    user_id, expertise_areas, industry, experience_years, 
                    hourly_rate, bio, skills, languages, timezone, 
                    mentoring_style, communication_methods, linkedin_url, 
                    github_url, portfolio_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                user_id, expertise_areas, industry, experience_years,
                hourly_rate, bio, skills, languages, timezone,
                mentoring_style, JSON.stringify(communication_methods),
                linkedin_url, github_url, portfolio_url
            ]);

            const mentorId = mentorResult.insertId;

            // Insert specializations
            if (specializations && specializations.length > 0) {
                for (const spec of specializations) {
                    await connection.query(`
                        INSERT INTO mentor_specializations (mentor_id, specialization, proficiency_level, years_experience)
                        VALUES (?, ?, ?, ?)
                    `, [mentorId, spec.specialization, spec.proficiency_level || 'intermediate', spec.years_experience || 0]);
                }
            }

            // Insert availability
            if (availability && availability.length > 0) {
                for (const avail of availability) {
                    await connection.query(`
                        INSERT INTO mentor_availability (mentor_id, day_of_week, start_time, end_time)
                        VALUES (?, ?, ?, ?)
                    `, [mentorId, avail.day_of_week, avail.start_time, avail.end_time]);
                }
            }

            // Create default preferences
            await connection.query(`
                INSERT INTO mentor_preferences (mentor_id) VALUES (?)
            `, [mentorId]);

            await connection.commit();
            res.status(201).json({ 
                message: 'Successfully registered as a mentor!',
                mentorId: mentorId
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }));

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
        const [mentor] = await pool.query('SELECT * FROM mentors WHERE user_id = ?', [user_id]);
        res.json({ isMentor: mentor.length > 0 });
    }));

    router.get('/profile', asyncHandler(async (req, res) => {
        const user_id = req.user.userId;
        const [mentor] = await pool.query('SELECT expertise_areas FROM mentors WHERE user_id = ?', [user_id]);
        if (mentor.length === 0) {
            return res.status(404).json({ message: 'Mentor profile not found' });
        }
        res.json(mentor[0]);
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