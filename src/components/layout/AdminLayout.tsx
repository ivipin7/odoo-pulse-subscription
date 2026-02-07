import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  Package,
  ArrowLeft,
  AlertTriangle,
  DollarSign,
  ClipboardList,
  Tag,
  Receipt,
  Users,
  BarChart3,
} from "lucide-react";

const adminLinks = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Subscriptions", to: "/admin/subscriptions", icon: CreditCard },
  { label: "At-Risk", to: "/admin/at-risk", icon: AlertTriangle },
  { label: "Invoices", to: "/admin/invoices", icon: FileText },
  { label: "Payments", to: "/admin/payments", icon: DollarSign },
  { label: "Quotations", to: "/admin/quotations", icon: ClipboardList },
  { label: "Products", to: "/admin/products", icon: Package },
  { label: "Discounts", to: "/admin/discounts", icon: Tag },
  { label: "Taxes", to: "/admin/taxes", icon: Receipt },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Reports", to: "/admin/reports", icon: BarChart3 },
];

export const AdminLayout = () => {
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <span className="text-sm font-bold text-sidebar-primary-foreground">OP</span>
            </div>
            <span className="text-lg font-bold tracking-tight">OdooPulse</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to, link.exact);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-background">
        <div className="p-6 sm:p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
