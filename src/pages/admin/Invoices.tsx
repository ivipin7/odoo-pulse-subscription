import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { invoices } from "@/data/mockData";

const AdminInvoices = () => {
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
              <tr key={inv.id}>
                <td>
                  <span className="font-mono font-medium text-foreground">{inv.id}</span>
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
