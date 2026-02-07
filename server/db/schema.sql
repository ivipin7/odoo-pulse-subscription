-- ═══════════════════════════════════════════════════════════════
-- OdooPulse – Subscription Management System
-- PostgreSQL 15+ Schema (DDL)
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUM Types ───────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('CUSTOMER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN');
CREATE TYPE subscription_status AS ENUM ('DRAFT', 'QUOTATION', 'ACTIVE', 'AT_RISK', 'CLOSED');
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'CONFIRMED', 'FAILED', 'PAID');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
CREATE TYPE payment_method AS ENUM ('CARD', 'UPI', 'BANK_TRANSFER', 'WALLET');
CREATE TYPE billing_period AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');
CREATE TYPE order_status AS ENUM ('DRAFT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
CREATE TYPE quotation_status AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CONVERTED');
CREATE TYPE discount_type AS ENUM ('PERCENT', 'FIXED');
CREATE TYPE tax_type AS ENUM ('GST', 'IGST', 'CGST_SGST', 'VAT', 'SALES_TAX');
CREATE TYPE retry_status AS ENUM ('SUCCESS', 'FAILED');
CREATE TYPE closed_reason AS ENUM ('customer_request', 'payment_failure', 'admin_action', 'expired');

-- ── Users ────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  company       VARCHAR(200),
  gst_number    VARCHAR(15),
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'CUSTOMER',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ── Categories ───────────────────────────────────────────────

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon        VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Products ─────────────────────────────────────────────────

CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  base_price    NUMERIC(12,2) NOT NULL DEFAULT 0,
  category_id   UUID REFERENCES categories(id),
  image_url     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  billing_period billing_period DEFAULT 'MONTHLY',
  features      JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_products_category ON products(category_id);

-- ── Product Variants ─────────────────────────────────────────

CREATE TABLE product_variants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  price_modifier  NUMERIC(12,2) NOT NULL DEFAULT 0,
  billing_period  billing_period NOT NULL DEFAULT 'MONTHLY',
  features        JSONB DEFAULT '[]',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);

-- ── Subscriptions ────────────────────────────────────────────

CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  product_id      UUID NOT NULL REFERENCES products(id),
  variant_id      UUID REFERENCES product_variants(id),
  status          subscription_status NOT NULL DEFAULT 'DRAFT',
  billing_period  billing_period NOT NULL DEFAULT 'MONTHLY',
  amount          NUMERIC(12,2) NOT NULL,
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date        DATE,
  next_billing    DATE,
  closed_reason   closed_reason,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sub_user ON subscriptions(user_id);
CREATE INDEX idx_sub_status ON subscriptions(status);
CREATE INDEX idx_sub_next_billing ON subscriptions(next_billing);

-- ── Invoices ─────────────────────────────────────────────────

CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number    VARCHAR(20) UNIQUE NOT NULL,
  user_id           UUID NOT NULL REFERENCES users(id),
  subscription_id   UUID REFERENCES subscriptions(id),
  status            invoice_status NOT NULL DEFAULT 'DRAFT',
  subtotal          NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date          DATE,
  paid_at           TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_user ON invoices(user_id);
CREATE INDEX idx_inv_sub ON invoices(subscription_id);
CREATE INDEX idx_inv_status ON invoices(status);

-- ── Invoice Line Items ───────────────────────────────────────

CREATE TABLE invoice_lines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(300) NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12,2) NOT NULL,
  tax_rate    NUMERIC(5,2) DEFAULT 0,
  subtotal    NUMERIC(12,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_lines_invoice ON invoice_lines(invoice_id);

-- ── Payments ─────────────────────────────────────────────────

CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id        UUID NOT NULL REFERENCES invoices(id),
  user_id           UUID NOT NULL REFERENCES users(id),
  amount            NUMERIC(12,2) NOT NULL,
  payment_method    payment_method NOT NULL DEFAULT 'CARD',
  status            payment_status NOT NULL DEFAULT 'PENDING',
  transaction_ref   VARCHAR(100),
  gateway_response  JSONB,
  payment_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pay_invoice ON payments(invoice_id);
CREATE INDEX idx_pay_user ON payments(user_id);
CREATE INDEX idx_pay_status ON payments(status);

-- ── Payment Retries (Recovery Engine) ────────────────────────

CREATE TABLE payment_retries (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id        UUID NOT NULL REFERENCES invoices(id),
  attempt_number    INTEGER NOT NULL,
  status            retry_status NOT NULL,
  payment_method    payment_method NOT NULL DEFAULT 'CARD',
  gateway_response  JSONB,
  error_message     TEXT,
  attempted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(invoice_id, attempt_number)
);

CREATE INDEX idx_retry_invoice ON payment_retries(invoice_id);

-- ── Orders ───────────────────────────────────────────────────

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  order_number    VARCHAR(20) UNIQUE NOT NULL,
  status          order_status NOT NULL DEFAULT 'DRAFT',
  total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  billing_address TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_order_user ON orders(user_id);
CREATE INDEX idx_order_status ON orders(status);

-- ── Order Items ──────────────────────────────────────────────

CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  variant_id  UUID REFERENCES product_variants(id),
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_oi_order ON order_items(order_id);

-- ── Quotations ───────────────────────────────────────────────

CREATE TABLE quotations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL REFERENCES users(id),
  status          quotation_status NOT NULL DEFAULT 'DRAFT',
  billing_period  billing_period NOT NULL DEFAULT 'MONTHLY',
  discount_id     UUID,
  total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  valid_until     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_quot_customer ON quotations(customer_id);

-- ── Quotation Items ──────────────────────────────────────────

CREATE TABLE quotation_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id  UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id),
  variant_id    UUID REFERENCES product_variants(id),
  quantity      INTEGER NOT NULL DEFAULT 1,
  unit_price    NUMERIC(12,2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qi_quotation ON quotation_items(quotation_id);

-- ── Discounts ────────────────────────────────────────────────

CREATE TABLE discounts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                  VARCHAR(20) UNIQUE NOT NULL,
  description           TEXT,
  type                  discount_type NOT NULL DEFAULT 'PERCENT',
  value                 NUMERIC(12,2) NOT NULL,
  min_order_amount      NUMERIC(12,2) DEFAULT 0,
  max_uses              INTEGER,
  valid_from            TIMESTAMPTZ NOT NULL,
  valid_until           TIMESTAMPTZ NOT NULL,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  applicable_products   JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX idx_discount_code ON discounts(code);

-- ── Discount Usage ───────────────────────────────────────────

CREATE TABLE discount_usage (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_id UUID NOT NULL REFERENCES discounts(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  order_id    UUID REFERENCES orders(id),
  used_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tax Rules ────────────────────────────────────────────────

CREATE TABLE tax_rules (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    VARCHAR(100) NOT NULL,
  region                  VARCHAR(50) NOT NULL,
  tax_type                tax_type NOT NULL,
  rate                    NUMERIC(5,2) NOT NULL,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  applicable_categories   JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

CREATE INDEX idx_tax_region ON tax_rules(region);

-- ── Cart Items ───────────────────────────────────────────────

CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  product_id  UUID NOT NULL REFERENCES products(id),
  variant_id  UUID REFERENCES product_variants(id),
  quantity    INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, variant_id)
);

CREATE INDEX idx_cart_user ON cart_items(user_id);

-- ── Auto-update updated_at Trigger ───────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'users', 'products', 'subscriptions', 'invoices', 
      'payments', 'orders', 'quotations', 'discounts', 
      'tax_rules', 'cart_items'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- Schema complete. Run seed.sql next for demo data.
-- ═══════════════════════════════════════════════════════════════
