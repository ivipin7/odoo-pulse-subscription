import { AlertTriangle, Phone, Mail, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useSubscriptions, useInvoices, useRetryPayment } from "@/hooks/useApi";

const AdminAtRisk = () => {
  const { data: subsData } = useSubscriptions();
  const { data: invData } = useInvoices();
  const retryPayment = useRetryPayment();
  const subscriptions = (subsData ?? []) as any[];
  const invoices = (invData ?? []) as any[];

  const atRiskSubs = subscriptions.filter((s: any) => s.status === "AT_RISK");
  const failedInvoices = invoices.filter((i: any) => i.status === "FAILED");

  const atRiskDetails = atRiskSubs.slice(0, 2).map((sub: any, i: number) => ({
    sub,
    reason: `Payment failed ${3 - i} times`,
    daysSinceIssue: i === 0 ? 15 : 7,
    lastContact: i === 0 ? "2025-02-05" : "2025-02-13",
    revenue: i === 0 ? 14400 : 20400,
  }));
  return (
    <div>
      <PageHeader
        title="At-Risk Subscriptions"
        breadcrumbs={[
          { label: "Admin", to: "/admin" },
          { label: "At-Risk" },
        ]}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KPICard
          title="Total At-Risk"
          value={atRiskSubs.length}
          icon={AlertTriangle}
          trend="↓ 1 from last week"
          trendUp={true}
        />
        <KPICard
          title="Revenue at Risk"
          value="₹34.8K"
          icon={AlertTriangle}
          trend="₹14.4K recoverable"
          trendUp={false}
        />
        <KPICard
          title="Failed Payments"
          value={failedInvoices.length}
          icon={RefreshCw}
          trend="5 retries pending"
          trendUp={false}
        />
        <KPICard
          title="Avg Days Overdue"
          value="11"
          icon={Clock}
          trend="Needs attention"
          trendUp={false}
        />
      </div>

      {/* At-Risk Detail Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-foreground">At-Risk Subscription Details</h3>
        </div>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Subscription</th>
              <th>Customer</th>
              <th>Plan</th>
              <th>Risk Reason</th>
              <th>Days Since Issue</th>
              <th>Revenue</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {atRiskDetails.map((item) => (
              <tr key={item.sub.id}>
                <td>
                  <span className="font-mono font-medium text-foreground">{item.sub.id}</span>
                </td>
                <td className="font-medium text-foreground">{item.sub.customer}</td>
                <td className="text-muted-foreground">{item.sub.plan}</td>
                <td>
                  <span className="text-sm text-red-600 font-medium">{item.reason}</span>
                </td>
                <td>
                  <span className="status-badge status-badge-warning">{item.daysSinceIssue}d overdue</span>
                </td>
                <td className="text-foreground font-medium">₹{item.revenue.toLocaleString()}</td>
                <td>
                  <StatusBadge status={item.sub.status} />
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Call Customer">
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Email Customer">
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => retryPayment.mutate(Number(item.sub?.id?.replace?.(/\D/g, "") || 0))}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recovery Timeline */}
      <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Recovery Actions Timeline</h3>
        <div className="space-y-4">
          {[
            { date: "Feb 20", action: "Auto-retry payment for GlobalTrade Ltd", status: "PENDING", type: "auto" },
            { date: "Feb 18", action: "Email reminder sent to RetailMax", status: "CONFIRMED", type: "email" },
            { date: "Feb 15", action: "Phone call to GlobalTrade Ltd — No answer", status: "FAILED", type: "call" },
            { date: "Feb 13", action: "Email reminder sent to RetailMax", status: "CONFIRMED", type: "email" },
            { date: "Feb 10", action: "Payment retry #2 failed for GlobalTrade Ltd", status: "FAILED", type: "auto" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 py-2 border-b last:border-0">
              <span className="text-xs text-muted-foreground w-16 pt-0.5 shrink-0">{item.date}</span>
              <div className="flex-1">
                <p className="text-sm text-foreground">{item.action}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAtRisk;
