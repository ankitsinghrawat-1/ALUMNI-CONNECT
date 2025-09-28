// server/api/admin.js
const express = require('express');
const { isAdmin } = require('../middleware/authMiddleware');

module.exports = function(pool) {
    const router = express.Router();

    // --- Stats Endpoint (Includes data for both dashboard and admin panel) ---
    router.get('/stats', isAdmin, async (req, res) => {
        try {
            const connection = await pool.getConnection();

            // Perform all queries in parallel for efficiency
            const [
                [newUsersResult],
                [pendingVerificationsResult],
                [activeGroupsResult],
                [newBlogsResult],
                [totalEventsResult],
                [totalJobsResult],
                [totalUsersResult],
                [totalApplicationsResult],
                [totalGroupsResult]
            ] = await Promise.all([
                connection.query("SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"),
                connection.query("SELECT COUNT(*) as count FROM verification_requests WHERE status = 'pending'"),
                connection.query("SELECT COUNT(*) as count FROM `groups` WHERE status = 'active'"),
                connection.query("SELECT COUNT(*) as count FROM blogs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND status = 'approved'"),
                connection.query("SELECT COUNT(*) as count FROM events"),
                connection.query("SELECT COUNT(*) as count FROM jobs"),
                connection.query("SELECT COUNT(*) as count FROM users"),
                connection.query("SELECT COUNT(*) as count FROM job_applications"),
                connection.query("SELECT COUNT(*) as count FROM `groups`")
            ]);

            connection.release();

            // This comprehensive response serves all parts of the admin area
            res.json({
                newUsersLast30Days: newUsersResult.count,
                pendingVerifications: pendingVerificationsResult.count,
                activeGroups: activeGroupsResult.count,
                newBlogsLast7Days: newBlogsResult.count,
                totalUsers: totalUsersResult.count,
                totalEvents: totalEventsResult.count,
                totalJobs: totalJobsResult.count,
                totalApplications: totalApplicationsResult.count,
                totalGroups: totalGroupsResult.count
            });

        } catch (error) {
            console.error('Error fetching detailed admin stats:', error);
            res.status(500).json({ message: 'Failed to fetch admin statistics' });
        }
    });

    // --- Analytics Endpoints ---

    // 1. User Signups (For Line Chart)
    router.get('/analytics/signups', isAdmin, async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM users 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                GROUP BY DATE(created_at) 
                ORDER BY date ASC
            `);
            res.json(rows);
        } catch (error) {
            console.error('Error fetching signup analytics:', error);
            res.status(500).json({ message: 'Failed to fetch signup analytics' });
        }
    });

    // 2. User Role Distribution (For Doughnut Chart)
    router.get('/analytics/user-roles', isAdmin, async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT role, COUNT(*) as count 
                FROM users 
                GROUP BY role
            `);
            res.json(rows);
        } catch (error) {
            console.error('Error fetching user role analytics:', error);
            res.status(500).json({ message: 'Failed to fetch user role analytics' });
        }
    });

    // 3. Content Creation Trends (For Bar Chart)
    router.get('/analytics/content-trends', isAdmin, async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT 'Jobs' as type, COUNT(*) as count FROM jobs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                UNION ALL
                SELECT 'Events' as type, COUNT(*) as count FROM events WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                UNION ALL
                SELECT 'Blogs' as type, COUNT(*) as count FROM blogs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            `);
            res.json(rows);
        } catch (error) {
            console.error('Error fetching content trends analytics:', error);
            res.status(500).json({ message: 'Failed to fetch content trends' });
        }
    });


    // --- Other Original Routes (Preserved) ---

    router.get('/pending-requests-summary', isAdmin, async (req, res) => {
         try {
            const connection = await pool.getConnection();
            const [
                [{ verifications }],
                [{ pendingJobs }],
                [{ pendingEvents }],
                [{ pendingCampaigns }],
                [{ groupCreations }],
                [{ groupJoins }]
            ] = await Promise.all([
                connection.query("SELECT COUNT(*) as verifications FROM verification_requests WHERE status = 'pending'"),
                connection.query("SELECT COUNT(*) as pendingJobs FROM jobs WHERE status = 'pending'"),
                connection.query("SELECT COUNT(*) as pendingEvents FROM events WHERE status = 'pending'"),
                connection.query("SELECT COUNT(*) as pendingCampaigns FROM campaigns WHERE status = 'pending'"),
                connection.query("SELECT COUNT(*) as groupCreations FROM `groups` WHERE status = 'pending'"),
                connection.query("SELECT COUNT(*) as groupJoins FROM group_members WHERE status = 'pending'")
            ]);
            connection.release();
            res.json({ verifications, pendingJobs, pendingEvents, pendingCampaigns, groupCreations, groupJoins });
        } catch (error) {
            console.error('Error fetching pending requests summary:', error);
            res.status(500).json({ message: 'Failed to fetch pending requests' });
        }
    });

    router.post('/announcements', isAdmin, async (req, res) => {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }
        try {
            await pool.query(
                'INSERT INTO announcements (title, content, created_by) VALUES (?, ?, ?)',
                [title, content, req.user.userId]
            );
            res.status(201).json({ message: 'Announcement created successfully.' });
        } catch (error) {
            console.error('Error creating announcement:', error);
            res.status(500).json({ message: 'Failed to create announcement.' });
        }
    });

    router.get('/recent-activity', isAdmin, async (req, res) => {
        try {
            const [rows] = await pool.query(`
                (SELECT 'new_user' as type, CONCAT(full_name, ' has registered.') as description, created_at FROM users ORDER BY created_at DESC LIMIT 5)
                UNION ALL
                (SELECT 'new_group' as type, CONCAT('New group created: ', name) as description, created_at FROM \`groups\` WHERE status = 'active' ORDER BY created_at DESC LIMIT 5)
                ORDER BY created_at DESC
                LIMIT 5
            `);
            res.json(rows);
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            res.status(500).json({ message: 'Failed to fetch recent activity' });
        }
    });

    return router;
};