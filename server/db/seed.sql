-- ═══════════════════════════════════════════════════════════════
-- OdooPulse – Seed Data  
-- Run AFTER schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ── Admin User (password: admin123) ──────────────────────────
-- bcrypt hash for 'admin123'
INSERT INTO users (id, name, email, password_hash, role, company, phone) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Super Admin', 'admin@odoopulse.com', '$2b$12$LJ6h1r2nR3dLmVqPdKQ9oOzPfWKCzWgkFNxAB1dcNbjFvBCqvdOXe', 'SUPER_ADMIN', 'OdooPulse Inc.', '+91-9876543210'),
  ('a0000000-0000-0000-0000-000000000002', 'Vipin Kumar', 'vipin@odoopulse.com', '$2b$12$LJ6h1r2nR3dLmVqPdKQ9oOzPfWKCzWgkFNxAB1dcNbjFvBCqvdOXe', 'ADMIN', 'TechStart Pvt Ltd', '+91-9876543211'),
  ('a0000000-0000-0000-0000-000000000003', 'Sharan M', 'sharan@odoopulse.com', '$2b$12$LJ6h1r2nR3dLmVqPdKQ9oOzPfWKCzWgkFNxAB1dcNbjFvBCqvdOXe', 'MANAGER', 'DataWorks LLC', '+91-9876543212');

-- ── Customer Users (password: customer123) ───────────────────
INSERT INTO users (id, name, email, password_hash, role, company, phone, gst_number) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Rahul Sharma', 'rahul@example.com', '$2b$12$LJ6h1r2nR3dLmVqPdKQ9oOzPfWKCzWgkFNxAB1dcNbjFvBCqvdOXe', 'CUSTOMER', 'Sharma Enterprises', '+91-9123456780', '29AAACP1234Q1ZA'),
  ('c0000000-0000-0000-0000-000000000002', 'Priya Patel', 'priya@example.com', '$2b$12$LJ6h1r2nR3dLmVqPdKQ9oOzPfWKCzWgkFNxAB1dcNbjFvBCqvdOXe', 'CUSTOMER', 'Patel Solutions', '+91-9123456781', '27BBBFP5678R1ZB'),
  ('c0000000-0000-0000-0000-000000000003', 'Amit Desai', 'amit@example.com', '$2b$12$LJ6h1r2nR3dLmVqPdKQ9oOzPfWKCzWgkFNxAB1dcNbjFvBCqvdOXe', 'CUSTOMER', 'Desai Corp', '+91-9123456782', NULL),
  ('c0000000-0000-0000-0000-000000000004', 'Meera Singh', 'meera@example.com', '$2b$12$LJ6h1r2nR3dLmVqPdKQ9oOzPfWKCzWgkFNxAB1dcNbjFvBCqvdOXe', 'CUSTOMER', 'Singh Tech', '+91-9123456783', '07CCCMS9012T1ZC');

-- ── Categories ───────────────────────────────────────────────
INSERT INTO categories (id, name, slug, description, icon) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'CRM & Sales', 'crm-sales', 'Customer relationship management and sales tools', 'Users'),
  ('d0000000-0000-0000-0000-000000000002', 'Accounting', 'accounting', 'Financial management and invoicing', 'Calculator'),
  ('d0000000-0000-0000-0000-000000000003', 'HR & Payroll', 'hr-payroll', 'Human resources and payroll management', 'Briefcase'),
  ('d0000000-0000-0000-0000-000000000004', 'Inventory', 'inventory', 'Stock and warehouse management', 'Package'),
  ('d0000000-0000-0000-0000-000000000005', 'Marketing', 'marketing', 'Marketing automation and campaigns', 'Megaphone'),
  ('d0000000-0000-0000-0000-000000000006', 'Project Management', 'project-mgmt', 'Project tracking and collaboration', 'FolderKanban');

-- ── Products ─────────────────────────────────────────────────
INSERT INTO products (id, name, description, base_price, category_id, image_url, billing_period, features) VALUES
  ('p0000000-0000-0000-0000-000000000001', 'OdooPulse CRM Pro', 'Complete CRM solution with pipeline management, lead scoring, and automated follow-ups.', 2499.00, 'd0000000-0000-0000-0000-000000000001', '/images/crm-pro.jpg', 'MONTHLY', '["Pipeline Management", "Lead Scoring", "Email Integration", "Analytics Dashboard", "Custom Reports"]'),
  ('p0000000-0000-0000-0000-000000000002', 'OdooPulse Accounting Suite', 'Full-featured accounting with GST compliance, bank reconciliation, and financial reports.', 3499.00, 'd0000000-0000-0000-0000-000000000002', '/images/accounting.jpg', 'MONTHLY', '["GST Compliant Invoicing", "Bank Reconciliation", "P&L Reports", "Balance Sheet", "TDS Management"]'),
  ('p0000000-0000-0000-0000-000000000003', 'OdooPulse HR360', 'End-to-end HR management from recruitment to payroll.', 1999.00, 'd0000000-0000-0000-0000-000000000003', '/images/hr360.jpg', 'MONTHLY', '["Employee Directory", "Leave Management", "Payroll Processing", "Attendance Tracking", "Performance Reviews"]'),
  ('p0000000-0000-0000-0000-000000000004', 'OdooPulse Inventory Manager', 'Real-time inventory tracking with multi-warehouse support.', 2999.00, 'd0000000-0000-0000-0000-000000000004', '/images/inventory.jpg', 'MONTHLY', '["Multi-warehouse", "Barcode Scanning", "Auto-reorder", "Batch Tracking", "Stock Valuation"]'),
  ('p0000000-0000-0000-0000-000000000005', 'OdooPulse Marketing Hub', 'Marketing automation with email campaigns, social media, and SMS.', 1499.00, 'd0000000-0000-0000-0000-000000000005', '/images/marketing.jpg', 'MONTHLY', '["Email Campaigns", "Social Media", "SMS Marketing", "A/B Testing", "Analytics"]'),
  ('p0000000-0000-0000-0000-000000000006', 'OdooPulse Project Pro', 'Agile project management with Kanban boards, Gantt charts, and time tracking.', 1799.00, 'd0000000-0000-0000-0000-000000000006', '/images/project.jpg', 'MONTHLY', '["Kanban Boards", "Gantt Charts", "Time Tracking", "Sprint Planning", "Resource Allocation"]');

-- ── Product Variants ─────────────────────────────────────────
INSERT INTO product_variants (id, product_id, name, price_modifier, billing_period) VALUES
  ('v0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'Starter (5 users)', 0, 'MONTHLY'),
  ('v0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000001', 'Business (25 users)', 2000, 'MONTHLY'),
  ('v0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000001', 'Enterprise (Unlimited)', 5000, 'MONTHLY'),
  ('v0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000002', 'Basic', 0, 'MONTHLY'),
  ('v0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000002', 'Professional', 1500, 'MONTHLY'),
  ('v0000000-0000-0000-0000-000000000006', 'p0000000-0000-0000-0000-000000000003', 'Standard', 0, 'MONTHLY'),
  ('v0000000-0000-0000-0000-000000000007', 'p0000000-0000-0000-0000-000000000003', 'Premium', 1000, 'MONTHLY');

-- ── Subscriptions ────────────────────────────────────────────
INSERT INTO subscriptions (id, user_id, product_id, variant_id, status, billing_period, amount, start_date, next_billing) VALUES
  ('s0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000002', 'ACTIVE', 'MONTHLY', 4499.00, '2025-01-01', '2025-08-01'),
  ('s0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', 'v0000000-0000-0000-0000-000000000005', 'ACTIVE', 'MONTHLY', 4999.00, '2025-02-15', '2025-08-15'),
  ('s0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000007', 'ACTIVE', 'MONTHLY', 2999.00, '2025-03-01', '2025-08-01'),
  ('s0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000005', NULL, 'AT_RISK', 'MONTHLY', 1499.00, '2025-01-15', '2025-07-15'),
  ('s0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000004', NULL, 'ACTIVE', 'QUARTERLY', 8097.00, '2025-04-01', '2025-10-01'),
  ('s0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000006', NULL, 'DRAFT', 'MONTHLY', 1799.00, '2025-07-01', NULL),
  ('s0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000003', 'ACTIVE', 'YEARLY', 89988.00, '2025-01-01', '2026-01-01'),
  ('s0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000002', 'v0000000-0000-0000-0000-000000000004', 'CLOSED', 'MONTHLY', 3499.00, '2024-06-01', NULL);

-- ── Invoices ─────────────────────────────────────────────────
INSERT INTO invoices (id, invoice_number, user_id, subscription_id, status, subtotal, tax_amount, discount_amount, total_amount, due_date) VALUES
  ('i0000000-0000-0000-0000-000000000001', 'INV-0001', 'c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'PAID', 4499.00, 809.82, 0, 5308.82, '2025-07-15'),
  ('i0000000-0000-0000-0000-000000000002', 'INV-0002', 'c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000002', 'PAID', 4999.00, 899.82, 0, 5898.82, '2025-07-28'),
  ('i0000000-0000-0000-0000-000000000003', 'INV-0003', 'c0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000003', 'CONFIRMED', 2999.00, 539.82, 0, 3538.82, '2025-08-01'),
  ('i0000000-0000-0000-0000-000000000004', 'INV-0004', 'c0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000004', 'FAILED', 1499.00, 269.82, 0, 1768.82, '2025-07-15'),
  ('i0000000-0000-0000-0000-000000000005', 'INV-0005', 'c0000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000005', 'PAID', 8097.00, 1457.46, 809.70, 8744.76, '2025-07-01'),
  ('i0000000-0000-0000-0000-000000000006', 'INV-0006', 'c0000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000007', 'DRAFT', 89988.00, 16197.84, 8998.80, 97187.04, '2026-01-01');

-- ── Payments ─────────────────────────────────────────────────
INSERT INTO payments (id, invoice_id, user_id, amount, payment_method, status, transaction_ref, payment_date) VALUES
  ('py000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 5308.82, 'CARD', 'SUCCESS', 'TXN_PAY001_ABC', '2025-07-10 10:30:00+05:30'),
  ('py000000-0000-0000-0000-000000000002', 'i0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 5898.82, 'UPI', 'SUCCESS', 'TXN_PAY002_DEF', '2025-07-25 14:15:00+05:30'),
  ('py000000-0000-0000-0000-000000000003', 'i0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 1768.82, 'CARD', 'FAILED', 'TXN_PAY003_GHI', '2025-07-14 09:00:00+05:30'),
  ('py000000-0000-0000-0000-000000000004', 'i0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 8744.76, 'BANK_TRANSFER', 'SUCCESS', 'TXN_PAY004_JKL', '2025-06-28 11:45:00+05:30');

-- ── Payment Retries (for the failed invoice) ─────────────────
INSERT INTO payment_retries (invoice_id, attempt_number, status, payment_method, error_message, attempted_at) VALUES
  ('i0000000-0000-0000-0000-000000000004', 1, 'FAILED', 'CARD', 'Insufficient funds', '2025-07-15 10:00:00+05:30'),
  ('i0000000-0000-0000-0000-000000000004', 2, 'FAILED', 'CARD', 'Card declined by issuer', '2025-07-16 10:00:00+05:30');

-- ── Orders ───────────────────────────────────────────────────
INSERT INTO orders (id, user_id, order_number, status, total_amount) VALUES
  ('o0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'ORD-0001', 'DELIVERED', 4499.00),
  ('o0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'ORD-0002', 'PROCESSING', 4999.00),
  ('o0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'ORD-0003', 'SHIPPED', 2999.00),
  ('o0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'ORD-0004', 'CONFIRMED', 8097.00),
  ('o0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004', 'ORD-0005', 'DELIVERED', 89988.00);

INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price) VALUES
  ('o0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000002', 1, 4499.00),
  ('o0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'v0000000-0000-0000-0000-000000000005', 1, 4999.00),
  ('o0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000007', 1, 2999.00),
  ('o0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000004', NULL, 1, 8097.00),
  ('o0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000003', 1, 89988.00);

-- ── Discounts ────────────────────────────────────────────────
INSERT INTO discounts (id, code, description, type, value, min_order_amount, max_uses, valid_from, valid_until, is_active) VALUES
  ('dc000000-0000-0000-0000-000000000001', 'WELCOME10', 'Welcome 10% off for new users', 'PERCENT', 10, 1000, 100, '2025-01-01', '2025-12-31', true),
  ('dc000000-0000-0000-0000-000000000002', 'FLAT500', 'Flat ₹500 off on orders above ₹5000', 'FIXED', 500, 5000, 50, '2025-01-01', '2025-12-31', true),
  ('dc000000-0000-0000-0000-000000000003', 'ANNUAL20', '20% off on annual subscriptions', 'PERCENT', 20, 0, NULL, '2025-01-01', '2025-12-31', true),
  ('dc000000-0000-0000-0000-000000000004', 'LAUNCH25', 'Launch offer - 25% off', 'PERCENT', 25, 2000, 200, '2025-06-01', '2025-08-31', true),
  ('dc000000-0000-0000-0000-000000000005', 'EXPIRED5', 'Expired promo', 'PERCENT', 5, 0, NULL, '2024-01-01', '2024-06-30', false);

-- ── Tax Rules ────────────────────────────────────────────────
INSERT INTO tax_rules (id, name, region, tax_type, rate, is_active) VALUES
  ('tx000000-0000-0000-0000-000000000001', 'GST 18%', 'India', 'GST', 18.00, true),
  ('tx000000-0000-0000-0000-000000000002', 'CGST 9%', 'Karnataka', 'CGST_SGST', 9.00, true),
  ('tx000000-0000-0000-0000-000000000003', 'SGST 9%', 'Karnataka', 'CGST_SGST', 9.00, true),
  ('tx000000-0000-0000-0000-000000000004', 'IGST 18%', 'Interstate', 'IGST', 18.00, true),
  ('tx000000-0000-0000-0000-000000000005', 'VAT 20%', 'UK', 'VAT', 20.00, true),
  ('tx000000-0000-0000-0000-000000000006', 'Sales Tax 8.5%', 'US-CA', 'SALES_TAX', 8.50, true);

-- ── Quotations ───────────────────────────────────────────────
INSERT INTO quotations (id, customer_id, status, billing_period, total_amount, valid_until) VALUES
  ('q0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'ACCEPTED', 'YEARLY', 53988.00, '2025-08-15'),
  ('q0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'SENT', 'MONTHLY', 4498.00, '2025-08-01'),
  ('q0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'DRAFT', 'QUARTERLY', 12896.00, '2025-09-01'),
  ('q0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'DECLINED', 'MONTHLY', 7498.00, '2025-07-15');

INSERT INTO quotation_items (quotation_id, product_id, variant_id, quantity, unit_price) VALUES
  ('q0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000002', 1, 53988.00),
  ('q0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000007', 1, 2999.00),
  ('q0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000005', NULL, 1, 1499.00),
  ('q0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000004', NULL, 1, 8097.00),
  ('q0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000006', NULL, 1, 4799.00),
  ('q0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000003', 1, 7499.00);

-- ── Cart Items (Current carts for demo) ──────────────────────
INSERT INTO cart_items (user_id, product_id, variant_id, quantity) VALUES
  ('c0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000001', 1),
  ('c0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000005', NULL, 2),
  ('c0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000006', 1);

-- ═══════════════════════════════════════════════════════════════
-- Seed complete. Database is ready for development.
-- Login: admin@odoopulse.com / admin123
-- ═══════════════════════════════════════════════════════════════
