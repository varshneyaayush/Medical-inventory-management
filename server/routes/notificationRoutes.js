import express from 'express';
import { getDb } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications - Dynamically fetch & sync alerts from database
router.get('/', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const todayStr = new Date().toISOString().split('T')[0];
        const day7Str = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        const day90Str = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

        // 1. Check Low Stock Items
        const lowStockRes = await db.query(
            `SELECT m.id, m.name, m.reorder_level, COALESCE(SUM(b.quantity), 0)::INT as current_stock
             FROM medicines m
             LEFT JOIN medicine_batches b ON m.id = b.medicine_id AND b.is_active = TRUE
             WHERE m.is_active = TRUE
             GROUP BY m.id, m.name, m.reorder_level
             HAVING COALESCE(SUM(b.quantity), 0) <= m.reorder_level`
        );

        // 2. Check Expired & Expiring Batches
        const expiryRes = await db.query(
            `SELECT b.id as batch_id, b.batch_number, b.expiry_date, b.quantity, m.id as medicine_id, m.name as medicine_name
             FROM medicine_batches b
             JOIN medicines m ON b.medicine_id = m.id
             WHERE b.is_active = TRUE AND m.is_active = TRUE AND b.quantity > 0 AND b.expiry_date <= $1
             ORDER BY b.expiry_date ASC`,
            [day90Str]
        );

        const dynamicNotifications = [];

        // Map Low Stock
        for (const item of lowStockRes.rows) {
            dynamicNotifications.push({
                id: `ls-${item.id}`,
                type: 'LOW_STOCK',
                severity: 'warning',
                title: '⚠️ Low Stock Alert',
                message: `${item.name}: Current stock (${item.current_stock}) is below reorder level (${item.reorder_level}).`,
                medicine_id: item.id,
                created_at: new Date().toISOString()
            });
        }

        // Map Expiry Tiers
        for (const b of expiryRes.rows) {
            const expDate = new Date(b.expiry_date);
            const today = new Date();
            const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

            const expDateStr = (b.expiry_date instanceof Date ? b.expiry_date.toISOString() : String(b.expiry_date)).split('T')[0];

            if (daysLeft < 0) {
                dynamicNotifications.push({
                    id: `exp-red-${b.batch_id}`,
                    type: 'EXPIRED',
                    severity: 'critical',
                    title: '🔴 Medicine Batch Expired',
                    message: `${b.medicine_name} (Batch: ${b.batch_number}) expired on ${expDateStr} (${Math.abs(daysLeft)} days ago). Qty: ${b.quantity}`,
                    medicine_id: b.medicine_id,
                    created_at: new Date().toISOString()
                });
            } else if (daysLeft <= 7) {
                dynamicNotifications.push({
                    id: `exp-orange-${b.batch_id}`,
                    type: 'EXPIRING_SOON',
                    severity: 'high',
                    title: '🟠 Expiring within 7 Days',
                    message: `${b.medicine_name} (Batch: ${b.batch_number}) expires in ${daysLeft} days (${expDateStr}). Qty: ${b.quantity}`,
                    medicine_id: b.medicine_id,
                    created_at: new Date().toISOString()
                });
            } else if (daysLeft <= 90) {
                dynamicNotifications.push({
                    id: `exp-yellow-${b.batch_id}`,
                    type: 'EXPIRING_90_DAYS',
                    severity: 'moderate',
                    title: '🟡 Expiring within 90 Days',
                    message: `${b.medicine_name} (Batch: ${b.batch_number}) expires in ${daysLeft} days (${expDateStr}). Qty: ${b.quantity}`,
                    medicine_id: b.medicine_id,
                    created_at: new Date().toISOString()
                });
            }
        }

        // Also fetch stored database notifications
        const dbNotifRes = await db.query(
            `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`
        );

        res.json({
            alertsCount: dynamicNotifications.length,
            dynamicAlerts: dynamicNotifications,
            history: dbNotifRes.rows
        });
    } catch (error) {
        console.error('❌ Error generating notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications.', details: error.message });
    }
});

export default router;
