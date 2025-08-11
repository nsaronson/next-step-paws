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
// GET /api/classes - Get all group classes
router.get('/', async (req, res) => {
    try {
        const result = await server_1.pool.query(`
      SELECT gc.*, 
             COUNT(gce.user_id) as enrolled_count,
             (gc.max_spots - COUNT(gce.user_id)) as available_spots
      FROM group_classes gc
      LEFT JOIN group_class_enrollments gce ON gc.id = gce.class_id
      GROUP BY gc.id
      ORDER BY gc.created_at DESC
    `);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ error: 'Failed to fetch classes' });
    }
});
// POST /api/classes - Create new group class (owner only)
router.post('/', auth_1.authenticateToken, auth_1.requireOwner, validation_1.classValidation, async (req, res) => {
    try {
        const { name, description, schedule, maxSpots, price, level } = req.body;
        const result = await server_1.pool.query('INSERT INTO group_classes (name, description, schedule, max_spots, price, level) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, description, schedule, maxSpots, price, level]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({ error: 'Failed to create class' });
    }
});
// PUT /api/classes/:id - Update group class (owner only)
router.put('/:id', auth_1.authenticateToken, auth_1.requireOwner, validation_1.classValidation, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, schedule, maxSpots, price, level } = req.body;
        const result = await server_1.pool.query('UPDATE group_classes SET name = $1, description = $2, schedule = $3, max_spots = $4, price = $5, level = $6, updated_at = NOW() WHERE id = $7 RETURNING *', [name, description, schedule, maxSpots, price, level, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Update class error:', error);
        res.status(500).json({ error: 'Failed to update class' });
    }
});
// DELETE /api/classes/:id - Delete group class (owner only)
router.delete('/:id', auth_1.authenticateToken, auth_1.requireOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await server_1.pool.query('DELETE FROM group_classes WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }
        res.json({ message: 'Class deleted successfully' });
    }
    catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({ error: 'Failed to delete class' });
    }
});
// POST /api/classes/:id/enroll - Enroll in a group class
router.post('/:id/enroll', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        // Check if class exists and has available spots
        const classResult = await server_1.pool.query(`
      SELECT gc.*, 
             COUNT(gce.user_id) as enrolled_count
      FROM group_classes gc
      LEFT JOIN group_class_enrollments gce ON gc.id = gce.class_id
      WHERE gc.id = $1
      GROUP BY gc.id
    `, [id]);
        if (classResult.rows.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }
        const classData = classResult.rows[0];
        const enrolledCount = parseInt(classData.enrolled_count);
        if (enrolledCount >= classData.max_spots) {
            return res.status(400).json({ error: 'Class is full' });
        }
        // Check if user is already enrolled
        const existingEnrollment = await server_1.pool.query('SELECT id FROM group_class_enrollments WHERE class_id = $1 AND user_id = $2', [id, userId]);
        if (existingEnrollment.rows.length > 0) {
            return res.status(400).json({ error: 'Already enrolled in this class' });
        }
        // Enroll user
        await server_1.pool.query('INSERT INTO group_class_enrollments (class_id, user_id) VALUES ($1, $2)', [id, userId]);
        res.status(201).json({ message: 'Successfully enrolled in class' });
    }
    catch (error) {
        console.error('Enroll in class error:', error);
        res.status(500).json({ error: 'Failed to enroll in class' });
    }
});
// DELETE /api/classes/:id/enroll - Unenroll from a group class
router.delete('/:id/enroll', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const result = await server_1.pool.query('DELETE FROM group_class_enrollments WHERE class_id = $1 AND user_id = $2 RETURNING id', [id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }
        res.json({ message: 'Successfully unenrolled from class' });
    }
    catch (error) {
        console.error('Unenroll from class error:', error);
        res.status(500).json({ error: 'Failed to unenroll from class' });
    }
});
exports.default = router;
//# sourceMappingURL=classes.js.map