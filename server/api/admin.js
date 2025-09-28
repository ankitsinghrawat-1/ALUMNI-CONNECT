// server/api/admin.js
const express = require('express');
const { isAdmin } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');


module.exports = function (pool) {
    const router = express.Router();

    // --- Stats & Analytics Endpoints (Preserved) ---
    router.get('/stats', isAdmin, asyncHandler(async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const [
                [newUsersResult], [pendingVerificationsResult], [activeGroupsResult], [newBlogsResult],
                [totalEventsResult], [totalJobsResult], [totalUsersResult], [totalApplicationsResult], [totalGroupsResult]
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
            res.json({
                newUsersLast30Days: newUsersResult.count, pendingVerifications: pendingVerificationsResult.count,
                activeGroups: activeGroupsResult.count, newBlogsLast7Days: newBlogsResult.count,
                totalUsers: totalUsersResult.count, totalEvents: totalEventsResult.count,
                totalJobs: totalJobsResult.count, totalApplications: totalApplicationsResult.count,
                totalGroups: totalGroupsResult.count
            });
        } catch (error) {
            console.error('Error fetching detailed admin stats:', error);
            res.status(500).json({ message: 'Failed to fetch admin statistics' });
        }
    }));

    router.get('/analytics/signups', isAdmin, asyncHandler(async (req, res) => {
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
    }));

    router.get('/analytics/user-roles', isAdmin, asyncHandler(async (req, res) => {
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
    }));

    router.get('/analytics/content-trends', isAdmin, asyncHandler(async (req, res) => {
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
    }));

    // --- PENDING REQUESTS SUMMARY (CORRECTED) ---
    router.get('/pending-requests-summary', isAdmin, asyncHandler(async (req, res) => {
        try {
            const connection = await pool.getConnection();
            const [
                [{ verifications }], [{ pendingJobs }], [{ pendingEvents }], [{ pendingCampaigns }],
                // This now correctly queries the `group_creation_requests` table
                [{ groupCreations }],
                [{ groupJoins }]
            ] = await Promise.all([
                connection.query("SELECT COUNT(*) as verifications FROM verification_requests WHERE status = 'pending'"),
                connection.query("SELECT COUNT(*) as pendingJobs FROM jobs WHERE status = 'pending'"),
                connection.query("SELECT COUNT(*) as pendingEvents FROM events WHERE status = 'pending'"),
                connection.query("SELECT COUNT(*) as pendingCampaigns FROM campaigns WHERE status = 'pending'"),
                connection.query("SELECT COUNT(*) as groupCreations FROM `group_creation_requests` WHERE status = 'pending'"),
                connection.query("SELECT COUNT(*) as groupJoins FROM group_join_requests WHERE status = 'pending'")
            ]);
            connection.release();
            res.json({ verifications, pendingJobs, pendingEvents, pendingCampaigns, groupCreations, groupJoins });
        } catch (error) {
            console.error('Error fetching pending requests summary:', error);
            res.status(500).json({ message: 'Failed to fetch pending requests' });
        }
    }));

    router.post('/announcements', isAdmin, asyncHandler(async (req, res) => {
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
    }));

    router.get('/recent-activity', isAdmin, asyncHandler(async (req, res) => {
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
    }));

    // --- USER MANAGEMENT ENDPOINTS (Preserved) ---
    router.get('/users', isAdmin, asyncHandler(async (req, res) => {
        try {
            const { page = 1, limit = 10, search = '' } = req.query;
            const offset = (page - 1) * limit;
            let whereClause = 'WHERE 1=1';
            const searchParams = [];

            if (search) {
                whereClause += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
                searchParams.push(`%${search}%`, `%${search}%`);
            }

            const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;

            const dataQuery = `
                SELECT 
                    u.user_id, 
                    u.full_name, 
                    u.email, 
                    u.role, 
                    u.created_at,
                    u.verification_status
                FROM users u
                ${whereClause}
                ORDER BY u.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [totalResult] = await pool.query(countQuery, searchParams);
            const [users] = await pool.query(dataQuery, [...searchParams, parseInt(limit), parseInt(offset)]);

            res.json({
                total: totalResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                data: users
            });

        } catch (error) {
            console.error('Error fetching users for admin:', error);
            res.status(500).json({ message: 'Failed to fetch users' });
        }
    }));

    router.get('/users/:id', isAdmin, asyncHandler(async (req, res) => {
        try {
            const [user] = await pool.query('SELECT user_id, full_name, email, role FROM users WHERE user_id = ?', [req.params.id]);
            if (user.length === 0) return res.status(404).json({ message: 'User not found' });
            res.json(user[0]);
        } catch (error) {
            console.error('Error fetching single user:', error);
            res.status(500).json({ message: 'Failed to fetch user details' });
        }
    }));

    router.put('/users/:id/role', isAdmin, asyncHandler(async (req, res) => {
        try {
            const { role } = req.body;
            if (!['student', 'alumni', 'faculty', 'admin'].includes(role)) {
                return res.status(400).json({ message: 'Invalid role specified' });
            }
            await pool.query('UPDATE users SET role = ? WHERE user_id = ?', [role, req.params.id]);
            res.json({ message: 'User role updated successfully' });
        } catch (error) {
            console.error('Error updating user role:', error);
            res.status(500).json({ message: 'Failed to update user role' });
        }
    }));

    // --- VERIFICATION MANAGEMENT ENDPOINTS (Preserved) ---
    router.put('/users/:id/verification', isAdmin, asyncHandler(async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { status } = req.body; // status is 'approved', 'rejected', or 'pending'
            const userId = req.params.id;
            const adminId = req.user.userId;

            if (!['pending', 'approved', 'rejected'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status specified' });
            }

            await connection.beginTransaction();

            const [latestRequest] = await connection.query(
                "SELECT request_id FROM verification_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
                [userId]
            );

            if (latestRequest.length > 0) {
                const requestId = latestRequest[0].request_id;
                await connection.query(
                    "UPDATE verification_requests SET status = ?, reviewed_by = ? WHERE request_id = ?",
                    [status, adminId, requestId]
                );
            } else {
                await connection.query(
                    "INSERT INTO verification_requests (user_id, status, document_path, reviewed_by, document_url) VALUES (?, ?, ?, ?, ?)",
                    [userId, status, 'Manually changed by admin', adminId, 'N/A']
                );
            }

            let userVerificationStatus;
            if (status === 'approved') {
                userVerificationStatus = 'verified';
            } else if (status === 'pending') {
                userVerificationStatus = 'pending';
            } else { // 'rejected'
                userVerificationStatus = 'unverified';
            }

            await connection.query(
                "UPDATE users SET verification_status = ? WHERE user_id = ?",
                [userVerificationStatus, userId]
            );

            await connection.commit();
            res.json({ message: `Verification status set to ${status}` });

        } catch (error) {
            await connection.rollback();
            console.error('Error updating verification status:', error);
            res.status(500).json({ message: 'Failed to update verification status' });
        } finally {
            connection.release();
        }
    }));

    router.get('/verification-requests', isAdmin, asyncHandler(async (req, res) => {
        try {
            const [requests] = await pool.query(`
                SELECT 
                    vr.request_id,
                    vr.created_at,
                    vr.document_path,
                    u.full_name,
                    u.email
                FROM verification_requests vr
                JOIN users u ON vr.user_id = u.user_id
                WHERE vr.status = 'pending'
                ORDER BY vr.created_at ASC
            `);
            res.json(requests);
        } catch (error) {
            console.error('Error fetching verification requests:', error);
            res.status(500).json({ message: 'Failed to fetch verification requests' });
        }
    }));

    router.put('/verification-requests/:id', isAdmin, asyncHandler(async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { status } = req.body; // 'approved' or 'rejected'
            const { id } = req.params; // This is request_id

            await connection.beginTransaction();

            await connection.query(
                'UPDATE verification_requests SET status = ?, reviewed_by = ? WHERE request_id = ?',
                [status, req.user.userId, id]
            );

            const [requestDetails] = await connection.query(
                'SELECT user_id FROM verification_requests WHERE request_id = ?',
                [id]
            );
            const userId = requestDetails[0].user_id;

            const userVerificationStatus = status === 'approved' ? 'verified' : 'unverified';
            await connection.query(
                'UPDATE users SET verification_status = ? WHERE user_id = ?',
                [userVerificationStatus, userId]
            );

            await connection.commit();
            res.json({ message: `Request has been ${status}.` });

        } catch (error) {
            await connection.rollback();
            console.error('Error updating verification request:', error);
            res.status(500).json({ message: 'Failed to update request.' });
        } finally {
            connection.release();
        }
    }));

    // --- GROUP CREATION MANAGEMENT (CORRECTED) ---
    router.get('/group-creation-requests', isAdmin, asyncHandler(async (req, res) => {
        // This query has been fixed to remove the non-existent 'created_at' column.
        const [requests] = await pool.query(`
        SELECT 
            gcr.request_id,
            gcr.group_name as name,
            gcr.group_description as description,
            u.full_name as creator_name
        FROM \`group_creation_requests\` gcr
        JOIN users u ON gcr.user_id = u.user_id
        WHERE gcr.status = 'pending'
    `);
        res.json(requests);
    }));

    router.put('/group-creation-requests/:id', isAdmin, asyncHandler(async (req, res) => {
        const { status } = req.body; // 'approve' or 'reject'
        const requestId = req.params.id;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [requestRows] = await connection.query("SELECT * FROM group_creation_requests WHERE request_id = ? AND status = 'pending'", [requestId]);
            if (requestRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: "Request not found or already handled." });
            }
            const request = requestRows[0];

            if (status === 'approve') {
                // 1. Create the new group in the `groups` table
                const [newGroup] = await connection.query(
                    "INSERT INTO `groups` (name, description, created_by, status, image_url, background_image_url) VALUES (?, ?, ?, 'active', ?, ?)",
                    [request.group_name, request.group_description, request.user_id, request.image_url, request.background_image_url]
                );
                const newGroupId = newGroup.insertId;

                // 2. Make the creator an admin of the new group
                await connection.query("INSERT INTO group_members (group_id, user_id, role, status) VALUES (?, ?, 'admin', 'approved')", [newGroupId, request.user_id]);

                // 3. Update the request status in `group_creation_requests`
                await connection.query("UPDATE group_creation_requests SET status = 'approved' WHERE request_id = ?", [requestId]);

            } else { // 'reject'
                await connection.query("UPDATE group_creation_requests SET status = 'rejected' WHERE request_id = ?", [requestId]);
            }

            await connection.commit();
            res.json({ message: `Group request has been ${status}d.` });

        } catch (error) {
            await connection.rollback();
            console.error('Error handling group creation request:', error);
            res.status(500).json({ message: 'Failed to process request.' });
        } finally {
            connection.release();
        }
    }));

    // --- GROUP JOIN REQUEST MANAGEMENT (Preserved) ---
    router.get('/group-join-requests', isAdmin, asyncHandler(async (req, res) => {
        try {
            const [requests] = await pool.query(`
                SELECT 
                    gjr.request_id,
                    gjr.user_id,
                    gjr.group_id,
                    gjr.created_at as joined_at,
                    u.full_name as user_name,
                    g.name as group_name
                FROM group_join_requests gjr
                JOIN users u ON gjr.user_id = u.user_id
                JOIN \`groups\` g ON gjr.group_id = g.group_id
                WHERE gjr.status = 'pending'
                ORDER BY gjr.created_at ASC
            `);
            res.json(requests);
        } catch (error) {
            console.error('Error fetching group join requests:', error);
            res.status(500).json({ message: 'Failed to fetch group join requests' });
        }
    }));

    router.put('/group-join-requests/:groupId/:userId', isAdmin, asyncHandler(async (req, res) => {
        try {
            const { status } = req.body;
            const { groupId, userId } = req.params;

            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status provided.' });
            }

            if (status === 'approved') {
                // First update the request status
                await pool.query(
                    "UPDATE group_join_requests SET status = 'approved' WHERE group_id = ? AND user_id = ?",
                    [groupId, userId]
                );
                // Then add the user as a member
                await pool.query(
                    "INSERT INTO group_members (group_id, user_id, role, status) VALUES (?, ?, 'member', 'approved')",
                    [groupId, userId]
                );
            } else { // status is 'rejected'
                await pool.query(
                    "UPDATE group_join_requests SET status = 'rejected' WHERE group_id = ? AND user_id = ?",
                    [groupId, userId]
                );
            }

            res.json({ message: `Join request has been ${status}.` });
        } catch (error) {
            console.error('Error updating group join request:', error);
            res.status(500).json({ message: 'Failed to update join request.' });
        }
    }));

    return router;
};