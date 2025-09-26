const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

module.exports = (pool) => {

    // --- Public Routes ---
    router.get('/', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT * FROM `groups` ORDER BY name ASC');
        res.json(rows);
    }));

    router.get('/:id', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT * FROM `groups` WHERE group_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Group not found' });
        }
        res.json(rows[0]);
    }));
    
    router.get('/:id/members', asyncHandler(async (req, res) => {
        const [members] = await pool.query(`
            SELECT u.user_id, u.full_name, u.profile_pic_url, u.email
            FROM users u JOIN group_members gm ON u.user_id = gm.user_id
            WHERE gm.group_id = ?
        `, [req.params.id]);
        res.json(members);
    }));

    // All routes below this require a user to be logged in
    router.use(verifyToken);
    
    router.get('/:id/membership-status', asyncHandler(async (req, res) => {
        const group_id = req.params.id;
        const user_id = req.user.userId;

        const [group] = await pool.query('SELECT created_by FROM `groups` WHERE group_id = ?', [group_id]);
        if (group.length > 0 && group[0].created_by === user_id) {
            return res.json({ status: 'admin' });
        }

        const [member] = await pool.query('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [group_id, user_id]);
        if (member.length > 0) {
            return res.json({ status: 'member' });
        }

        const [request] = await pool.query('SELECT * FROM group_join_requests WHERE group_id = ? AND user_id = ? AND status = "pending"', [group_id, user_id]);
        if (request.length > 0) {
            return res.json({ status: 'pending' });
        }

        res.json({ status: 'none' });
    }));


    // --- Alumni (Logged-in User) Routes ---
    router.post('/request-creation', asyncHandler(async (req, res) => {
        const { group_name, group_description } = req.body;
        const user_id = req.user.userId;
        try {
            await pool.query(
                'INSERT INTO group_creation_requests (user_id, group_name, group_description) VALUES (?, ?, ?)',
                [user_id, group_name, group_description]
            );
            res.status(201).json({ message: 'Group creation request submitted successfully!' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'A group with this name has already been requested.' });
            }
            throw error;
        }
    }));
    
    router.post('/:id/request-join', asyncHandler(async (req, res) => {
        const group_id = req.params.id;
        const user_id = req.user.userId;
        try {
            await pool.query(
                'INSERT INTO group_join_requests (group_id, user_id) VALUES (?, ?)',
                [group_id, user_id]
            );
            res.status(201).json({ message: 'Request to join group sent successfully!' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'You have already sent a request to join this group.' });
            }
            throw error;
        }
    }));
    
    // --- Group Posts ---
    router.get('/:id/posts', asyncHandler(async (req, res) => {
        const [posts] = await pool.query(`
            SELECT gp.post_id, gp.content, gp.created_at, u.full_name as author, u.profile_pic_url
            FROM group_posts gp
            JOIN users u ON gp.user_id = u.user_id
            WHERE gp.group_id = ?
            ORDER BY gp.created_at DESC
        `, [req.params.id]);
        res.json(posts);
    }));

    router.post('/:id/posts', asyncHandler(async (req, res) => {
        const group_id = req.params.id;
        const user_id = req.user.userId;
        const { content } = req.body;

        await pool.query(
            'INSERT INTO group_posts (group_id, user_id, content) VALUES (?, ?, ?)',
            [group_id, user_id, content]
        );
        res.status(201).json({ message: 'Post created successfully!' });
    }));

    // --- Admin-Only Routes ---
    router.post('/', isAdmin, asyncHandler(async (req, res) => {
        const { name, description, image_url } = req.body;
        const created_by = req.user.userId;
        const [result] = await pool.query(
            'INSERT INTO `groups` (name, description, image_url, created_by) VALUES (?, ?, ?, ?)',
            [name, description, image_url, created_by]
        );
        const groupId = result.insertId;
        await pool.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, created_by]);
        res.status(201).json({ message: 'Group created successfully!', groupId });
    }));
    
    router.get('/admin/creation-requests', isAdmin, asyncHandler(async (req, res) => {
        const [requests] = await pool.query("SELECT gcr.*, u.full_name FROM group_creation_requests gcr JOIN users u ON gcr.user_id = u.user_id WHERE gcr.status = 'pending'");
        res.json(requests);
    }));

    router.post('/admin/creation-requests/:requestId', isAdmin, asyncHandler(async (req, res) => {
        const { requestId } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        if (action === 'approve') {
            const [request] = await pool.query('SELECT * FROM group_creation_requests WHERE request_id = ?', [requestId]);
            if (request.length === 0) return res.status(404).json({ message: 'Request not found.' });
            
            const { group_name, group_description, user_id } = request[0];
            const [newGroup] = await pool.query('INSERT INTO `groups` (name, description, created_by) VALUES (?, ?, ?)', [group_name, group_description, user_id]);
            await pool.query('UPDATE group_creation_requests SET status = "approved" WHERE request_id = ?', [requestId]);
            res.status(200).json({ message: 'Group creation request approved.' });
        } else {
            await pool.query('UPDATE group_creation_requests SET status = "rejected" WHERE request_id = ?', [requestId]);
            res.status(200).json({ message: 'Group creation request rejected.' });
        }
    }));
    
    router.get('/:id/join-requests', verifyToken, asyncHandler(async (req, res) => {
        // Security check: Only group admin can view requests
        const group_id = req.params.id;
        const [group] = await pool.query('SELECT created_by FROM `groups` WHERE group_id = ?', [group_id]);
        if (group.length === 0 || group[0].created_by !== req.user.userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const [requests] = await pool.query("SELECT gjr.*, u.full_name FROM group_join_requests gjr JOIN users u ON gjr.user_id = u.user_id WHERE gjr.group_id = ? AND gjr.status = 'pending'", [group_id]);
        res.json(requests);
    }));

    router.post('/:groupId/join-requests/:requestId', verifyToken, asyncHandler(async (req, res) => {
        const { groupId, requestId } = req.params;
        const { action } = req.body;
        
        // Security check: Only group admin can manage requests
        const [group] = await pool.query('SELECT created_by FROM `groups` WHERE group_id = ?', [groupId]);
        if (group.length === 0 || group[0].created_by !== req.user.userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (action === 'approve') {
            const [request] = await pool.query('SELECT * FROM group_join_requests WHERE request_id = ?', [requestId]);
            if (request.length === 0) return res.status(404).json({ message: 'Request not found.' });

            const { user_id } = request[0];
            await pool.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, user_id]);
            await pool.query('UPDATE group_join_requests SET status = "approved" WHERE request_id = ?', [requestId]);
            res.status(200).json({ message: 'Join request approved.' });
        } else {
            await pool.query('UPDATE group_join_requests SET status = "rejected" WHERE request_id = ?', [requestId]);
            res.status(200).json({ message: 'Join request rejected.' });
        }
    }));

    return router;
};