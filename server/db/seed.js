import path from 'path';
import bcrypt from 'bcryptjs';
import { getDb, initSchema } from './db.js';

export async function seedDatabase() {
    console.log('🌱 Starting MediVault Database Initialization & Seeding...');
    const db = await getDb();

    // 1. Initialize schema
    const schemaPath = path.resolve(process.cwd(), 'server', 'db', 'schema.sql');
    await initSchema(schemaPath);
    console.log('✅ Schema initialized successfully.');

    // Check if seeding is already done
    const userCheck = await db.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(userCheck.rows[0].count) > 0) {
        console.log('ℹ️ Database already contains data. Skipping re-seed.');
        return;
    }

    // 2. Create Default Users (Admin & Staff)
    const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
    const staffPasswordHash = await bcrypt.hash('Staff@123456', 10);

    const adminUser = await db.query(
        `INSERT INTO users (name, email, phone, password_hash, role) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['Admin Aayush', 'admin@medivault.com', '+91 98765 43210', adminPasswordHash, 'ADMIN']
    );
    const staffUser = await db.query(
        `INSERT INTO users (name, email, phone, password_hash, role) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['Priya Sharma', 'staff@medivault.com', '+91 98123 45678', staffPasswordHash, 'STAFF']
    );

    const adminId = adminUser.rows[0].id;
    const staffId = staffUser.rows[0].id;
    console.log('👤 Created Admin and Staff accounts.');

    // 3. Create Suppliers
    const supplierData = [
        ['Cipla Distributors Ltd.', 'Cipla Ltd.', '+91 22 2482 6000', 'orders@cipladist.com', '101 Pharma City, Mumbai, MH', '27AAACC1234H1Z1'],
        ['Sun Pharma Wholesale', 'Sun Pharmaceuticals', '+91 22 4324 4324', 'supply@sunpharma.com', '502 Healthcare Park, Vadodara, GJ', '24AAACS5678J1Z5'],
        ['Lupin Medical Supply', 'Lupin Limited', '+91 22 6640 2222', 'dist@lupinmed.com', '88 Bio Tech Zone, Pune, MH', '27AAACL9012K1Z9']
    ];

    const supplierIds = [];
    for (const sup of supplierData) {
        const res = await db.query(
            `INSERT INTO suppliers (name, company, phone, email, address, gst_number) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            sup
        );
        supplierIds.push(res.rows[0].id);
    }
    console.log(`🏢 Created ${supplierIds.length} suppliers.`);

    // 4. Create Medicines & Batches
    const today = new Date();
    const addDays = (d, days) => {
        const result = new Date(d);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0];
    };

    const medicinesList = [
        {
            name: 'Paracetamol 500mg',
            generic_name: 'Paracetamol / Acetaminophen',
            brand: 'Calpol',
            category: 'Analgesics & Antipyretics',
            description: 'Fast-acting fever and mild to moderate pain relief tablet.',
            image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
            barcode: '890123400001',
            reorder_level: 50,
            unit: 'Strip of 15',
            batches: [
                { batch_number: 'B24-PAR-01', purchase_price: 18.00, selling_price: 32.50, quantity: 120, mfg: addDays(today, -180), exp: addDays(today, 450), supplier_id: supplierIds[0] },
                { batch_number: 'B24-PAR-02', purchase_price: 19.50, selling_price: 34.00, quantity: 45, mfg: addDays(today, -90), exp: addDays(today, 5), supplier_id: supplierIds[0] } // Expiring soon (5 days)
            ]
        },
        {
            name: 'Amoxicillin 500mg Capsules',
            generic_name: 'Amoxicillin Trihydrate',
            brand: 'Mox 500',
            category: 'Antibiotics',
            description: 'Broad-spectrum penicillin antibiotic for bacterial infections.',
            image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
            barcode: '890123400002',
            reorder_level: 30,
            unit: 'Strip of 10',
            batches: [
                { batch_number: 'AMX-2024-A', purchase_price: 65.00, selling_price: 110.00, quantity: 80, mfg: addDays(today, -120), exp: addDays(today, 365), supplier_id: supplierIds[1] },
                { batch_number: 'AMX-2024-B', purchase_price: 68.00, selling_price: 115.00, quantity: 15, mfg: addDays(today, -400), exp: addDays(today, -10), supplier_id: supplierIds[1] } // Expired (10 days ago)
            ]
        },
        {
            name: 'Azithromycin 250mg Tablets',
            generic_name: 'Azithromycin Dihydrate',
            brand: 'Azee 250',
            category: 'Antibiotics',
            description: 'Macrolide antibiotic for respiratory tract and skin infections.',
            image_url: 'https://images.unsplash.com/photo-1550572017-edf7b47b4d13?w=600&auto=format&fit=crop&q=80',
            barcode: '890123400003',
            reorder_level: 25,
            unit: 'Strip of 6',
            batches: [
                { batch_number: 'AZT-9981', purchase_price: 72.00, selling_price: 125.00, quantity: 60, mfg: addDays(today, -150), exp: addDays(today, 280), supplier_id: supplierIds[2] }
            ]
        },
        {
            name: 'Cetirizine 10mg Tablets',
            generic_name: 'Cetirizine Hydrochloride',
            brand: 'Cetzine',
            category: 'Antihistamines',
            description: 'Non-drowsy allergy and rhinitis relief tablet.',
            image_url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=600&auto=format&fit=crop&q=80',
            barcode: '890123400004',
            reorder_level: 40,
            unit: 'Strip of 10',
            batches: [
                { batch_number: 'CTZ-2024-01', purchase_price: 12.00, selling_price: 24.00, quantity: 8, mfg: addDays(today, -200), exp: addDays(today, 60), supplier_id: supplierIds[0] } // Low stock (8 <= 40) & Expiring in 60 days
            ]
        },
        {
            name: 'Pantoprazole 40mg Gastro-Resistant',
            generic_name: 'Pantoprazole Sodium',
            brand: 'Pan 40',
            category: 'Gastroenterology',
            description: 'Proton pump inhibitor for hyperacidity, GERD, and peptic ulcers.',
            image_url: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&auto=format&fit=crop&q=80',
            barcode: '890123400005',
            reorder_level: 50,
            unit: 'Strip of 15',
            batches: [
                { batch_number: 'PAN-8812', purchase_price: 85.00, selling_price: 145.00, quantity: 140, mfg: addDays(today, -60), exp: addDays(today, 540), supplier_id: supplierIds[1] },
                { batch_number: 'PAN-8813', purchase_price: 88.00, selling_price: 148.00, quantity: 90, mfg: addDays(today, -30), exp: addDays(today, 600), supplier_id: supplierIds[1] }
            ]
        },
        {
            name: 'Omeprazole 20mg Capsules',
            generic_name: 'Omeprazole',
            brand: 'Omez 20',
            category: 'Gastroenterology',
            description: 'Relieves heartburn, acid reflux, and stomach acid disorders.',
            image_url: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=600&auto=format&fit=crop&q=80',
            barcode: '890123400006',
            reorder_level: 35,
            unit: 'Strip of 15',
            batches: [
                { batch_number: 'OMZ-5501', purchase_price: 40.00, selling_price: 75.00, quantity: 110, mfg: addDays(today, -100), exp: addDays(today, 400), supplier_id: supplierIds[2] }
            ]
        },
        {
            name: 'Ibuprofen 400mg Tablets',
            generic_name: 'Ibuprofen',
            brand: 'Brufen 400',
            category: 'NSAIDs & Anti-inflammatory',
            description: 'Effective relief for joint pain, toothache, and musculoskeletal inflammation.',
            image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
            barcode: '890123400007',
            reorder_level: 40,
            unit: 'Strip of 15',
            batches: [
                { batch_number: 'BRU-1044', purchase_price: 15.00, selling_price: 28.00, quantity: 180, mfg: addDays(today, -90), exp: addDays(today, 500), supplier_id: supplierIds[0] }
            ]
        },
        {
            name: 'ORS Electrolyte Hydration Powder',
            generic_name: 'Oral Rehydration Salts',
            brand: 'Electral',
            category: 'Nutrition & Rehydration',
            description: 'WHO recommended formula for restoring fluid and electrolyte balance.',
            image_url: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=600&auto=format&fit=crop&q=80',
            barcode: '890123400008',
            reorder_level: 50,
            unit: 'Sachet 21.8g',
            batches: [
                { batch_number: 'ORS-2024-X', purchase_price: 11.00, selling_price: 21.50, quantity: 250, mfg: addDays(today, -40), exp: addDays(today, 700), supplier_id: supplierIds[1] }
            ]
        },
        {
            name: 'Vitamin B-Complex with Zinc Capsules',
            generic_name: 'B-Complex Vitamins + Zinc',
            brand: 'Becosules Z',
            category: 'Vitamins & Minerals',
            description: 'Essential daily multivitamin supplement for immune support and stamina.',
            image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
            barcode: '890123400009',
            reorder_level: 20,
            unit: 'Strip of 20',
            batches: [
                { batch_number: 'BEC-9011', purchase_price: 32.00, selling_price: 54.00, quantity: 95, mfg: addDays(today, -110), exp: addDays(today, 320), supplier_id: supplierIds[2] }
            ]
        },
        {
            name: 'Cough Syrup DX 100ml',
            generic_name: 'Dextromethorphan HBr + Chlorpheniramine',
            brand: 'Benadryl DX',
            category: 'Respiratory Care',
            description: 'Relieves dry coughing, throat irritation, and bronchial discomfort.',
            image_url: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&auto=format&fit=crop&q=80',
            barcode: '890123400010',
            reorder_level: 15,
            unit: 'Bottle 100ml',
            batches: [
                { batch_number: 'BND-C10', purchase_price: 70.00, selling_price: 120.00, quantity: 5, mfg: addDays(today, -250), exp: addDays(today, 25), supplier_id: supplierIds[0] } // Low stock (5 <= 15) & Expiring in 25 days
            ]
        }
    ];

    for (const med of medicinesList) {
        const medRes = await db.query(
            `INSERT INTO medicines (name, generic_name, brand, category, description, image_url, barcode, reorder_level, unit) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [med.name, med.generic_name, med.brand, med.category, med.description, med.image_url, med.barcode, med.reorder_level, med.unit]
        );
        const medId = medRes.rows[0].id;

        for (const batch of med.batches) {
            const batchRes = await db.query(
                `INSERT INTO medicine_batches (medicine_id, batch_number, purchase_price, selling_price, quantity, manufacturing_date, expiry_date, supplier_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [medId, batch.batch_number, batch.purchase_price, batch.selling_price, batch.quantity, batch.mfg, batch.exp, batch.supplier_id]
            );
            const batchId = batchRes.rows[0].id;

            // Log initial stock transaction
            await db.query(
                `INSERT INTO stock_transactions (medicine_id, batch_id, transaction_type, quantity, previous_stock, new_stock, notes, created_by)
                 VALUES ($1, $2, 'PURCHASE', $3, 0, $4, 'Initial stock import', $5)`,
                [medId, batchId, batch.quantity, batch.quantity, adminId]
            );
        }
    }
    console.log(`💊 Created ${medicinesList.length} medicines and corresponding batches.`);

    // 5. Create Sample Historical Purchases
    const purchaseRes = await db.query(
        `INSERT INTO purchases (supplier_id, invoice_number, purchase_date, total_amount, notes, created_by)
         VALUES ($1, 'INV-PUR-2026-001', CURRENT_TIMESTAMP - INTERVAL '5 days', 15450.00, 'Monthly replenishment order', $2) RETURNING id`,
        [supplierIds[0], adminId]
    );

    // 6. Create Sample Historical Sales
    const saleRes1 = await db.query(
        `INSERT INTO sales (invoice_number, sale_date, customer_name, customer_phone, total_amount, payment_method, created_by)
         VALUES ('INV-SL-2026-101', CURRENT_TIMESTAMP - INTERVAL '2 days', 'Ramesh Kumar', '+91 98989 12345', 345.00, 'UPI', $1) RETURNING id`,
        [staffId]
    );
    const saleRes2 = await db.query(
        `INSERT INTO sales (invoice_number, sale_date, customer_name, customer_phone, total_amount, payment_method, created_by)
         VALUES ('INV-SL-2026-102', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Anita Desai', '+91 97777 65432', 890.00, 'CARD', $1) RETURNING id`,
        [adminId]
    );

    // 7. Generate Initial Notifications
    // Expired notification
    await db.query(
        `INSERT INTO notifications (type, title, message, medicine_id)
         VALUES ('EXPIRED', '🔴 Medicine Batch Expired', 'Amoxicillin 500mg (Batch: AMX-2024-B) expired on ${addDays(today, -10)}. Dispose safely.', 2)`
    );
    // Expiring soon notification
    await db.query(
        `INSERT INTO notifications (type, title, message, medicine_id)
         VALUES ('EXPIRING_SOON', '🟠 Batch Expiring Soon', 'Paracetamol 500mg (Batch: B24-PAR-02) expires in 5 days (${addDays(today, 5)}).', 1)`
    );
    // Low stock notification
    await db.query(
        `INSERT INTO notifications (type, title, message, medicine_id)
         VALUES ('LOW_STOCK', '⚠️ Low Stock Alert', 'Cetirizine 10mg current stock (8) is below the reorder level (40).', 4)`
    );

    // 8. Create Security Audit Logs
    await db.query(
        `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, old_data, new_data)
         VALUES ($1, 'Admin Aayush', 'INITIAL_SYSTEM_SEED', 'SYSTEM', 1, NULL, 'System seeded with standard medicine database and RBAC accounts.')`,
        [adminId]
    );

    console.log('🎉 MediVault database successfully populated with rich demo client data!');
}

// Execute if run directly
if (process.argv[1].includes('seed.js')) {
    seedDatabase().then(() => {
        process.exit(0);
    }).catch(err => {
        console.error('❌ Error seeding database:', err);
        process.exit(1);
    });
}
