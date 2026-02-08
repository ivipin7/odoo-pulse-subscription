import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, AdminRoute, GuestRoute } from "@/components/layout/RouteGuards";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import ProductFormPage from "@/pages/ProductFormPage";
import SubscriptionsPage from "@/pages/SubscriptionsPage";
import SubscriptionDetailPage from "@/pages/SubscriptionDetailPage";
import SubscriptionFormPage from "@/pages/SubscriptionFormPage";
import InvoicesPage from "@/pages/InvoicesPage";
import InvoiceDetailPage from "@/pages/InvoiceDetailPage";
import PaymentsPage from "@/pages/PaymentsPage";
import PaymentFormPage from "@/pages/PaymentFormPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminTaxesPage from "@/pages/admin/AdminTaxesPage";
import AdminDiscountsPage from "@/pages/admin/AdminDiscountsPage";
import AdminPlansPage from "@/pages/admin/AdminPlansPage";
import AdminQuotationTemplatesPage from "@/pages/admin/AdminQuotationTemplatesPage";
import AdminAttributesPage from "@/pages/admin/AdminAttributesPage";
import ReportsPage from "@/pages/ReportsPage";
import ChurnPredictionPage from "@/pages/ChurnPredictionPage";
import ShopHomePage from "@/pages/shop/ShopHomePage";
import ShopPage from "@/pages/shop/ShopPage";
import ShopProductDetailPage from "@/pages/shop/ShopProductDetailPage";
import CartPage from "@/pages/shop/CartPage";
import MyOrdersPage from "@/pages/shop/MyOrdersPage";
import OrderDetailPage from "@/pages/shop/OrderDetailPage";
import ShopProfilePage from "@/pages/shop/ShopProfilePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest routes */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* All protected routes under unified sidebar layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Dashboard & Management */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new" element={<ProductFormPage />} />
            <Route path="/products/:id/edit" element={<ProductFormPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/subscriptions/new" element={<SubscriptionFormPage />} />
            <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
            <Route path="/subscriptions/:id/edit" element={<SubscriptionFormPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/payments/new" element={<PaymentFormPage />} />

            {/* Shop pages — same sidebar */}
            <Route path="/shop" element={<ShopHomePage />} />
            <Route path="/shop/products" element={<ShopPage />} />
            <Route path="/shop/products/:id" element={<ShopProductDetailPage />} />
            <Route path="/shop/cart" element={<CartPage />} />
            <Route path="/shop/orders" element={<MyOrdersPage />} />
            <Route path="/shop/orders/:id" element={<OrderDetailPage />} />
            <Route path="/shop/profile" element={<ShopProfilePage />} />

            {/* Admin routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/taxes" element={<AdminTaxesPage />} />
              <Route path="/admin/discounts" element={<AdminDiscountsPage />} />
              <Route path="/admin/plans" element={<AdminPlansPage />} />
              <Route path="/admin/attributes" element={<AdminAttributesPage />} />
              <Route path="/admin/quotation-templates" element={<AdminQuotationTemplatesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/churn" element={<ChurnPredictionPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
