-- ============================================================
-- Migration V3: Pause/Resume, Cancel with reason, Usage meter
-- Run: psql -U postgres -d subscription_db -f migration_v3.sql
-- ============================================================

-- Add PAUSED and CANCELLED to subscription_status enum
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Add pause/resume and cancellation tracking columns
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
