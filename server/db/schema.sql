-- ============================================================
-- OdooPulse — Complete Database Schema (DDL)
-- PostgreSQL 15+
-- Owner: Sharan (feature/db-schema)
-- ============================================================
-- Run: psql -U postgres -d odoopulse -f server/db/schema.sql
-- ============================================================

-- ============================================================
-- 0. CLEAN SLATE (drop in reverse dependency order)
-- ============================================================
DROP TRIGGER IF EXISTS trg_tax_rules_updated ON tax_rules;
DROP TRIGGER IF EXISTS trg_discounts_updated ON discounts;
DROP TRIGGER IF EXISTS trg_quotations_updated ON quotations;
DROP TRIGGER IF EXISTS trg_cart_items_updated ON cart_items;
DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
DROP TRIGGER IF EXISTS trg_payments_updated ON payments;
DROP TRIGGER IF EXISTS trg_invoices_updated ON invoices;
DROP TRIGGER IF EXISTS trg_subscriptions_updated ON subscriptions;
DROP TRIGGER IF EXISTS trg_products_updated ON products;
DROP TRIGGER IF EXISTS trg_addresses_updated ON addresses;
DROP TRIGGER IF EXISTS trg_users_updated ON users;

DROP TABLE IF EXISTS payment_retries CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS quotation_items CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS tax_rules CASCADE;
DROP TABLE IF EXISTS discounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS invoice_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS quotation_status CASCADE;
DROP TYPE IF EXISTS discount_type CASCADE;
DROP TYPE IF EXISTS discount_status CASCADE;
DROP TYPE IF EXISTS tax_type CASCADE;
DROP TYPE IF EXISTS tax_status CASCADE;
DROP TYPE IF EXISTS billing_period CASCADE;

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT', 'CUSTOMER');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE subscription_status AS ENUM ('DRAFT', 'QUOTATION', 'ACTIVE', 'AT_RISK', 'CLOSED');
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'CONFIRMED', 'FAILED', 'PAID');
CREATE TYPE payment_status AS ENUM ('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED');
CREATE TYPE payment_method AS ENUM ('UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING');
CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');
CREATE TYPE quotation_status AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'REJECTED');
CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE discount_status AS ENUM ('ACTIVE', 'EXPIRED', 'DISABLED');
CREATE TYPE tax_type AS ENUM ('GST', 'IGST', 'CGST_SGST', 'CESS');
CREATE TYPE tax_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE billing_period AS ENUM ('MONTHLY', 'SEMI_ANNUAL', 'ANNUAL');

-- ============================================================
-- 2. TABLES
-- ============================================================

-- ----- users -----
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    company         VARCHAR(100),
    gst_number      VARCHAR(15),
    role            user_role NOT NULL DEFAULT 'CUSTOMER',
    department      VARCHAR(50),
    status          user_status NOT NULL DEFAULT 'ACTIVE',
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ----- addresses -----
CREATE TABLE addresses (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           VARCHAR(50) NOT NULL,          -- 'Office', 'Warehouse'
    line1           VARCHAR(255) NOT NULL,
    line2           VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    pin_code        VARCHAR(10) NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ----- categories -----
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,   -- 'ERP', 'CRM', 'HR', etc.
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----- products -----
CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    base_price      NUMERIC(12,2) NOT NULL CHECK (base_price > 0),
    billing_period  billing_period NOT NULL DEFAULT 'MONTHLY',
    category_id     INTEGER NOT NULL REFERENCES categories(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ                    -- soft delete
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;

-- ----- product_variants -----
CREATE TABLE product_variants (
    id              SERIAL PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name            VARCHAR(50) NOT NULL,          -- 'Standard', 'Professional', 'Enterprise'
    extra_price     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);

-- ----- subscriptions -----
CREATE TABLE subscriptions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    product_id      INTEGER NOT NULL REFERENCES products(id),
    variant_id      INTEGER REFERENCES product_variants(id),
    status          subscription_status NOT NULL DEFAULT 'DRAFT',
    start_date      DATE,
    next_billing    DATE,
    billing_period  billing_period NOT NULL DEFAULT 'MONTHLY',
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at       TIMESTAMPTZ,                   -- when subscription was closed
    deleted_at      TIMESTAMPTZ                    -- soft delete
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing);
CREATE INDEX idx_subscriptions_at_risk ON subscriptions(status) WHERE status = 'AT_RISK';

-- ----- invoices -----
CREATE TABLE invoices (
    id              SERIAL PRIMARY KEY,
    invoice_number  VARCHAR(20) NOT NULL UNIQUE,   -- 'INV-2025-001'
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
    user_id         INTEGER NOT NULL REFERENCES users(id),
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount    NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    status          invoice_status NOT NULL DEFAULT 'DRAFT',
    due_date        DATE NOT NULL,
    retry_count     INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 3),
    last_retry_at   TIMESTAMPTZ,
    next_retry_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ                    -- soft delete
);

CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_failed ON invoices(status, retry_count) WHERE status = 'FAILED';
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- ----- payments -----
CREATE TABLE payments (
    id              SERIAL PRIMARY KEY,
    payment_ref     VARCHAR(20) NOT NULL UNIQUE,   -- 'PAY-001'
    invoice_id      INTEGER NOT NULL REFERENCES invoices(id),
    user_id         INTEGER NOT NULL REFERENCES users(id),
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    method          payment_method NOT NULL,
    status          payment_status NOT NULL DEFAULT 'PENDING',
    gateway_ref     VARCHAR(100),                  -- external payment gateway reference
    failure_reason  TEXT,                           -- why payment failed
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ----- payment_retries (AUDIT LOG — Siva needs this) -----
CREATE TABLE payment_retries (
    id              SERIAL PRIMARY KEY,
    invoice_id      INTEGER NOT NULL REFERENCES invoices(id),
    payment_id      INTEGER REFERENCES payments(id),        -- NULL if retry itself failed
    attempt_number  INTEGER NOT NULL CHECK (attempt_number >= 1 AND attempt_number <= 3),
    status          payment_status NOT NULL,                 -- SUCCESS or FAILED
    failure_reason  TEXT,
    attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(invoice_id, attempt_number)                      -- can't retry same attempt twice
);

CREATE INDEX idx_retries_invoice ON payment_retries(invoice_id);

-- ----- orders -----
CREATE TABLE orders (
    id              SERIAL PRIMARY KEY,
    order_number    VARCHAR(20) NOT NULL UNIQUE,   -- 'ORD-2025-001'
    user_id         INTEGER NOT NULL REFERENCES users(id),
    total_amount    NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status          order_status NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ----- order_items -----
CREATE TABLE order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    variant_id      INTEGER REFERENCES product_variants(id),
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price      NUMERIC(12,2) NOT NULL CHECK (unit_price > 0),
    billing_period  billing_period NOT NULL DEFAULT 'MONTHLY',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ----- cart_items -----
CREATE TABLE cart_items (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    variant_id      INTEGER REFERENCES product_variants(id),
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, product_id, variant_id)                 -- no duplicate cart entries
);

CREATE INDEX idx_cart_user ON cart_items(user_id);

-- ----- quotations -----
CREATE TABLE quotations (
    id              SERIAL PRIMARY KEY,
    quotation_number VARCHAR(20) NOT NULL UNIQUE,  -- 'QOT-001'
    user_id         INTEGER NOT NULL REFERENCES users(id),
    total_amount    NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    valid_until     DATE NOT NULL,
    status          quotation_status NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_quotations_user ON quotations(user_id);
CREATE INDEX idx_quotations_status ON quotations(status);

-- ----- quotation_items -----
CREATE TABLE quotation_items (
    id              SERIAL PRIMARY KEY,
    quotation_id    INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    variant_id      INTEGER REFERENCES product_variants(id),
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price      NUMERIC(12,2) NOT NULL CHECK (unit_price > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotation_items_quotation ON quotation_items(quotation_id);

-- ----- discounts -----
CREATE TABLE discounts (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,
    description     TEXT,
    type            discount_type NOT NULL,
    value           NUMERIC(12,2) NOT NULL CHECK (value > 0),
    min_order       NUMERIC(12,2) NOT NULL DEFAULT 0,
    max_uses        INTEGER NOT NULL DEFAULT 0 CHECK (max_uses >= 0),
    used_count      INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    valid_from      DATE NOT NULL,
    valid_until     DATE NOT NULL,
    status          discount_status NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (valid_until >= valid_from),
    CHECK (used_count <= max_uses OR max_uses = 0),
    CHECK (type != 'PERCENTAGE' OR value <= 100)            -- percentage can't exceed 100
);

CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discounts_status ON discounts(status);

-- ----- tax_rules -----
CREATE TABLE tax_rules (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    rate            NUMERIC(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
    type            tax_type NOT NULL,
    applicable_to   VARCHAR(100) NOT NULL,
    region          VARCHAR(100) NOT NULL,
    status          tax_status NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to every table that has updated_at
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_addresses_updated BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cart_items_updated BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_quotations_updated BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_discounts_updated BEFORE UPDATE ON discounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tax_rules_updated BEFORE UPDATE ON tax_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SCHEMA COMPLETE ✅
-- Now run seed.sql for test data
-- ============================================================
