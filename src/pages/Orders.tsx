import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/layout/TopNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useOrders } from "@/hooks/useApi";

const Orders = () => {
  const { data: ordersData } = useOrders();
  const orders = (ordersData ?? []) as any[];
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        <PageHeader
          title="My Orders"
          breadcrumbs={[{ label: "Home", to: "/" }, { label: "Orders" }]}
        />

        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="font-mono font-medium text-foreground">{order.id}</span>
                  </td>
                  <td className="text-muted-foreground">{order.date}</td>
                  <td className="font-medium text-foreground">₹{order.total.toLocaleString()}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
