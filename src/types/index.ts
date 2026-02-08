// Shared types matching backend DB schema (snake_case to match API responses)

export type UserRole = "ADMIN" | "INTERNAL" | "PORTAL";
export type ProductType = "CONSUMABLE" | "SERVICE";
export type BillingPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type TaxComputation = "PERCENTAGE" | "FIXED";
export type DiscountType = "PERCENTAGE" | "FIXED";
export type SubscriptionStatus = "DRAFT" | "QUOTATION" | "CONFIRMED" | "ACTIVE" | "CLOSED" | "PAUSED" | "CANCELLED";
export type PaymentTerm = "IMMEDIATE" | "NET_15" | "NET_30" | "NET_60";
export type InvoiceStatus = "DRAFT" | "CONFIRMED" | "PAID" | "FAILED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED";
export type PaymentMethod = "CREDIT_CARD" | "BANK_TRANSFER" | "CASH" | "OTHER";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  product_type: ProductType;
  sales_price: number;
  cost_price: number;
  description?: string;
  tax_id?: string;
  tax_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface RecurringPlan {
  id: string;
  name: string;
  billing_period: BillingPeriod;
  billing_interval: number;
  description?: string;
  price: number;
  min_quantity: number;
  start_date?: string;
  end_date?: string;
  auto_close: boolean;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
  is_active: boolean;
}

export interface Tax {
  id: string;
  name: string;
  tax_computation: TaxComputation;
  amount: number;
  is_active: boolean;
}

export interface Discount {
  id: string;
  name: string;
  discount_type: DiscountType;
  value: number;
  min_purchase?: number;
  min_quantity?: number;
  start_date?: string;
  end_date?: string;
  limit_usage?: number;
  usage_count: number;
  applies_to: "ALL" | "PRODUCTS" | "SUBSCRIPTIONS";
  is_active: boolean;
}

export interface SubscriptionLine {
  id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  tax_id?: string;
  tax_name?: string;
  discount_id?: string;
  discount_name?: string;
  subtotal: number;
}

export interface Subscription {
  id: string;
  subscription_number: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  recurring_plan_id: string;
  plan_name?: string;
  status: SubscriptionStatus;
  start_date?: string;
  expiration_date?: string;
  payment_terms: PaymentTerm;
  notes?: string;
  paused_at?: string;
  resumed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  lines: SubscriptionLine[];
  created_at: string;
}

export interface InvoiceLine {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  discount_amount: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  subscription_id: string;
  subscription_number?: string;
  customer_id: string;
  customer_name?: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  due_date?: string;
  paid_date?: string;
  lines: InvoiceLine[];
  created_at: string;
}

export interface Payment {
  id: string;
  payment_number: string;
  invoice_id: string;
  invoice_number?: string;
  customer_name?: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  payment_date?: string;
  notes?: string;
  created_at: string;
}

export interface DashboardData {
  activeSubscriptions: number;
  totalRevenue: number;
  payments: { count: number; total: number };
  overdueInvoices: number;
  subscriptionsByStatus: { status: string; count: string }[];
  recentPayments: Payment[];
  atRiskCount?: number;
}

// Churn prediction types
export interface RiskFactor {
  factor: string;
  score: number;
  detail: string;
}

export interface AtRiskSubscription {
  subscription_id: string;
  subscription_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  plan_name: string | null;
  status: string;
  start_date: string | null;
  expiration_date: string | null;
  total_amount: number;
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_factors: RiskFactor[];
  recommended_actions: string[];
}

export interface ChurnSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  avg_score: number;
  at_risk_revenue: number;
}

export interface ChurnData {
  atRisk: AtRiskSubscription[];
  summary: ChurnSummary;
}

export interface UsageData {
  subscription_id: string;
  subscription_number: string;
  status: string;
  billing_period: string;
  billing_interval: number;
  cycle_days: number;
  current_cycle: number;
  days_into_cycle: number;
  days_remaining: number;
  progress_percent: number;
  cycle_start_date: string;
  next_billing_date: string;
  start_date: string | null;
  expiration_date: string | null;
  paused_at: string | null;
  resumed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  total_invoices: number;
  paid_invoices: number;
  total_paid: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: any };
}

// Product Variants
export interface ProductAttribute {
  id: string;
  name: string;
  values: ProductAttributeValue[];
}

export interface ProductAttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  extra_price: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  attribute_value_id: string;
  attribute_name: string;
  attribute_value: string;
  extra_price: number;
  sku?: string;
  price_override?: number;
  is_active: boolean;
}

// Quotation Templates
export interface QuotationTemplateLine {
  id: string;
  product_id: string;
  product_name?: string;
  unit_price?: number;
  quantity: number;
  description?: string;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  validity_days: number;
  recurring_plan_id?: string;
  plan_name?: string;
  notes?: string;
  is_active: boolean;
  lines: QuotationTemplateLine[];
  created_at: string;
}
