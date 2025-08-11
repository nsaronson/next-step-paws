"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const server_1 = require("../server");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
// Register new user
router.post('/register', validation_1.authValidation, async (req, res) => {
    try {
        const { email, name, role, dogName, password } = req.body;
        // Check if user already exists
        const existingUser = await server_1.pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Insert user
        const result = await server_1.pool.query('INSERT INTO users (email, name, role, dog_name, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, dog_name', [email, name, role, dogName, passwordHash]);
        const user = result.rows[0];
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                dogName: user.dog_name
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Login user
router.post('/login', validation_1.loginValidation, async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const result = await server_1.pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        // Check password
        const validPassword = await bcrypt_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                dogName: user.dog_name
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map