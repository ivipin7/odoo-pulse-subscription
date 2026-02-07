import { AlertTriangle, DollarSign, RefreshCw, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KPICard } from "@/components/shared/KPICard";

const AdminDashboard = () => {
  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Failed Payments"
          value={12}
          icon={AlertTriangle}
          trend="↑ 3 from last week"
          trendUp={false}
        />
        <KPICard
          title="At-Risk Subscriptions"
          value={8}
          icon={TrendingUp}
          trend="↓ 2 from last week"
          trendUp={true}
        />
        <KPICard
          title="Recovered Payments"
          value={24}
          icon={RefreshCw}
          trend="↑ 5 from last month"
          trendUp={true}
        />
        <KPICard
          title="Monthly Revenue"
          value="₹2.4L"
          icon={DollarSign}
          trend="↑ 12% MoM"
          trendUp={true}
        />
      </div>

      {/* Quick summary */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Recent Failed Invoices</h3>
          <div className="space-y-3">
            {[
              { customer: "GlobalTrade Ltd", amount: "₹14,400", date: "Feb 01" },
              { customer: "RetailMax", amount: "₹20,400", date: "Feb 01" },
              { customer: "QuickShip Inc", amount: "₹8,400", date: "Jan 28" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <span className="text-sm font-medium text-foreground">{item.customer}</span>
                  <span className="block text-xs text-muted-foreground">{item.date}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">At-Risk Subscriptions</h3>
          <div className="space-y-3">
            {[
              { customer: "GlobalTrade Ltd", plan: "Inventory Control", days: 15 },
              { customer: "RetailMax", plan: "ERP Suite", days: 7 },
              { customer: "NovaTech", plan: "CRM Pro", days: 3 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <span className="text-sm font-medium text-foreground">{item.customer}</span>
                  <span className="block text-xs text-muted-foreground">{item.plan}</span>
                </div>
                <span className="status-badge status-badge-warning">{item.days}d overdue</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
