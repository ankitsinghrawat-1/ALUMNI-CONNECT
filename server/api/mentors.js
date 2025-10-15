const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

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

    // Check mentor status - uses optional auth (works for logged in and non-logged in users)
    router.get('/status', optionalAuth, asyncHandler(async (req, res) => {
        try {
            // Check if user is authenticated
            if (!req.user || !req.user.userId) {
                return res.json({ 
                    isMentor: false,
                    mentorId: null
                });
            }
            
            const user_id = req.user.userId;
            
            // Fetch is_mentor from users table (more efficient - no join needed)
            const [users] = await pool.query(
                'SELECT is_mentor FROM users WHERE user_id = ?', 
                [user_id]
            );
            
            if (users.length === 0) {
                return res.json({ 
                    isMentor: false,
                    mentorId: null
                });
            }
            
            const isMentor = users[0].is_mentor === 1 || users[0].is_mentor === true;
            
            // Only fetch mentorId if user is a mentor
            let mentorId = null;
            if (isMentor) {
                const [mentor] = await pool.query(
                    'SELECT mentor_id FROM mentors WHERE user_id = ?', 
                    [user_id]
                );
                mentorId = mentor.length > 0 ? mentor[0].mentor_id : null;
            }
            
            res.json({ 
                isMentor: isMentor,
                mentorId: mentorId
            });
        } catch (error) {
            console.error('Error in /mentors/status:', error);
            // Always return a valid response, never throw/404
            res.json({ 
                isMentor: false,
                mentorId: null
            });
        }
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

            // Update user's is_mentor flag
            await connection.query(`
                UPDATE users SET is_mentor = TRUE WHERE user_id = ?
            `, [user_id]);

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

    // Update mentor profile
    router.put('/profile', asyncHandler(async (req, res) => {
        const {
            expertise_areas,
            industry,
            experience_years,
            hourly_rate,
            bio,
            skills,
            languages,
            timezone,
            mentoring_style,
            communication_methods,
            linkedin_url,
            github_url,
            portfolio_url,
            response_time_hours,
            specializations,
            availability
        } = req.body;
        
        const user_id = req.user.userId;
        
        // Get mentor_id
        const [mentor] = await pool.query('SELECT mentor_id FROM mentors WHERE user_id = ?', [user_id]);
        if (mentor.length === 0) {
            return res.status(404).json({ message: 'Mentor profile not found' });
        }
        
        const mentorId = mentor[0].mentor_id;
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Update mentor profile
            await connection.query(`
                UPDATE mentors SET 
                    expertise_areas = ?, industry = ?, experience_years = ?, 
                    hourly_rate = ?, bio = ?, skills = ?, languages = ?, 
                    timezone = ?, mentoring_style = ?, communication_methods = ?,
                    linkedin_url = ?, github_url = ?, portfolio_url = ?,
                    response_time_hours = ?, updated_at = CURRENT_TIMESTAMP
                WHERE mentor_id = ?
            `, [
                expertise_areas, industry, experience_years, hourly_rate,
                bio, skills, languages, timezone, mentoring_style,
                JSON.stringify(communication_methods), linkedin_url,
                github_url, portfolio_url, response_time_hours, mentorId
            ]);

            // Update specializations if provided
            if (specializations && Array.isArray(specializations)) {
                // Remove existing specializations
                await connection.query('DELETE FROM mentor_specializations WHERE mentor_id = ?', [mentorId]);
                
                // Add new specializations
                for (const spec of specializations) {
                    await connection.query(`
                        INSERT INTO mentor_specializations (mentor_id, specialization, proficiency_level, years_experience)
                        VALUES (?, ?, ?, ?)
                    `, [mentorId, spec.specialization, spec.proficiency_level || 'intermediate', spec.years_experience || 0]);
                }
            }

            // Update availability if provided
            if (availability && Array.isArray(availability)) {
                // Remove existing availability
                await connection.query('DELETE FROM mentor_availability WHERE mentor_id = ?', [mentorId]);
                
                // Add new availability
                for (const avail of availability) {
                    await connection.query(`
                        INSERT INTO mentor_availability (mentor_id, day_of_week, start_time, end_time)
                        VALUES (?, ?, ?, ?)
                    `, [mentorId, avail.day_of_week, avail.start_time, avail.end_time]);
                }
            }

            await connection.commit();
            res.status(200).json({ message: 'Mentor profile updated successfully!' });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }));

    // Get current mentor's profile for editing
    router.get('/profile', asyncHandler(async (req, res) => {
        const user_id = req.user.userId;
        
        // Get mentor profile
        const [mentors] = await pool.query(`
            SELECT * FROM mentors WHERE user_id = ?
        `, [user_id]);
        
        if (mentors.length === 0) {
            return res.status(404).json({ message: 'Mentor profile not found' });
        }
        
        const mentor = mentors[0];
        const mentorId = mentor.mentor_id;

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
            WHERE mentor_id = ?
        `, [mentorId]);

        res.json({
            ...mentor,
            communication_methods: mentor.communication_methods ? JSON.parse(mentor.communication_methods) : [],
            specializations,
            availability
        });
    }));

    // Add achievement
    router.post('/achievements', asyncHandler(async (req, res) => {
        const { 
            achievement_type, 
            title, 
            description, 
            issuer_organization, 
            achievement_date, 
            verification_url, 
            image_url, 
            is_featured 
        } = req.body;
        
        const user_id = req.user.userId;
        
        // Get mentor_id
        const [mentor] = await pool.query('SELECT mentor_id FROM mentors WHERE user_id = ?', [user_id]);
        if (mentor.length === 0) {
            return res.status(404).json({ message: 'Mentor profile not found' });
        }
        
        const mentorId = mentor[0].mentor_id;
        
        await pool.query(`
            INSERT INTO mentor_achievements 
            (mentor_id, achievement_type, title, description, issuer_organization, 
             achievement_date, verification_url, image_url, is_featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [mentorId, achievement_type, title, description, issuer_organization, 
            achievement_date, verification_url, image_url, is_featured || false]);
        
        res.status(201).json({ message: 'Achievement added successfully!' });
    }));

    // Add portfolio item
    router.post('/portfolio', asyncHandler(async (req, res) => {
        const {
            project_title,
            project_description,
            project_url,
            image_url,
            technologies_used,
            project_type,
            completion_date,
            is_featured,
            display_order
        } = req.body;
        
        const user_id = req.user.userId;
        
        // Get mentor_id
        const [mentor] = await pool.query('SELECT mentor_id FROM mentors WHERE user_id = ?', [user_id]);
        if (mentor.length === 0) {
            return res.status(404).json({ message: 'Mentor profile not found' });
        }
        
        const mentorId = mentor[0].mentor_id;
        
        await pool.query(`
            INSERT INTO mentor_portfolio 
            (mentor_id, project_title, project_description, project_url, image_url,
             technologies_used, project_type, completion_date, is_featured, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [mentorId, project_title, project_description, project_url, image_url,
            technologies_used, project_type, completion_date, is_featured || false, display_order || 0]);
        
        res.status(201).json({ message: 'Portfolio item added successfully!' });
    }));

    // Submit mentor review
    router.post('/:mentorId/reviews', asyncHandler(async (req, res) => {
        const { mentorId } = req.params;
        const {
            rating,
            review_text,
            session_quality,
            communication_rating,
            helpfulness_rating,
            would_recommend
        } = req.body;
        
        const reviewer_user_id = req.user.userId;
        
        // Check if user has already reviewed this mentor
        const [existingReview] = await pool.query(
            'SELECT review_id FROM mentor_reviews WHERE mentor_id = ? AND reviewer_user_id = ?',
            [mentorId, reviewer_user_id]
        );
        
        if (existingReview.length > 0) {
            return res.status(409).json({ message: 'You have already reviewed this mentor' });
        }
        
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Add review
            await connection.query(`
                INSERT INTO mentor_reviews 
                (mentor_id, reviewer_user_id, rating, review_text, session_quality,
                 communication_rating, helpfulness_rating, would_recommend)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [mentorId, reviewer_user_id, rating, review_text, session_quality,
                communication_rating, helpfulness_rating, would_recommend]);
            
            // Update mentor's average rating and review count
            await connection.query(`
                UPDATE mentors SET 
                    average_rating = (
                        SELECT AVG(rating) FROM mentor_reviews WHERE mentor_id = ?
                    ),
                    total_reviews = (
                        SELECT COUNT(*) FROM mentor_reviews WHERE mentor_id = ?
                    )
                WHERE mentor_id = ?
            `, [mentorId, mentorId, mentorId]);
            
            await connection.commit();
            res.status(201).json({ message: 'Review submitted successfully!' });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }));

    // Delete mentor profile
    router.delete('/profile', asyncHandler(async (req, res) => {
        const user_id = req.user.userId;
        
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // This will cascade delete all related mentor data due to foreign key constraints
            const [result] = await connection.query('DELETE FROM mentors WHERE user_id = ?', [user_id]);
            
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Mentor profile not found' });
            }
            
            // Update user's is_mentor flag to FALSE
            await connection.query('UPDATE users SET is_mentor = FALSE WHERE user_id = ?', [user_id]);
            
            await connection.commit();
            res.status(200).json({ message: 'Mentor profile deleted successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }));

    // Get mentor statistics (for dashboard/analytics)
    router.get('/stats/overview', asyncHandler(async (req, res) => {
        // Get total mentors count
        const [totalResult] = await pool.query(`
            SELECT COUNT(*) as total_mentors FROM mentors WHERE is_available = TRUE
        `);

        // Get average rating
        const [avgRatingResult] = await pool.query(`
            SELECT AVG(average_rating) as avg_rating FROM mentors WHERE is_available = TRUE AND total_reviews > 0
        `);

        // Get total sessions
        const [totalSessionsResult] = await pool.query(`
            SELECT COUNT(*) as total_sessions FROM mentor_sessions WHERE status = 'completed'
        `);

        // Get active mentors (those who had a session in last 30 days)
        const [activeMentorsResult] = await pool.query(`
            SELECT COUNT(DISTINCT mentor_id) as active_mentors 
            FROM mentor_sessions 
            WHERE status = 'completed' AND actual_end_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);

        // Get top industries
        const [topIndustries] = await pool.query(`
            SELECT industry, COUNT(*) as count 
            FROM mentors 
            WHERE is_available = TRUE AND industry IS NOT NULL 
            GROUP BY industry 
            ORDER BY count DESC 
            LIMIT 5
        `);

        // Get mentor distribution by verification level
        const [verificationStats] = await pool.query(`
            SELECT verification_level, COUNT(*) as count 
            FROM mentors 
            WHERE is_available = TRUE 
            GROUP BY verification_level
        `);

        res.json({
            total_mentors: totalResult[0].total_mentors,
            avg_rating: parseFloat(avgRatingResult[0].avg_rating || 0).toFixed(1),
            total_sessions: totalSessionsResult[0].total_sessions,
            active_mentors: activeMentorsResult[0].active_mentors,
            top_industries: topIndustries,
            verification_stats: verificationStats
        });
    }));

    // Get recommended mentors based on user profile/interests
    router.get('/recommendations', verifyToken, asyncHandler(async (req, res) => {
        const user_id = req.user.userId;

        // Get user profile to understand their interests
        const [userProfile] = await pool.query(`
            SELECT industry, job_title, skills, interests FROM users WHERE user_id = ?
        `, [user_id]);

        if (userProfile.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userProfile[0];
        let recommendedMentors = [];

        // Find mentors in same industry
        if (user.industry) {
            const [industryMentors] = await pool.query(`
                SELECT 
                    m.mentor_id,
                    u.user_id, 
                    u.full_name, 
                    u.job_title, 
                    u.company, 
                    u.profile_pic_url, 
                    m.industry,
                    m.experience_years,
                    m.average_rating,
                    m.total_reviews,
                    m.bio,
                    GROUP_CONCAT(DISTINCT ms.specialization) as specializations,
                    'same_industry' as recommendation_reason
                FROM mentors m 
                JOIN users u ON m.user_id = u.user_id 
                LEFT JOIN mentor_specializations ms ON m.mentor_id = ms.mentor_id
                WHERE m.is_available = TRUE 
                    AND m.industry = ?
                    AND m.user_id != ?
                GROUP BY m.mentor_id
                ORDER BY m.average_rating DESC, m.total_reviews DESC
                LIMIT 3
            `, [user.industry, user_id]);

            recommendedMentors = recommendedMentors.concat(industryMentors);
        }

        // Find top-rated mentors
        const [topRated] = await pool.query(`
            SELECT 
                m.mentor_id,
                u.user_id, 
                u.full_name, 
                u.job_title, 
                u.company, 
                u.profile_pic_url, 
                m.industry,
                m.experience_years,
                m.average_rating,
                m.total_reviews,
                m.bio,
                GROUP_CONCAT(DISTINCT ms.specialization) as specializations,
                'top_rated' as recommendation_reason
            FROM mentors m 
            JOIN users u ON m.user_id = u.user_id 
            LEFT JOIN mentor_specializations ms ON m.mentor_id = ms.mentor_id
            WHERE m.is_available = TRUE 
                AND m.user_id != ?
                AND m.average_rating >= 4.0
                AND m.total_reviews >= 5
            GROUP BY m.mentor_id
            ORDER BY m.average_rating DESC, m.total_reviews DESC
            LIMIT 3
        `, [user_id]);

        // Merge and deduplicate
        const mentorIds = new Set(recommendedMentors.map(m => m.mentor_id));
        topRated.forEach(mentor => {
            if (!mentorIds.has(mentor.mentor_id)) {
                recommendedMentors.push(mentor);
                mentorIds.add(mentor.mentor_id);
            }
        });

        res.json({
            recommendations: recommendedMentors.slice(0, 6),
            user_industry: user.industry
        });
    }));

    // Track mentor profile view
    router.post('/:mentorId/track-view', asyncHandler(async (req, res) => {
        const { mentorId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        // Update or insert analytics record
        await pool.query(`
            INSERT INTO mentor_analytics (mentor_id, date, profile_views)
            VALUES (?, ?, 1)
            ON DUPLICATE KEY UPDATE profile_views = profile_views + 1
        `, [mentorId, today]);

        res.json({ success: true });
    }));

    // Get mentor availability calendar
    router.get('/:mentorId/availability/calendar', asyncHandler(async (req, res) => {
        const { mentorId } = req.params;
        const { start_date, end_date } = req.query;

        // Get mentor's weekly availability
        const [availability] = await pool.query(`
            SELECT day_of_week, start_time, end_time, is_available
            FROM mentor_availability 
            WHERE mentor_id = ? AND is_available = TRUE
            ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
        `, [mentorId]);

        // Get already booked sessions
        const [bookedSessions] = await pool.query(`
            SELECT scheduled_datetime, duration_minutes
            FROM mentor_sessions 
            WHERE mentor_id = ? 
                AND status IN ('scheduled', 'in_progress')
                AND scheduled_datetime BETWEEN ? AND ?
            ORDER BY scheduled_datetime
        `, [mentorId, start_date || new Date(), end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]);

        res.json({
            weekly_availability: availability,
            booked_sessions: bookedSessions
        });
    }));

    // Get trending/featured mentors
    router.get('/featured/trending', asyncHandler(async (req, res) => {
        const { limit = 6 } = req.query;

        // Get mentors with high recent activity
        const [trendingMentors] = await pool.query(`
            SELECT 
                m.mentor_id,
                u.user_id, 
                u.full_name, 
                u.job_title, 
                u.company, 
                u.profile_pic_url, 
                m.industry,
                m.experience_years,
                m.average_rating,
                m.total_reviews,
                m.total_sessions,
                m.bio,
                m.is_premium,
                m.verification_level,
                GROUP_CONCAT(DISTINCT ms.specialization) as specializations,
                COALESCE(SUM(ma.profile_views), 0) as recent_views
            FROM mentors m 
            JOIN users u ON m.user_id = u.user_id 
            LEFT JOIN mentor_specializations ms ON m.mentor_id = ms.mentor_id
            LEFT JOIN mentor_analytics ma ON m.mentor_id = ma.mentor_id 
                AND ma.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            WHERE m.is_available = TRUE
            GROUP BY m.mentor_id
            ORDER BY recent_views DESC, m.average_rating DESC, m.total_reviews DESC
            LIMIT ?
        `, [parseInt(limit)]);

        res.json({
            trending: trendingMentors
        });
    }));

    // Get mentor badges/achievements
    router.get('/:mentorId/badges', asyncHandler(async (req, res) => {
        const { mentorId } = req.params;

        const [mentor] = await pool.query(`
            SELECT 
                average_rating,
                total_reviews,
                total_sessions,
                total_mentees,
                response_time_hours,
                success_rate,
                is_premium,
                verification_level,
                created_at
            FROM mentors 
            WHERE mentor_id = ?
        `, [mentorId]);

        if (mentor.length === 0) {
            return res.status(404).json({ message: 'Mentor not found' });
        }

        const m = mentor[0];
        const badges = [];

        // Determine badges
        if (m.average_rating >= 4.8 && m.total_reviews >= 10) {
            badges.push({ name: 'Top Rated', icon: 'fa-star', color: '#FFD700' });
        }
        if (m.response_time_hours <= 12) {
            badges.push({ name: 'Quick Responder', icon: 'fa-bolt', color: '#4A90E2' });
        }
        if (m.total_sessions >= 50) {
            badges.push({ name: 'Experienced', icon: 'fa-award', color: '#50C878' });
        }
        if (m.total_mentees >= 20) {
            badges.push({ name: 'Popular', icon: 'fa-users', color: '#FF6B6B' });
        }
        if (m.success_rate >= 90) {
            badges.push({ name: 'High Success', icon: 'fa-check-circle', color: '#50C878' });
        }
        if (m.is_premium) {
            badges.push({ name: 'Premium', icon: 'fa-crown', color: '#FFD700' });
        }
        if (m.verification_level === 'verified' || m.verification_level === 'premium') {
            badges.push({ name: 'Verified', icon: 'fa-shield-check', color: '#4A90E2' });
        }

        // Calculate tenure
        const monthsSinceJoined = Math.floor((Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30));
        if (monthsSinceJoined >= 12) {
            badges.push({ name: 'Veteran', icon: 'fa-trophy', color: '#9B59B6' });
        }

        res.json({
            badges
        });
    }));

    return router;
};