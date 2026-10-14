import express from 'express';
import { getDb, withTransaction } from '../db/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

const router = express.Router();

// POST /api/purchases - Create a purchase order from supplier
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { supplier_id, invoice_number, items, notes } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Purchase order must contain at least one item.' });
        }

        const invNum = invoice_number || `INV-PUR-${Date.now()}`;

        const purchaseRecord = await withTransaction(async (trx) => {
            let totalAmount = 0;
            const processedItems = [];

            for (const item of items) {
                const { medicine_id, batch_number, purchase_price, selling_price, quantity, manufacturing_date, expiry_date } = item;
                const qty = parseInt(quantity);
                const pPrice = parseFloat(purchase_price);
                const sPrice = parseFloat(selling_price);

                if (!qty || qty <= 0 || !pPrice || !sPrice || !expiry_date) {
                    throw new Error('Valid quantity, prices, and expiry date are required for each item.');
                }

                const subtotal = qty * pPrice;
                totalAmount += subtotal;

                // Check if batch already exists for this medicine
                const existingBatchRes = await trx.query(
                    'SELECT * FROM medicine_batches WHERE medicine_id = $1 AND batch_number = $2',
                    [medicine_id, batch_number.trim()]
                );

                let batchId;
                let previousStock = 0;

                if (existingBatchRes.rows.length > 0) {
                    // Update existing batch
                    const existingBatch = existingBatchRes.rows[0];
                    batchId = existingBatch.id;
                    previousStock = parseInt(existingBatch.quantity);
                    const newStock = previousStock + qty;

                    await trx.query(
                        `UPDATE medicine_batches 
                         SET quantity = $1, purchase_price = $2, selling_price = $3, expiry_date = $4, updated_at = CURRENT_TIMESTAMP 
                         WHERE id = $5`,
                        [newStock, pPrice, sPrice, expiry_date, batchId]
                    );

                    await trx.query(
                        `INSERT INTO stock_transactions (medicine_id, batch_id, transaction_type, quantity, previous_stock, new_stock, reference_id, notes, created_by)
                         VALUES ($1, $2, 'PURCHASE', $3, $4, $5, $6, 'Purchase replenishment', $7)`,
                        [medicine_id, batchId, qty, previousStock, newStock, invNum, req.user.id]
                    );
                } else {
                    // Create new batch
                    const newBatchRes = await trx.query(
                        `INSERT INTO medicine_batches (medicine_id, batch_number, purchase_price, selling_price, quantity, manufacturing_date, expiry_date, supplier_id)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                        [medicine_id, batch_number.trim(), pPrice, sPrice, qty, manufacturing_date || null, expiry_date, supplier_id || null]
                    );
                    batchId = newBatchRes.rows[0].id;

                    await trx.query(
                        `INSERT INTO stock_transactions (medicine_id, batch_id, transaction_type, quantity, previous_stock, new_stock, reference_id, notes, created_by)
                         VALUES ($1, $2, 'PURCHASE', $3, 0, $4, $5, 'New batch purchase import', $6)`,
                        [medicine_id, batchId, qty, qty, invNum, req.user.id]
                    );
                }

                processedItems.push({
                    medicine_id,
                    batch_id: batchId,
                    quantity: qty,
                    purchase_price: pPrice,
                    selling_price: sPrice,
                    expiry_date,
                    subtotal
                });
            }

            // Insert purchase header
            const purRes = await trx.query(
                `INSERT INTO purchases (supplier_id, invoice_number, total_amount, notes, created_by)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [supplier_id || null, invNum, totalAmount, notes || '', req.user.id]
            );

            const purchase = purRes.rows[0];

            for (const pi of processedItems) {
                await trx.query(
                    `INSERT INTO purchase_items (purchase_id, medicine_id, batch_id, quantity, purchase_price, selling_price, expiry_date, subtotal)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [purchase.id, pi.medicine_id, pi.batch_id, pi.quantity, pi.purchase_price, pi.selling_price, pi.expiry_date, pi.subtotal]
                );
            }

            return purchase;
        });

        await logAuditEvent({
            userId: req.user.id,
            userName: req.user.name,
            action: 'RECORD_PURCHASE',
            entityType: 'PURCHASE',
            entityId: purchaseRecord.id,
            newData: { invoice_number: invNum, total_amount: purchaseRecord.total_amount }
        });

        res.status(201).json({ message: 'Purchase recorded successfully.', purchase: purchaseRecord });
    } catch (error) {
        console.error('❌ Purchase processing error:', error.message);
        res.status(400).json({ error: error.message || 'Failed to record purchase.' });
    }
});

// GET /api/purchases - Purchase History List
router.get('/', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const purRes = await db.query(
            `SELECT p.*, s.name as supplier_name, s.company as supplier_company, u.name as created_by_name,
                    COUNT(pi.id)::INT AS total_items
             FROM purchases p
             LEFT JOIN suppliers s ON p.supplier_id = s.id
             LEFT JOIN users u ON p.created_by = u.id
             LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
             GROUP BY p.id, s.name, s.company, u.name
             ORDER BY p.purchase_date DESC
             LIMIT 100`
        );

        res.json({ purchases: purRes.rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch purchases history.' });
    }
});

export default router;
