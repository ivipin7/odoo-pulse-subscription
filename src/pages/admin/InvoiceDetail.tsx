import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useInvoices, usePayments, useRetryPayment } from "@/hooks/useApi";
import { useState } from "react";
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  FileText,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
} from "lucide-react";

// ── Odoo-style Status Ribbon ─────────────────────────────────
const statusSteps = [
  { key: "DRAFT", label: "Draft", icon: FileText },
  { key: "CONFIRMED", label: "Confirmed", icon: Send },
  { key: "PAID", label: "Paid", icon: CheckCircle2 },
];

const StatusRibbon = ({ currentStatus }: { currentStatus: string }) => {
  const isFailed = currentStatus === "FAILED";
  const statusOrder = ["DRAFT", "CONFIRMED", "PAID"];
  const currentIdx = statusOrder.indexOf(isFailed ? "CONFIRMED" : currentStatus);

  return (
    <div className="flex items-center gap-0 bg-muted/30 rounded-lg p-1">
      {statusSteps.map((step, idx) => {
        const isActive = idx <= currentIdx;
        const isCurrent = step.key === currentStatus || (isFailed && step.key === "CONFIRMED");
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center">
            {idx > 0 && (
              <div className={`w-8 h-0.5 ${isActive ? "bg-primary" : "bg-border"}`} />
            )}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isCurrent
                  ? isFailed
                    ? "bg-destructive/10 text-destructive border border-destructive/30"
                    : "bg-primary text-primary-foreground"
                  : isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {step.label}
            </div>
          </div>
        );
      })}
      {isFailed && (
        <>
          <div className="w-8 h-0.5 bg-destructive/40" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-destructive text-destructive-foreground">
            <XCircle className="h-3.5 w-3.5" />
            Failed
          </div>
        </>
      )}
    </div>
  );
};

// ── Mock Invoice Lines (for detail display) ─────────────
const getMockInvoiceLines = (invoiceId: string, invoiceAmount: number) => [
  {
    id: 1,
    description: "Subscription Service - Monthly Plan",
    quantity: 1,
    unitPrice: invoiceAmount * 0.7,
    taxRate: 18,
    subtotal: invoiceAmount * 0.7,
  },
  {
    id: 2,
    description: "Premium Support Add-on",
    quantity: 1,
    unitPrice: invoiceAmount * 0.2,
    taxRate: 18,
    subtotal: invoiceAmount * 0.2,
  },
  {
    id: 3,
    description: "Setup & Configuration Fee",
    quantity: 1,
    unitPrice: invoiceAmount * 0.1,
    taxRate: 18,
    subtotal: invoiceAmount * 0.1,
  },
];

const getMockRetryHistory = (invoiceId: string) => [
  { attempt: 1, date: "2025-07-15 10:00 AM", method: "CARD", status: "FAILED", error: "Insufficient funds" },
  { attempt: 2, date: "2025-07-16 10:00 AM", method: "CARD", status: "FAILED", error: "Card declined by issuer" },
];

const AdminInvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invData } = useInvoices();
  const { data: payData } = usePayments();
  const retryMutation = useRetryPayment();
  const [activeTab, setActiveTab] = useState<"lines" | "payments" | "other">("lines");

  const invoices = (invData ?? []) as any[];
  const payments = (payData ?? []) as any[];
  const invoice = invoices.find((inv) => inv.id === id);

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Invoice not found</h2>
        <button
          onClick={() => navigate("/admin/invoices")}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  const invoiceLines = getMockInvoiceLines(invoice.id, invoice.amount);
  const invoicePayments = payments.filter((p) => p.invoiceId === invoice.id);
  const retryHistory = invoice.status === "FAILED" ? getMockRetryHistory(invoice.id) : [];
  const subtotal = invoice.amount * 0.85;
  const taxAmount = invoice.amount * 0.15;

  const handleRetry = () => {
    retryMutation.mutate(invoice.id);
  };

  const tabs = [
    { key: "lines" as const, label: "Invoice Lines", count: invoiceLines.length },
    { key: "payments" as const, label: "Payments & Retries", count: invoicePayments.length + retryHistory.length },
    { key: "other" as const, label: "Other Info" },
  ];

  return (
    <div>
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/invoices")}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{invoice.id}</h1>
            <p className="text-sm text-muted-foreground">Invoice for {invoice.customer}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === "FAILED" && (
            <button
              onClick={handleRetry}
              disabled={retryMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${retryMutation.isPending ? "animate-spin" : ""}`} />
              {retryMutation.isPending ? "Retrying..." : "Retry Payment"}
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors">
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {/* ── Status Ribbon (Odoo-style) ─────────────────────── */}
      <div className="mb-6">
        <StatusRibbon currentStatus={invoice.status} />
      </div>

      {/* ── Header Info Card ───────────────────────────────── */}
      <div className="rounded-lg border bg-card shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Customer</h3>
            <p className="font-semibold text-foreground">{invoice.customer}</p>
            <p className="text-sm text-muted-foreground">contact@{invoice.customer.toLowerCase().replace(/\s+/g, "")}.com</p>
            <p className="text-sm text-muted-foreground">GSTIN: 29AAACP1234Q1ZA</p>
          </div>
          {/* Invoice Info */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Invoice Details</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice Date:</span>
                <span className="font-medium">{invoice.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-medium">{invoice.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </div>
          {/* Amount Summary */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Amount</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (18% GST):</span>
                <span>₹{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-border pt-1.5 flex justify-between text-sm font-semibold">
                <span>Total:</span>
                <span className="text-lg">₹{invoice.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Failed Payment Warning ─────────────────────────── */}
      {invoice.status === "FAILED" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive">Payment Failed</p>
            <p className="text-sm text-muted-foreground mt-1">
              This invoice has a failed payment. {retryHistory.length} of 3 retry attempts used. 
              {retryHistory.length < 3 ? " Click 'Retry Payment' to attempt again." : " Maximum retries exhausted — subscription may be closed."}
            </p>
          </div>
        </div>
      )}

      {/* ── Tabs (Odoo-style) ──────────────────────────────── */}
      <div className="border-b border-border mb-0">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-muted">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ────────────────────────────────────── */}
      <div className="rounded-b-lg border border-t-0 bg-card shadow-sm overflow-hidden">
        {/* Invoice Lines Tab */}
        {activeTab === "lines" && (
          <table className="erp-table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Description</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Tax %</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoiceLines.map((line, idx) => (
                <tr key={line.id}>
                  <td className="text-muted-foreground">{idx + 1}</td>
                  <td className="font-medium text-foreground">{line.description}</td>
                  <td className="text-right">{line.quantity}</td>
                  <td className="text-right">₹{line.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="text-right">{line.taxRate}%</td>
                  <td className="text-right font-medium">₹{line.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td colSpan={5} className="text-right font-semibold">Total:</td>
                <td className="text-right font-semibold text-lg">₹{invoice.amount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Payments & Retries Tab */}
        {activeTab === "payments" && (
          <div className="p-6 space-y-6">
            {/* Payment History */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Payment Attempts</h3>
              {invoicePayments.length > 0 ? (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th className="text-right">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicePayments.map((pay) => (
                      <tr key={pay.id}>
                        <td className="font-mono text-sm">{pay.id}</td>
                        <td className="text-muted-foreground">{pay.date}</td>
                        <td>{pay.method}</td>
                        <td className="text-right">₹{pay.amount.toLocaleString()}</td>
                        <td><StatusBadge status={pay.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground italic">No payments recorded yet.</p>
              )}
            </div>

            {/* Retry History */}
            {retryHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Recovery Attempts
                </h3>
                <div className="space-y-3">
                  {retryHistory.map((retry, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 flex items-center justify-between ${
                        retry.status === "FAILED" ? "border-destructive/20 bg-destructive/5" : "border-green-500/20 bg-green-500/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          retry.status === "FAILED" ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
                        }`}>
                          {retry.attempt}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Attempt #{retry.attempt} — {retry.method}</p>
                          <p className="text-xs text-muted-foreground">{retry.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {retry.status === "FAILED" && (
                          <span className="text-xs text-destructive">{retry.error}</span>
                        )}
                        <StatusBadge status={retry.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other Info Tab */}
        {activeTab === "other" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Company Details</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground w-28 flex-shrink-0">Company:</span>
                    <span className="font-medium">{invoice.customer}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground w-28 flex-shrink-0">GSTIN:</span>
                    <span className="font-mono">29AAACP1234Q1ZA</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground w-28 flex-shrink-0">Address:</span>
                    <span>Tower B, Floor 12, Cyber Hub, Gurugram, Haryana 122002</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Audit Trail</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className="text-sm">
                      <span className="font-medium">Created</span>
                      <span className="text-muted-foreground ml-2">{invoice.date} at 09:00 AM</span>
                    </div>
                  </div>
                  {["CONFIRMED", "PAID", "FAILED"].includes(invoice.status) && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="text-sm">
                        <span className="font-medium">Confirmed</span>
                        <span className="text-muted-foreground ml-2">{invoice.date} at 10:30 AM</span>
                      </div>
                    </div>
                  )}
                  {invoice.status === "PAID" && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div className="text-sm">
                        <span className="font-medium">Payment Received</span>
                        <span className="text-muted-foreground ml-2">{invoice.date} at 11:15 AM</span>
                      </div>
                    </div>
                  )}
                  {invoice.status === "FAILED" && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="text-sm">
                        <span className="font-medium">Payment Failed</span>
                        <span className="text-muted-foreground ml-2">{invoice.date} at 02:00 PM</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvoiceDetail;
