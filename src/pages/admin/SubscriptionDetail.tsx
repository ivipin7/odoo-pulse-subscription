import { useParams, useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useSubscriptions, useInvoices, usePayments } from "@/hooks/useApi";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  RefreshCw,
  Shield,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Zap,
  TrendingUp,
} from "lucide-react";

// ── Lifecycle State Machine Visualization ─────────────────────
const lifecycleSteps = [
  { key: "DRAFT", label: "Draft", icon: FileText, color: "bg-gray-400" },
  { key: "QUOTATION", label: "Quotation", icon: Clock, color: "bg-blue-400" },
  { key: "ACTIVE", label: "Active", icon: CheckCircle2, color: "bg-green-500" },
  { key: "AT_RISK", label: "At Risk", icon: AlertTriangle, color: "bg-amber-500" },
  { key: "CLOSED", label: "Closed", icon: XCircle, color: "bg-gray-500" },
];

const LifecycleTimeline = ({ currentStatus }: { currentStatus: string }) => {
  const statusOrder = ["DRAFT", "QUOTATION", "ACTIVE", "AT_RISK", "CLOSED"];
  const currentIdx = statusOrder.indexOf(currentStatus);

  // For ACTIVE, show path up to ACTIVE (skip AT_RISK)
  // For AT_RISK, show path up to AT_RISK
  // For CLOSED, show full path
  const isLinearPath = currentStatus === "ACTIVE" || currentStatus === "QUOTATION" || currentStatus === "DRAFT";

  return (
    <div className="flex items-center gap-0 flex-wrap">
      {lifecycleSteps.map((step, idx) => {
        // Determine if this step is part of the path
        let isPassed = false;
        let isCurrent = step.key === currentStatus;

        if (currentStatus === "ACTIVE") {
          isPassed = idx <= 2; // DRAFT, QUOTATION, ACTIVE
        } else if (currentStatus === "AT_RISK") {
          isPassed = idx <= 3;
        } else if (currentStatus === "CLOSED") {
          isPassed = true;
        } else {
          isPassed = idx <= currentIdx;
        }

        // Skip AT_RISK in the visualization if subscription is ACTIVE
        if (step.key === "AT_RISK" && isLinearPath) return null;

        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center">
            {idx > 0 && !(step.key === "AT_RISK" && isLinearPath) && (
              <div className={`w-6 md:w-10 h-0.5 ${isPassed ? "bg-primary" : "bg-border"}`} />
            )}
            <div
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isCurrent
                  ? currentStatus === "AT_RISK"
                    ? "bg-amber-500/10 text-amber-600 border-2 border-amber-500/40 shadow-sm"
                    : currentStatus === "CLOSED"
                    ? "bg-muted text-muted-foreground border-2 border-border"
                    : "bg-primary text-primary-foreground shadow-sm"
                  : isPassed
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground bg-muted/30"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Stat Card Component ───────────────────────────────────────
const StatCard = ({
  icon: Icon,
  label,
  value,
  subtext,
  variant = "default",
}: {
  icon: any;
  label: string;
  value: string;
  subtext?: string;
  variant?: "default" | "success" | "warning" | "danger";
}) => {
  const colors = {
    default: "text-foreground",
    success: "text-green-600",
    warning: "text-amber-600",
    danger: "text-destructive",
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${colors[variant]}`} />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xl font-semibold ${colors[variant]}`}>{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
};

const AdminSubscriptionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: subsData } = useSubscriptions();
  const { data: invData } = useInvoices();
  const { data: payData } = usePayments();
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "history">("overview");

  const subscriptions = (subsData ?? []) as any[];
  const invoices = (invData ?? []) as any[];
  const payments = (payData ?? []) as any[];
  const subscription = subscriptions.find((s) => s.id === id);

  if (!subscription) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Subscription not found</h2>
        <button
          onClick={() => navigate("/admin/subscriptions")}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Back to Subscriptions
        </button>
      </div>
    );
  }

  // Mock related data
  const relatedInvoices = invoices.filter((inv) =>
    inv.customer === subscription.customer
  );
  const relatedPayments = payments.filter((p) =>
    p.customer === subscription.customer
  );

  const totalPaid = relatedPayments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const monthsActive = subscription.startDate
    ? Math.max(1, Math.floor((Date.now() - new Date(subscription.startDate).getTime()) / (30 * 24 * 60 * 60 * 1000)))
    : 1;

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "invoices" as const, label: "Invoices", count: relatedInvoices.length },
    { key: "history" as const, label: "Activity History" },
  ];

  return (
    <div>
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/subscriptions")}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{subscription.id}</h1>
              <StatusBadge status={subscription.status} />
            </div>
            <p className="text-sm text-muted-foreground">{subscription.customer} — {subscription.plan}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {subscription.status === "AT_RISK" && (
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <RefreshCw className="h-4 w-4" />
              Retry Payment
            </button>
          )}
          {subscription.status === "ACTIVE" && (
            <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors">
              <XCircle className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Lifecycle Timeline ─────────────────────────────── */}
      <div className="mb-6">
        <LifecycleTimeline currentStatus={subscription.status} />
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={CreditCard}
          label="Plan"
          value={subscription.plan.split(" - ")[0]}
          subtext={subscription.plan.split(" - ")[1] || "Standard"}
        />
        <StatCard
          icon={Calendar}
          label="Next Billing"
          value={subscription.nextBilling === "-" ? "N/A" : subscription.nextBilling}
          variant={subscription.status === "AT_RISK" ? "warning" : "default"}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Paid"
          value={`₹${totalPaid.toLocaleString()}`}
          subtext={`Over ${monthsActive} months`}
          variant="success"
        />
        <StatCard
          icon={Zap}
          label="Status"
          value={subscription.status.replace("_", " ")}
          subtext={`Since ${subscription.startDate}`}
          variant={
            subscription.status === "ACTIVE" ? "success" :
            subscription.status === "AT_RISK" ? "warning" :
            subscription.status === "CLOSED" ? "danger" : "default"
          }
        />
      </div>

      {/* ── At Risk Warning ────────────────────────────────── */}
      {subscription.status === "AT_RISK" && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-600">Subscription At Risk</p>
            <p className="text-sm text-muted-foreground mt-1">
              A payment for this subscription has failed. The system will attempt automatic retries. 
              If all retries are exhausted, this subscription will be automatically closed.
            </p>
          </div>
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────── */}
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
      <div className="rounded-b-lg border border-t-0 bg-card shadow-sm">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-28 flex-shrink-0">Customer:</span>
                    <span className="font-medium">{subscription.customer}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-28 flex-shrink-0">Email:</span>
                    <span>contact@{subscription.customer.toLowerCase().replace(/\s+/g, "")}.com</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-28 flex-shrink-0">Phone:</span>
                    <span>+91 98765 43210</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Subscription Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-28 flex-shrink-0">Plan:</span>
                    <span className="font-medium">{subscription.plan}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-28 flex-shrink-0">Start Date:</span>
                    <span>{subscription.startDate}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-28 flex-shrink-0">Next Billing:</span>
                    <span className={subscription.status === "AT_RISK" ? "text-amber-600 font-medium" : ""}>
                      {subscription.nextBilling}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-28 flex-shrink-0">Billing Cycle:</span>
                    <span>Monthly</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-28 flex-shrink-0">Status:</span>
                    <StatusBadge status={subscription.status} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <div className="overflow-hidden">
            {relatedInvoices.length > 0 ? (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {relatedInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-mono font-medium text-foreground">{inv.id}</td>
                      <td className="text-muted-foreground">{inv.date}</td>
                      <td className="text-right font-medium">₹{inv.amount.toLocaleString()}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td>
                        <button
                          onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                          className="text-xs text-primary hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No invoices found for this subscription.</p>
              </div>
            )}
          </div>
        )}

        {/* Activity History Tab */}
        {activeTab === "history" && (
          <div className="p-6">
            <div className="space-y-4">
              {[
                { date: subscription.startDate, action: "Subscription created", detail: `Plan: ${subscription.plan}`, icon: FileText, color: "bg-blue-500" },
                { date: subscription.startDate, action: "Status changed to ACTIVE", detail: "Subscription activated after payment confirmation", icon: CheckCircle2, color: "bg-green-500" },
                ...(subscription.status === "AT_RISK"
                  ? [{ date: subscription.nextBilling, action: "Payment failed — Status changed to AT_RISK", detail: "Automatic retry scheduled", icon: AlertTriangle, color: "bg-amber-500" }]
                  : []),
                ...(subscription.status === "CLOSED"
                  ? [
                      { date: subscription.nextBilling, action: "Payment failed — Status changed to AT_RISK", detail: "3 retry attempts failed", icon: AlertTriangle, color: "bg-amber-500" },
                      { date: subscription.nextBilling, action: "Subscription CLOSED", detail: "Closed due to payment failure", icon: XCircle, color: "bg-red-500" },
                    ]
                  : []),
              ].reverse().map((event, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full ${event.color} flex items-center justify-center`}>
                      <event.icon className="h-4 w-4 text-white" />
                    </div>
                    {idx < 3 && <div className="w-0.5 h-full bg-border mt-2" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-foreground">{event.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{event.detail}</p>
                    <p className="text-xs text-muted-foreground mt-1">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubscriptionDetail;
