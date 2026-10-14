import express from 'express';
import { getDb, withTransaction } from '../db/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

const router = express.Router();

// GET /api/medicines - List with Search, Filter & Aggregated Batch Stats
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search, category, brand, stockStatus, expiryStatus, supplierId, sortBy = 'name', sortOrder = 'ASC' } = req.query;
        const db = await getDb();

        let query = `
            SELECT 
                m.id,
                m.name,
                m.generic_name,
                m.brand,
                m.category,
                m.description,
                m.image_url,
                m.barcode,
                m.reorder_level,
                m.unit,
                m.is_active,
                m.created_at,
                m.updated_at,
                COALESCE(SUM(b.quantity), 0)::INT AS current_stock,
                MIN(b.selling_price)::NUMERIC AS min_selling_price,
                MAX(b.selling_price)::NUMERIC AS max_selling_price,
                MIN(b.purchase_price)::NUMERIC AS min_purchase_price,
                MIN(b.expiry_date) AS earliest_expiry,
                COUNT(b.id)::INT AS total_batches
            FROM medicines m
            LEFT JOIN medicine_batches b ON m.id = b.medicine_id AND b.is_active = TRUE
            WHERE m.is_active = TRUE
        `;

        const params = [];

        if (search) {
            params.push(`%${search.trim()}%`);
            query += ` AND (m.name ILIKE $${params.length} OR m.generic_name ILIKE $${params.length} OR m.brand ILIKE $${params.length} OR m.barcode ILIKE $${params.length} OR b.batch_number ILIKE $${params.length})`;
        }

        if (category) {
            params.push(category);
            query += ` AND m.category = $${params.length}`;
        }

        if (brand) {
            params.push(brand);
            query += ` AND m.brand = $${params.length}`;
        }

        if (supplierId) {
            params.push(parseInt(supplierId));
            query += ` AND b.supplier_id = $${params.length}`;
        }

        query += ` GROUP BY m.id`;

        // Apply Stock Status filter having total_stock
        if (stockStatus === 'LOW_STOCK') {
            query += ` HAVING COALESCE(SUM(b.quantity), 0) <= m.reorder_level`;
        } else if (stockStatus === 'OUT_OF_STOCK') {
            query += ` HAVING COALESCE(SUM(b.quantity), 0) = 0`;
        } else if (stockStatus === 'IN_STOCK') {
            query += ` HAVING COALESCE(SUM(b.quantity), 0) > m.reorder_level`;
        }

        // Apply Expiry Status filter
        const todayStr = new Date().toISOString().split('T')[0];
        const day7Str = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        const day90Str = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

        if (expiryStatus === 'EXPIRED') {
            query += ` HAVING MIN(b.expiry_date) < '${todayStr}'`;
        } else if (expiryStatus === 'EXPIRING_SOON') {
            query += ` HAVING MIN(b.expiry_date) >= '${todayStr}' AND MIN(b.expiry_date) <= '${day7Str}'`;
        } else if (expiryStatus === 'EXPIRING_90_DAYS') {
            query += ` HAVING MIN(b.expiry_date) >= '${todayStr}' AND MIN(b.expiry_date) <= '${day90Str}'`;
        }

        // Sorting
        const validSortFields = {
            name: 'm.name',
            stock: 'current_stock',
            price: 'min_selling_price',
            expiry: 'earliest_expiry',
            created: 'm.created_at'
        };

        const sortField = validSortFields[sortBy] || 'm.name';
        const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        query += ` ORDER BY ${sortField} ${direction}`;

        const result = await db.query(query, params);
        res.json({ medicines: result.rows });
    } catch (error) {
        console.error('❌ Error fetching medicines:', error);
        res.status(500).json({ error: 'Failed to fetch medicines.' });
    }
});

// GET /api/medicines/:id - Comprehensive Medicine Details + All Batches + Transactions History
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();

        const medRes = await db.query('SELECT * FROM medicines WHERE id = $1 AND is_active = TRUE', [id]);
        if (medRes.rows.length === 0) {
            return res.status(404).json({ error: 'Medicine not found or archived.' });
        }

        const medicine = medRes.rows[0];

        // Fetch active batches sorted by FEFO (earliest expiry first)
        const batchesRes = await db.query(
            `SELECT b.*, s.name as supplier_name, s.company as supplier_company
             FROM medicine_batches b
             LEFT JOIN suppliers s ON b.supplier_id = s.id
             WHERE b.medicine_id = $1 AND b.is_active = TRUE
             ORDER BY b.expiry_date ASC`,
            [id]
        );

        // Fetch recent stock transactions for auditability
        const txRes = await db.query(
            `SELECT t.*, u.name as user_name, b.batch_number
             FROM stock_transactions t
             LEFT JOIN users u ON t.created_by = u.id
             LEFT JOIN medicine_batches b ON t.batch_id = b.id
             WHERE t.medicine_id = $1
             ORDER BY t.created_at DESC
             LIMIT 20`,
            [id]
        );

        // Calculate total stock
        const currentStock = batchesRes.rows.reduce((sum, b) => sum + parseInt(b.quantity), 0);

        res.json({
            medicine: {
                ...medicine,
                current_stock: currentStock,
                batches: batchesRes.rows,
                stock_history: txRes.rows
            }
        });
    } catch (error) {
        console.error('❌ Error fetching medicine detail:', error);
        res.status(500).json({ error: 'Failed to fetch medicine detail.' });
    }
});

// POST /api/medicines - Add new medicine with optional initial batch
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, generic_name, brand, category, description, image_url, barcode, reorder_level, unit, initial_batch } = req.body;

        if (!name || !generic_name || !brand || !category) {
            return res.status(400).json({ error: 'Name, generic name, brand, and category are required.' });
        }

        const db = await getDb();

        const result = await withTransaction(async (trx) => {
            const medRes = await trx.query(
                `INSERT INTO medicines (name, generic_name, brand, category, description, image_url, barcode, reorder_level, unit)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [
                    name.trim(),
                    generic_name.trim(),
                    brand.trim(),
                    category.trim(),
                    description || '',
                    image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
                    barcode || `BAR-${Date.now()}`,
                    parseInt(reorder_level) || 10,
                    unit || 'Strip'
                ]
            );

            const newMed = medRes.rows[0];

            if (initial_batch && initial_batch.batch_number) {
                const batchRes = await trx.query(
                    `INSERT INTO medicine_batches (medicine_id, batch_number, purchase_price, selling_price, quantity, manufacturing_date, expiry_date, supplier_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                    [
                        newMed.id,
                        initial_batch.batch_number.trim(),
                        parseFloat(initial_batch.purchase_price) || 0,
                        parseFloat(initial_batch.selling_price) || 0,
                        parseInt(initial_batch.quantity) || 0,
                        initial_batch.manufacturing_date || null,
                        initial_batch.expiry_date,
                        initial_batch.supplier_id ? parseInt(initial_batch.supplier_id) : null
                    ]
                );

                const newBatch = batchRes.rows[0];

                if (newBatch.quantity > 0) {
                    await trx.query(
                        `INSERT INTO stock_transactions (medicine_id, batch_id, transaction_type, quantity, previous_stock, new_stock, notes, created_by)
                         VALUES ($1, $2, 'PURCHASE', $3, 0, $4, 'Initial batch creation', $5)`,
                        [newMed.id, newBatch.id, newBatch.quantity, newBatch.quantity, req.user.id]
                    );
                }
            }

            return newMed;
        });

        await logAuditEvent({
            userId: req.user.id,
            userName: req.user.name,
            action: 'CREATE_MEDICINE',
            entityType: 'MEDICINE',
            entityId: result.id,
            newData: result
        });

        res.status(201).json({ message: 'Medicine added successfully.', medicine: result });
    } catch (error) {
        console.error('❌ Error creating medicine:', error);
        res.status(500).json({ error: error.message || 'Failed to create medicine.' });
    }
});

// PUT /api/medicines/:id - Edit Medicine Details
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, generic_name, brand, category, description, image_url, barcode, reorder_level, unit } = req.body;

        const db = await getDb();
        const oldRes = await db.query('SELECT * FROM medicines WHERE id = $1', [id]);
        if (oldRes.rows.length === 0) {
            return res.status(404).json({ error: 'Medicine not found.' });
        }

        const oldData = oldRes.rows[0];

        const updateRes = await db.query(
            `UPDATE medicines 
             SET name = $1, generic_name = $2, brand = $3, category = $4, description = $5, image_url = $6, barcode = $7, reorder_level = $8, unit = $9, updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 RETURNING *`,
            [name, generic_name, brand, category, description, image_url, barcode, parseInt(reorder_level), unit, id]
        );

        const newData = updateRes.rows[0];

        await logAuditEvent({
            userId: req.user.id,
            userName: req.user.name,
            action: 'UPDATE_MEDICINE',
            entityType: 'MEDICINE',
            entityId: id,
            oldData,
            newData
        });

        res.json({ message: 'Medicine updated successfully.', medicine: newData });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update medicine.' });
    }
});

// DELETE /api/medicines/:id - Soft delete (archive: is_active = false)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();

        await db.query('UPDATE medicines SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

        await logAuditEvent({
            userId: req.user.id,
            userName: req.user.name,
            action: 'ARCHIVE_MEDICINE',
            entityType: 'MEDICINE',
            entityId: id
        });

        res.json({ message: 'Medicine archived safely. Historical transaction records preserved.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to archive medicine.' });
    }
});

export default router;
