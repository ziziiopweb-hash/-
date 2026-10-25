-- ============================================================================
-- SHADOW STORE — Supabase / PostgreSQL Production Schema & Migrations
-- Mauritanian Digital Gaming Store
-- Payment Receiver Phone: 31520844
-- Supported Methods: Bankily, Masrivi, Sedad
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'customer')) DEFAULT 'customer',
    language TEXT NOT NULL CHECK (language IN ('ar', 'en')) DEFAULT 'ar',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    game TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    image TEXT NOT NULL,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('player_id', 'account_login', 'digital_code')),
    requires_player_id BOOLEAN NOT NULL DEFAULT true,
    requires_zone_id BOOLEAN NOT NULL DEFAULT false,
    requires_server BOOLEAN NOT NULL DEFAULT false,
    requires_account_credentials BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    warning_notice_ar TEXT,
    warning_notice_en TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- 4. PRODUCT VARIANTS TABLE (Prices in MRU)
CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    amount TEXT NOT NULL,
    unit TEXT NOT NULL,
    price_mru NUMERIC(10, 2) NOT NULL CHECK (price_mru >= 0),
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_active ON product_variants(active);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference TEXT UNIQUE NOT NULL, -- e.g. SHD-2026-XXXX
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    product_id TEXT NOT NULL REFERENCES products(id),
    variant_id TEXT NOT NULL REFERENCES product_variants(id),
    product_name TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('player_id', 'account_login', 'digital_code')),
    player_id TEXT,
    player_zone_id TEXT,
    server_name TEXT,
    account_credentials_encrypted TEXT,
    amount_mru NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bankily', 'masrivi', 'sedad')),
    payment_phone TEXT NOT NULL DEFAULT '31520844',
    transaction_reference TEXT,
    payment_proof_url TEXT,
    status TEXT NOT NULL CHECK (status IN (
        'awaiting_payment',
        'needs_review',
        'in_progress',
        'completed',
        'rejected',
        'cancelled'
    )) DEFAULT 'awaiting_payment',
    admin_notes TEXT,
    customer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- 6. ORDER STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);

-- 7. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    content_en TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'promotion', 'warning')) DEFAULT 'info',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT UNIQUE NOT NULL, -- e.g. TKT-1042
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    order_reference TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    admin_reply TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_phone ON support_tickets(customer_phone);

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    ip TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(timestamp DESC);

-- 10. STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS store_settings (
    id INT PRIMARY KEY DEFAULT 1,
    payment_number TEXT NOT NULL DEFAULT '31520844',
    whatsapp_number TEXT NOT NULL DEFAULT '22231520844',
    support_hours_ar TEXT NOT NULL,
    support_hours_en TEXT NOT NULL,
    bankily_instructions_ar TEXT NOT NULL,
    bankily_instructions_en TEXT NOT NULL,
    masrivi_instructions_ar TEXT NOT NULL,
    masrivi_instructions_en TEXT NOT NULL,
    sedad_instructions_ar TEXT NOT NULL,
    sedad_instructions_en TEXT NOT NULL,
    banner_notice_ar TEXT,
    banner_notice_en TEXT,
    banner_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous public can read active products and variants
CREATE POLICY "Public products view" ON products FOR SELECT USING (active = true);
CREATE POLICY "Public variants view" ON product_variants FOR SELECT USING (active = true);
CREATE POLICY "Public announcements view" ON announcements FOR SELECT USING (active = true);
