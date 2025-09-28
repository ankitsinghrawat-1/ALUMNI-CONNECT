const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const fs = require('fs').promises;
const path = require('path');

module.exports = (pool, upload) => {

    const isGroupAdmin = async (userId, groupId) => {
        const [member] = await pool.query('SELECT role FROM group_members WHERE user_id = ? AND group_id = ?', [userId, groupId]);
        return member.length > 0 && member[0].role === 'admin';
    };

    router.get('/', asyncHandler(async (req, res) => {
        const [rows] = await pool.query("SELECT * FROM `groups` WHERE status = 'active' ORDER BY name ASC");
        res.json(rows);
    }));

    router.get('/:id', asyncHandler(async (req, res) => {
        const [rows] = await pool.query(`
            SELECT g.*, u.full_name as creator_name 
            FROM \`groups\` g 
            LEFT JOIN users u ON g.created_by = u.user_id 
            WHERE g.group_id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Group not found' });
        res.json(rows[0]);
    }));

    router.get('/:id/members', asyncHandler(async (req, res) => {
        const [members] = await pool.query(`
            SELECT u.user_id, u.full_name, u.profile_pic_url, u.email, gm.role
            FROM users u JOIN group_members gm ON u.user_id = gm.user_id
            WHERE gm.group_id = ?
        `, [req.params.id]);
        res.json(members);
    }));

    router.use(verifyToken);

    router.get('/:id/membership-status', asyncHandler(async (req, res) => {
        const group_id = req.params.id;
        const user_id = req.user.userId;

        if (req.user.role === 'admin' || (await isGroupAdmin(user_id, group_id))) {
            return res.json({ status: 'admin' });
        }
        const [member] = await pool.query('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [group_id, user_id]);
        if (member.length > 0) return res.json({ status: member[0].status });

        const [request] = await pool.query('SELECT * FROM group_join_requests WHERE group_id = ? AND user_id = ? AND status = "pending"', [group_id, user_id]);
        if (request.length > 0) return res.json({ status: 'pending' });

        res.json({ status: 'none' });
    }));

    // --- User Group Requests (FINAL CORRECTED VERSION) ---
    router.post('/request-creation', upload.fields([
        { name: 'group_logo', maxCount: 1 },
        { name: 'group_background', maxCount: 1 }
    ]), asyncHandler(async (req, res) => {
        const { group_name, group_description } = req.body;
        const user_id = req.user.userId;

        // This robustly checks for files and constructs the path
        const logo_url = (req.files && req.files['group_logo']) ? `uploads/groups/${req.files['group_logo'][0].filename}` : null;
        const background_url = (req.files && req.files['group_background']) ? `uploads/groups/${req.files['group_background'][0].filename}` : null;

        await pool.query(
            'INSERT INTO group_creation_requests (user_id, group_name, group_description, image_url, background_image_url) VALUES (?, ?, ?, ?, ?)',
            [user_id, group_name, group_description, logo_url, background_url]
        );
        res.status(201).json({ message: 'Group creation request submitted successfully!' });
    }));

    router.post('/:id/request-join', asyncHandler(async (req, res) => {
        const group_id = req.params.id;
        const user_id = req.user.userId;
        
        // Check if user is already a member
        const [existingMember] = await pool.query(
            'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
            [group_id, user_id]
        );
        if (existingMember.length > 0) {
            return res.status(400).json({ message: 'You are already a member of this group.' });
        }
        
        // Check if there's already a pending request
        const [existingRequest] = await pool.query(
            'SELECT * FROM group_join_requests WHERE group_id = ? AND user_id = ? AND status = "pending"',
            [group_id, user_id]
        );
        if (existingRequest.length > 0) {
            return res.status(400).json({ message: 'You already have a pending request for this group.' });
        }
        
        await pool.query(
            'INSERT INTO group_join_requests (group_id, user_id, status) VALUES (?, ?, "pending")',
            [group_id, user_id]
        );
        res.status(201).json({ message: 'Request to join group sent successfully!' });
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

    // --- Group Admin & Platform Admin Management ---
    router.put('/:id', upload.fields([
        { name: 'group_logo', maxCount: 1 },
        { name: 'group_background', maxCount: 1 }
    ]), asyncHandler(async (req, res) => {
        const { name, description } = req.body;
        const group_id = req.params.id;

        if (req.user.role !== 'admin' && !(await isGroupAdmin(req.user.userId, group_id))) {
            return res.status(403).json({ message: 'Forbidden: You are not an admin of this group.' });
        }

        const [group] = await pool.query('SELECT image_url, background_image_url FROM `groups` WHERE group_id = ?', [group_id]);

        let new_logo_url = group[0].image_url;
        if (req.files['group_logo']) {
            new_logo_url = `uploads/groups/${req.files['group_logo'][0].filename}`;
            if (group[0].image_url) {
                const oldImagePath = path.join(__dirname, '..', '..', group[0].image_url);
                fs.unlink(oldImagePath).catch(err => console.error("Failed to delete old group image:", err));
            }
        }

        let new_background_url = group[0].background_image_url;
        if (req.files['group_background']) {
            new_background_url = `uploads/groups/${req.files['group_background'][0].filename}`;
            if (group[0].background_image_url) {
                const oldImagePath = path.join(__dirname, '..', '..', group[0].background_image_url);
                fs.unlink(oldImagePath).catch(err => console.error("Failed to delete old group background:", err));
            }
        }

        await pool.query('UPDATE `groups` SET name = ?, description = ?, image_url = ?, background_image_url = ? WHERE group_id = ?', [name, description, new_logo_url, new_background_url, group_id]);
        res.status(200).json({ message: 'Group updated successfully!' });
    }));

    router.delete('/:groupId/members/:memberId', asyncHandler(async (req, res) => {
        const { groupId, memberId } = req.params;

        if (req.user.role !== 'admin' && !(await isGroupAdmin(req.user.userId, groupId))) {
            return res.status(403).json({ message: 'Forbidden: You are not an admin of this group.' });
        }

        const [group] = await pool.query('SELECT created_by FROM `groups` WHERE group_id = ?', [groupId]);
        if (group[0].created_by == memberId) {
            return res.status(400).json({ message: 'Group creator cannot be removed.' });
        }

        await pool.query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, memberId]);
        res.status(200).json({ message: 'Member removed successfully.' });
    }));

    // --- Group Role Management ---
    router.post('/:groupId/members/:memberId/promote', asyncHandler(async (req, res) => {
        const { groupId, memberId } = req.params;

        if (req.user.role !== 'admin' && !(await isGroupAdmin(req.user.userId, groupId))) {
            return res.status(403).json({ message: 'Forbidden: You are not an admin of this group.' });
        }

        await pool.query("UPDATE group_members SET role = 'admin' WHERE group_id = ? AND user_id = ?", [groupId, memberId]);
        res.status(200).json({ message: 'Member promoted to admin.' });
    }));

    router.post('/:groupId/members/:memberId/demote', asyncHandler(async (req, res) => {
        const { groupId, memberId } = req.params;

        if (req.user.role !== 'admin' && !(await isGroupAdmin(req.user.userId, groupId))) {
            return res.status(403).json({ message: 'Forbidden: You are not an admin of this group.' });
        }

        const [group] = await pool.query('SELECT created_by FROM `groups` WHERE group_id = ?', [groupId]);
        if (group[0].created_by == memberId) {
            return res.status(400).json({ message: 'The group creator cannot be demoted.' });
        }

        await pool.query("UPDATE group_members SET role = 'member' WHERE group_id = ? AND user_id = ?", [groupId, memberId]);
        res.status(200).json({ message: 'Admin demoted to member.' });
    }));

    // --- Group Invites ---
    router.post('/:groupId/invites', asyncHandler(async (req, res) => {
        const { groupId } = req.params;
        const { invitee_email } = req.body;
        const inviter_id = req.user.userId;

        const [invitee] = await pool.query('SELECT user_id FROM users WHERE email = ?', [invitee_email]);
        if (invitee.length === 0) {
            return res.status(404).json({ message: 'User to invite not found.' });
        }
        const invitee_id = invitee[0].user_id;

        try {
            await pool.query('INSERT INTO group_invites (group_id, inviter_id, invitee_id) VALUES (?, ?, ?)', [groupId, inviter_id, invitee_id]);
            res.status(201).json({ message: 'Invitation sent successfully!' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'This user has already been invited or has requested to join.' });
            }
            throw error;
        }
    }));

    // --- Platform Admin-Only Routes ---
    router.post('/', isAdmin, upload.fields([
        { name: 'group_logo', maxCount: 1 },
        { name: 'group_background', maxCount: 1 }
    ]), asyncHandler(async (req, res) => {
        const { name, description } = req.body;
        const logo_url = req.files['group_logo'] ? `uploads/groups/${req.files['group_logo'][0].filename}` : null;
        const background_url = req.files['group_background'] ? `uploads/groups/${req.files['group_background'][0].filename}` : null;
        const created_by = req.user.userId;
        const [result] = await pool.query(
            'INSERT INTO `groups` (name, description, image_url, background_image_url, created_by) VALUES (?, ?, ?, ?, ?)',
            [name, description, logo_url, background_url, created_by]
        );
        const groupId = result.insertId;
        await pool.query("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'admin')", [groupId, created_by]);
        res.status(201).json({ message: 'Group created successfully!', groupId });
    }));

    router.post('/admin/creation-requests/:requestId', isAdmin, asyncHandler(async (req, res) => {
        const { requestId } = req.params;
        const { action } = req.body;

        const [requestResult] = await pool.query('SELECT * FROM group_creation_requests WHERE request_id = ?', [requestId]);
        if (requestResult.length === 0) {
            return res.status(404).json({ message: 'Request not found.' });
        }
        const request = requestResult[0];

        if (action === 'approve') {
            const { group_name, group_description, user_id, image_url, background_image_url } = request;
            const [newGroup] = await pool.query('INSERT INTO `groups` (name, description, created_by, image_url, background_image_url) VALUES (?, ?, ?, ?, ?)', [group_name, group_description, user_id, image_url, background_image_url]);
            const newGroupId = newGroup.insertId;
            await pool.query("INSERT INTO group_members (group_id, user_id, role) VALUES (?,?, 'admin')", [newGroupId, user_id]);
            await pool.query('UPDATE group_creation_requests SET status = "approved" WHERE request_id = ?', [requestId]);
            res.status(200).json({ message: 'Group creation request approved.' });
        } else {
            await pool.query('UPDATE group_creation_requests SET status = "rejected" WHERE request_id = ?', [requestId]);
            res.status(200).json({ message: 'Group creation request rejected.' });
        }
    }));

    router.get('/:id/join-requests', verifyToken, asyncHandler(async (req, res) => {
        const group_id = req.params.id;
        if (req.user.role !== 'admin' && !(await isGroupAdmin(req.user.userId, group_id))) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const [requests] = await pool.query("SELECT gjr.*, u.full_name FROM group_join_requests gjr JOIN users u ON gjr.user_id = u.user_id WHERE gjr.group_id = ? AND gjr.status = 'pending'", [group_id]);
        res.json(requests);
    }));

    router.post('/:groupId/join-requests/:requestId', verifyToken, asyncHandler(async (req, res) => {
        const { groupId, requestId } = req.params;
        const { action } = req.body;

        if (req.user.role !== 'admin' && !(await isGroupAdmin(req.user.userId, groupId))) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const [request] = await pool.query('SELECT * FROM group_join_requests WHERE request_id = ?', [requestId]);
        if (request.length === 0) return res.status(404).json({ message: 'Request not found.' });

        const { user_id } = request[0];
        if (action === 'approve') {
            await pool.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, user_id]);
        }
        await pool.query(`UPDATE group_join_requests SET status = ? WHERE request_id = ?`, [action === 'approve' ? 'approved' : 'rejected', requestId]);
        res.status(200).json({ message: `Join request ${action}d.` });
    }));

    return router;
};