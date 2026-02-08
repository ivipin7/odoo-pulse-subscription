import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { ArrowLeft, Package, MapPin, FileText, User, Calendar, Hash } from "lucide-react";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data,
    enabled: !!user && !!id,
  });

  if (isLoading) return <PageLoader />;
  if (!data?.data) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order not found</h2>
        <Link to="/shop/orders"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders</Button></Link>
      </div>
    );
  }

  const order = data.data;
  const lines = order.lines || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/shop/orders" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Link>
          <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
        </div>
        <Badge className={`text-sm px-3 py-1 ${statusColors[order.status] || ""}`}>
          {order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Info + Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Order Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Order Number</p>
                    <p className="font-medium">{order.order_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Order Date</p>
                    <p className="font-medium">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{order.first_name} {order.last_name}</p>
                  </div>
                </div>
                {order.shipping_address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Shipping Address</p>
                      <p className="font-medium">{order.shipping_address}</p>
                    </div>
                  </div>
                )}
              </div>
              {order.notes && (
                <div className="mt-4 flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Notes</p>
                    <p className="font-medium">{order.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Items ({lines.length})</h2>
              <div className="divide-y">
                {lines.map((line: any) => (
                  <div key={line.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{line.product_name || line.description}</p>
                        <p className="text-xs text-muted-foreground">{line.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-medium text-sm">₹{Number(line.subtotal).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.quantity} × ₹{Number(line.unit_price).toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Price Summary */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Price Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{Number(order.subtotal).toFixed(0)}</span>
                </div>
                {Number(order.tax_amount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>₹{Number(order.tax_amount).toFixed(0)}</span>
                  </div>
                )}
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600">-₹{Number(order.discount_amount).toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{Number(order.total).toFixed(0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
