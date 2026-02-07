-- ============================================================
-- Migration 002: Seed Data
-- OdooPulse — Test data matching frontend mock data
-- ============================================================
-- Run AFTER 001_initial_schema.sql:
--   psql -U postgres -d odoopulse -f server/db/migrations/002_seed_data.sql
-- ============================================================

-- ============================================================
-- 1. USERS
-- ============================================================
-- Password for all seeded users: "Password@123" (bcrypt hash)

INSERT INTO users (name, email, password_hash, phone, company, gst_number, role, department, status, last_login)
VALUES
  -- Admin / Internal users
  ('Priya Sharma',   'priya@odoopulse.in',   '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 99999 11111', NULL, NULL, 'SUPER_ADMIN', 'Engineering', 'ACTIVE',   '2025-02-20 14:30:00+05:30'),
  ('Arjun Mehta',    'arjun@odoopulse.in',   '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 99999 22222', NULL, NULL, 'ADMIN',       'Sales',       'ACTIVE',   '2025-02-20 11:15:00+05:30'),
  ('Sneha Patil',    'sneha@odoopulse.in',   '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 99999 33333', NULL, NULL, 'MANAGER',     'Support',     'ACTIVE',   '2025-02-19 16:45:00+05:30'),
  ('Vikram Singh',   'vikram@odoopulse.in',  '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 99999 44444', NULL, NULL, 'SUPPORT',     'Support',     'ACTIVE',   '2025-02-18 09:20:00+05:30'),
  ('Anita Desai',    'anita@odoopulse.in',   '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 99999 55555', NULL, NULL, 'MANAGER',     'Finance',     'INACTIVE', '2025-02-15 13:00:00+05:30'),
  ('Rahul Gupta',    'rahul@odoopulse.in',   '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 99999 66666', NULL, NULL, 'ADMIN',       'Operations',  'ACTIVE',   '2025-02-20 10:00:00+05:30'),

  -- Customer users
  ('Rajesh Kumar',   'rajesh.kumar@acmecorp.in',   '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 98765 43210', 'Acme Corp',       '27AABCU9603R1ZM', 'CUSTOMER', NULL, 'ACTIVE', NULL),
  ('Amit Patel',     'amit@techstart.in',          '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 98765 11111', 'TechStart Inc',   '29AADCS4202C1Z5', 'CUSTOMER', NULL, 'ACTIVE', NULL),
  ('Sarah Khan',     'sarah@globaltrade.in',       '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 98765 22222', 'GlobalTrade Ltd', '07AABCG1234D1ZA', 'CUSTOMER', NULL, 'ACTIVE', NULL),
  ('Deepak Joshi',   'deepak@financehub.in',       '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 98765 33333', 'FinanceHub',      '27AABCF5678E1Z3', 'CUSTOMER', NULL, 'ACTIVE', NULL),
  ('Meera Reddy',    'meera@retailmax.in',         '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 98765 44444', 'RetailMax',       '36AABCR9012F1Z7', 'CUSTOMER', NULL, 'ACTIVE', NULL),
  ('Kiran Rao',      'kiran@mediaflow.in',         '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 98765 55555', 'MediaFlow',       '29AABCM3456G1Z1', 'CUSTOMER', NULL, 'ACTIVE', NULL),
  ('Ravi Nair',      'ravi@buildright.in',         '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 98765 66666', 'BuildRight Co',   '32AABCB7890H1Z4', 'CUSTOMER', NULL, 'ACTIVE', NULL),
  ('Pooja Verma',    'pooja@datadriven.in',        '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 98765 77777', 'DataDriven LLC',  '27AABCD2345I1Z8', 'CUSTOMER', NULL, 'ACTIVE', NULL),

  -- Quotation customers
  ('Neha Agarwal',   'neha@novatech.in',           '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 98765 88888', 'NovaTech Systems','27AABCN6789J1Z2', 'CUSTOMER', NULL, 'ACTIVE', NULL),
  ('Suresh Iyer',    'suresh@cloudnine.in',        '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 98765 99999', 'CloudNine Ltd',   '29AABCC0123K1Z6', 'CUSTOMER', NULL, 'ACTIVE', NULL),
  ('Divya Menon',    'divya@urbanretail.in',       '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 98765 00001', 'UrbanRetail',     '27AABCU4567L1Z9', 'CUSTOMER', NULL, 'ACTIVE', NULL),
  ('Mohan Das',      'mohan@greenleaf.in',         '$2b$10$rQZ8kHwL6C5YdF3v9uXhXeJ2R4nMqW0sE7tYpA1bN8vK3jG5mH2iO', '+91 98765 00002', 'GreenLeaf Farms', '33AABCG8901M1Z3', 'CUSTOMER', NULL, 'ACTIVE', NULL);

-- ============================================================
-- 2. ADDRESSES
-- ============================================================

INSERT INTO addresses (user_id, label, line1, line2, city, state, pin_code, is_default)
VALUES
  (7, 'Office',    'Tower B, Floor 12, Cyber Hub', 'Sector 24, Gurugram',           'Gurugram', 'Haryana', '122002', TRUE),
  (7, 'Warehouse', 'Plot 45, Industrial Area Phase-II', 'Manesar',                  'Gurugram', 'Haryana', '122051', FALSE);

-- ============================================================
-- 3. CATEGORIES
-- ============================================================

INSERT INTO categories (name) VALUES
  ('ERP'), ('CRM'), ('HR'), ('Accounting'), ('Inventory'), ('Marketing');

-- ============================================================
-- 4. PRODUCTS
-- ============================================================

INSERT INTO products (id, name, description, base_price, billing_period, category_id)
VALUES
  (1, 'ERP Suite',          'Complete enterprise resource planning solution for growing businesses',     1200.00, 'MONTHLY', 1),
  (2, 'CRM Pro',            'Customer relationship management with advanced analytics',                  800.00, 'MONTHLY', 2),
  (3, 'HR Management',      'Human resource management with payroll integration',                        600.00, 'MONTHLY', 3),
  (4, 'Accounting Plus',    'Financial management, reporting, and compliance tools',                     900.00, 'MONTHLY', 4),
  (5, 'Inventory Control',  'Warehouse and stock management with barcode scanning',                      700.00, 'MONTHLY', 5),
  (6, 'Marketing Hub',      'Campaign management, email marketing, and lead generation',                 500.00, 'MONTHLY', 6);

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- ============================================================
-- 5. PRODUCT VARIANTS
-- ============================================================

INSERT INTO product_variants (id, product_id, name, extra_price) VALUES
  (1,  1, 'Standard',         0.00),
  (2,  1, 'Professional',   500.00),
  (3,  1, 'Enterprise',    1200.00),
  (4,  2, 'Starter',          0.00),
  (5,  2, 'Business',       400.00),
  (6,  3, 'Basic',            0.00),
  (7,  3, 'Premium',        300.00),
  (8,  4, 'Standard',         0.00),
  (9,  4, 'Advanced',       600.00),
  (10, 5, 'Single Warehouse', 0.00),
  (11, 5, 'Multi-Warehouse', 500.00),
  (12, 6, 'Essentials',       0.00),
  (13, 6, 'Growth',         350.00);

SELECT setval('product_variants_id_seq', (SELECT MAX(id) FROM product_variants));

-- ============================================================
-- 6. SUBSCRIPTIONS
-- ============================================================

INSERT INTO subscriptions (id, user_id, product_id, variant_id, status, start_date, next_billing, billing_period, amount)
VALUES
  (1,  7,  1,  3,  'ACTIVE',   '2024-06-15', '2025-03-15', 'MONTHLY', 2400.00),
  (2,  8,  2,  5,  'ACTIVE',   '2024-09-01', '2025-03-01', 'MONTHLY', 1200.00),
  (3,  9,  5, 11,  'AT_RISK',  '2024-03-20', '2025-02-20', 'MONTHLY', 1200.00),
  (4, 10,  4,  9,  'ACTIVE',   '2024-11-10', '2025-05-10', 'MONTHLY', 1500.00),
  (5, 11,  1,  2,  'AT_RISK',  '2024-07-01', '2025-02-01', 'MONTHLY', 1700.00),
  (6, 12,  6, 13,  'CLOSED',   '2024-01-15', NULL,         'MONTHLY',  850.00),
  (7, 13,  3,  7,  'ACTIVE',   '2024-10-20', '2025-04-20', 'MONTHLY',  900.00),
  (8, 14,  2,  4,  'CLOSED',   '2024-02-10', NULL,         'MONTHLY',  800.00);

UPDATE subscriptions SET closed_at = '2024-12-15 00:00:00+05:30' WHERE id = 6;
UPDATE subscriptions SET closed_at = '2024-11-01 00:00:00+05:30' WHERE id = 8;

SELECT setval('subscriptions_id_seq', (SELECT MAX(id) FROM subscriptions));

-- ============================================================
-- 7. INVOICES
-- ============================================================

INSERT INTO invoices (id, invoice_number, subscription_id, user_id, amount, tax_amount, discount_amount, total_amount, status, due_date, retry_count, last_retry_at)
VALUES
  (1, 'INV-2025-001', 1,  7, 24000.00, 4320.00,  0.00, 28800.00, 'PAID',      '2025-01-15', 0, NULL),
  (2, 'INV-2025-002', 2,  8, 12000.00, 2160.00,  0.00, 14400.00, 'PAID',      '2025-01-15', 0, NULL),
  (3, 'INV-2025-003', 3,  9, 12000.00, 2160.00,  0.00, 14400.00, 'FAILED',    '2025-02-15', 3, '2025-02-10 10:00:00+05:30'),
  (4, 'INV-2025-004', 4, 10, 15000.00, 2700.00,  0.00, 18000.00, 'CONFIRMED', '2025-02-15', 0, NULL),
  (5, 'INV-2025-005', 5, 11, 17000.00, 3060.00,  0.00, 20400.00, 'FAILED',    '2025-02-15', 2, '2025-02-08 14:30:00+05:30'),
  (6, 'INV-2025-006', 6, 12,  8500.00, 1530.00,  0.00, 10200.00, 'DRAFT',     '2025-02-20', 0, NULL);

SELECT setval('invoices_id_seq', (SELECT MAX(id) FROM invoices));

-- ============================================================
-- 8. PAYMENTS
-- ============================================================

INSERT INTO payments (id, payment_ref, invoice_id, user_id, amount, method, status, failure_reason)
VALUES
  (1, 'PAY-001',  1,  7, 28800.00, 'UPI',          'SUCCESS', NULL),
  (2, 'PAY-002',  2,  8, 14400.00, 'CREDIT_CARD',  'SUCCESS', NULL),
  (3, 'PAY-003',  3,  9, 14400.00, 'NET_BANKING',  'FAILED',  'Insufficient funds'),
  (4, 'PAY-004',  4, 10, 18000.00, 'UPI',          'PENDING', NULL),
  (5, 'PAY-005',  5, 11, 20400.00, 'CREDIT_CARD',  'FAILED',  'Card declined'),
  (6, 'PAY-006',  6, 12, 10200.00, 'DEBIT_CARD',   'PENDING', NULL),
  (7, 'PAY-007',  3,  9, 14400.00, 'UPI',          'REFUNDED', NULL);

SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));

-- ============================================================
-- 9. PAYMENT RETRIES
-- ============================================================

INSERT INTO payment_retries (invoice_id, payment_id, attempt_number, status, failure_reason, attempted_at)
VALUES
  (3, NULL, 1, 'FAILED', 'Gateway timeout',       '2025-02-03 10:00:00+05:30'),
  (3, NULL, 2, 'FAILED', 'Insufficient funds',    '2025-02-06 10:00:00+05:30'),
  (3, NULL, 3, 'FAILED', 'Bank server down',      '2025-02-10 10:00:00+05:30'),
  (5, NULL, 1, 'FAILED', 'Card expired',          '2025-02-04 14:00:00+05:30'),
  (5, NULL, 2, 'FAILED', 'Card declined',         '2025-02-08 14:30:00+05:30');

-- ============================================================
-- 10. ORDERS
-- ============================================================

INSERT INTO orders (id, order_number, user_id, total_amount, tax_amount, discount_amount, status)
VALUES
  (1, 'ORD-2025-001', 7, 14400.00, 2592.00, 1000.00, 'PAID'),
  (2, 'ORD-2025-002', 7,  9600.00, 1728.00,    0.00, 'PAID'),
  (3, 'ORD-2025-003', 7,  7200.00, 1296.00,  500.00, 'PROCESSING'),
  (4, 'ORD-2025-004', 7,  5400.00,  972.00,    0.00, 'FAILED'),
  (5, 'ORD-2025-005', 7,  6000.00, 1080.00,  200.00, 'PENDING');

SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

-- ============================================================
-- 11. ORDER ITEMS
-- ============================================================

INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, billing_period)
VALUES
  (1, 1, 2,  1, 1700.00, 'MONTHLY'),
  (2, 2, 5,  1, 1200.00, 'MONTHLY'),
  (3, 3, 7,  1,  900.00, 'MONTHLY'),
  (4, 4, 8,  1,  900.00, 'MONTHLY'),
  (5, 6, 13, 2,  850.00, 'MONTHLY');

-- ============================================================
-- 12. CART ITEMS
-- ============================================================

INSERT INTO cart_items (user_id, product_id, variant_id, quantity)
VALUES
  (7, 1, 2,  1),
  (7, 3, 7,  1),
  (7, 6, 12, 2);

-- ============================================================
-- 13. QUOTATIONS
-- ============================================================

INSERT INTO quotations (id, quotation_number, user_id, total_amount, valid_until, status)
VALUES
  (1, 'QOT-001', 15, 34800.00, '2025-03-15', 'SENT'),
  (2, 'QOT-002', 16, 10800.00, '2025-03-01', 'ACCEPTED'),
  (3, 'QOT-003', 14, 18600.00, '2025-02-28', 'EXPIRED'),
  (4, 'QOT-004', 17, 27600.00, '2025-04-01', 'DRAFT'),
  (5, 'QOT-005', 18, 20400.00, '2025-03-20', 'SENT'),
  (6, 'QOT-006', 13, 10800.00, '2025-03-10', 'REJECTED');

SELECT setval('quotations_id_seq', (SELECT MAX(id) FROM quotations));

-- ============================================================
-- 14. QUOTATION ITEMS
-- ============================================================

INSERT INTO quotation_items (quotation_id, product_id, variant_id, quantity, unit_price)
VALUES
  (1, 1, 3, 1, 2400.00),
  (1, 2, 5, 1, 1200.00),
  (2, 3, 7, 1,  900.00),
  (3, 2, 4, 1,  800.00),
  (3, 6, 13, 1, 850.00),
  (4, 5, 11, 1, 1200.00),
  (4, 4, 9,  1, 1500.00),
  (5, 1, 2, 1, 1700.00),
  (6, 4, 8, 1, 900.00);

-- ============================================================
-- 15. DISCOUNTS
-- ============================================================

INSERT INTO discounts (code, description, type, value, min_order, max_uses, used_count, valid_from, valid_until, status)
VALUES
  ('WELCOME20', 'Welcome discount for new customers',       'PERCENTAGE', 20.00,   5000.00,  100,  45, '2025-01-01', '2025-06-30', 'ACTIVE'),
  ('ANNUAL10',  '10% off on annual plans',                  'PERCENTAGE', 10.00,  10000.00,   50,  32, '2025-01-01', '2025-12-31', 'ACTIVE'),
  ('FLAT5K',    'Flat ₹5,000 off on Enterprise plans',      'FIXED',      5000.00, 20000.00,  20,  20, '2024-10-01', '2025-01-31', 'EXPIRED'),
  ('BUNDLE15',  '15% off on 3+ product bundles',            'PERCENTAGE', 15.00,  15000.00,   30,   8, '2025-02-01', '2025-05-31', 'ACTIVE'),
  ('LAUNCH2K',  '₹2,000 launch discount',                  'FIXED',      2000.00,  8000.00, 200, 156, '2024-06-01', '2024-12-31', 'DISABLED');

-- ============================================================
-- 16. TAX RULES
-- ============================================================

INSERT INTO tax_rules (name, rate, type, applicable_to, region, status)
VALUES
  ('GST Standard',             18.00, 'GST',       'All Software Products',  'Pan-India',    'ACTIVE'),
  ('IGST (Inter-State)',       18.00, 'IGST',      'Inter-state supplies',   'Cross-state',  'ACTIVE'),
  ('CGST + SGST (Maharashtra)',18.00, 'CGST_SGST', 'Intra-state supplies',   'Maharashtra',  'ACTIVE'),
  ('CGST + SGST (Karnataka)',  18.00, 'CGST_SGST', 'Intra-state supplies',   'Karnataka',    'ACTIVE'),
  ('Education Cess',            2.00, 'CESS',      'Education products',     'Pan-India',    'INACTIVE'),
  ('Reduced GST',              12.00, 'GST',       'Discounted plans',       'Pan-India',    'ACTIVE');

-- ============================================================
-- Migration 002 COMPLETE ✅
-- ============================================================
