import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useSubscriptions } from "@/hooks/useApi";
import { useNavigate } from "react-router-dom";

const AdminSubscriptions = () => {
  const { data: subsData } = useSubscriptions();
  const subscriptions = (subsData ?? []) as any[];
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="Subscriptions" />

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Subscription ID</th>
              <th>Customer</th>
              <th>Plan</th>
              <th>Start Date</th>
              <th>Next Billing</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/admin/subscriptions/${sub.id}`)}>
                <td>
                  <span className="font-mono font-medium text-primary hover:underline">{sub.id}</span>
                </td>
                <td className="font-medium text-foreground">{sub.customer}</td>
                <td className="text-muted-foreground">{sub.plan}</td>
                <td className="text-muted-foreground">{sub.startDate}</td>
                <td className="text-muted-foreground">{sub.nextBilling}</td>
                <td>
                  <StatusBadge status={sub.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
