-- PostgreSQL Database Schema for MediVault Medical Inventory & Pharmacy Management System

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'STAFF')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ
);

-- 2. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. MEDICINES TABLE
CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    barcode VARCHAR(100) UNIQUE,
    reorder_level INT NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
    unit VARCHAR(50) NOT NULL DEFAULT 'Strip',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. MEDICINE_BATCHES TABLE
CREATE TABLE IF NOT EXISTS medicine_batches (
    id SERIAL PRIMARY KEY,
    medicine_id INT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    purchase_price NUMERIC(10, 2) NOT NULL CHECK (purchase_price >= 0),
    selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0),
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (medicine_id, batch_number)
);

-- 5. PURCHASES TABLE
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    purchase_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    notes TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. PURCHASE_ITEMS TABLE
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    medicine_id INT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    batch_id INT REFERENCES medicine_batches(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    purchase_price NUMERIC(10, 2) NOT NULL CHECK (purchase_price >= 0),
    selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0),
    expiry_date DATE NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 7. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    sale_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    customer_name VARCHAR(255) DEFAULT 'Walk-in Customer',
    customer_phone VARCHAR(50),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method VARCHAR(50) DEFAULT 'CASH',
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. SALE_ITEMS TABLE
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    medicine_id INT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    batch_id INT REFERENCES medicine_batches(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 9. STOCK_TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS stock_transactions (
    id SERIAL PRIMARY KEY,
    medicine_id INT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    batch_id INT REFERENCES medicine_batches(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'EXPIRY', 'DAMAGE')),
    quantity INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reference_id VARCHAR(100),
    notes TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('LOW_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'SYSTEM')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    medicine_id INT REFERENCES medicines(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT,
    old_data TEXT,
    new_data TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR HIGH PERFORMANCE SEARCH & AUDITABILITY
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicines_brand ON medicines(brand);
CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);
CREATE INDEX IF NOT EXISTS idx_medicines_active ON medicines(is_active);

CREATE INDEX IF NOT EXISTS idx_batches_med_exp ON medicine_batches(medicine_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON medicine_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_number ON medicine_batches(batch_number);

CREATE INDEX IF NOT EXISTS idx_transactions_med ON stock_transactions(medicine_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON stock_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
