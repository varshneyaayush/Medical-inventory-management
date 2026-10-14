import express from 'express';
import { getDb } from '../db/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/audit.js';

const router = express.Router();

// GET /api/suppliers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const supRes = await db.query(
            `SELECT s.*, 
                    COUNT(DISTINCT b.id)::INT AS total_batches_supplied,
                    COUNT(DISTINCT p.id)::INT AS total_purchase_orders
             FROM suppliers s
             LEFT JOIN medicine_batches b ON s.id = b.supplier_id AND b.is_active = TRUE
             LEFT JOIN purchases p ON s.id = p.supplier_id
             WHERE s.is_active = TRUE
             GROUP BY s.id
             ORDER BY s.name ASC`
        );
        res.json({ suppliers: supRes.rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch suppliers.' });
    }
});

// POST /api/suppliers
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, company, phone, email, address, gst_number } = req.body;
        if (!name || !company || !phone) {
            return res.status(400).json({ error: 'Name, company, and phone are required.' });
        }

        const db = await getDb();
        const insertRes = await db.query(
            `INSERT INTO suppliers (name, company, phone, email, address, gst_number)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name.trim(), company.trim(), phone.trim(), email || '', address || '', gst_number || '']
        );

        const newSupplier = insertRes.rows[0];

        await logAuditEvent({
            userId: req.user.id,
            userName: req.user.name,
            action: 'CREATE_SUPPLIER',
            entityType: 'SUPPLIER',
            entityId: newSupplier.id,
            newData: newSupplier
        });

        res.status(201).json({ message: 'Supplier created successfully.', supplier: newSupplier });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create supplier.' });
    }
});

// PUT /api/suppliers/:id
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, company, phone, email, address, gst_number } = req.body;

        const db = await getDb();
        const updateRes = await db.query(
            `UPDATE suppliers
             SET name = $1, company = $2, phone = $3, email = $4, address = $5, gst_number = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7 RETURNING *`,
            [name, company, phone, email, address, gst_number, id]
        );

        res.json({ message: 'Supplier updated successfully.', supplier: updateRes.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update supplier.' });
    }
});

// DELETE /api/suppliers/:id - Soft archive
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();
        await db.query('UPDATE suppliers SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
        res.json({ message: 'Supplier archived safely.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to archive supplier.' });
    }
});

export default router;
