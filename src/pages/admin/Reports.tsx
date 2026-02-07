import {
  BarChart3,
  TrendingUp,
  Download,
  DollarSign,
  Users,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { KPICard } from "@/components/shared/KPICard";
import { useSubscriptions, useInvoices, usePayments } from "@/hooks/useApi";

const monthlyData = [
  { month: "Sep", revenue: 145000, subscriptions: 42 },
  { month: "Oct", revenue: 168000, subscriptions: 48 },
  { month: "Nov", revenue: 172000, subscriptions: 51 },
  { month: "Dec", revenue: 185000, subscriptions: 55 },
  { month: "Jan", revenue: 210000, subscriptions: 60 },
  { month: "Feb", revenue: 240000, subscriptions: 64 },
];

const topProducts = [
  { name: "ERP Suite", revenue: 98400, subscribers: 18 },
  { name: "CRM Pro", revenue: 67200, subscribers: 14 },
  { name: "Accounting Plus", revenue: 54000, subscribers: 10 },
  { name: "Inventory Control", revenue: 42000, subscribers: 8 },
  { name: "HR Management", revenue: 36000, subscribers: 7 },
  { name: "Marketing Hub", revenue: 25500, subscribers: 7 },
];

const maxRevenue = Math.max(...topProducts.map((p) => p.revenue));

const AdminReports = () => {
  const { data: subsData } = useSubscriptions();
  const { data: invData } = useInvoices();
  const { data: payData } = usePayments();
  const subscriptions = (subsData ?? []) as any[];
  const invoices = (invData ?? []) as any[];
  const payments = (payData ?? []) as any[];
  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        breadcrumbs={[
          { label: "Admin", to: "/admin" },
          { label: "Reports" },
        ]}
        actions={
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KPICard
          title="Total Revenue (FY)"
          value="₹12.2L"
          icon={DollarSign}
          trend="↑ 24% YoY"
          trendUp={true}
        />
        <KPICard
          title="Active Subscriptions"
          value={subscriptions.filter((s) => s.status === "ACTIVE").length}
          icon={Users}
          trend="↑ 4 this month"
          trendUp={true}
        />
        <KPICard
          title="Payment Success Rate"
          value={`${Math.round(
            (payments.filter((p) => p.status === "SUCCESS").length / payments.length) * 100
          )}%`}
          icon={CreditCard}
          trend="Target: 95%"
          trendUp={true}
        />
        <KPICard
          title="Churn Rate"
          value="4.2%"
          icon={AlertTriangle}
          trend="↓ 0.8% from last quarter"
          trendUp={true}
        />
      </div>

      {/* Revenue Trend (Bar Chart) */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Monthly Revenue Trend
            </h3>
          </div>
          <div className="space-y-3">
            {monthlyData.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-8">{m.month}</span>
                <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                  <div
                    className="bg-accent/80 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{
                      width: `${(m.revenue / 260000) * 100}%`,
                    }}
                  >
                    <span className="text-xs font-medium text-white">
                      ₹{(m.revenue / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              Revenue by Product
            </h3>
          </div>
          <div className="space-y-3">
            {topProducts.map((p) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-28 truncate">{p.name}</span>
                <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                  <div
                    className="bg-primary/70 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{
                      width: `${(p.revenue / maxRevenue) * 100}%`,
                    }}
                  >
                    <span className="text-xs font-medium text-white">
                      ₹{(p.revenue / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">{p.subscribers} subs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Invoice Summary</h3>
          <div className="space-y-3">
            {[
              { label: "Paid", count: invoices.filter((i) => i.status === "PAID").length, amount: invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0), color: "text-emerald-600" },
              { label: "Confirmed", count: invoices.filter((i) => i.status === "CONFIRMED").length, amount: invoices.filter((i) => i.status === "CONFIRMED").reduce((s, i) => s + i.amount, 0), color: "text-sky-600" },
              { label: "Failed", count: invoices.filter((i) => i.status === "FAILED").length, amount: invoices.filter((i) => i.status === "FAILED").reduce((s, i) => s + i.amount, 0), color: "text-red-600" },
              { label: "Draft", count: invoices.filter((i) => i.status === "DRAFT").length, amount: invoices.filter((i) => i.status === "DRAFT").reduce((s, i) => s + i.amount, 0), color: "text-gray-500" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${row.color}`}>{row.label}</span>
                  <span className="text-xs text-muted-foreground">({row.count})</span>
                </div>
                <span className="font-semibold text-foreground">₹{row.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Subscription Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: "Active", count: subscriptions.filter((s) => s.status === "ACTIVE").length, color: "bg-emerald-500" },
              { label: "At Risk", count: subscriptions.filter((s) => s.status === "AT_RISK").length, color: "bg-amber-500" },
              { label: "Closed", count: subscriptions.filter((s) => s.status === "CLOSED").length, color: "bg-gray-400" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${row.color}`} />
                  <span className="font-medium text-foreground">{row.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-foreground">{row.count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((row.count / subscriptions.length) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Visual bar */}
          <div className="mt-4 flex h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500"
              style={{
                width: `${(subscriptions.filter((s) => s.status === "ACTIVE").length / subscriptions.length) * 100}%`,
              }}
            />
            <div
              className="bg-amber-500"
              style={{
                width: `${(subscriptions.filter((s) => s.status === "AT_RISK").length / subscriptions.length) * 100}%`,
              }}
            />
            <div
              className="bg-gray-400"
              style={{
                width: `${(subscriptions.filter((s) => s.status === "CLOSED").length / subscriptions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
