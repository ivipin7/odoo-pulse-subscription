-- ============================================================
-- Migration V2: Add missing features from requirements
-- Run: psql -U postgres -d subscription_db -f migration_v2.sql
-- ============================================================

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);

-- Recurring plans: add new columns
ALTER TABLE recurring_plans ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE recurring_plans ADD COLUMN IF NOT EXISTS min_quantity INT NOT NULL DEFAULT 1;
ALTER TABLE recurring_plans ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE recurring_plans ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE recurring_plans ADD COLUMN IF NOT EXISTS auto_close BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE recurring_plans ADD COLUMN IF NOT EXISTS closable BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE recurring_plans ADD COLUMN IF NOT EXISTS pausable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE recurring_plans ADD COLUMN IF NOT EXISTS renewable BOOLEAN NOT NULL DEFAULT true;

-- Discounts: add new columns
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS limit_usage INT;
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS usage_count INT NOT NULL DEFAULT 0;
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS applies_to VARCHAR(20) NOT NULL DEFAULT 'ALL';

-- Add CANCELLED to invoice_status enum
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'CANCELLED';
