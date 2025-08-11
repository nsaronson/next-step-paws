import express from 'express';
import { pool } from '../server';
import { authenticateToken, requireOwner, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/users - Get all users (owner only)
router.get('/', authenticateToken, requireOwner, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, dog_name, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Users can only view their own profile unless they're an owner
    if (req.user?.role !== 'owner' && req.user?.userId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT id, email, name, role, dog_name, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/users/:id - Update user profile
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, dogName } = req.body;

    // Users can only update their own profile unless they're an owner
    if (req.user?.role !== 'owner' && req.user?.userId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    const result = await pool.query(
      'UPDATE users SET name = $1, dog_name = $2, updated_at = NOW() WHERE id = $3 RETURNING id, email, name, role, dog_name',
      [name.trim(), dogName?.trim() || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
