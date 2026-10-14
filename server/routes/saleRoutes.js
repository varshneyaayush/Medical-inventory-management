import express from 'express';
import { getDb, withTransaction } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

const router = express.Router();

// POST /api/sales - Process sale with FEFO (First Expiry First Out) stock deduction
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { items, customer_name, customer_phone, payment_method = 'CASH' } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'At least one medicine item is required to complete a sale.' });
        }

        const invoiceNumber = `INV-SL-${Date.now()}`;

        const saleRecord = await withTransaction(async (trx) => {
            let totalAmount = 0;
            const processedItems = [];

            // 1. Validate & process each item
            for (const item of items) {
                const { medicine_id, quantity } = item;
                const requestedQty = parseInt(quantity);

                if (!requestedQty || requestedQty <= 0) {
                    throw new Error(`Invalid quantity for medicine ID ${medicine_id}`);
                }

                // Check medicine exists
                const medRes = await trx.query('SELECT name FROM medicines WHERE id = $1 AND is_active = TRUE', [medicine_id]);
                if (medRes.rows.length === 0) {
                    throw new Error(`Medicine ID ${medicine_id} not found.`);
                }
                const medName = medRes.rows[0].name;

                // Fetch batches sorted by FEFO (earliest expiry first with quantity > 0)
                const batchRes = await trx.query(
                    `SELECT * FROM medicine_batches 
                     WHERE medicine_id = $1 AND is_active = TRUE AND quantity > 0
                     ORDER BY expiry_date ASC`,
                    [medicine_id]
                );

                const batches = batchRes.rows;
                const totalStockAvailable = batches.reduce((sum, b) => sum + parseInt(b.quantity), 0);

                if (totalStockAvailable < requestedQty) {
                    throw new Error(`Insufficient stock for "${medName}". Requested: ${requestedQty}, Available: ${totalStockAvailable}`);
                }

                // FEFO Deduction Loop
                let remainingToDeduct = requestedQty;

                for (const batch of batches) {
                    if (remainingToDeduct <= 0) break;

                    const batchQty = parseInt(batch.quantity);
                    const deductAmount = Math.min(batchQty, remainingToDeduct);
                    const newBatchQty = batchQty - deductAmount;
                    const itemSubtotal = deductAmount * parseFloat(batch.selling_price);

                    totalAmount += itemSubtotal;
                    remainingToDeduct -= deductAmount;

                    // Update batch stock
                    await trx.query(
                        'UPDATE medicine_batches SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                        [newBatchQty, batch.id]
                    );

                    // Record stock transaction audit
                    await trx.query(
                        `INSERT INTO stock_transactions (medicine_id, batch_id, transaction_type, quantity, previous_stock, new_stock, reference_id, notes, created_by)
                         VALUES ($1, $2, 'SALE', $3, $4, $5, $6, $7, $8)`,
                        [
                            medicine_id,
                            batch.id,
                            deductAmount,
                            batchQty,
                            newBatchQty,
                            invoiceNumber,
                            `Sale to ${customer_name || 'Walk-in Customer'}`,
                            req.user.id
                        ]
                    );

                    processedItems.push({
                        medicine_id,
                        batch_id: batch.id,
                        quantity: deductAmount,
                        selling_price: parseFloat(batch.selling_price),
                        subtotal: itemSubtotal
                    });
                }
            }

            // 2. Insert main sale invoice
            const saleRes = await trx.query(
                `INSERT INTO sales (invoice_number, customer_name, customer_phone, total_amount, payment_method, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [
                    invoiceNumber,
                    customer_name || 'Walk-in Customer',
                    customer_phone || null,
                    totalAmount,
                    payment_method,
                    req.user.id
                ]
            );

            const sale = saleRes.rows[0];

            // 3. Insert sale_items
            for (const pi of processedItems) {
                await trx.query(
                    `INSERT INTO sale_items (sale_id, medicine_id, batch_id, quantity, selling_price, subtotal)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [sale.id, pi.medicine_id, pi.batch_id, pi.quantity, pi.selling_price, pi.subtotal]
                );
            }

            return { ...sale, items: processedItems };
        });

        await logAuditEvent({
            userId: req.user.id,
            userName: req.user.name,
            action: 'RECORD_SALE',
            entityType: 'SALE',
            entityId: saleRecord.id,
            newData: { invoice_number: invoiceNumber, total_amount: saleRecord.total_amount, customer: customer_name }
        });

        res.status(201).json({ message: 'Sale completed successfully.', sale: saleRecord });
    } catch (error) {
        console.error('❌ Sale transaction failed:', error.message);
        res.status(400).json({ error: error.message || 'Transaction failed.' });
    }
});

// GET /api/sales - Sales History List
router.get('/', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const salesRes = await db.query(
            `SELECT s.*, u.name as cashier_name,
                    COUNT(si.id)::INT AS total_items
             FROM sales s
             LEFT JOIN users u ON s.created_by = u.id
             LEFT JOIN sale_items si ON s.id = si.sale_id
             GROUP BY s.id, u.name
             ORDER BY s.sale_date DESC
             LIMIT 100`
        );

        res.json({ sales: salesRes.rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sales history.' });
    }
});

// GET /api/sales/:id - Invoice Details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();

        const saleRes = await db.query(
            `SELECT s.*, u.name as cashier_name
             FROM sales s
             LEFT JOIN users u ON s.created_by = u.id
             WHERE s.id = $1`,
            [id]
        );

        if (saleRes.rows.length === 0) {
            return res.status(404).json({ error: 'Sale invoice not found.' });
        }

        const itemsRes = await db.query(
            `SELECT si.*, m.name as medicine_name, m.generic_name, m.brand, b.batch_number, b.expiry_date
             FROM sale_items si
             JOIN medicines m ON si.medicine_id = m.id
             LEFT JOIN medicine_batches b ON si.batch_id = b.id
             WHERE si.sale_id = $1`,
            [id]
        );

        res.json({ sale: saleRes.rows[0], items: itemsRes.rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sale details.' });
    }
});

export default router;
