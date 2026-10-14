import express from 'express';
import { getDb, withTransaction } from '../db/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

const router = express.Router();

// POST /api/medicines/:id/batches - Add a new batch to a medicine
router.post('/medicine/:medicineId', authenticateToken, async (req, res) => {
    try {
        const { medicineId } = req.params;
        const { batch_number, purchase_price, selling_price, quantity, manufacturing_date, expiry_date, supplier_id } = req.body;

        if (!batch_number || !purchase_price || !selling_price || !expiry_date) {
            return res.status(400).json({ error: 'Batch number, prices, and expiry date are required.' });
        }

        const result = await withTransaction(async (trx) => {
            const batchRes = await trx.query(
                `INSERT INTO medicine_batches (medicine_id, batch_number, purchase_price, selling_price, quantity, manufacturing_date, expiry_date, supplier_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [
                    medicineId,
                    batch_number.trim(),
                    parseFloat(purchase_price),
                    parseFloat(selling_price),
                    parseInt(quantity) || 0,
                    manufacturing_date || null,
                    expiry_date,
                    supplier_id ? parseInt(supplier_id) : null
                ]
            );

            const newBatch = batchRes.rows[0];

            if (newBatch.quantity > 0) {
                await trx.query(
                    `INSERT INTO stock_transactions (medicine_id, batch_id, transaction_type, quantity, previous_stock, new_stock, notes, created_by)
                     VALUES ($1, $2, 'PURCHASE', $3, 0, $4, 'Batch created with initial stock', $5)`,
                    [medicineId, newBatch.id, newBatch.quantity, newBatch.quantity, req.user.id]
                );
            }

            return newBatch;
        });

        await logAuditEvent({
            userId: req.user.id,
            userName: req.user.name,
            action: 'ADD_BATCH',
            entityType: 'MEDICINE_BATCH',
            entityId: result.id,
            newData: result
        });

        res.status(201).json({ message: 'Batch added successfully.', batch: result });
    } catch (error) {
        console.error('❌ Error adding batch:', error);
        res.status(500).json({ error: error.message || 'Failed to add batch.' });
    }
});

// POST /api/batches/:id/adjust - Stock Adjustment (Increase or Decrease inside DB transaction)
router.post('/:id/adjust', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { adjustment_type, quantity, reason } = req.body; // type: 'ADD' or 'SUBTRACT' or 'EXPIRY' or 'DAMAGE'

        const qty = parseInt(quantity);
        if (!qty || qty <= 0) {
            return res.status(400).json({ error: 'Valid adjustment quantity is required.' });
        }

        const result = await withTransaction(async (trx) => {
            const batchRes = await trx.query('SELECT * FROM medicine_batches WHERE id = $1 AND is_active = TRUE', [id]);
            if (batchRes.rows.length === 0) {
                throw new Error('Batch not found.');
            }

            const batch = batchRes.rows[0];
            const previousStock = parseInt(batch.quantity);
            let newStock = previousStock;
            let txType = 'ADJUSTMENT';

            if (adjustment_type === 'ADD') {
                newStock = previousStock + qty;
                txType = 'PURCHASE';
            } else if (adjustment_type === 'SUBTRACT') {
                if (previousStock < qty) {
                    throw new Error(`Insufficient stock. Current batch stock is ${previousStock}.`);
                }
                newStock = previousStock - qty;
                txType = 'ADJUSTMENT';
            } else if (adjustment_type === 'EXPIRY') {
                if (previousStock < qty) {
                    throw new Error(`Insufficient stock for expiry write-off.`);
                }
                newStock = previousStock - qty;
                txType = 'EXPIRY';
            } else if (adjustment_type === 'DAMAGE') {
                if (previousStock < qty) {
                    throw new Error(`Insufficient stock for damage write-off.`);
                }
                newStock = previousStock - qty;
                txType = 'DAMAGE';
            } else {
                throw new Error('Invalid adjustment type.');
            }

            // Update batch stock
            await trx.query('UPDATE medicine_batches SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStock, id]);

            // Log stock transaction
            await trx.query(
                `INSERT INTO stock_transactions (medicine_id, batch_id, transaction_type, quantity, previous_stock, new_stock, notes, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [batch.medicine_id, id, txType, qty, previousStock, newStock, reason || `Manual stock adjustment (${adjustment_type})`, req.user.id]
            );

            return { previousStock, newStock, batch_id: id };
        });

        await logAuditEvent({
            userId: req.user.id,
            userName: req.user.name,
            action: 'STOCK_ADJUSTMENT',
            entityType: 'MEDICINE_BATCH',
            entityId: id,
            newData: { adjustment_type, quantity: qty, reason, ...result }
        });

        res.json({ message: 'Stock adjusted successfully.', data: result });
    } catch (error) {
        console.error('❌ Stock adjustment error:', error.message);
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/batches/:id - Update batch pricing or expiry
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { purchase_price, selling_price, expiry_date } = req.body;

        const db = await getDb();
        const batchRes = await db.query('SELECT * FROM medicine_batches WHERE id = $1', [id]);
        if (batchRes.rows.length === 0) {
            return res.status(404).json({ error: 'Batch not found.' });
        }

        const oldBatch = batchRes.rows[0];

        const updateRes = await db.query(
            `UPDATE medicine_batches
             SET purchase_price = $1, selling_price = $2, expiry_date = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 RETURNING *`,
            [parseFloat(purchase_price), parseFloat(selling_price), expiry_date, id]
        );

        await logAuditEvent({
            userId: req.user.id,
            userName: req.user.name,
            action: 'UPDATE_BATCH_DETAILS',
            entityType: 'MEDICINE_BATCH',
            entityId: id,
            oldData: oldBatch,
            newData: updateRes.rows[0]
        });

        res.json({ message: 'Batch updated successfully.', batch: updateRes.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update batch.' });
    }
});

export default router;
