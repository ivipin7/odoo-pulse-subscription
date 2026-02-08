import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import type { DashboardData } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Users,
  Package,
  FileText,
  Settings,
  Brain,
  ShieldAlert,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "INTERNAL";

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get("/reports/dashboard");
      return res.data.data;
    },
  });

  if (isLoading) return <PageLoader />;
  if (error) return <p className="text-destructive">Failed to load dashboard</p>;
  if (!data) return null;

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    QUOTATION: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    ACTIVE: "bg-green-100 text-green-800",
    CLOSED: "bg-red-100 text-red-800",
  };

  // ---------- ADMIN / INTERNAL DASHBOARD ----------
  if (isAdmin) {
    const adminKpis = [
      {
        title: "Active Subscriptions",
        value: data.activeSubscriptions,
        icon: RefreshCw,
        color: "text-blue-600 bg-blue-50",
      },
      {
        title: "Total Revenue",
        value: `₹${data.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        icon: DollarSign,
        color: "text-green-600 bg-green-50",
      },
      {
        title: "Payments Collected",
        value: data.payments.count,
        sub: `₹${data.payments.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        icon: CreditCard,
        color: "text-purple-600 bg-purple-50",
      },
      {
        title: "Overdue Invoices",
        value: data.overdueInvoices,
        icon: AlertTriangle,
        color: data.overdueInvoices > 0 ? "text-red-600 bg-red-50" : "text-gray-600 bg-gray-50",
      },
      {
        title: "At-Risk Subs",
        value: data.atRiskCount ?? 0,
        icon: ShieldAlert,
        color: (data.atRiskCount ?? 0) > 0 ? "text-orange-600 bg-orange-50" : "text-gray-600 bg-gray-50",
        link: "/churn",
      },
    ];

    const quickLinks = [
      { to: "/admin/users", label: "Manage Users", icon: Users },
      { to: "/products/new", label: "Add Product", icon: Package },
      { to: "/admin/plans", label: "Manage Plans", icon: Settings },
      { to: "/reports", label: "View Reports", icon: FileText },
      { to: "/churn", label: "Churn Prediction", icon: Brain },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">System-wide overview</p>
        </div>

        {/* Admin KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {adminKpis.map((kpi) => {
            const content = (
              <Card key={kpi.title} className={(kpi as any).link ? "hover:shadow-md transition-shadow cursor-pointer" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{kpi.title}</p>
                      <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                      {kpi.sub && <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>}
                    </div>
                    <div className={`p-3 rounded-full ${kpi.color}`}>
                      <kpi.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            return (kpi as any).link ? (
              <Link key={kpi.title} to={(kpi as any).link}>{content}</Link>
            ) : (
              <div key={kpi.title}>{content}</div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {quickLinks.map((link) => (
                <Link key={link.to} to={link.to}>
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                    <link.icon className="h-5 w-5" />
                    <span className="text-xs">{link.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown + Recent Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Subscriptions by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {data.subscriptionsByStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subscriptions yet</p>
              ) : (
                <div className="space-y-3">
                  {data.subscriptionsByStatus.map((s) => (
                    <div key={s.status} className="flex items-center justify-between">
                      <Badge className={statusColors[s.status] || "bg-gray-100"}>{s.status}</Badge>
                      <span className="text-lg font-semibold">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Payments (All Customers)</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments yet</p>
              ) : (
                <div className="space-y-3">
                  {data.recentPayments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{p.payment_number}</p>
                        <p className="text-xs text-muted-foreground">{p.customer_name} — {p.invoice_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">₹{parseFloat(p.amount).toFixed(2)}</p>
                        <Badge variant={p.status === "COMPLETED" ? "default" : "destructive"} className="text-xs">
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ---------- CUSTOMER DASHBOARD ----------
  const customerKpis = [
    {
      title: "My Active Subscriptions",
      value: data.activeSubscriptions,
      icon: RefreshCw,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Total Paid",
      value: `₹${data.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-green-600 bg-green-50",
    },
    {
      title: "My Payments",
      value: data.payments.count,
      sub: `₹${data.payments.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: CreditCard,
      color: "text-purple-600 bg-purple-50",
    },
    {
      title: "Pending Invoices",
      value: data.overdueInvoices,
      icon: AlertTriangle,
      color: data.overdueInvoices > 0 ? "text-red-600 bg-red-50" : "text-gray-600 bg-gray-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.first_name}!</h1>
        <p className="text-sm text-muted-foreground">Your subscription overview</p>
      </div>

      {/* Customer KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {customerKpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  {kpi.sub && <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>}
                </div>
                <div className={`p-3 rounded-full ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customer quick links + subscription status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {data.subscriptionsByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have no subscriptions yet</p>
            ) : (
              <div className="space-y-3">
                {data.subscriptionsByStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between">
                    <Badge className={statusColors[s.status] || "bg-gray-100"}>{s.status}</Badge>
                    <span className="text-lg font-semibold">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link to="/subscriptions">
                <Button variant="outline" size="sm">View All Subscriptions</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentPayments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{p.payment_number}</p>
                      <p className="text-xs text-muted-foreground">{p.invoice_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₹{parseFloat(p.amount).toFixed(2)}</p>
                      <Badge variant={p.status === "COMPLETED" ? "default" : "destructive"} className="text-xs">
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link to="/payments">
                <Button variant="outline" size="sm">View All Payments</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
