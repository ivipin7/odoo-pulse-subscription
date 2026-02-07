export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  period: string;
  category: string;
  variants: { name: string; extraPrice: number }[];
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  period: string;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: OrderItem[];
  tax: number;
  discount: number;
}

export interface Subscription {
  id: string;
  customer: string;
  plan: string;
  status: "ACTIVE" | "AT_RISK" | "CLOSED";
  startDate: string;
  nextBilling: string;
}

export interface Invoice {
  id: string;
  customer: string;
  amount: number;
  status: "DRAFT" | "CONFIRMED" | "FAILED" | "PAID";
  date: string;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  period: string;
  variant: string;
  qty: number;
}

export const products: Product[] = [
  {
    id: 1,
    name: "ERP Suite",
    description: "Complete enterprise resource planning solution for growing businesses",
    price: 1200,
    period: "month",
    category: "ERP",
    variants: [
      { name: "Standard", extraPrice: 0 },
      { name: "Professional", extraPrice: 500 },
      { name: "Enterprise", extraPrice: 1200 },
    ],
  },
  {
    id: 2,
    name: "CRM Pro",
    description: "Customer relationship management with advanced analytics",
    price: 800,
    period: "month",
    category: "CRM",
    variants: [
      { name: "Starter", extraPrice: 0 },
      { name: "Business", extraPrice: 400 },
    ],
  },
  {
    id: 3,
    name: "HR Management",
    description: "Human resource management with payroll integration",
    price: 600,
    period: "month",
    category: "HR",
    variants: [
      { name: "Basic", extraPrice: 0 },
      { name: "Premium", extraPrice: 300 },
    ],
  },
  {
    id: 4,
    name: "Accounting Plus",
    description: "Financial management, reporting, and compliance tools",
    price: 900,
    period: "month",
    category: "Accounting",
    variants: [
      { name: "Standard", extraPrice: 0 },
      { name: "Advanced", extraPrice: 600 },
    ],
  },
  {
    id: 5,
    name: "Inventory Control",
    description: "Warehouse and stock management with barcode scanning",
    price: 700,
    period: "month",
    category: "Inventory",
    variants: [
      { name: "Single Warehouse", extraPrice: 0 },
      { name: "Multi-Warehouse", extraPrice: 500 },
    ],
  },
  {
    id: 6,
    name: "Marketing Hub",
    description: "Campaign management, email marketing, and lead generation",
    price: 500,
    period: "month",
    category: "Marketing",
    variants: [
      { name: "Essentials", extraPrice: 0 },
      { name: "Growth", extraPrice: 350 },
    ],
  },
];

export const orders: Order[] = [
  {
    id: "ORD-2025-001",
    date: "2025-01-15",
    total: 14400,
    status: "PAID",
    tax: 2592,
    discount: 1000,
    items: [
      { name: "ERP Suite - Professional", qty: 1, price: 1700, period: "month" },
    ],
  },
  {
    id: "ORD-2025-002",
    date: "2025-01-20",
    total: 9600,
    status: "PAID",
    tax: 1728,
    discount: 0,
    items: [
      { name: "CRM Pro - Business", qty: 1, price: 1200, period: "month" },
    ],
  },
  {
    id: "ORD-2025-003",
    date: "2025-02-01",
    total: 7200,
    status: "PROCESSING",
    tax: 1296,
    discount: 500,
    items: [
      { name: "HR Management - Premium", qty: 1, price: 900, period: "month" },
    ],
  },
  {
    id: "ORD-2025-004",
    date: "2025-02-03",
    total: 5400,
    status: "FAILED",
    tax: 972,
    discount: 0,
    items: [
      { name: "Accounting Plus - Standard", qty: 1, price: 900, period: "month" },
    ],
  },
  {
    id: "ORD-2025-005",
    date: "2025-02-05",
    total: 6000,
    status: "PENDING",
    tax: 1080,
    discount: 200,
    items: [
      { name: "Marketing Hub - Growth", qty: 2, price: 850, period: "month" },
    ],
  },
];

export const subscriptions: Subscription[] = [
  { id: "SUB-001", customer: "Acme Corp", plan: "ERP Suite - Enterprise", status: "ACTIVE", startDate: "2024-06-15", nextBilling: "2025-03-15" },
  { id: "SUB-002", customer: "TechStart Inc", plan: "CRM Pro - Business", status: "ACTIVE", startDate: "2024-09-01", nextBilling: "2025-03-01" },
  { id: "SUB-003", customer: "GlobalTrade Ltd", plan: "Inventory Control - Multi", status: "AT_RISK", startDate: "2024-03-20", nextBilling: "2025-02-20" },
  { id: "SUB-004", customer: "FinanceHub", plan: "Accounting Plus - Advanced", status: "ACTIVE", startDate: "2024-11-10", nextBilling: "2025-05-10" },
  { id: "SUB-005", customer: "RetailMax", plan: "ERP Suite - Professional", status: "AT_RISK", startDate: "2024-07-01", nextBilling: "2025-02-01" },
  { id: "SUB-006", customer: "MediaFlow", plan: "Marketing Hub - Growth", status: "CLOSED", startDate: "2024-01-15", nextBilling: "-" },
  { id: "SUB-007", customer: "BuildRight Co", plan: "HR Management - Premium", status: "ACTIVE", startDate: "2024-10-20", nextBilling: "2025-04-20" },
  { id: "SUB-008", customer: "DataDriven LLC", plan: "CRM Pro - Starter", status: "CLOSED", startDate: "2024-02-10", nextBilling: "-" },
];

export const invoices: Invoice[] = [
  { id: "INV-2025-001", customer: "Acme Corp", amount: 28800, status: "PAID", date: "2025-01-01" },
  { id: "INV-2025-002", customer: "TechStart Inc", amount: 14400, status: "PAID", date: "2025-01-01" },
  { id: "INV-2025-003", customer: "GlobalTrade Ltd", amount: 14400, status: "FAILED", date: "2025-02-01" },
  { id: "INV-2025-004", customer: "FinanceHub", amount: 18000, status: "CONFIRMED", date: "2025-02-01" },
  { id: "INV-2025-005", customer: "RetailMax", amount: 20400, status: "FAILED", date: "2025-02-01" },
  { id: "INV-2025-006", customer: "MediaFlow", amount: 10200, status: "DRAFT", date: "2025-02-05" },
];

export const initialCartItems: CartItem[] = [
  { productId: 1, name: "ERP Suite", price: 1700, period: "month", variant: "Professional", qty: 1 },
  { productId: 3, name: "HR Management", price: 900, period: "month", variant: "Premium", qty: 1 },
  { productId: 6, name: "Marketing Hub", price: 500, period: "month", variant: "Essentials", qty: 2 },
];

export const userProfile = {
  name: "Rajesh Kumar",
  email: "rajesh.kumar@acmecorp.in",
  phone: "+91 98765 43210",
  company: "Acme Corp",
  gst: "27AABCU9603R1ZM",
  addresses: [
    {
      id: 1,
      label: "Office",
      line1: "Tower B, Floor 12, Cyber Hub",
      line2: "Sector 24, Gurugram",
      city: "Gurugram",
      state: "Haryana",
      pin: "122002",
      isDefault: true,
    },
    {
      id: 2,
      label: "Warehouse",
      line1: "Plot 45, Industrial Area Phase-II",
      line2: "Manesar",
      city: "Gurugram",
      state: "Haryana",
      pin: "122051",
      isDefault: false,
    },
  ],
};

export const categories = ["All", "ERP", "CRM", "HR", "Accounting", "Inventory", "Marketing"];

// --- Extended Data for Admin Pages ---

export interface Payment {
  id: string;
  invoiceId: string;
  customer: string;
  amount: number;
  method: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | "REFUNDED";
  date: string;
  retryCount: number;
}

export const payments: Payment[] = [
  { id: "PAY-001", invoiceId: "INV-2025-001", customer: "Acme Corp", amount: 28800, method: "UPI", status: "SUCCESS", date: "2025-01-02", retryCount: 0 },
  { id: "PAY-002", invoiceId: "INV-2025-002", customer: "TechStart Inc", amount: 14400, method: "Credit Card", status: "SUCCESS", date: "2025-01-02", retryCount: 0 },
  { id: "PAY-003", invoiceId: "INV-2025-003", customer: "GlobalTrade Ltd", amount: 14400, method: "Net Banking", status: "FAILED", date: "2025-02-02", retryCount: 3 },
  { id: "PAY-004", invoiceId: "INV-2025-004", customer: "FinanceHub", amount: 18000, method: "UPI", status: "PENDING", date: "2025-02-02", retryCount: 0 },
  { id: "PAY-005", invoiceId: "INV-2025-005", customer: "RetailMax", amount: 20400, method: "Credit Card", status: "FAILED", date: "2025-02-02", retryCount: 2 },
  { id: "PAY-006", invoiceId: "INV-2025-006", customer: "MediaFlow", amount: 10200, method: "Debit Card", status: "PENDING", date: "2025-02-06", retryCount: 0 },
  { id: "PAY-007", invoiceId: "INV-2025-003", customer: "GlobalTrade Ltd", amount: 14400, method: "UPI", status: "REFUNDED", date: "2025-02-10", retryCount: 0 },
];

export interface Quotation {
  id: string;
  customer: string;
  products: string[];
  totalAmount: number;
  validUntil: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "REJECTED";
  date: string;
}

export const quotations: Quotation[] = [
  { id: "QOT-001", customer: "NovaTech Systems", products: ["ERP Suite - Enterprise", "CRM Pro - Business"], totalAmount: 34800, validUntil: "2025-03-15", status: "SENT", date: "2025-02-15" },
  { id: "QOT-002", customer: "CloudNine Ltd", products: ["HR Management - Premium"], totalAmount: 10800, validUntil: "2025-03-01", status: "ACCEPTED", date: "2025-02-01" },
  { id: "QOT-003", customer: "DataDriven LLC", products: ["CRM Pro - Starter", "Marketing Hub - Growth"], totalAmount: 18600, validUntil: "2025-02-28", status: "EXPIRED", date: "2025-01-28" },
  { id: "QOT-004", customer: "UrbanRetail", products: ["Inventory Control - Multi", "Accounting Plus - Advanced"], totalAmount: 27600, validUntil: "2025-04-01", status: "DRAFT", date: "2025-02-20" },
  { id: "QOT-005", customer: "GreenLeaf Farms", products: ["ERP Suite - Professional"], totalAmount: 20400, validUntil: "2025-03-20", status: "SENT", date: "2025-02-18" },
  { id: "QOT-006", customer: "BuildRight Co", products: ["Accounting Plus - Standard"], totalAmount: 10800, validUntil: "2025-03-10", status: "REJECTED", date: "2025-02-10" },
];

export interface Discount {
  id: string;
  code: string;
  description: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  status: "ACTIVE" | "EXPIRED" | "DISABLED";
}

export const discounts: Discount[] = [
  { id: "DSC-001", code: "WELCOME20", description: "Welcome discount for new customers", type: "PERCENTAGE", value: 20, minOrder: 5000, maxUses: 100, usedCount: 45, validFrom: "2025-01-01", validUntil: "2025-06-30", status: "ACTIVE" },
  { id: "DSC-002", code: "ANNUAL10", description: "10% off on annual plans", type: "PERCENTAGE", value: 10, minOrder: 10000, maxUses: 50, usedCount: 32, validFrom: "2025-01-01", validUntil: "2025-12-31", status: "ACTIVE" },
  { id: "DSC-003", code: "FLAT5K", description: "Flat ₹5,000 off on Enterprise plans", type: "FIXED", value: 5000, minOrder: 20000, maxUses: 20, usedCount: 20, validFrom: "2024-10-01", validUntil: "2025-01-31", status: "EXPIRED" },
  { id: "DSC-004", code: "BUNDLE15", description: "15% off on 3+ product bundles", type: "PERCENTAGE", value: 15, minOrder: 15000, maxUses: 30, usedCount: 8, validFrom: "2025-02-01", validUntil: "2025-05-31", status: "ACTIVE" },
  { id: "DSC-005", code: "LAUNCH2K", description: "₹2,000 launch discount", type: "FIXED", value: 2000, minOrder: 8000, maxUses: 200, usedCount: 156, validFrom: "2024-06-01", validUntil: "2024-12-31", status: "DISABLED" },
];

export interface TaxRule {
  id: string;
  name: string;
  rate: number;
  type: "GST" | "IGST" | "CGST+SGST" | "CESS";
  applicableTo: string;
  region: string;
  status: "ACTIVE" | "INACTIVE";
}

export const taxRules: TaxRule[] = [
  { id: "TAX-001", name: "GST Standard", rate: 18, type: "GST", applicableTo: "All Software Products", region: "Pan-India", status: "ACTIVE" },
  { id: "TAX-002", name: "IGST (Inter-State)", rate: 18, type: "IGST", applicableTo: "Inter-state supplies", region: "Cross-state", status: "ACTIVE" },
  { id: "TAX-003", name: "CGST + SGST (Maharashtra)", rate: 18, type: "CGST+SGST", applicableTo: "Intra-state supplies", region: "Maharashtra", status: "ACTIVE" },
  { id: "TAX-004", name: "CGST + SGST (Karnataka)", rate: 18, type: "CGST+SGST", applicableTo: "Intra-state supplies", region: "Karnataka", status: "ACTIVE" },
  { id: "TAX-005", name: "Education Cess", rate: 2, type: "CESS", applicableTo: "Education products", region: "Pan-India", status: "INACTIVE" },
  { id: "TAX-006", name: "Reduced GST", rate: 12, type: "GST", applicableTo: "Discounted plans", region: "Pan-India", status: "ACTIVE" },
];

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "SUPPORT";
  department: string;
  lastLogin: string;
  status: "ACTIVE" | "INACTIVE";
}

export const adminUsers: AdminUser[] = [
  { id: "USR-001", name: "Priya Sharma", email: "priya@odoopulse.in", role: "SUPER_ADMIN", department: "Engineering", lastLogin: "2025-02-20 14:30", status: "ACTIVE" },
  { id: "USR-002", name: "Arjun Mehta", email: "arjun@odoopulse.in", role: "ADMIN", department: "Sales", lastLogin: "2025-02-20 11:15", status: "ACTIVE" },
  { id: "USR-003", name: "Sneha Patil", email: "sneha@odoopulse.in", role: "MANAGER", department: "Support", lastLogin: "2025-02-19 16:45", status: "ACTIVE" },
  { id: "USR-004", name: "Vikram Singh", email: "vikram@odoopulse.in", role: "SUPPORT", department: "Support", lastLogin: "2025-02-18 09:20", status: "ACTIVE" },
  { id: "USR-005", name: "Anita Desai", email: "anita@odoopulse.in", role: "MANAGER", department: "Finance", lastLogin: "2025-02-15 13:00", status: "INACTIVE" },
  { id: "USR-006", name: "Rahul Gupta", email: "rahul@odoopulse.in", role: "ADMIN", department: "Operations", lastLogin: "2025-02-20 10:00", status: "ACTIVE" },
];
