# OdooPulse — Subscription Management System

> **24-Hour SNS × Odoo Hackathon Project**
> A full-featured subscription lifecycle management platform built for SaaS / ERP businesses. Manages the complete flow from product catalog → checkout → subscription tracking → payment recovery → admin analytics.

---

## Table of Contents

- [Hackathon Rules & Constraints](#hackathon-rules--constraints)
- [Core Differentiator](#core-differentiator)
- [Lifecycle State Machines](#lifecycle-state-machines)
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Pages & Routes (22 Total)](#pages--routes-22-total)
- [Component Architecture](#component-architecture)
- [Design System](#design-system)
- [Mock Data Models](#mock-data-models)
- [Team Work Split (4 Members)](#team-work-split-4-members)
- [Git Workflow](#git-workflow)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Team](#team)

---

## Hackathon Rules & Constraints

> **These rules are NON-NEGOTIABLE. Every contributor must read before writing any code.**

### Technology Rules
- **PostgreSQL ONLY** for database — no MongoDB, Firebase, Supabase, or NoSQL
- SQL-first approach with normalized schema (3NF)
- Backend: **Modular Monolith** architecture
- Strict layering: `Controllers → Services → Repositories → Database`
- Business logic lives ONLY in **Services**
- Repositories contain ONLY SQL / DB access logic
- **No blockchain** (explicitly disallowed)
- Entry-level encryption only: password hashing (bcrypt), secure tokens — no advanced crypto

### Scope Rules
- Do NOT add features beyond the problem statement
- Do NOT invent new modules or hype features (AI decisions, ML, blockchain)
- One strong feature > many weak features
- Focus on **correctness** of existing features

### AI Usage Rules
- AI can ONLY: explain insights in business language, summarize system behavior
- AI must NOT: perform financial calculations, change states, decide business rules, control workflows
- All decisions must be **deterministic and rule-based**

### Database & Data Integrity Rules
- Schema must use: ENUMs, FOREIGN KEYS, CHECK constraints, UNIQUE constraints
- Status transitions enforced in service logic
- Historical data must **never** be recalculated
- **No hard deletes** for financial records (soft delete only)
- Retry limits enforced at service + DB level

### Frontend Rules (Phase 1 — COMPLETED ✅)
- UI-only implementation (static/mock data)
- No API calls, no backend assumptions, no real auth
- Navigation and layout complete
- Status badges mandatory everywhere
- Admin and Customer portals clearly separated

### Design & UX Rules
- Clean, professional, ERP-style UI — no flashy animations
- Clarity > creativity
- UI must visually communicate lifecycle states

### Judging Mindset
- Correctness > complexity
- Lifecycle logic > UI polish
- Explainable automation > black-box intelligence
- Every feature must be explainable in **under 60 seconds**
- System must feel **enterprise-ready**, not demo-only

---

## Core Differentiator

### 🎯 Failed Payment Recovery Automation

This is the **PRIMARY feature** that differentiates OdooPulse from other submissions.

**How it works:**
1. Payment fails → Invoice marked `FAILED` → Subscription moves to `AT_RISK`
2. System tracks `retry_count` and `last_retry_date` per invoice
3. Auto-retry up to **3 attempts** with idempotent logic
4. Successful retry → Invoice `PAID` → Subscription back to `ACTIVE`
5. All 3 retries fail → Subscription `CLOSED` (cannot auto-reactivate)

**Hard Rules:**
- Paid invoices must NEVER be retried
- Retry must be idempotent (same result if called multiple times)
- Retry logic must be explicit, auditable, and explainable
- CLOSED subscriptions cannot auto-reactivate

---

## Lifecycle State Machines

### Invoice Status Flow
```
DRAFT → CONFIRMED → FAILED → PAID
                       ↓
              (retry ≤ 3 times)
                       ↓
               PAID (success)
```

### Subscription Status Flow
```
DRAFT → QUOTATION → ACTIVE → AT_RISK → CLOSED
                       ↑         ↓
                       └── PAID ──┘  (recovery success)
```

**Transition Rules:**
| Trigger | From | To |
|---------|------|----|
| Payment fails | Invoice: CONFIRMED | Invoice: FAILED |
| Invoice fails | Subscription: ACTIVE | Subscription: AT_RISK |
| Retry succeeds | Invoice: FAILED | Invoice: PAID |
| Invoice paid | Subscription: AT_RISK | Subscription: ACTIVE |
| Retry limit (3) hit | Subscription: AT_RISK | Subscription: CLOSED |
| Quote accepted | Subscription: QUOTATION | Subscription: ACTIVE |

---

## Overview

OdooPulse is a Subscription Management System that covers the entire subscription lifecycle:

1. **Customer Portal** — Browse products, manage cart, checkout, view orders & profile
2. **Authentication** — Login, signup, password reset flows
3. **Admin Panel** — Dashboard, subscription tracking, at-risk recovery, payments, invoices, quotations, products, discounts, taxes, user management, and analytics/reports

Built from scratch in a 24-hour hackathon with a team of 4 developers.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
### Frontend
| Layer | Technology | Version |
|-------|-----------|----------|
| **Framework** | React | 18.3 |
| **Build Tool** | Vite | 5.4 |
| **Language** | TypeScript | 5.8 |
| **Routing** | React Router DOM | 6.30 |
| **Styling** | Tailwind CSS | 3.4 |
| **UI Components** | shadcn/ui (Radix Primitives) | Latest |
| **Charts** | Recharts | 2.15 |
| **Forms** | React Hook Form + Zod | 7.61 / 3.25 |
| **State/Server** | TanStack React Query | 5.83 |
| **Icons** | Lucide React | 0.462 |
| **Notifications** | Sonner + Radix Toast | — |
| **Animations** | tailwindcss-animate | 1.0 |
| **Date Utils** | date-fns | 3.6 |
| **Testing** | Vitest + Testing Library | 3.2 |

### Backend (Phase 2 — To Be Implemented)
| Layer | Technology | Notes |
|-------|-----------|-------|
| **Runtime** | Node.js + TypeScript | Same language as frontend |
| **Framework** | Express.js or Fastify | REST API |
| **Database** | PostgreSQL | ONLY allowed DB |
| **ORM/Query** | Prisma or raw SQL (pg) | Type-safe queries |
| **Auth** | bcrypt + JWT | Password hashing + tokens |
| **Validation** | Zod | Shared with frontend |
| **Architecture** | Modular Monolith | Controllers → Services → Repositories |

### Key Libraries

- `class-variance-authority` — Component variant management
- `clsx` + `tailwind-merge` — Conditional class merging
- `cmdk` — Command palette
- `vaul` — Drawer component
- `embla-carousel-react` — Carousel
- `react-resizable-panels` — Resizable layouts
- `react-day-picker` — Calendar/date picker
- `input-otp` — OTP input fields

---

## Features

### Customer Portal (8 pages)
- **Landing Page** — Hero section, feature highlights, footer
- **Product Shop** — Search, category filtering, sort by price/name, product grid with gradient cards
- **Product Detail** — 3-tier pricing (Monthly / 6-Month / Yearly with % savings), variant selector, quantity controls, price summary
- **Shopping Cart** — Line items with quantity controls, order summary, discount code input
- **Checkout** — 3-step wizard (Address → Payment → Confirmation), saved address selection, payment form
- **Orders List** — ERP-style table with status badges, order filtering
- **Order Detail** — Invoice-style layout with bill-to info, line items, tax/discount breakdown, retry payment for failed orders
- **Profile** — Personal details form, multiple address management (Office/Warehouse)

### Authentication (3 pages)
- **Login** — Email/password with remember me, show/hide password toggle, forgot password link
- **Signup** — Full registration (name, company, email, phone, password, GST number, terms)
- **Reset Password** — Email input → success confirmation with "check your email" state

### Admin Panel (11 pages)
- **Dashboard** — 4 KPI cards (Failed Payments, At-Risk, Recovered, Revenue), recent failed invoices panel, at-risk subscriptions panel
- **Subscriptions** — Full subscription list with ID, customer, plan, dates, status badges
- **At-Risk** — KPI row (Total At-Risk, Revenue at Risk, Failed Payments, Avg Days Overdue), detail table with risk reasons, call/email/retry actions, recovery timeline
- **Invoices** — Invoice ledger with customer, amount, date, status
- **Payments** — Payment ledger with method, retry count, refund tracking, retry actions for failed payments
- **Quotations** — Quote management with product lists, validity dates, send/accept actions, summary stats
- **Products** — Product CRUD table with category badges, variant listing, edit/delete actions
- **Discounts** — Discount code management with usage progress bars, type (% / ₹), min order, validity ranges
- **Taxes** — Tax rule configuration (GST / IGST / CGST+SGST / CESS), rate, region, applicability
- **Users** — User management with role badges (Super Admin / Admin / Manager / Support), avatar initials, department, last login
- **Reports** — Revenue trend bars, product revenue breakdown, invoice status summary, subscription pie breakdown with visual bar

### Shared Features
- Responsive design (mobile hamburger menu + desktop nav)
- Status badge system (success / warning / danger / info / neutral) with consistent color mapping
- KPI cards with trend indicators
- ERP-style data tables with hover states
- Breadcrumb navigation on admin pages
- HSL CSS variable theming (dark navy primary + cyan accent)

---

## Pages & Routes (22 Total)

### Portal Routes
| Route | Page | File |
|-------|------|------|
| `/` | Landing / Home | `pages/Index.tsx` |
| `/shop` | Product Catalog | `pages/Shop.tsx` |
| `/shop/:id` | Product Detail | `pages/ProductDetail.tsx` |
| `/cart` | Shopping Cart | `pages/Cart.tsx` |
| `/checkout` | Checkout Wizard | `pages/Checkout.tsx` |
| `/orders` | My Orders | `pages/Orders.tsx` |
| `/orders/:id` | Order Detail | `pages/OrderDetail.tsx` |
| `/profile` | User Profile | `pages/Profile.tsx` |

### Auth Routes
| Route | Page | File |
|-------|------|------|
| `/login` | Sign In | `pages/Login.tsx` |
| `/signup` | Create Account | `pages/Signup.tsx` |
| `/reset-password` | Reset Password | `pages/ResetPassword.tsx` |

### Admin Routes (nested under `/admin` with sidebar layout)
| Route | Page | File |
|-------|------|------|
| `/admin` | Dashboard | `pages/admin/Dashboard.tsx` |
| `/admin/subscriptions` | Subscriptions | `pages/admin/Subscriptions.tsx` |
| `/admin/at-risk` | At-Risk Recovery | `pages/admin/AtRisk.tsx` |
| `/admin/invoices` | Invoices | `pages/admin/Invoices.tsx` |
| `/admin/payments` | Payments | `pages/admin/Payments.tsx` |
| `/admin/quotations` | Quotations | `pages/admin/Quotations.tsx` |
| `/admin/products` | Products | `pages/admin/Products.tsx` |
| `/admin/discounts` | Discount Codes | `pages/admin/Discounts.tsx` |
| `/admin/taxes` | Tax Configuration | `pages/admin/Taxes.tsx` |
| `/admin/users` | User Management | `pages/admin/Users.tsx` |
| `/admin/reports` | Reports & Analytics | `pages/admin/Reports.tsx` |

### Other
| Route | Page | File |
|-------|------|------|
| `*` | 404 Not Found | `pages/NotFound.tsx` |

---

## Project Structure

```
src/
├── App.tsx                          # Root component — router + providers
├── main.tsx                         # Entry point
├── index.css                        # Tailwind + HSL theme variables + custom CSS
├── vite-env.d.ts                    # Vite type declarations
│
├── components/
│   ├── layout/
│   │   ├── TopNav.tsx               # Portal sticky navbar (Home/Shop/Orders/Admin/Login)
│   │   └── AdminLayout.tsx          # Admin sidebar (11 links) + Outlet
│   │
│   ├── shared/
│   │   ├── KPICard.tsx              # Metric card with icon + trend
│   │   ├── PageHeader.tsx           # Title + breadcrumbs + action slot
│   │   ├── ProductCard.tsx          # Gradient product card with category icon
│   │   └── StatusBadge.tsx          # Universal status → color mapper
│   │
│   ├── ui/                          # 49 shadcn/ui components (Radix-based)
│   │   ├── button.tsx               # Includes custom "accent" variant
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── dialog.tsx
│   │   ├── badge.tsx
│   │   ├── toast.tsx / toaster.tsx / sonner.tsx
│   │   └── ... (48 more)
│   │
│   └── NavLink.tsx                  # react-router NavLink wrapper with active class
│
├── data/
│   └── mockData.ts                  # All mock data + TypeScript interfaces
│       ├── Product (6 items)
│       ├── Order (5 items)
│       ├── Subscription (8 items)
│       ├── Invoice (6 items)
│       ├── CartItem (3 items)
│       ├── Payment (7 items)
│       ├── Quotation (6 items)
│       ├── Discount (5 items)
│       ├── TaxRule (6 items)
│       ├── AdminUser (6 items)
│       └── userProfile + categories
│
├── hooks/
│   ├── use-mobile.tsx               # Mobile breakpoint detection
│   └── use-toast.ts                 # Toast notification hook
│
├── lib/
│   └── utils.ts                     # cn() utility (clsx + tailwind-merge)
│
├── pages/
│   ├── Index.tsx                    # Landing page
│   ├── Shop.tsx                     # Product catalog
│   ├── ProductDetail.tsx            # Product detail + pricing tiers
│   ├── Cart.tsx                     # Shopping cart
│   ├── Checkout.tsx                 # 3-step checkout
│   ├── Orders.tsx                   # Orders list
│   ├── OrderDetail.tsx              # Single order detail
│   ├── Profile.tsx                  # User profile
│   ├── Login.tsx                    # Sign in
│   ├── Signup.tsx                   # Registration
│   ├── ResetPassword.tsx            # Password reset
│   ├── NotFound.tsx                 # 404
│   │
│   └── admin/
│       ├── Dashboard.tsx            # Admin dashboard + KPIs
│       ├── Subscriptions.tsx        # Subscription list
│       ├── AtRisk.tsx               # At-risk recovery
│       ├── Invoices.tsx             # Invoice list
│       ├── Payments.tsx             # Payment ledger
│       ├── Quotations.tsx           # Quotation management
│       ├── Products.tsx             # Product CRUD
│       ├── Discounts.tsx            # Discount codes
│       ├── Taxes.tsx                # Tax rules
│       ├── Users.tsx                # User management
│       └── Reports.tsx              # Analytics & reports
│
└── test/                            # Test files
```

---

## Component Architecture

```
App.tsx
├── QueryClientProvider (TanStack)
├── TooltipProvider (Radix)
├── Toaster (Radix Toast)
├── Sonner (Sonner Toast)
└── BrowserRouter
    ├── Portal Pages → wrapped with <TopNav /> inside each page
    ├── Auth Pages → standalone (no nav)
    └── /admin → <AdminLayout>
        ├── Fixed Sidebar (w-60, bg-sidebar, 11 nav items)
        └── <Outlet /> → Admin page content
```

---

## Design System

### Color Palette (HSL CSS Variables)
| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `222 47% 15%` | Dark navy — headers, sidebar, buttons |
| `--accent` | `199 89% 48%` | Cyan — CTAs, links, highlights |
| `--background` | `220 14% 96%` | Light gray page background |
| `--card` | `0 0% 100%` | White cards |
| `--destructive` | `0 84% 60%` | Red — errors, danger |
| `--sidebar-background` | `222 47% 11%` | Very dark navy sidebar |
| `--sidebar-primary` | `199 89% 48%` | Cyan sidebar accents |

### Status Badge Colors
| Status | Color | CSS Class |
|--------|-------|-----------|
| ACTIVE, PAID, SUCCESS, ACCEPTED | Green | `status-badge-success` |
| AT_RISK, PENDING, SENT | Amber | `status-badge-warning` |
| FAILED, REJECTED | Red | `status-badge-danger` |
| PROCESSING, CONFIRMED, REFUNDED | Blue | `status-badge-info` |
| DRAFT, CLOSED, EXPIRED, DISABLED, INACTIVE | Gray | `status-badge-neutral` |

### Custom CSS Classes
- `.erp-table` — Styled `<table>` with `th`/`td` padding, borders, hover rows
- `.kpi-card` — Metric card with shadow + rounded border
- `.kpi-value` — Large bold metric number
- `.kpi-label` — Small muted label text
- `.status-badge` — Inline pill badge base

---

## Mock Data Models

| Model | Count | Key Fields |
|-------|-------|------------|
| `Product` | 6 | id, name, description, price, period, category, variants[] |
| `Order` | 5 | id, date, total, status, items[], tax, discount |
| `Subscription` | 8 | id, customer, plan, status (ACTIVE/AT_RISK/CLOSED), startDate, nextBilling |
| `Invoice` | 6 | id, customer, amount, status (DRAFT/CONFIRMED/FAILED/PAID), date |
| `Payment` | 7 | id, invoiceId, customer, amount, method, status, date, retryCount |
| `Quotation` | 6 | id, customer, products[], totalAmount, validUntil, status, date |
| `Discount` | 5 | id, code, description, type (PERCENTAGE/FIXED), value, minOrder, maxUses, usedCount, validity, status |
| `TaxRule` | 6 | id, name, rate, type (GST/IGST/CGST+SGST/CESS), applicableTo, region, status |
| `AdminUser` | 6 | id, name, email, role (SUPER_ADMIN/ADMIN/MANAGER/SUPPORT), department, lastLogin, status |
| `CartItem` | 3 | productId, name, price, period, variant, qty |
| `userProfile` | 1 | name, email, phone, company, gst, addresses[] |
| `categories` | 7 | "All", "ERP", "CRM", "HR", "Accounting", "Inventory", "Marketing" |

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9 (or Bun)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd odoo-pulse-ui-main

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at **http://localhost:5173**

### Production Build

```bash
npm run build
npm run preview
```

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start dev server with HMR |
| `build` | `vite build` | Production build to `dist/` |
| `build:dev` | `vite build --mode development` | Development build |
| `preview` | `vite preview` | Serve production build locally |
| `lint` | `eslint .` | Run ESLint |
| `test` | `vitest run` | Run tests once |
| `test:watch` | `vitest` | Run tests in watch mode |

---

## Team Work Split (4 Members)

### Current Status
- ✅ **Phase 1 DONE** — Full UI with 22 routes, layouts, components, mock data
- ⏳ **Phase 2 NEXT** — Backend, database, API integration

### Member Assignments

#### 👤 Member 1 — Database & Schema (backend/db)
**Branch:** `feature/db-schema`

**Responsibilities:**
- PostgreSQL schema design (all tables, ENUMs, constraints, FKs)
- Seed data scripts
- Migration files
- Tables: `users`, `products`, `product_variants`, `subscriptions`, `invoices`, `payments`, `payment_retries`, `quotations`, `discounts`, `tax_rules`, `addresses`, `cart_items`, `orders`, `order_items`

**Key constraints to enforce:**
- ENUMs for all status fields (invoice_status, subscription_status, payment_status, etc.)
- CHECK constraints on retry_count (max 3), amounts (> 0)
- FOREIGN KEY cascades
- `deleted_at` column for soft deletes on financial records
- `created_at`, `updated_at` timestamps on every table

**Deliverable:** Working `schema.sql` + `seed.sql` that can be run on any PostgreSQL instance

---

#### 👤 Member 2 — Core Backend APIs (backend/api)
**Branch:** `feature/api-core`

**Responsibilities:**
- Express/Fastify server setup
- Modular Monolith folder structure:
  ```
  server/
  ├── modules/
  │   ├── auth/       (controller, service, repository)
  │   ├── products/   (controller, service, repository)
  │   ├── subscriptions/ (controller, service, repository)
  │   ├── invoices/   (controller, service, repository)
  │   └── payments/   (controller, service, repository)
  ├── middleware/     (auth, error handling, validation)
  ├── config/         (db connection, env)
  └── index.ts        (entry point)
  ```
- CRUD APIs for: Products, Subscriptions, Invoices, Users
- Auth: signup, login, JWT middleware
- Input validation with Zod

**Deliverable:** Working REST API with Postman/Thunder Client collection

---

#### 👤 Member 3 — Payment Recovery Engine (backend/recovery)
**Branch:** `feature/payment-recovery`

**Responsibilities:**
- **THE core differentiator** — this must be demo-perfect
- Payment processing simulation (mock gateway)
- Failed payment detection
- Auto-retry engine with rules:
  - Max 3 retries per invoice
  - Idempotent retry logic
  - Track `retry_count`, `last_retry_date`, `next_retry_date`
  - Paid invoices must NEVER be retried
- State transitions:
  - Payment fail → Invoice FAILED → Subscription AT_RISK
  - Retry success → Invoice PAID → Subscription ACTIVE
  - Retry limit hit → Subscription CLOSED
- Recovery analytics API (for dashboard KPIs)
- Audit log for every retry attempt

**Deliverable:** Working `/api/payments/retry/:invoiceId` + `/api/recovery/dashboard` endpoints

---

#### 👤 Member 4 — Frontend Integration & Polish (frontend/integration)
**Branch:** `feature/frontend-integration`

**Responsibilities:**
- Connect all UI pages to backend APIs (replace mock data)
- API service layer (`src/services/*.ts`) using TanStack React Query
- Auth flow: login → store JWT → protected routes
- Real-time status updates on admin dashboard
- Loading states, error handling, toast notifications
- Form submissions (checkout, profile, product CRUD)
- Final UI polish and bug fixes
- Demo preparation

**Deliverable:** Fully integrated frontend hitting real APIs

---

### Integration Points

```
  Member 1 (DB)          Member 2 (API)          Member 3 (Recovery)      Member 4 (Frontend)
  ─────────────          ──────────────          ───────────────────      ───────────────────
  schema.sql ──────────→ Repositories use ──────→ Recovery service ──────→ API calls from UI
  seed.sql               schema tables           uses invoice/sub         replaces mockData.ts
                                                  repositories
```

**Integration order:**
1. Member 1 delivers schema → Member 2 + 3 can start coding against it
2. Member 2 delivers base APIs → Member 4 starts integration
3. Member 3 delivers recovery engine → Member 4 integrates dashboard
4. Final integration + demo prep (all 4)

### Timeline (24 hrs)

| Hour | Member 1 (DB) | Member 2 (API) | Member 3 (Recovery) | Member 4 (Frontend) |
|------|--------------|----------------|---------------------|--------------------|
| 0-2 | Schema design | Server setup + folder structure | Study retry logic + design | Create API service layer skeleton |
| 2-6 | Schema + seed SQL | Auth + Products + Subscriptions API | Payment module + retry engine | Connect auth (login/signup) |
| 6-10 | Indexes + optimization | Invoices + Quotations + remaining CRUD | Recovery dashboard API + audit log | Connect admin pages to APIs |
| 10-14 | Help test + fix schema issues | API testing + edge cases | Integration with Member 2 APIs | Connect portal pages to APIs |
| 14-18 | DB monitoring + query tuning | Bug fixes + API polish | Demo scenario scripting | Loading/error states + polish |
| 18-22 | Support + help debug | Final integration | Final integration | Final integration |
| 22-24 | ALL: Demo prep, presentation, README update |||||

---

## Git Workflow

### Branches
```
main                    ← stable/demo-ready (protected, no direct commits)
├── develop             ← integration branch (merge feature branches here)
├── feature/db-schema           ← Member 1
├── feature/api-core            ← Member 2
├── feature/payment-recovery    ← Member 3
└── feature/frontend-integration ← Member 4
```

### Rules
- **NEVER** commit directly to `main`
- Merge to `develop` first, test, then merge `develop` → `main`
- Professional commit messages only:
  - `feat: add subscription CRUD API`
  - `fix: prevent retry on paid invoices`
  - `refactor: extract payment service logic`
  - `chore: add seed data for products`
- **NO** commits like "final", "done", "hackathon fix", "asdf"

### Workflow
```bash
# 1. Always pull latest develop before starting work
git checkout develop
git pull origin develop

# 2. Create/switch to your feature branch
git checkout -b feature/your-feature

# 3. Work, commit frequently
git add -A
git commit -m "feat: add invoice status transitions"

# 4. Push your branch
git push origin feature/your-feature

# 5. Create PR to develop (not main!)
# Review → Merge → Test on develop

# 6. When develop is stable → merge to main for demo
```

---

## Team

Built during the **24-Hour SNS × Odoo Hackathon** by a team of 4 developers.

---

## License

This project is part of a hackathon submission.
