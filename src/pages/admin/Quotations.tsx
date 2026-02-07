import { FileText, Plus, Eye, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useQuotations } from "@/hooks/useApi";

const statusMap: Record<string, string> = {
  DRAFT: "DRAFT",
  SENT: "PROCESSING",
  ACCEPTED: "PAID",
  EXPIRED: "CLOSED",
  REJECTED: "FAILED",
};

const AdminQuotations = () => {
  const { data: quotData } = useQuotations();
  const quotations = (quotData ?? []) as any[];
  return (
    <div>
      <PageHeader
        title="Quotations"
        breadcrumbs={[
          { label: "Admin", to: "/admin" },
          { label: "Quotations" },
        ]}
        actions={
          <Button variant="accent" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Quotation
          </Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Quotations</p>
          <p className="text-2xl font-bold text-foreground mt-1">{quotations.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Accepted</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {quotations.filter((q) => q.status === "ACCEPTED").length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {quotations.filter((q) => q.status === "SENT" || q.status === "DRAFT").length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            ₹{(quotations.reduce((s, q) => s + q.totalAmount, 0) / 1000).toFixed(1)}K
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Quotation ID</th>
              <th>Customer</th>
              <th>Products</th>
              <th>Amount</th>
              <th>Valid Until</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((q) => (
              <tr key={q.id}>
                <td>
                  <span className="font-mono font-medium text-foreground">{q.id}</span>
                </td>
                <td className="font-medium text-foreground">{q.customer}</td>
                <td className="text-muted-foreground text-sm">
                  {q.products.join(", ")}
                </td>
                <td className="text-foreground">₹{q.totalAmount.toLocaleString()}</td>
                <td className="text-muted-foreground">{q.validUntil}</td>
                <td>
                  <StatusBadge status={statusMap[q.status] || q.status} />
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {q.status === "DRAFT" && (
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                    )}
                    {q.status === "SENT" && (
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mark Accepted
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminQuotations;
