import express from 'express';
import { getDb } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reports/valuation
router.get('/valuation', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const resVal = await db.query(
            `SELECT m.id, m.name, m.generic_name, m.brand, m.category,
                    COALESCE(SUM(b.quantity), 0)::INT as total_stock,
                    COALESCE(SUM(b.quantity * b.purchase_price), 0)::NUMERIC as total_purchase_value,
                    COALESCE(SUM(b.quantity * b.selling_price), 0)::NUMERIC as total_selling_value,
                    COALESCE(SUM(b.quantity * (b.selling_price - b.purchase_price)), 0)::NUMERIC as potential_profit
             FROM medicines m
             LEFT JOIN medicine_batches b ON m.id = b.medicine_id AND b.is_active = TRUE
             WHERE m.is_active = TRUE
             GROUP BY m.id
             ORDER BY total_selling_value DESC`
        );
        res.json({ valuation: resVal.rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate valuation report.' });
    }
});

// GET /api/reports/expiry
router.get('/expiry', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const expRes = await db.query(
            `SELECT b.*, m.name as medicine_name, m.brand, m.category, s.name as supplier_name
             FROM medicine_batches b
             JOIN medicines m ON b.medicine_id = m.id
             LEFT JOIN suppliers s ON b.supplier_id = s.id
             WHERE b.is_active = TRUE AND m.is_active = TRUE AND b.quantity > 0
             ORDER BY b.expiry_date ASC`
        );
        res.json({ batches: expRes.rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate expiry timeline report.' });
    }
});

export default router;
