import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import { AdminLayout } from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import AdminAtRisk from "./pages/admin/AtRisk";
import AdminInvoices from "./pages/admin/Invoices";
import AdminPayments from "./pages/admin/Payments";
import AdminQuotations from "./pages/admin/Quotations";
import AdminProducts from "./pages/admin/Products";
import AdminDiscounts from "./pages/admin/Discounts";
import AdminTaxes from "./pages/admin/Taxes";
import AdminUsers from "./pages/admin/Users";
import AdminReports from "./pages/admin/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="at-risk" element={<AdminAtRisk />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="quotations" element={<AdminQuotations />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="discounts" element={<AdminDiscounts />} />
            <Route path="taxes" element={<AdminTaxes />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
