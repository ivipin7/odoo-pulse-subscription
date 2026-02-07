-- OdooPulse Seed Data â€” matches frontend mockData.ts
-- Password for all seed users: "password123" (bcrypt hash of "password123")

-- Admin Users
INSERT INTO users (name, email, password_hash, phone, company, role, department, status, last_login) VALUES
('Priya Sharma',  'priya@odoopulse.in',  '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 99999 11111', 'OdooPulse', 'SUPER_ADMIN', 'Engineering', 'ACTIVE', '2025-02-20 14:30:00+05:30'),
('Arjun Mehta',   'arjun@odoopulse.in',  '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 99999 22222', 'OdooPulse', 'ADMIN',       'Sales',       'ACTIVE', '2025-02-20 11:15:00+05:30'),
('Sneha Patil',   'sneha@odoopulse.in',  '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 99999 33333', 'OdooPulse', 'MANAGER',     'Support',     'ACTIVE', '2025-02-19 16:45:00+05:30'),
('Vikram Singh',  'vikram@odoopulse.in', '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 99999 44444', 'OdooPulse', 'SUPPORT',     'Support',     'ACTIVE', '2025-02-18 09:20:00+05:30'),
('Anita Desai',   'anita@odoopulse.in',  '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 99999 55555', 'OdooPulse', 'MANAGER',     'Finance',     'INACTIVE', '2025-02-15 13:00:00+05:30'),
('Rahul Gupta',   'rahul@odoopulse.in',  '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 99999 66666', 'OdooPulse', 'ADMIN',       'Operations',  'ACTIVE', '2025-02-20 10:00:00+05:30');

-- Customer Users (matching mock subscriptions)
INSERT INTO users (name, email, password_hash, phone, company, gst_number, role, status) VALUES
('Rajesh Kumar',    'rajesh.kumar@acmecorp.in',     '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 98765 43210', 'Acme Corp',        '27AABCU9603R1ZM', 'CUSTOMER', 'ACTIVE'),
('Arun Verma',      'arun@techstart.in',            '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 98765 43211', 'TechStart Inc',    '29AABCT1234R1Z1', 'CUSTOMER', 'ACTIVE'),
('Meera Joshi',     'meera@globaltrade.in',         '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 98765 43212', 'GlobalTrade Ltd',  '27AABCG5678R1Z2', 'CUSTOMER', 'ACTIVE'),
('Suresh Nair',     'suresh@financehub.in',         '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 98765 43213', 'FinanceHub',       '32AABCF9012R1Z3', 'CUSTOMER', 'ACTIVE'),
('Deepa Rao',       'deepa@retailmax.in',           '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 98765 43214', 'RetailMax',        '29AABCR3456R1Z4', 'CUSTOMER', 'ACTIVE'),
('Kiran Deshmukh',  'kiran@mediaflow.in',           '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 98765 43215', 'MediaFlow',        '27AABCM7890R1Z5', 'CUSTOMER', 'ACTIVE'),
('Nitin Shah',      'nitin@buildright.in',          '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 98765 43216', 'BuildRight Co',    '24AABCB1234R1Z6', 'CUSTOMER', 'ACTIVE'),
('Ravi Iyer',       'ravi@datadriven.in',           '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 98765 43217', 'DataDriven LLC',   '27AABCD5678R1Z7', 'CUSTOMER', 'ACTIVE'),
('Pooja Menon',     'pooja@novatech.in',            '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 98765 43218', 'NovaTech Systems', '29AABCN9012R1Z8', 'CUSTOMER', 'ACTIVE'),
('Amit Patel',      'amit@cloudnine.in',            '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 98765 43219', 'CloudNine Ltd',    '27AABCC3456R1Z9', 'CUSTOMER', 'ACTIVE'),
('Sanjay Kulkarni', 'sanjay@urbanretail.in',        '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 98765 43220', 'UrbanRetail',      '27AABCU7890R1ZA', 'CUSTOMER', 'ACTIVE'),
('Lakshmi Reddy',   'lakshmi@greenleaf.in',         '$2b$10$mrKQuYPAhHIDZjpdtgJu0.rdNNwo8rcnuf0BiBfCoDv6NqzcZq/IG', '+91 98765 43221', 'GreenLeaf Farms',  '36AABCG1234R1ZB', 'CUSTOMER', 'ACTIVE');

-- Addresses for Rajesh Kumar (user_id = 7)
INSERT INTO addresses (user_id, label, line1, line2, city, state, pin_code, is_default) VALUES
(7, 'Office',    'Tower B, Floor 12, Cyber Hub', 'Sector 24, Gurugram', 'Gurugram', 'Haryana', '122002', TRUE),
(7, 'Warehouse', 'Plot 45, Industrial Area Phase-II', 'Manesar', 'Gurugram', 'Haryana', '122051', FALSE);

-- Categories
INSERT INTO categories (name) VALUES
('ERP'), ('CRM'), ('HR'), ('Accounting'), ('Inventory'), ('Marketing');

-- Products (matching mockData products)
INSERT INTO products (name, description, base_price, billing_period, category_id) VALUES
('ERP Suite',         'Complete enterprise resource planning solution for growing businesses',  1200.00, 'MONTHLY', 1),
('CRM Pro',           'Customer relationship management with advanced analytics',               800.00, 'MONTHLY', 2),
('HR Management',     'Human resource management with payroll integration',                     600.00, 'MONTHLY', 3),
('Accounting Plus',   'Financial management, reporting, and compliance tools',                  900.00, 'MONTHLY', 4),
('Inventory Control', 'Warehouse and stock management with barcode scanning',                   700.00, 'MONTHLY', 5),
('Marketing Hub',     'Campaign management, email marketing, and lead generation',              500.00, 'MONTHLY', 6);

-- Product Variants
INSERT INTO product_variants (product_id, name, extra_price) VALUES
(1, 'Standard',          0.00),
(1, 'Professional',    500.00),
(1, 'Enterprise',     1200.00),
(2, 'Starter',           0.00),
(2, 'Business',        400.00),
(3, 'Basic',             0.00),
(3, 'Premium',         300.00),
(4, 'Standard',          0.00),
(4, 'Advanced',        600.00),
(5, 'Single Warehouse',  0.00),
(5, 'Multi-Warehouse', 500.00),
(6, 'Essentials',        0.00),
(6, 'Growth',          350.00);

-- Subscriptions (matching mockData)
-- user_id 7=Acme(Rajesh), 8=TechStart(Arun), 9=GlobalTrade(Meera), 10=FinanceHub(Suresh)
-- 11=RetailMax(Deepa), 12=MediaFlow(Kiran), 13=BuildRight(Nitin), 14=DataDriven(Ravi)
INSERT INTO subscriptions (user_id, product_id, variant_id, status, start_date, next_billing, billing_period, amount) VALUES
(7,  1, 3,  'ACTIVE',  '2024-06-15', '2025-03-15', 'MONTHLY', 2400.00),
(8,  2, 5,  'ACTIVE',  '2024-09-01', '2025-03-01', 'MONTHLY', 1200.00),
(9,  5, 11, 'AT_RISK', '2024-03-20', '2025-02-20', 'MONTHLY', 1200.00),
(10, 4, 9,  'ACTIVE',  '2024-11-10', '2025-05-10', 'MONTHLY', 1500.00),
(11, 1, 2,  'AT_RISK', '2024-07-01', '2025-02-01', 'MONTHLY', 1700.00),
(12, 6, 13, 'CLOSED',  '2024-01-15', NULL,         'MONTHLY',  850.00),
(13, 3, 7,  'ACTIVE',  '2024-10-20', '2025-04-20', 'MONTHLY',  900.00),
(14, 2, 4,  'CLOSED',  '2024-02-10', NULL,         'MONTHLY',  800.00);

-- Invoices (matching mockData)
INSERT INTO invoices (invoice_number, subscription_id, user_id, amount, tax_amount, discount_amount, total_amount, status, due_date, retry_count) VALUES
('INV-2025-001', 1, 7,  24000.00, 4320.00, 0,      28800.00,  'PAID',      '2025-01-15', 0),
('INV-2025-002', 2, 8,  12000.00, 2160.00, 0,      14400.00,  'PAID',      '2025-01-15', 0),
('INV-2025-003', 3, 9,  12000.00, 2160.00, 0,      14400.00,  'FAILED',    '2025-02-15', 3),
('INV-2025-004', 4, 10, 15000.00, 2700.00, 0,      18000.00,  'CONFIRMED', '2025-02-15', 0),
('INV-2025-005', 5, 11, 17000.00, 3060.00, 0,      20400.00,  'FAILED',    '2025-02-15', 2),
('INV-2025-006', 6, 12,  8500.00, 1530.00, 0,      10200.00,  'DRAFT',     '2025-02-20', 0);

-- Payments (matching mockData)
INSERT INTO payments (payment_ref, invoice_id, user_id, amount, method, status) VALUES
('PAY-001', 1, 7,  28800.00, 'UPI',         'SUCCESS'),
('PAY-002', 2, 8,  14400.00, 'CREDIT_CARD', 'SUCCESS'),
('PAY-003', 3, 9,  14400.00, 'NET_BANKING', 'FAILED'),
('PAY-004', 4, 10, 18000.00, 'UPI',         'PENDING'),
('PAY-005', 5, 11, 20400.00, 'CREDIT_CARD', 'FAILED'),
('PAY-006', 6, 12, 10200.00, 'DEBIT_CARD',  'PENDING'),
('PAY-007', 3, 9,  14400.00, 'UPI',         'REFUNDED');

-- Payment Retries (for GlobalTrade â€” 3 retries all failed)
INSERT INTO payment_retries (invoice_id, payment_id, attempt_number, status, failure_reason) VALUES
(3, NULL, 1, 'FAILED', 'Gateway timeout'),
(3, NULL, 2, 'FAILED', 'Insufficient funds'),
(3, NULL, 3, 'FAILED', 'Bank declined');

-- Payment Retries for RetailMax â€” 2 retries, both failed
INSERT INTO payment_retries (invoice_id, payment_id, attempt_number, status, failure_reason) VALUES
(5, NULL, 1, 'FAILED', 'Network error'),
(5, NULL, 2, 'FAILED', 'Card expired');

-- Orders (matching mockData)
INSERT INTO orders (order_number, user_id, total_amount, tax_amount, discount_amount, status) VALUES
('ORD-2025-001', 7,  14400.00, 2592.00, 1000.00, 'PAID'),
('ORD-2025-002', 8,   9600.00, 1728.00,    0.00, 'PAID'),
('ORD-2025-003', 9,   7200.00, 1296.00,  500.00, 'PROCESSING'),
('ORD-2025-004', 10,  5400.00,  972.00,    0.00, 'FAILED'),
('ORD-2025-005', 11,  6000.00, 1080.00,  200.00, 'PENDING');

-- Order Items
INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, billing_period) VALUES
(1, 1, 2, 1, 1700.00, 'MONTHLY'),
(2, 2, 5, 1, 1200.00, 'MONTHLY'),
(3, 3, 7, 1,  900.00, 'MONTHLY'),
(4, 4, 8, 1,  900.00, 'MONTHLY'),
(5, 6, 13, 2, 850.00, 'MONTHLY');

-- Cart items for Rajesh Kumar (user_id = 7)
INSERT INTO cart_items (user_id, product_id, variant_id, quantity) VALUES
(7, 1, 2,  1),
(7, 3, 7,  1),
(7, 6, 12, 2);

-- Quotations (matching mockData)
INSERT INTO quotations (quotation_number, user_id, total_amount, valid_until, status) VALUES
('QOT-001', 15, 34800.00, '2025-03-15', 'SENT'),
('QOT-002', 16, 10800.00, '2025-03-01', 'ACCEPTED'),
('QOT-003', 14, 18600.00, '2025-02-28', 'EXPIRED'),
('QOT-004', 17, 27600.00, '2025-04-01', 'DRAFT'),
('QOT-005', 18, 20400.00, '2025-03-20', 'SENT'),
('QOT-006', 13, 10800.00, '2025-03-10', 'REJECTED');

-- Quotation Items
INSERT INTO quotation_items (quotation_id, product_id, variant_id, quantity, unit_price) VALUES
(1, 1, 3, 1, 2400.00),
(1, 2, 5, 1, 1200.00),
(2, 3, 7, 1,  900.00),
(3, 2, 4, 1,  800.00),
(3, 6, 13, 1, 850.00),
(4, 5, 11, 1, 1200.00),
(4, 4, 9, 1, 1500.00),
(5, 1, 2, 1, 1700.00),
(6, 4, 8, 1,  900.00);

-- Discounts (matching mockData)
INSERT INTO discounts (code, description, type, value, min_order, max_uses, used_count, valid_from, valid_until, status) VALUES
('WELCOME20', 'Welcome discount for new customers',    'PERCENTAGE', 20.00, 5000.00,  100, 45,  '2025-01-01', '2025-06-30', 'ACTIVE'),
('ANNUAL10',  '10% off on annual plans',               'PERCENTAGE', 10.00, 10000.00,  50, 32,  '2025-01-01', '2025-12-31', 'ACTIVE'),
('FLAT5K',    'Flat 5000 off on Enterprise plans',      'FIXED',    5000.00, 20000.00,  20, 20,  '2024-10-01', '2025-01-31', 'EXPIRED'),
('BUNDLE15',  '15% off on 3+ product bundles',         'PERCENTAGE', 15.00, 15000.00,  30,  8,  '2025-02-01', '2025-05-31', 'ACTIVE'),
('LAUNCH2K',  '2000 launch discount',                   'FIXED',    2000.00, 8000.00, 200, 156, '2024-06-01', '2024-12-31', 'DISABLED');

-- Tax Rules (matching mockData)
INSERT INTO tax_rules (name, rate, type, applicable_to, region, status) VALUES
('GST Standard',             18.00, 'GST',      'All Software Products', 'Pan-India',    'ACTIVE'),
('IGST (Inter-State)',       18.00, 'IGST',     'Inter-state supplies',  'Cross-state',  'ACTIVE'),
('CGST + SGST (Maharashtra)', 18.00, 'CGST_SGST', 'Intra-state supplies', 'Maharashtra', 'ACTIVE'),
('CGST + SGST (Karnataka)',  18.00, 'CGST_SGST', 'Intra-state supplies', 'Karnataka',    'ACTIVE'),
('Education Cess',            2.00, 'CESS',     'Education products',    'Pan-India',    'INACTIVE'),
('Reduced GST',              12.00, 'GST',      'Discounted plans',      'Pan-India',    'ACTIVE');
