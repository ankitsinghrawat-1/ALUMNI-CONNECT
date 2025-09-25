const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

module.exports = (pool, createGlobalNotification) => {

    router.post('/:id/rsvp', verifyToken, asyncHandler(async (req, res) => {
        const event_id = req.params.id;
        const user_id = req.user.userId;
        try {
            await pool.query('INSERT INTO event_rsvps (event_id, user_id) VALUES (?, ?)', [event_id, user_id]);
            res.status(201).json({ message: 'RSVP successful!' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'You have already RSVP\'d to this event.' });
            }
            throw error; // Let the central handler catch other errors
        }
    }));

    router.delete('/:id/rsvp', verifyToken, asyncHandler(async (req, res) => {
        const event_id = req.params.id;
        const user_id = req.user.userId;
        await pool.query('DELETE FROM event_rsvps WHERE event_id = ? AND user_id = ?', [event_id, user_id]);
        res.status(200).json({ message: 'RSVP canceled.' });
    }));
    
    router.get('/user/rsvps', verifyToken, asyncHandler(async (req, res) => {
        const user_id = req.user.userId;
        const [rsvps] = await pool.query('SELECT event_id FROM event_rsvps WHERE user_id = ?', [user_id]);
        res.json(rsvps.map(r => r.event_id));
    }));

    router.get('/:id/attendees', asyncHandler(async (req, res) => {
        const [attendees] = await pool.query(`
            SELECT u.full_name, u.profile_pic_url, u.email, u.verification_status
            FROM users u JOIN event_rsvps er ON u.user_id = er.user_id
            WHERE er.event_id = ?
        `, [req.params.id]);
        res.json(attendees);
    }));

    router.get('/recent', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT event_id, title, date, location FROM events ORDER BY date DESC LIMIT 3');
        res.json(rows);
    }));

    router.post('/by-ids', asyncHandler(async (req, res) => {
        const { event_ids } = req.body;
        if (!event_ids || event_ids.length === 0) return res.json([]);
        const placeholders = event_ids.map(() => '?').join(',');
        const [rows] = await pool.query(`SELECT event_id, title, date, location FROM events WHERE event_id IN (${placeholders}) ORDER BY date DESC`, event_ids);
        res.json(rows);
    }));

    router.get('/', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT * FROM events ORDER BY date DESC');
        res.json(rows);
    }));

    router.get('/:id', asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT * FROM events WHERE event_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(rows[0]);
    }));

    router.put('/:id', verifyToken, isAdmin, asyncHandler(async (req, res) => {
        const { title, description, date, location, organizer } = req.body;
        await pool.query(
            'UPDATE events SET title = ?, description = ?, date = ?, location = ?, organizer = ? WHERE event_id = ?',
            [title, description, date, location, organizer, req.params.id]
        );
        res.status(200).json({ message: 'Event updated successfully!' });
    }));

    router.delete('/:id', verifyToken, isAdmin, asyncHandler(async (req, res) => {
        const eventId = req.params.id;
        await pool.query('DELETE FROM event_rsvps WHERE event_id = ?', [eventId]);
        await pool.query('DELETE FROM events WHERE event_id = ?', [eventId]);
        res.status(200).json({ message: 'Event and all related RSVPs deleted successfully.' });
    }));

    router.post('/', verifyToken, isAdmin, asyncHandler(async (req, res) => {
        const { title, date, location, organizer, description } = req.body;
        await pool.query('INSERT INTO events (title, date, location, organizer, description) VALUES (?, ?, ?, ?, ?)', [title, date, location, organizer, description]);
        await createGlobalNotification(`A new event has been scheduled: "${title}" on ${new Date(date).toLocaleDateString()}.`, '/events.html');
        res.status(201).json({ message: 'Event added successfully' });
    }));

    return router;
};