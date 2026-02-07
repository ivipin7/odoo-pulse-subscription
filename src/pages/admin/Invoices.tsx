import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useInvoices } from "@/hooks/useApi";
import { useNavigate } from "react-router-dom";

const AdminInvoices = () => {
  const { data: invData } = useInvoices();
  const invoices = (invData ?? []) as any[];
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="Invoices" />

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/admin/invoices/${inv.id}`)}>
                <td>
                  <span className="font-mono font-medium text-primary hover:underline">{inv.id}</span>
                </td>
                <td className="font-medium text-foreground">{inv.customer}</td>
                <td className="text-foreground">₹{inv.amount.toLocaleString()}</td>
                <td className="text-muted-foreground">{inv.date}</td>
                <td>
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInvoices;
