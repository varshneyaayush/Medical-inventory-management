import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { getDb, initSchema } from './db/db.js';
import { seedDatabase } from './db/seed.js';

import authRoutes from './routes/authRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        app: 'MediVault Medical Inventory Management System',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Server Internal Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start Server and Initialize Database
async function startServer() {
    try {
        console.log('🚀 Booting MediVault Server...');
        // Initialize DB & Seed data if first boot
        await seedDatabase();

        app.listen(PORT, () => {
            console.log(`====================================================`);
            console.log(`🏥 MediVault Server running on http://localhost:${PORT}`);
            console.log(`====================================================`);
        });
    } catch (err) {
        console.error('❌ Failed to start MediVault Server:', err);
        process.exit(1);
    }
}

startServer();
