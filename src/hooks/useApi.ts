/**
 * React Query hooks with automatic mock-data fallback.
 *
 * Strategy:
 *  - Each hook calls the real API first.
 *  - If the API is unreachable (network error, CORS, 5xx) the `retry`
 *    is disabled and `placeholderData` from mockData keeps the UI working.
 *  - When Sindhu / Siva spin up the backend, hooks automatically use real data.
 *  - The `useFallbackQuery` wrapper makes this pattern DRY.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { productsService } from "@/services/products.service";
import { subscriptionsService } from "@/services/subscriptions.service";
import { invoicesService } from "@/services/invoices.service";
import { paymentsService } from "@/services/payments.service";
import { ordersService } from "@/services/orders.service";
import { cartService } from "@/services/cart.service";
import { quotationsService } from "@/services/quotations.service";
import { discountsService } from "@/services/discounts.service";
import { taxesService } from "@/services/taxes.service";
import { usersService } from "@/services/users.service";
import { profileService } from "@/services/profile.service";
import { toast } from "sonner";

// ─── Mock data (kept as fallback until backend is live) ──
import {
  products as mockProducts,
  orders as mockOrders,
  subscriptions as mockSubscriptions,
  invoices as mockInvoices,
  initialCartItems as mockCartItems,
  payments as mockPayments,
  quotations as mockQuotations,
  discounts as mockDiscounts,
  taxRules as mockTaxRules,
  adminUsers as mockAdminUsers,
  userProfile as mockUserProfile,
  categories as mockCategories,
} from "@/data/mockData";

// ──────────────────────────────────────────────────────────
// Helper: wraps a query so it silently falls back to mock
// ──────────────────────────────────────────────────────────
function useFallbackQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  mockData: T,
  opts?: Partial<UseQueryOptions<T, Error, T, string[]>>
) {
  return useQuery<T, Error, T, string[]>({
    queryKey: key,
    queryFn,
    retry: 1,
    retryDelay: 500,
    placeholderData: mockData,
    ...opts,
  });
}

// ─── Products ────────────────────────────────────────────

export function useProducts() {
  return useFallbackQuery(
    ["products"],
    productsService.getAll,
    mockProducts as any
  );
}

export function useProduct(id: number) {
  const mock = mockProducts.find((p) => p.id === id);
  return useFallbackQuery(
    ["products", String(id)],
    () => productsService.getById(id),
    mock as any,
    { enabled: !!id }
  );
}

export function useCategories() {
  return { data: mockCategories };
}

// ─── Subscriptions ───────────────────────────────────────

export function useSubscriptions() {
  return useFallbackQuery(
    ["subscriptions"],
    subscriptionsService.getAll,
    mockSubscriptions as any
  );
}

export function useSubscription(id: number) {
  return useFallbackQuery(
    ["subscriptions", String(id)],
    () => subscriptionsService.getById(id),
    mockSubscriptions[0] as any,
    { enabled: !!id }
  );
}

// ─── Invoices ────────────────────────────────────────────

export function useInvoices() {
  return useFallbackQuery(
    ["invoices"],
    invoicesService.getAll,
    mockInvoices as any
  );
}

// ─── Payments ────────────────────────────────────────────

export function usePayments() {
  return useFallbackQuery(
    ["payments"],
    paymentsService.getAll,
    mockPayments as any
  );
}

export function useRetryPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) => paymentsService.retryPayment(invoiceId),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Payment recovered successfully!");
      } else {
        toast.error(
          `Retry failed. ${data.retriesRemaining} retries remaining.`
        );
      }
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["recovery"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Retry failed");
    },
  });
}

export function useRecoveryDashboard() {
  const mock = {
    failedCount: mockPayments.filter((p) => p.status === "FAILED").length,
    atRiskCount: mockSubscriptions.filter((s) => s.status === "AT_RISK").length,
    recoveredCount: 24,
    revenueAtRisk: mockPayments
      .filter((p) => p.status === "FAILED")
      .reduce((s, p) => s + p.amount, 0),
    revenueRecovered: 172800,
  };
  return useFallbackQuery(
    ["recovery", "dashboard"],
    paymentsService.getRecoveryDashboard,
    mock as any
  );
}

export function useAtRiskSubscriptions() {
  const mock = mockSubscriptions.filter((s) => s.status === "AT_RISK");
  return useFallbackQuery(
    ["recovery", "at-risk"],
    paymentsService.getAtRiskSubscriptions,
    mock as any
  );
}

export function useRecoveryTimeline() {
  return useFallbackQuery(
    ["recovery", "timeline"],
    paymentsService.getRecoveryTimeline,
    [] as any
  );
}

// ─── Orders ──────────────────────────────────────────────

export function useOrders() {
  return useFallbackQuery(
    ["orders"],
    ordersService.getAll,
    mockOrders as any
  );
}

export function useOrder(id: string | number) {
  const mock = mockOrders.find((o) => o.id === String(id));
  return useFallbackQuery(
    ["orders", String(id)],
    () => ordersService.getById(Number(id)),
    mock as any,
    { enabled: !!id }
  );
}

// ─── Cart ────────────────────────────────────────────────

export function useCart() {
  return useFallbackQuery(
    ["cart"],
    cartService.getItems,
    mockCartItems as any
  );
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      productId: number;
      variantId?: number;
      quantity: number;
    }) => cartService.addItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      cartService.updateQuantity(id, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cartService.removeItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Removed from cart");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ─── Quotations ──────────────────────────────────────────

export function useQuotations() {
  return useFallbackQuery(
    ["quotations"],
    quotationsService.getAll,
    mockQuotations as any
  );
}

// ─── Discounts ───────────────────────────────────────────

export function useDiscounts() {
  return useFallbackQuery(
    ["discounts"],
    discountsService.getAll,
    mockDiscounts as any
  );
}

export function useValidateDiscount() {
  return useMutation({
    mutationFn: (code: string) => discountsService.validate(code),
    onSuccess: (discount) => {
      toast.success(`Discount "${discount.code}" applied!`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ─── Tax Rules ───────────────────────────────────────────

export function useTaxRules() {
  return useFallbackQuery(
    ["taxes"],
    taxesService.getAll,
    mockTaxRules as any
  );
}

// ─── Users (Admin) ───────────────────────────────────────

export function useUsers() {
  return useFallbackQuery(
    ["users"],
    usersService.getAll,
    mockAdminUsers as any
  );
}

// ─── Profile ─────────────────────────────────────────────

export function useProfile() {
  return useFallbackQuery(
    ["profile"],
    profileService.getProfile,
    mockUserProfile as any
  );
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof profileService.updateProfile>[0]) =>
      profileService.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
