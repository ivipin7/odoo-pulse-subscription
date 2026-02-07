# OdooPulse — Subscription Management System

> **24-Hour SNS × Odoo Hackathon Project**
> A full-featured subscription lifecycle management platform built for SaaS / ERP businesses. Manages the complete flow from product catalog → checkout → subscription tracking → payment recovery → admin analytics.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Pages & Routes (22 Total)](#pages--routes-22-total)
- [Component Architecture](#component-architecture)
- [Design System](#design-system)
- [Mock Data Models](#mock-data-models)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Team](#team)

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

## Team

Built during the **24-Hour SNS × Odoo Hackathon** by a team of 4 developers.

---

## License

This project is part of a hackathon submission.
