import { useParams, Link } from "react-router-dom";
import { Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/layout/TopNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useOrder, useProfile } from "@/hooks/useApi";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: orderData } = useOrder(id || "");
  const { data: profileData } = useProfile();
  const order = orderData as any;
  const userProfile = profileData as any;

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 text-center">
          <h2 className="text-xl font-semibold text-foreground">Order not found</h2>
          <Button variant="accent" asChild className="mt-4">
            <Link to="/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = order.total - order.tax + order.discount;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <PageHeader
          title={`Invoice ${order.id}`}
          breadcrumbs={[
            { label: "Home", to: "/" },
            { label: "Orders", to: "/orders" },
            { label: order.id },
          ]}
          actions={
            <div className="flex gap-2">
              {order.status === "FAILED" && (
                <Button variant="destructive" size="sm">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Retry Payment
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          }
        />

        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          {/* Invoice header */}
          <div className="p-6 sm:p-8 border-b">
            <div className="flex flex-col sm:flex-row justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <span className="text-xs font-bold text-primary-foreground">OP</span>
                  </div>
                  <span className="font-bold text-foreground">OdooPulse</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  SNS Innovation Hub<br />
                  Coimbatore, Tamil Nadu 641107
                </p>
              </div>
              <div className="text-sm sm:text-right space-y-1">
                <div>
                  <span className="text-muted-foreground">Invoice: </span>
                  <span className="font-mono font-medium text-foreground">{order.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date: </span>
                  <span className="text-foreground">{order.date}</span>
                </div>
                <div className="mt-2">
                  <StatusBadge status={order.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Bill to */}
          <div className="px-6 sm:px-8 py-4 border-b bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Bill To
            </span>
            <p className="text-sm text-foreground mt-1 font-medium">{userProfile.name}</p>
            <p className="text-sm text-muted-foreground">{userProfile.company}</p>
            <p className="text-sm text-muted-foreground">GST: {userProfile.gst}</p>
          </div>

          {/* Line items */}
          <div className="px-6 sm:px-8">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <span className="font-medium text-foreground">{item.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        Billed per {item.period}
                      </span>
                    </td>
                    <td className="text-center">{item.qty}</td>
                    <td className="text-right">₹{item.price.toLocaleString()}</td>
                    <td className="text-right font-medium">
                      ₹{(item.price * item.qty).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-6 sm:px-8 py-6 border-t">
            <div className="flex flex-col items-end space-y-2 text-sm">
              <div className="flex justify-between w-56">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-56">
                <span className="text-muted-foreground">GST (18%)</span>
                <span className="text-foreground">₹{order.tax.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between w-56">
                  <span className="text-emerald-600">Discount</span>
                  <span className="text-emerald-600">-₹{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between w-56 border-t pt-2 text-base font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
