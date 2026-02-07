/**
 * Shared TypeScript types matching the PostgreSQL schema.
 * These will be the API response shapes — same as mockData interfaces
 * but augmented with fields that come from the DB.
 */

// ─── ENUMs ───────────────────────────────────────────────

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "SUPPORT" | "CUSTOMER";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type SubscriptionStatus = "DRAFT" | "QUOTATION" | "ACTIVE" | "AT_RISK" | "CLOSED";
export type InvoiceStatus = "DRAFT" | "CONFIRMED" | "FAILED" | "PAID";
export type PaymentStatus = "SUCCESS" | "FAILED" | "PENDING" | "REFUNDED";
export type PaymentMethod = "UPI" | "CREDIT_CARD" | "DEBIT_CARD" | "NET_BANKING";
export type OrderStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED";
export type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "REJECTED";
export type DiscountType = "PERCENTAGE" | "FIXED";
export type DiscountStatus = "ACTIVE" | "EXPIRED" | "DISABLED";
export type TaxType = "GST" | "IGST" | "CGST+SGST" | "CESS";
export type TaxStatus = "ACTIVE" | "INACTIVE";
export type BillingPeriod = "MONTHLY" | "SEMI_ANNUAL" | "ANNUAL";

// ─── Entity Types ────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  gstNumber?: string;
  role: UserRole;
  department?: string;
  status: UserStatus;
  lastLogin?: string;
  createdAt: string;
}

export interface Address {
  id: number;
  userId: number;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
}

export interface UserProfile extends User {
  addresses: Address[];
}

export interface ProductVariant {
  id: number;
  name: string;
  extraPrice: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  billingPeriod: BillingPeriod;
  categoryName: string;
  isActive: boolean;
  variants: ProductVariant[];
}

export interface Subscription {
  id: number;
  userId: number;
  customerName?: string;
  productName?: string;
  variantName?: string;
  status: SubscriptionStatus;
  startDate: string;
  nextBilling: string;
  billingPeriod: BillingPeriod;
  amount: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  subscriptionId: number;
  userId: number;
  customerName?: string;
  amount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  retryCount: number;
  lastRetryAt?: string;
  nextRetryAt?: string;
}

export interface Payment {
  id: number;
  paymentRef: string;
  invoiceId: number;
  invoiceNumber?: string;
  userId: number;
  customerName?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayRef?: string;
  failureReason?: string;
  createdAt: string;
}

export interface PaymentRetry {
  id: number;
  invoiceId: number;
  invoiceNumber?: string;
  customerName?: string;
  paymentId?: number;
  attemptNumber: number;
  status: PaymentStatus;
  failureReason?: string;
  attemptedAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  status: OrderStatus;
  createdAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  productId: number;
  productName?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  billingPeriod: BillingPeriod;
}

export interface CartItem {
  id: number;
  productId: number;
  productName?: string;
  variantId?: number;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  billingPeriod?: BillingPeriod;
}

export interface Quotation {
  id: number;
  quotationNumber: string;
  userId: number;
  customerName?: string;
  totalAmount: number;
  validUntil: string;
  status: QuotationStatus;
  createdAt: string;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: number;
  productId: number;
  productName?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
}

export interface Discount {
  id: number;
  code: string;
  description: string;
  type: DiscountType;
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  status: DiscountStatus;
}

export interface TaxRule {
  id: number;
  name: string;
  rate: number;
  type: TaxType;
  applicableTo: string;
  region: string;
  status: TaxStatus;
}

// ─── Auth Types ──────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
  gstNumber?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Recovery Dashboard ──────────────────────────────────

export interface RecoveryDashboard {
  failedCount: number;
  atRiskCount: number;
  recoveredCount: number;
  revenueAtRisk: number;
  revenueRecovered: number;
}

export interface RetryResult {
  invoiceId: number;
  attempt: number;
  success: boolean;
  invoiceStatus: InvoiceStatus;
  subscriptionStatus: SubscriptionStatus;
  retriesRemaining: number;
}
