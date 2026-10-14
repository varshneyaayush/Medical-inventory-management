import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let dbInstance = null;
let dbType = 'pglite';

export async function getDb() {
    if (dbInstance) return dbInstance;

    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
        try {
            console.log('🔗 Connecting to external PostgreSQL database via pg Pool...');
            const pg = await import('pg');
            const { Pool } = pg.default || pg;
            const pool = new Pool({ connectionString: databaseUrl });
            
            // Wrapper to match uniform query interface
            dbInstance = {
                query: async (text, params = []) => {
                    const res = await pool.query(text, params);
                    return { rows: res.rows, rowCount: res.rowCount };
                },
                exec: async (sqlText) => {
                    return await pool.query(sqlText);
                },
                type: 'pg_pool'
            };
            dbType = 'pg_pool';
            console.log('✅ Connected to PostgreSQL via pg Pool.');
            return dbInstance;
        } catch (err) {
            console.warn('⚠️ Could not connect to external PostgreSQL, falling back to embedded PGlite persistent DB:', err.message);
        }
    }

    // Fallback or default: Embedded PGlite disk database
    console.log('📦 Initializing embedded persistent PostgreSQL (PGlite)...');
    const dbDir = path.resolve(process.cwd(), 'data', 'postgres_db');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const { PGlite } = await import('@electric-sql/pglite');
    const pglite = new PGlite(dbDir);

    dbInstance = {
        query: async (text, params = []) => {
            const res = await pglite.query(text, params);
            return { rows: res.rows, rowCount: res.affectedRows || res.rows.length };
        },
        exec: async (sqlText) => {
            return await pglite.exec(sqlText);
        },
        type: 'pglite'
    };
    dbType = 'pglite';
    console.log(`✅ Embedded PostgreSQL (PGlite) active with persistent data storage at: ${dbDir}`);
    return dbInstance;
}

/**
 * Execute queries in a database transaction block
 */
export async function withTransaction(callback) {
    const db = await getDb();
    await db.query('BEGIN');
    try {
        const result = await callback(db);
        await db.query('COMMIT');
        return result;
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('❌ Transaction rolled back due to error:', error);
        throw error;
    }
}

/**
 * Utility helper to execute SQL file (like schema.sql)
 */
export async function initSchema(schemaPath) {
    const db = await getDb();
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await db.exec(sql);
}

export function getDbType() {
    return dbType;
}
