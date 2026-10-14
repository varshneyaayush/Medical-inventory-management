import express from 'express';
import { getDb } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard/stats - Admin Dashboard KPIs & Visualization Data
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const todayStr = new Date().toISOString().split('T')[0];
        const day7Str = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

        // 1. Total Active Medicines Count
        const medCountRes = await db.query('SELECT COUNT(*)::INT as count FROM medicines WHERE is_active = TRUE');
        const totalMedicines = medCountRes.rows[0].count;

        // 2. Total Stock Units & Valuation
        const stockValRes = await db.query(
            `SELECT 
                COALESCE(SUM(quantity), 0)::INT as total_stock,
                COALESCE(SUM(quantity * purchase_price), 0)::NUMERIC as inventory_purchase_valuation,
                COALESCE(SUM(quantity * selling_price), 0)::NUMERIC as inventory_selling_valuation
             FROM medicine_batches
             WHERE is_active = TRUE`
        );
        const { total_stock, inventory_purchase_valuation, inventory_selling_valuation } = stockValRes.rows[0];

        // 3. Low Stock Medicines Count (total stock <= reorder_level)
        const lowStockRes = await db.query(
            `SELECT COUNT(*)::INT as count FROM (
                SELECT m.id
                FROM medicines m
                LEFT JOIN medicine_batches b ON m.id = b.medicine_id AND b.is_active = TRUE
                WHERE m.is_active = TRUE
                GROUP BY m.id, m.reorder_level
                HAVING COALESCE(SUM(b.quantity), 0) <= m.reorder_level
            ) sub`
        );
        const lowStockCount = lowStockRes.rows[0].count;

        // 4. Expiring Soon Count (<= 7 days) & Expired Count
        const expiredRes = await db.query(
            `SELECT COUNT(*)::INT as count FROM medicine_batches 
             WHERE is_active = TRUE AND quantity > 0 AND expiry_date < $1`,
            [todayStr]
        );
        const expiredCount = expiredRes.rows[0].count;

        const expiringSoonRes = await db.query(
            `SELECT COUNT(*)::INT as count FROM medicine_batches 
             WHERE is_active = TRUE AND quantity > 0 AND expiry_date >= $1 AND expiry_date <= $2`,
            [todayStr, day7Str]
        );
        const expiringSoonCount = expiringSoonRes.rows[0].count;

        // 5. Today's Purchases & Today's Sales
        const todaySalesRes = await db.query(
            `SELECT COALESCE(SUM(total_amount), 0)::NUMERIC as total 
             FROM sales 
             WHERE sale_date::DATE = CURRENT_DATE`
        );
        const todaySales = todaySalesRes.rows[0].total;

        const todayPurchasesRes = await db.query(
            `SELECT COALESCE(SUM(total_amount), 0)::NUMERIC as total 
             FROM purchases 
             WHERE purchase_date::DATE = CURRENT_DATE`
        );
        const todayPurchases = todayPurchasesRes.rows[0].total;

        // 6. Category Breakdown
        const categoryRes = await db.query(
            `SELECT m.category, COUNT(m.id)::INT as medicine_count, COALESCE(SUM(b.quantity), 0)::INT as stock
             FROM medicines m
             LEFT JOIN medicine_batches b ON m.id = b.medicine_id AND b.is_active = TRUE
             WHERE m.is_active = TRUE
             GROUP BY m.category
             ORDER BY stock DESC`
        );

        // 7. Recent Transactions
        const recentTxRes = await db.query(
            `SELECT t.*, m.name as medicine_name, b.batch_number, u.name as user_name
             FROM stock_transactions t
             JOIN medicines m ON t.medicine_id = m.id
             LEFT JOIN medicine_batches b ON t.batch_id = b.id
             LEFT JOIN users u ON t.created_by = u.id
             ORDER BY t.created_at DESC
             LIMIT 8`
        );

        res.json({
            kpi: {
                totalMedicines,
                totalStock: total_stock,
                inventoryPurchaseValuation: parseFloat(inventory_purchase_valuation),
                inventorySellingValuation: parseFloat(inventory_selling_valuation),
                lowStockCount,
                expiringSoonCount,
                expiredCount,
                todaySales: parseFloat(todaySales),
                todayPurchases: parseFloat(todayPurchases)
            },
            categories: categoryRes.rows,
            recentTransactions: recentTxRes.rows
        });
    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
    }
});

export default router;
