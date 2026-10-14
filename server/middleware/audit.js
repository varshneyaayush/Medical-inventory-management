import { getDb } from '../db/db.js';

export async function logAuditEvent({ userId, userName, action, entityType, entityId, oldData = null, newData = null }) {
    try {
        const db = await getDb();
        await db.query(
            `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, old_data, new_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                userId || null,
                userName || 'System',
                action,
                entityType,
                entityId || null,
                oldData ? JSON.stringify(oldData) : null,
                newData ? JSON.stringify(newData) : null
            ]
        );
    } catch (err) {
        console.error('❌ Error creating audit log:', err.message);
    }
}
