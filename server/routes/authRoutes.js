import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'medivault_production_secure_jwt_secret_key_2026_client_spec';

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const db = await getDb();
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);

        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = userRes.rows[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated. Contact administrator.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Update last login timestamp
        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        await logAuditEvent({
            userId: user.id,
            userName: user.name,
            action: 'USER_LOGIN',
            entityType: 'USER',
            entityId: user.id,
            newData: { login_at: new Date().toISOString() }
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                last_login: user.last_login
            }
        });
    } catch (error) {
        console.error('❌ Login API error:', error);
        res.status(500).json({ error: 'Internal server login error.' });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// POST /api/auth/reset-password
router.post('/reset-password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
        }

        const db = await getDb();
        const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
        const user = userRes.rows[0];

        const valid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!valid) {
            return res.status(400).json({ error: 'Incorrect current password.' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHash, req.user.id]);

        await logAuditEvent({
            userId: req.user.id,
            userName: req.user.name,
            action: 'PASSWORD_RESET',
            entityType: 'USER',
            entityId: req.user.id
        });

        res.json({ message: 'Password updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset password.' });
    }
});

export default router;
