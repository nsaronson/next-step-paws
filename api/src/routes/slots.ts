import express from 'express';
import { pool } from '../server';
import { authenticateToken, requireOwner, AuthRequest } from '../middleware/auth';
import { slotValidation } from '../middleware/validation';

const router = express.Router();

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
    const params: any[] = [];
    const conditions: string[] = [];

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

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ error: 'Failed to fetch time slots' });
  }
});

// POST /api/slots - Create new time slot (owner only)
router.post('/', authenticateToken, requireOwner, slotValidation, async (req: AuthRequest, res) => {
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
    const existingSlot = await pool.query(
      'SELECT id FROM available_slots WHERE date = $1 AND time = $2',
      [date, time]
    );

    if (existingSlot.rows.length > 0) {
      return res.status(400).json({ error: 'Time slot already exists' });
    }

    const result = await pool.query(
      'INSERT INTO available_slots (date, time, duration) VALUES ($1, $2, $3) RETURNING *',
      [date, time, duration]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create slot error:', error);
    res.status(500).json({ error: 'Failed to create time slot' });
  }
});

// PUT /api/slots/:id - Update time slot (owner only)
router.put('/:id', authenticateToken, requireOwner, slotValidation, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { date, time, duration = 60 } = req.body;

    // Check if slot exists
    const existingSlot = await pool.query('SELECT * FROM available_slots WHERE id = $1', [id]);

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
    const conflictSlot = await pool.query(
      'SELECT id FROM available_slots WHERE date = $1 AND time = $2 AND id != $3',
      [date, time, id]
    );

    if (conflictSlot.rows.length > 0) {
      return res.status(400).json({ error: 'Time slot already exists' });
    }

    const result = await pool.query(
      'UPDATE available_slots SET date = $1, time = $2, duration = $3 WHERE id = $4 RETURNING *',
      [date, time, duration, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update slot error:', error);
    res.status(500).json({ error: 'Failed to update time slot' });
  }
});

// DELETE /api/slots/:id - Delete time slot (owner only)
router.delete('/:id', authenticateToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if slot exists
    const existingSlot = await pool.query('SELECT * FROM available_slots WHERE id = $1', [id]);

    if (existingSlot.rows.length === 0) {
      return res.status(404).json({ error: 'Time slot not found' });
    }

    const slot = existingSlot.rows[0];

    // Don't allow deleting booked slots
    if (slot.is_booked) {
      return res.status(400).json({ error: 'Cannot delete booked time slot. Cancel the booking first.' });
    }

    await pool.query('DELETE FROM available_slots WHERE id = $1', [id]);

    res.json({ message: 'Time slot deleted successfully' });
  } catch (error) {
    console.error('Delete slot error:', error);
    res.status(500).json({ error: 'Failed to delete time slot' });
  }
});

export default router;
