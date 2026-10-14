import jwt from 'jsonwebtoken';
import { getDb } from '../db/db.js';

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required. Please login.' });
    }

    const secret = process.env.JWT_SECRET || 'medivault_production_secure_jwt_secret_key_2026_client_spec';

    jwt.verify(token, secret, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }

        try {
            const db = await getDb();
            const userRes = await db.query(
                'SELECT id, name, email, phone, role, is_active FROM users WHERE id = $1',
                [decoded.userId]
            );

            if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
                return res.status(403).json({ error: 'User account is deactivated or unavailable.' });
            }

            req.user = userRes.rows[0];
            next();
        } catch (dbErr) {
            return res.status(500).json({ error: 'Authentication database verification failed.' });
        }
    });
}

export function requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
}
