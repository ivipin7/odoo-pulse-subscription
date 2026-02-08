import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import {
  LayoutDashboard, Package, RefreshCw, FileText, CreditCard,
  Users, Tags, Percent, BarChart3, LogOut, Menu, X,
  ClipboardList, Store, Layers, ShoppingCart, ShoppingBag,
  Home, User, ChevronDown, ChevronRight, Brain,
} from "lucide-react";
import { useState } from "react";

const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { to: "/products", label: "Products", icon: Package, adminOnly: true },
  { to: "/subscriptions", label: "Subscriptions", icon: RefreshCw, adminOnly: false },
  { to: "/invoices", label: "Invoices", icon: FileText, adminOnly: false },
  { to: "/payments", label: "Payments", icon: CreditCard, adminOnly: false },
];

const shopNav = [
  { to: "/shop", label: "Storefront", icon: Home, end: true },
  { to: "/shop/products", label: "Browse Products", icon: ShoppingBag },
  { to: "/shop/cart", label: "Cart", icon: ShoppingCart },
  { to: "/shop/orders", label: "My Orders", icon: Package },
  { to: "/shop/profile", label: "My Profile", icon: User },
];

const adminNav = [
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/taxes", label: "Taxes", icon: Tags },
  { to: "/admin/discounts", label: "Discounts", icon: Percent },
  { to: "/admin/plans", label: "Plans", icon: RefreshCw },
  { to: "/admin/attributes", label: "Variants", icon: Layers },
  { to: "/admin/quotation-templates", label: "Templates", icon: ClipboardList },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/churn", label: "Churn Prediction", icon: Brain },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shopExpanded, setShopExpanded] = useState(location.pathname.startsWith("/shop"));
  const isAdmin = user?.role === "ADMIN" || user?.role === "INTERNAL";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? "bg-primary/10 text-primary font-semibold"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">SubManager</h1>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Subscription Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Main section */}
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase text-muted-foreground/70 tracking-widest">
          Management
        </p>
        {mainNav
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setSidebarOpen(false)}>
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}

        {/* Shop section - collapsible */}
        <div className="pt-4">
          <button
            onClick={() => setShopExpanded(!shopExpanded)}
            className="flex items-center justify-between w-full px-3 mb-2 text-[11px] font-semibold uppercase text-muted-foreground/70 tracking-widest hover:text-muted-foreground transition-colors"
          >
            <span>Shop</span>
            {shopExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {shopExpanded && (
            <div className="space-y-0.5">
              {shopNav
                .filter((item) => {
                  // Hide cart for admins
                  if (isAdmin && item.to === "/shop/cart") return false;
                  // Hide orders/profile for admins
                  if (isAdmin && (item.to === "/shop/orders" || item.to === "/shop/profile")) return false;
                  return true;
                })
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={linkClass}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.to === "/shop/cart" && totalItems > 0 && (
                      <span className="ml-auto h-5 min-w-[1.25rem] px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                        {totalItems}
                      </span>
                    )}
                  </NavLink>
                ))}
            </div>
          )}
        </div>

        {/* Admin section */}
        {isAdmin && (
          <div className="pt-4">
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase text-muted-foreground/70 tracking-widest">
              Administration
            </p>
            {adminNav.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setSidebarOpen(false)}>
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-border/50 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-bold shadow-sm">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-card border-r border-border/50 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-card shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-sm px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted md:hidden transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <div className="md:hidden">
              <h1 className="text-base font-bold text-primary">SubManager</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin && totalItems > 0 && (
              <NavLink
                to="/shop/cart"
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-sm font-medium hover:bg-muted transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                <span className="h-5 min-w-[1.25rem] px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              </NavLink>
            )}
            <div className="hidden md:flex items-center gap-2 px-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xs font-bold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <span className="text-sm font-medium">{user?.first_name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
