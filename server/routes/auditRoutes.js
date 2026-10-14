import express from 'express';
import { getDb } from '../db/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/audit-logs
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { search, action, entityType } = req.query;
        const db = await getDb();

        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search.trim()}%`);
            query += ` AND (user_name ILIKE $${params.length} OR action ILIKE $${params.length} OR entity_type ILIKE $${params.length})`;
        }

        if (action) {
            params.push(action);
            query += ` AND action = $${params.length}`;
        }

        if (entityType) {
            params.push(entityType);
            query += ` AND entity_type = $${params.length}`;
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const logsRes = await db.query(query, params);
        res.json({ logs: logsRes.rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit logs.' });
    }
});

export default router;
