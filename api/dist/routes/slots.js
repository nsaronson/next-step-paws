"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// GET /api/slots - Get all available time slots
router.get('/', async (req, res) => {
    try {
        const { date, available } = req.query;
        let query = `
      SELECT s.id, s.date, s.time, s.duration, s.is_booked, s.created_at, s.updated_at,
             CASE WHEN b.id IS NOT NULL THEN TRUE ELSE FALSE END as has_booking,
             b.user_id as booked_by_user_id
      FROM available_slots s
      LEFT JOIN bookings b ON s.id = b.slot_id AND b.status != 'cancelled'
    `;
        const params = [];
        const conditions = [];
        // Filter by date if provided
        if (date) {
            conditions.push(`s.date = $${params.length + 1}`);
            params.push(date);
        }
        // Filter by availability if requested
        if (available === 'true') {
            conditions.push('s.is_booked = FALSE');
        }
        // Only show future slots
        conditions.push(`(s.date > CURRENT_DATE OR (s.date = CURRENT_DATE AND s.time > CURRENT_TIME))`);
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }
        query += ' ORDER BY s.date ASC, s.time ASC';
        const result = await server_1.pool.query(query, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get slots error:', error);
        res.status(500).json({ error: 'Failed to fetch time slots' });
    }
});
// POST /api/slots - Create new time slot (owner only)
router.post('/', auth_1.authenticateToken, auth_1.requireOwner, validation_1.slotValidation, async (req, res) => {
    try {
        const { date, time, duration = 60 } = req.body;
        // Check if slot date is in the future
        const slotDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (slotDate < today) {
            return res.status(400).json({ error: 'Cannot create slots for past dates' });
        }
        // Check if slot already exists
        const existingSlot = await server_1.pool.query('SELECT id FROM available_slots WHERE date = $1 AND time = $2', [date, time]);
        if (existingSlot.rows.length > 0) {
            return res.status(400).json({ error: 'Time slot already exists' });
        }
        const result = await server_1.pool.query('INSERT INTO available_slots (date, time, duration) VALUES ($1, $2, $3) RETURNING *', [date, time, duration]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Create slot error:', error);
        res.status(500).json({ error: 'Failed to create time slot' });
    }
});
// PUT /api/slots/:id - Update time slot (owner only)
router.put('/:id', auth_1.authenticateToken, auth_1.requireOwner, validation_1.slotValidation, async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time, duration = 60 } = req.body;
        // Check if slot exists
        const existingSlot = await server_1.pool.query('SELECT * FROM available_slots WHERE id = $1', [id]);
        if (existingSlot.rows.length === 0) {
            return res.status(404).json({ error: 'Time slot not found' });
        }
        const slot = existingSlot.rows[0];
        // Don't allow updating booked slots
        if (slot.is_booked) {
            return res.status(400).json({ error: 'Cannot update booked time slot' });
        }
        // Check if slot date is in the future
        const slotDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (slotDate < today) {
            return res.status(400).json({ error: 'Cannot update to past dates' });
        }
        // Check if updated slot conflicts with existing slots
        const conflictSlot = await server_1.pool.query('SELECT id FROM available_slots WHERE date = $1 AND time = $2 AND id != $3', [date, time, id]);
        if (conflictSlot.rows.length > 0) {
            return res.status(400).json({ error: 'Time slot already exists' });
        }
        const result = await server_1.pool.query('UPDATE available_slots SET date = $1, time = $2, duration = $3 WHERE id = $4 RETURNING *', [date, time, duration, id]);
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Update slot error:', error);
        res.status(500).json({ error: 'Failed to update time slot' });
    }
});
// DELETE /api/slots/:id - Delete time slot (owner only)
router.delete('/:id', auth_1.authenticateToken, auth_1.requireOwner, async (req, res) => {
    try {
        const { id } = req.params;
        // Check if slot exists
        const existingSlot = await server_1.pool.query('SELECT * FROM available_slots WHERE id = $1', [id]);
        if (existingSlot.rows.length === 0) {
            return res.status(404).json({ error: 'Time slot not found' });
        }
        const slot = existingSlot.rows[0];
        // Don't allow deleting booked slots
        if (slot.is_booked) {
            return res.status(400).json({ error: 'Cannot delete booked time slot. Cancel the booking first.' });
        }
        await server_1.pool.query('DELETE FROM available_slots WHERE id = $1', [id]);
        res.json({ message: 'Time slot deleted successfully' });
    }
    catch (error) {
        console.error('Delete slot error:', error);
        res.status(500).json({ error: 'Failed to delete time slot' });
    }
});
exports.default = router;
//# sourceMappingURL=slots.js.map