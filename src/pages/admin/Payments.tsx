import { CreditCard, DollarSign, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePayments, useRetryPayment } from "@/hooks/useApi";

const AdminPayments = () => {
  const { data: payData } = usePayments();
  const payments = (payData ?? []) as any[];
  const retryPayment = useRetryPayment();
  const totalCollected = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalFailed = payments
    .filter((p) => p.status === "FAILED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <PageHeader
        title="Payments"
        breadcrumbs={[
          { label: "Admin", to: "/admin" },
          { label: "Payments" },
        ]}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KPICard
          title="Total Collected"
          value={`₹${(totalCollected / 1000).toFixed(1)}K`}
          icon={DollarSign}
          trend="↑ 8% from last month"
          trendUp={true}
        />
        <KPICard
          title="Failed Payments"
          value={payments.filter((p) => p.status === "FAILED").length}
          icon={XCircle}
          trend={`₹${(totalFailed / 1000).toFixed(1)}K at risk`}
          trendUp={false}
        />
        <KPICard
          title="Pending"
          value={payments.filter((p) => p.status === "PENDING").length}
          icon={CreditCard}
          trend="Awaiting confirmation"
          trendUp={false}
        />
        <KPICard
          title="Refunded"
          value={payments.filter((p) => p.status === "REFUNDED").length}
          icon={RefreshCw}
          trend="1 this month"
          trendUp={false}
        />
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Date</th>
              <th>Retries</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((pay) => (
              <tr key={pay.id}>
                <td>
                  <span className="font-mono font-medium text-foreground">{pay.id}</span>
                </td>
                <td className="text-muted-foreground font-mono text-xs">{pay.invoiceId}</td>
                <td className="font-medium text-foreground">{pay.customer}</td>
                <td className="text-foreground">₹{pay.amount.toLocaleString()}</td>
                <td className="text-muted-foreground">{pay.method}</td>
                <td className="text-muted-foreground">{pay.date}</td>
                <td className="text-center">
                  {pay.retryCount > 0 ? (
                    <span className="status-badge status-badge-warning">{pay.retryCount}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td>
                  <StatusBadge status={pay.status} />
                </td>
                <td className="text-right">
                  {pay.status === "FAILED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => retryPayment.mutate(Number(pay.id?.replace?.(/\D/g, "") || 0))}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPayments;
