# OdooPulse — Team Work Split

> **24-Hour SNS × Odoo Hackathon**
> Last updated: Feb 7, 2026

---

## Team Members

| # | Name | Role | Branch | Focus Area |
|---|------|------|--------|------------|
| 1 | **Vipin** | Lead / Frontend Integration | `feature/frontend-integration` | API service layer, connect UI to backend, auth flow, demo prep |
| 2 | **Sharan** | Database & Schema | `feature/db-schema` | PostgreSQL schema, ENUMs, constraints, migrations, seed data |
| 3 | **Sindhu** | Core Backend APIs | `feature/api-core` | Express server, modular monolith, CRUD APIs, auth |
| 4 | **Siva** | Payment Recovery Engine | `feature/payment-recovery` | Failed payment retry, state transitions, recovery dashboard |

---

## Current Status

- ✅ **Phase 1 COMPLETE** — Full frontend with 22 routes, layouts, 49 shadcn/ui components, mock data
- ⏳ **Phase 2 NOW** — Backend (PostgreSQL + Express + Modular Monolith)
- ⏳ **Phase 3** — Integration (connect frontend to backend APIs)

---

## Project Repository

```
Repo:   https://github.com/ivipin7/odoo-pulse-subscription
Main:   main (protected — demo-ready only)
Dev:    develop (integration branch)
```

---

## Full Tech Stack

### Frontend (DONE ✅)
| Tech | Purpose |
|------|---------|
| React 18 + TypeScript | UI framework |
| Vite 5.4 | Build tool |
| React Router DOM 6 | Client-side routing |
| Tailwind CSS 3.4 | Styling |
| shadcn/ui (Radix) | 49 UI components |
| TanStack React Query | Server state management |
| React Hook Form + Zod | Form validation |
| Recharts | Charts/analytics |
| Lucide React | Icons |
| Sonner | Toast notifications |

### Backend (TO BUILD)
| Tech | Purpose |
|------|---------|
| Node.js + TypeScript | Runtime |
| Express.js | HTTP framework |
| PostgreSQL 15+ | Database (ONLY allowed) |
| pg (node-postgres) | Database driver |
| bcrypt | Password hashing |
| jsonwebtoken (JWT) | Auth tokens |
| Zod | Request validation |
| dotenv | Environment config |
| cors | CORS middleware |
| helmet | Security headers |

---

## Backend Folder Structure (EVERYONE MUST FOLLOW)

```
server/
├── index.ts                        # Entry point — starts Express
├── config/
│   ├── db.ts                       # PostgreSQL pool connection
│   └── env.ts                      # Environment variables
│
├── middleware/
│   ├── auth.ts                     # JWT verification middleware
│   ├── errorHandler.ts             # Global error handling
│   └── validate.ts                 # Zod validation middleware
│
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts      # POST /api/auth/login, /register
│   │   ├── auth.service.ts         # Business logic (hash, verify, token)
│   │   ├── auth.repository.ts      # DB queries (find user, create user)
│   │   ├── auth.routes.ts          # Express router
│   │   └── auth.schema.ts          # Zod schemas
│   │
│   ├── products/
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── products.repository.ts
│   │   ├── products.routes.ts
│   │   └── products.schema.ts
│   │
│   ├── subscriptions/
│   │   ├── subscriptions.controller.ts
│   │   ├── subscriptions.service.ts
│   │   ├── subscriptions.repository.ts
│   │   ├── subscriptions.routes.ts
│   │   └── subscriptions.schema.ts
│   │
│   ├── invoices/
│   │   ├── invoices.controller.ts
│   │   ├── invoices.service.ts
│   │   ├── invoices.repository.ts
│   │   ├── invoices.routes.ts
│   │   └── invoices.schema.ts
│   │
│   ├── payments/
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts     # ← RECOVERY ENGINE lives here
│   │   ├── payments.repository.ts
│   │   ├── payments.routes.ts
│   │   └── payments.schema.ts
│   │
│   ├── quotations/
│   │   ├── quotations.controller.ts
│   │   ├── quotations.service.ts
│   │   ├── quotations.repository.ts
│   │   ├── quotations.routes.ts
│   │   └── quotations.schema.ts
│   │
│   ├── discounts/
│   │   ├── discounts.controller.ts
│   │   ├── discounts.service.ts
│   │   ├── discounts.repository.ts
│   │   ├── discounts.routes.ts
│   │   └── discounts.schema.ts
│   │
│   ├── taxes/
│   │   ├── taxes.controller.ts
│   │   ├── taxes.service.ts
│   │   ├── taxes.repository.ts
│   │   ├── taxes.routes.ts
│   │   └── taxes.schema.ts
│   │
│   └── users/
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── users.repository.ts
│       ├── users.routes.ts
│       └── users.schema.ts
│
├── db/
│   ├── schema.sql                  # Full DDL — Sharan owns this
│   ├── seed.sql                    # Test data — Sharan owns this
│   └── migrations/                 # Version-ordered migrations
│       ├── 001_initial_schema.sql
│       └── 002_seed_data.sql
│
└── package.json                    # Backend dependencies
```

### Architecture Rule (STRICT)

```
Controller  →  Service  →  Repository  →  Database
   ↑              ↑            ↑
 HTTP only    Business      SQL only
 req/res      logic only    No logic
```

- **Controllers**: Parse request, call service, return response. NO business logic.
- **Services**: All business rules, validations, state transitions. NO SQL here.
- **Repositories**: Raw SQL queries only. NO business decisions.

---

## Lifecycle State Machines (EVERYONE MUST MEMORIZE)

### Invoice Status
```
DRAFT → CONFIRMED → FAILED → PAID
                       ↓
              (retry ≤ 3 times)
                       ↓
               PAID (if success)
```

### Subscription Status
```
DRAFT → QUOTATION → ACTIVE → AT_RISK → CLOSED
                       ↑         ↓
                       └── PAID ──┘  (recovery success)
```

### Transition Rules (ENFORCED IN SERVICES ONLY)
| Trigger | Invoice From → To | Subscription From → To |
|---------|-------------------|------------------------|
| Payment attempt fails | CONFIRMED → FAILED | ACTIVE → AT_RISK |
| Retry succeeds (count ≤ 3) | FAILED → PAID | AT_RISK → ACTIVE |
| Retry limit reached (3) | stays FAILED | AT_RISK → CLOSED |
| Quote accepted | — | QUOTATION → ACTIVE |
| New invoice created | → DRAFT | — |
| Invoice confirmed | DRAFT → CONFIRMED | — |

---

# 📋 SHARAN — Database & Schema

## Branch: `feature/db-schema`

## Your Deliverables
1. `server/db/schema.sql` — Complete DDL
2. `server/db/seed.sql` — Test data matching frontend mock data
3. Working PostgreSQL database that anyone can set up locally

## Setup Instructions (for your machine)
```bash
# Install PostgreSQL 15+ if not installed
# Create database
psql -U postgres -c "CREATE DATABASE odoopulse;"

# Run schema
psql -U postgres -d odoopulse -f server/db/schema.sql

# Run seed
psql -U postgres -d odoopulse -f server/db/seed.sql
```

## Environment File (create `server/.env`)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=odoopulse
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=odoopulse_hackathon_secret_2026
PORT=3001
```

---

## COMPLETE DATABASE SCHEMA

### Rules You MUST Follow
- All tables: `id` as PRIMARY KEY (SERIAL or UUID)
- All tables: `created_at TIMESTAMPTZ DEFAULT NOW()`
- All tables: `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Financial tables: `deleted_at TIMESTAMPTZ NULL` (soft delete — NEVER hard delete)
- All foreign keys: explicit `REFERENCES` with `ON DELETE` behavior
- All status columns: use PostgreSQL `ENUM` types
- All money columns: use `NUMERIC(12,2)`, NEVER `FLOAT`
- CHECK constraints on: amounts (> 0), retry_count (0-3), percentages (0-100)

---

### ENUM Types

```sql
-- Create all ENUM types first
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
```

---

### Table: `users`

```sql
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
```

### Table: `addresses`

```sql
CREATE TABLE addresses (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           VARCHAR(50) NOT NULL,        -- 'Office', 'Warehouse'
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
```

### Table: `categories`

```sql
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,  -- 'ERP', 'CRM', 'HR', etc.
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `products`

```sql
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
    deleted_at      TIMESTAMPTZ                   -- soft delete
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;
```

### Table: `product_variants`

```sql
CREATE TABLE product_variants (
    id              SERIAL PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name            VARCHAR(50) NOT NULL,         -- 'Standard', 'Professional', 'Enterprise'
    extra_price     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
```

### Table: `subscriptions`

```sql
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
    closed_at       TIMESTAMPTZ,                  -- when subscription was closed
    deleted_at      TIMESTAMPTZ                   -- soft delete
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing);
CREATE INDEX idx_subscriptions_at_risk ON subscriptions(status) WHERE status = 'AT_RISK';
```

### Table: `invoices`

```sql
CREATE TABLE invoices (
    id              SERIAL PRIMARY KEY,
    invoice_number  VARCHAR(20) NOT NULL UNIQUE,  -- 'INV-2025-001'
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
    deleted_at      TIMESTAMPTZ                   -- soft delete
);

CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_failed ON invoices(status, retry_count) WHERE status = 'FAILED';
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
```

### Table: `payments`

```sql
CREATE TABLE payments (
    id              SERIAL PRIMARY KEY,
    payment_ref     VARCHAR(20) NOT NULL UNIQUE,  -- 'PAY-001'
    invoice_id      INTEGER NOT NULL REFERENCES invoices(id),
    user_id         INTEGER NOT NULL REFERENCES users(id),
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    method          payment_method NOT NULL,
    status          payment_status NOT NULL DEFAULT 'PENDING',
    gateway_ref     VARCHAR(100),                 -- external payment gateway reference
    failure_reason  TEXT,                          -- why payment failed
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
```

### Table: `payment_retries` (AUDIT LOG — Siva needs this)

```sql
CREATE TABLE payment_retries (
    id              SERIAL PRIMARY KEY,
    invoice_id      INTEGER NOT NULL REFERENCES invoices(id),
    payment_id      INTEGER REFERENCES payments(id),       -- NULL if retry itself failed
    attempt_number  INTEGER NOT NULL CHECK (attempt_number >= 1 AND attempt_number <= 3),
    status          payment_status NOT NULL,                -- SUCCESS or FAILED
    failure_reason  TEXT,
    attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(invoice_id, attempt_number)                     -- can't retry same attempt twice
);

CREATE INDEX idx_retries_invoice ON payment_retries(invoice_id);
```

### Table: `orders`

```sql
CREATE TABLE orders (
    id              SERIAL PRIMARY KEY,
    order_number    VARCHAR(20) NOT NULL UNIQUE,  -- 'ORD-2025-001'
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
```

### Table: `order_items`

```sql
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
```

### Table: `cart_items`

```sql
CREATE TABLE cart_items (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    variant_id      INTEGER REFERENCES product_variants(id),
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, product_id, variant_id)                -- no duplicate cart entries
);

CREATE INDEX idx_cart_user ON cart_items(user_id);
```

### Table: `quotations`

```sql
CREATE TABLE quotations (
    id              SERIAL PRIMARY KEY,
    quotation_number VARCHAR(20) NOT NULL UNIQUE, -- 'QOT-001'
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
```

### Table: `quotation_items`

```sql
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
```

### Table: `discounts`

```sql
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
    CHECK (type != 'PERCENTAGE' OR value <= 100)           -- percentage can't exceed 100
);

CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discounts_status ON discounts(status);
```

### Table: `tax_rules`

```sql
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
```

### Updated-at Trigger (apply to all tables)

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to every table that has updated_at
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
```

---

# 📋 SINDHU — Core Backend APIs

## Branch: `feature/api-core`

## Your Deliverables
1. Express server with modular monolith structure
2. Database connection pool (`pg`)
3. Auth module (register, login, JWT)
4. CRUD APIs for: Products, Subscriptions, Invoices, Quotations, Discounts, Taxes, Users
5. Middleware: auth, error handling, Zod validation
6. Postman/Thunder Client collection

## Prerequisites
- Wait for Sharan's schema — you build repositories against his tables
- Or start with the schema above and coordinate if changes happen

## Setup Steps
```bash
cd server/
npm init -y
npm install express cors helmet dotenv pg bcrypt jsonwebtoken zod
npm install -D typescript @types/express @types/node @types/pg @types/bcrypt @types/jsonwebtoken ts-node-dev
npx tsc --init
```

### tsconfig.json (server)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["./**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### package.json scripts (server)
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

## Database Connection (config/db.ts)
```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'odoopulse',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// Test connection
pool.query('SELECT NOW()').then(() => {
  console.log('✅ PostgreSQL connected');
}).catch((err) => {
  console.error('❌ PostgreSQL connection failed:', err.message);
  process.exit(1);
});
```

---

## API Endpoints You Must Build

### Auth Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (customer) |
| POST | `/api/auth/login` | Login → return JWT |
| GET | `/api/auth/me` | Get current user from JWT |

### Products Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products (with variants) |
| GET | `/api/products/:id` | Get single product with variants |
| POST | `/api/products` | Create product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Soft delete product (admin) |

### Subscriptions Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | List all (admin) or user's subs |
| GET | `/api/subscriptions/:id` | Get single subscription |
| POST | `/api/subscriptions` | Create subscription (from checkout) |
| PATCH | `/api/subscriptions/:id/status` | Update status (service enforces transitions) |

### Invoices Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List all (admin) or user's invoices |
| GET | `/api/invoices/:id` | Get single invoice |
| POST | `/api/invoices` | Create invoice for subscription |
| PATCH | `/api/invoices/:id/status` | Update status (service enforces transitions) |

### Quotations Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quotations` | List all quotations |
| GET | `/api/quotations/:id` | Get single quotation |
| POST | `/api/quotations` | Create quotation |
| PATCH | `/api/quotations/:id/status` | Update status |

### Discounts Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/discounts` | List all discount codes |
| POST | `/api/discounts` | Create discount (admin) |
| PUT | `/api/discounts/:id` | Update discount (admin) |
| POST | `/api/discounts/validate` | Validate a discount code |

### Taxes Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/taxes` | List all tax rules |
| POST | `/api/taxes` | Create tax rule (admin) |
| PUT | `/api/taxes/:id` | Update tax rule (admin) |

### Users Module (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users (admin) |
| GET | `/api/users/:id` | Get single user |
| PATCH | `/api/users/:id` | Update user role/status (admin) |

### Orders Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List user's orders |
| GET | `/api/orders/:id` | Get order with items |
| POST | `/api/orders` | Create order (from checkout) |

### Cart Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user's cart items |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:id` | Update quantity |
| DELETE | `/api/cart/:id` | Remove item |

### Profile Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile + addresses |
| PUT | `/api/profile` | Update profile |
| POST | `/api/profile/addresses` | Add address |
| PUT | `/api/profile/addresses/:id` | Update address |
| DELETE | `/api/profile/addresses/:id` | Delete address |

---

## Example: How a Module Should Look

### products.repository.ts
```typescript
import { pool } from '../../config/db';

export const ProductRepository = {
  async findAll() {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name,
        json_agg(json_build_object('id', pv.id, 'name', pv.name, 'extra_price', pv.extra_price)) as variants
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE p.deleted_at IS NULL AND p.is_active = TRUE
      GROUP BY p.id, c.name
      ORDER BY p.id
    `);
    return result.rows;
  },

  async findById(id: number) {
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL', [id]
    );
    return result.rows[0] || null;
  },

  async create(data: { name: string; description: string; base_price: number; category_id: number; billing_period: string }) {
    const result = await pool.query(
      `INSERT INTO products (name, description, base_price, category_id, billing_period)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.name, data.description, data.base_price, data.category_id, data.billing_period]
    );
    return result.rows[0];
  },

  async softDelete(id: number) {
    await pool.query('UPDATE products SET deleted_at = NOW() WHERE id = $1', [id]);
  },
};
```

### products.service.ts
```typescript
import { ProductRepository } from './products.repository';

export const ProductService = {
  async getAllProducts() {
    return ProductRepository.findAll();
  },

  async getProductById(id: number) {
    const product = await ProductRepository.findById(id);
    if (!product) throw new Error('Product not found');
    return product;
  },

  async createProduct(data: any) {
    // business validations here
    if (data.base_price <= 0) throw new Error('Price must be positive');
    return ProductRepository.create(data);
  },

  async deleteProduct(id: number) {
    const product = await ProductRepository.findById(id);
    if (!product) throw new Error('Product not found');
    return ProductRepository.softDelete(id);
  },
};
```

### products.controller.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { ProductService } from './products.service';

export const ProductController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getAllProducts();
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getProductById(Number(req.params.id));
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },
};
```

---

## API Response Format (STANDARD — everyone must use)

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "optional"
}
```

### Success (list)
```json
{
  "success": true,
  "data": [ ... ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [ ... ]
  }
}
```

---

# 📋 SIVA — Payment Recovery Engine

## Branch: `feature/payment-recovery`

## Your Deliverables
1. Payment processing endpoints (simulate gateway)
2. Failed payment retry engine (THE CORE FEATURE)
3. Recovery dashboard API (KPIs for admin dashboard)
4. `payment_retries` audit log
5. This must be **demoable in 60 seconds** to judges

## Prerequisites
- Needs Sharan's `invoices`, `payments`, `payment_retries`, `subscriptions` tables
- Needs Sindhu's base server setup (Express, auth middleware, db pool)
- Can start coding service logic independently and wire up later

---

## Endpoints You Own

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/process` | Simulate payment for an invoice |
| POST | `/api/payments/retry/:invoiceId` | Retry failed payment (idempotent) |
| GET | `/api/payments` | List all payments |
| GET | `/api/payments/:id` | Get single payment |
| GET | `/api/recovery/dashboard` | Recovery KPIs (failed, at-risk, recovered, revenue) |
| GET | `/api/recovery/at-risk` | At-risk subscriptions with details |
| GET | `/api/recovery/timeline` | Recovery actions audit log |

---

## CORE: Retry Logic (payments.service.ts)

**THIS IS THE MOST IMPORTANT FILE IN THE ENTIRE PROJECT**

```typescript
import { pool } from '../../config/db';

export const PaymentService = {

  /**
   * Retry a failed payment
   * RULES:
   * 1. Only FAILED invoices can be retried
   * 2. Max 3 retries (CHECK constraint in DB)
   * 3. Must be idempotent
   * 4. PAID invoices must NEVER be retried
   * 5. Records every attempt in payment_retries audit log
   */
  async retryPayment(invoiceId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock the invoice row (prevent race conditions)
      const invoiceResult = await client.query(
        'SELECT * FROM invoices WHERE id = $1 FOR UPDATE',
        [invoiceId]
      );
      const invoice = invoiceResult.rows[0];

      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status === 'PAID') throw new Error('Invoice already paid — cannot retry');
      if (invoice.status !== 'FAILED') throw new Error('Only FAILED invoices can be retried');
      if (invoice.retry_count >= 3) throw new Error('Maximum retry limit (3) reached');

      // 2. Simulate payment gateway call
      const paymentSuccess = this.simulatePaymentGateway();

      // 3. Record the retry attempt (audit log)
      const attemptNumber = invoice.retry_count + 1;
      const retryStatus = paymentSuccess ? 'SUCCESS' : 'FAILED';

      await client.query(
        `INSERT INTO payment_retries (invoice_id, attempt_number, status, failure_reason)
         VALUES ($1, $2, $3, $4)`,
        [invoiceId, attemptNumber, retryStatus, paymentSuccess ? null : 'Simulated failure']
      );

      // 4. Update invoice
      if (paymentSuccess) {
        // SUCCESS: invoice → PAID
        await client.query(
          `UPDATE invoices SET status = 'PAID', retry_count = $1, last_retry_at = NOW(), updated_at = NOW()
           WHERE id = $2`,
          [attemptNumber, invoiceId]
        );

        // Create successful payment record
        await client.query(
          `INSERT INTO payments (payment_ref, invoice_id, user_id, amount, method, status)
           VALUES ($1, $2, $3, $4, 'UPI', 'SUCCESS')`,
          [`PAY-RETRY-${invoiceId}-${attemptNumber}`, invoiceId, invoice.user_id, invoice.total_amount]
        );

        // SUCCESS: subscription → ACTIVE
        await client.query(
          `UPDATE subscriptions SET status = 'ACTIVE', updated_at = NOW()
           WHERE id = $1 AND status = 'AT_RISK'`,
          [invoice.subscription_id]
        );
      } else {
        // FAILED: increment retry count
        await client.query(
          `UPDATE invoices SET retry_count = $1, last_retry_at = NOW(), updated_at = NOW()
           WHERE id = $2`,
          [attemptNumber, invoiceId]
        );

        // If retry limit reached → close subscription
        if (attemptNumber >= 3) {
          await client.query(
            `UPDATE subscriptions SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW()
             WHERE id = $1 AND status = 'AT_RISK'`,
            [invoice.subscription_id]
          );
        }
      }

      await client.query('COMMIT');

      return {
        invoiceId,
        attempt: attemptNumber,
        success: paymentSuccess,
        invoiceStatus: paymentSuccess ? 'PAID' : 'FAILED',
        subscriptionStatus: paymentSuccess ? 'ACTIVE' : (attemptNumber >= 3 ? 'CLOSED' : 'AT_RISK'),
        retriesRemaining: 3 - attemptNumber,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Simulate payment gateway (mock)
   * In demo: make this succeed on 2nd or 3rd retry to show recovery
   * Returns true ~60% of the time
   */
  simulatePaymentGateway(): boolean {
    return Math.random() > 0.4;
  },

  /**
   * Recovery Dashboard KPIs
   */
  async getRecoveryDashboard() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM invoices WHERE status = 'FAILED') as failed_count,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'AT_RISK') as at_risk_count,
        (SELECT COUNT(*) FROM payment_retries WHERE status = 'SUCCESS') as recovered_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'FAILED') as revenue_at_risk,
        (SELECT COALESCE(SUM(i.total_amount), 0)
         FROM invoices i
         JOIN payment_retries pr ON pr.invoice_id = i.id
         WHERE pr.status = 'SUCCESS') as revenue_recovered
    `);
    return result.rows[0];
  },

  /**
   * Get at-risk subscriptions with retry details
   */
  async getAtRiskSubscriptions() {
    const result = await pool.query(`
      SELECT s.*, u.name as customer_name, u.email,
        p.name as product_name,
        i.id as invoice_id, i.invoice_number, i.retry_count, i.total_amount,
        i.last_retry_at
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN products p ON s.product_id = p.id
      LEFT JOIN invoices i ON i.subscription_id = s.id AND i.status = 'FAILED'
      WHERE s.status = 'AT_RISK'
      ORDER BY i.retry_count DESC, s.updated_at DESC
    `);
    return result.rows;
  },

  /**
   * Recovery timeline (audit log)
   */
  async getRecoveryTimeline() {
    const result = await pool.query(`
      SELECT pr.*, i.invoice_number, u.name as customer_name
      FROM payment_retries pr
      JOIN invoices i ON pr.invoice_id = i.id
      JOIN users u ON i.user_id = u.id
      ORDER BY pr.attempted_at DESC
      LIMIT 20
    `);
    return result.rows;
  },
};
```

---

## Demo Script (Practice This)

**60-second demo to judges:**

1. Show Admin Dashboard → point out "Failed Payments: 2", "At-Risk: 2"
2. Go to At-Risk page → show GlobalTrade Ltd (3 retries used → CLOSED)
3. Go to RetailMax (2 retries used, 1 remaining) → click "Retry"
4. Show success → invoice flips to PAID → subscription back to ACTIVE
5. Show payment_retries audit log → "every attempt is tracked"
6. Say: *"The system automatically recovers revenue before closing subscriptions. Every retry is idempotent, audited, and explainable."*

---

# 📋 VIPIN — Frontend Integration & Lead

## Branch: `feature/frontend-integration`

## Your Deliverables
1. API service layer (`src/services/*.ts`)
2. Connect all 22 pages to backend APIs
3. Auth flow (login → JWT → protected routes)
4. Loading states, error handling, toast notifications
5. Integration coordination across all members
6. Demo prep & README updates

## Prerequisites
- Sindhu's APIs must be running
- Siva's recovery endpoints must be ready
- Sharan's DB must be seeded

---

## API Service Layer Structure

Create these files in the frontend:
```
src/
└── services/
    ├── api.ts              # Axios/fetch base config + JWT interceptor
    ├── auth.service.ts     # login, register, getMe
    ├── products.service.ts # getAll, getById, create, update, delete
    ├── subscriptions.service.ts
    ├── invoices.service.ts
    ├── payments.service.ts # retry, getRecoveryDashboard
    ├── orders.service.ts
    ├── cart.service.ts
    ├── quotations.service.ts
    ├── discounts.service.ts
    ├── taxes.service.ts
    └── users.service.ts
```

### Base API Config (src/services/api.ts)
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Request failed');
  }
  const json = await res.json();
  return json.data;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: any) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: any) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: any) => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
```

### Environment File (create `.env` in frontend root)
```env
VITE_API_URL=http://localhost:3001/api
```

---

## Page → API Mapping

| Frontend Page | API Calls Needed |
|--------------|------------------|
| Login | `POST /auth/login` |
| Signup | `POST /auth/register` |
| Shop | `GET /products` |
| ProductDetail | `GET /products/:id` |
| Cart | `GET /cart`, `POST /cart`, `PUT /cart/:id`, `DELETE /cart/:id` |
| Checkout | `POST /orders`, `POST /subscriptions` |
| Orders | `GET /orders` |
| OrderDetail | `GET /orders/:id` |
| Profile | `GET /profile`, `PUT /profile`, `POST /profile/addresses` |
| Admin Dashboard | `GET /recovery/dashboard` |
| Admin Subscriptions | `GET /subscriptions` |
| Admin At-Risk | `GET /recovery/at-risk`, `POST /payments/retry/:id` |
| Admin Invoices | `GET /invoices` |
| Admin Payments | `GET /payments`, `POST /payments/retry/:id` |
| Admin Quotations | `GET /quotations`, `PATCH /quotations/:id/status` |
| Admin Products | `GET /products`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id` |
| Admin Discounts | `GET /discounts`, `POST /discounts`, `PUT /discounts/:id` |
| Admin Taxes | `GET /taxes`, `POST /taxes`, `PUT /taxes/:id` |
| Admin Users | `GET /users`, `PATCH /users/:id` |
| Admin Reports | `GET /recovery/dashboard` (reuse KPIs) |

---

## Integration Checklist

- [ ] Backend `.env` set up with PostgreSQL credentials
- [ ] Frontend `.env` set up with `VITE_API_URL`
- [ ] `npm run dev` on backend (port 3001) — Sindhu confirms
- [ ] `npm run dev` on frontend (port 5173) — Vipin confirms
- [ ] Auth flow working (register → login → JWT stored → protected routes)
- [ ] Products loading from DB on Shop page
- [ ] Subscriptions loading on Admin page
- [ ] Failed payment retry working end-to-end
- [ ] Recovery dashboard showing real KPIs
- [ ] At-Risk page retry button triggers actual retry
- [ ] Status badges reflect real DB status
- [ ] All CRUD operations working
- [ ] Demo scenario rehearsed

---

## Timeline

| Hour | Sharan (DB) | Sindhu (API) | Siva (Recovery) | Vipin (Frontend) |
|------|-------------|--------------|-----------------|------------------|
| 0-2 | Schema DDL + ENUMs | Express setup + folder structure | Study retry logic design | Service layer skeleton |
| 2-4 | All tables + constraints | DB connection + Auth module | Payment service scaffold | Auth integration |
| 4-6 | Seed data | Products + Subscriptions API | Retry engine (core logic) | Connect Shop + Products |
| 6-8 | Indexes + test queries | Invoices + Orders API | payment_retries audit log | Connect Orders + Cart |
| 8-10 | Schema fixes from team | Quotations + Discounts + Taxes | Recovery dashboard API | Connect Admin pages |
| 10-14 | Help debug queries | Users + Cart + Profile API | At-risk API + timeline | At-Risk + Retry integration |
| 14-18 | Query optimization | API testing + edge cases | Demo scenario prep | Loading/error states |
| 18-22 | Support team | Bug fixes | Final retry testing | Polish + bug fixes |
| 22-24 | **ALL: Final integration, demo rehearsal, presentation prep** ||||

---

## Communication Rules

1. **Schema changes** → Sharan announces in group, everyone pulls
2. **API ready** → Sindhu pushes + shares endpoint in group
3. **Recovery engine ready** → Siva announces, Vipin integrates
4. **Blocker** → Speak up immediately, don't waste time stuck
5. **Every 2 hours** → Quick sync: "What's done? What's next? Any blockers?"

---

## Git Commands Quick Reference

```bash
# Start your work
git checkout develop
git pull origin develop
git checkout -b feature/your-branch

# Commit (use proper prefix!)
git add -A
git commit -m "feat: add invoice CRUD repository"

# Push
git push origin feature/your-branch

# When ready to integrate
# Create PR: feature/your-branch → develop
# After merge, everyone pulls develop
git checkout develop
git pull origin develop
```

### Commit Prefixes
| Prefix | When |
|--------|------|
| `feat:` | New feature/endpoint/page |
| `fix:` | Bug fix |
| `refactor:` | Code restructure, no behavior change |
| `chore:` | Config, deps, setup |
| `docs:` | Documentation |
| `test:` | Tests |

**NEVER use:** "final", "done", "hackathon", "fix2", "asdf"
