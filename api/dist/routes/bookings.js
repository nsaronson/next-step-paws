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
// GET /api/bookings - Get bookings for the authenticated user (or all for owner)
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        let query;
        let params;
        if (req.user?.role === 'owner') {
            // Owner can see all bookings
            query = `
        SELECT b.*, 
               s.date, s.time, s.duration,
               u.name as user_name, u.email as user_email
        FROM bookings b
        JOIN available_slots s ON b.slot_id = s.id
        JOIN users u ON b.user_id = u.id
        ORDER BY s.date ASC, s.time ASC
      `;
            params = [];
        }
        else {
            // Regular users can only see their own bookings
            query = `
        SELECT b.*, 
               s.date, s.time, s.duration
        FROM bookings b
        JOIN available_slots s ON b.slot_id = s.id
        WHERE b.user_id = $1
        ORDER BY s.date ASC, s.time ASC
      `;
            params = [req.user?.userId];
        }
        const result = await server_1.pool.query(query, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});
// POST /api/bookings - Create new booking
router.post('/', auth_1.authenticateToken, validation_1.bookingValidation, async (req, res) => {
    try {
        const { slotId, dogName, notes } = req.body;
        const userId = req.user?.userId;
        // Check if slot exists and is available
        const slotResult = await server_1.pool.query('SELECT * FROM available_slots WHERE id = $1 AND is_booked = FALSE', [slotId]);
        if (slotResult.rows.length === 0) {
            return res.status(400).json({ error: 'Time slot not available' });
        }
        const slot = slotResult.rows[0];
        // Check if the slot is in the future
        const slotDateTime = new Date(`${slot.date}T${slot.time}`);
        if (slotDateTime <= new Date()) {
            return res.status(400).json({ error: 'Cannot book past time slots' });
        }
        // Start transaction
        await server_1.pool.query('BEGIN');
        try {
            // Create booking
            const bookingResult = await server_1.pool.query('INSERT INTO bookings (slot_id, user_id, dog_name, notes, status) VALUES ($1, $2, $3, $4, $5) RETURNING *', [slotId, userId, dogName, notes || null, 'confirmed']);
            // Mark slot as booked
            await server_1.pool.query('UPDATE available_slots SET is_booked = TRUE WHERE id = $1', [slotId]);
            await server_1.pool.query('COMMIT');
            // Return booking with slot details
            const booking = bookingResult.rows[0];
            res.status(201).json({
                ...booking,
                date: slot.date,
                time: slot.time,
                duration: slot.duration
            });
        }
        catch (error) {
            await server_1.pool.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});
// PUT /api/bookings/:id - Update booking
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { dogName, notes, status } = req.body;
        // Validate dogName if provided
        if (dogName && dogName.trim().length === 0) {
            return res.status(400).json({ error: 'Dog name cannot be empty' });
        }
        // Validate status if provided
        const validStatuses = ['confirmed', 'pending', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        // Check if booking exists and user has access
        let checkQuery;
        let checkParams;
        if (req.user?.role === 'owner') {
            checkQuery = 'SELECT * FROM bookings WHERE id = $1';
            checkParams = [id];
        }
        else {
            checkQuery = 'SELECT * FROM bookings WHERE id = $1 AND user_id = $2';
            checkParams = [id, req.user?.userId];
        }
        const existingBooking = await server_1.pool.query(checkQuery, checkParams);
        if (existingBooking.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        const currentBooking = existingBooking.rows[0];
        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (dogName !== undefined) {
            updates.push(`dog_name = $${paramCount++}`);
            values.push(dogName.trim());
        }
        if (notes !== undefined) {
            updates.push(`notes = $${paramCount++}`);
            values.push(notes || null);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }
        updates.push(`updated_at = NOW()`);
        values.push(id);
        const updateQuery = `UPDATE bookings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        // Handle slot availability if status changes to cancelled
        if (status === 'cancelled' && currentBooking.status !== 'cancelled') {
            await server_1.pool.query('BEGIN');
            try {
                const result = await server_1.pool.query(updateQuery, values);
                // Free up the slot
                await server_1.pool.query('UPDATE available_slots SET is_booked = FALSE WHERE id = $1', [currentBooking.slot_id]);
                await server_1.pool.query('COMMIT');
                res.json(result.rows[0]);
            }
            catch (error) {
                await server_1.pool.query('ROLLBACK');
                throw error;
            }
        }
        else {
            const result = await server_1.pool.query(updateQuery, values);
            res.json(result.rows[0]);
        }
    }
    catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({ error: 'Failed to update booking' });
    }
});
// DELETE /api/bookings/:id - Cancel/delete booking
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Check if booking exists and user has access
        let checkQuery;
        let checkParams;
        if (req.user?.role === 'owner') {
            checkQuery = 'SELECT * FROM bookings WHERE id = $1';
            checkParams = [id];
        }
        else {
            checkQuery = 'SELECT * FROM bookings WHERE id = $1 AND user_id = $2';
            checkParams = [id, req.user?.userId];
        }
        const existingBooking = await server_1.pool.query(checkQuery, checkParams);
        if (existingBooking.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        const booking = existingBooking.rows[0];
        await server_1.pool.query('BEGIN');
        try {
            // Delete booking
            await server_1.pool.query('DELETE FROM bookings WHERE id = $1', [id]);
            // Free up the slot
            await server_1.pool.query('UPDATE available_slots SET is_booked = FALSE WHERE id = $1', [booking.slot_id]);
            await server_1.pool.query('COMMIT');
            res.json({ message: 'Booking cancelled successfully' });
        }
        catch (error) {
            await server_1.pool.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});
exports.default = router;
//# sourceMappingURL=bookings.js.map