import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Package, Minus, Plus, ShoppingCart, ChevronRight, Shield, Truck, RotateCcw, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface PlanRow {
  id: string;
  name: string;
  billing_period: string;
  billing_interval: number;
  price: number;
  description?: string;
}

interface VariantRow {
  id: string;
  product_id: string;
  attribute_value_id: string;
  attribute_name: string;
  attribute_value: string;
  extra_price: number;
  sku?: string;
  price_override?: number;
}

/** Get the number of months a plan covers */
function planMonths(period: string, interval: number): number {
  switch (period) {
    case "DAILY": return (interval / 30) || 1;
    case "WEEKLY": return (interval * 7) / 30;
    case "MONTHLY": return interval;
    case "YEARLY": return interval * 12;
    default: return interval;
  }
}

/** Format period for display */
function periodLabel(period: string, interval: number): string {
  if (interval === 1) {
    switch (period) {
      case "DAILY": return "Daily";
      case "WEEKLY": return "Weekly";
      case "MONTHLY": return "Monthly";
      case "YEARLY": return "Yearly";
    }
  }
  const unit = period.toLowerCase().replace("ly", "").replace("dai", "day");
  return `${interval} ${unit}${interval > 1 ? "s" : ""}`;
}

export default function ShopProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "ADMIN" || user?.role === "INTERNAL";

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["shop-product"] });
      navigate("/shop/products");
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate();
    }
  };
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<VariantRow | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanRow | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["shop-product", id],
    queryFn: async () => (await api.get(`/shop/products/${id}`)).data.data,
  });

  if (isLoading) return <PageLoader />;
  if (!data) return <p className="p-8 text-center">Product not found</p>;

  const product = data;
  const plans: PlanRow[] = product.plans || [];
  const variants: VariantRow[] = product.variants || [];

  // Group variants by attribute name
  const variantGroups: Record<string, VariantRow[]> = {};
  variants.forEach((v) => {
    (variantGroups[v.attribute_name] ||= []).push(v);
  });

  // Base price (product price + variant extra + plan price)
  const basePrice = Number(product.sales_price);
  const variantExtra = selectedVariant ? Number(selectedVariant.extra_price) : 0;

  // Compute plan pricing table rows
  // Monthly price is the baseline for comparison
  const monthlyPlan = plans.find((p) => p.billing_period === "MONTHLY" && p.billing_interval === 1);
  const monthlyBaseTotal = monthlyPlan ? basePrice + Number(monthlyPlan.price) : basePrice;

  function computePlanRow(plan: PlanRow) {
    const months = planMonths(plan.billing_period, plan.billing_interval);
    const totalPrice = (basePrice + variantExtra + Number(plan.price)) * months;
    const perMonth = totalPrice / months;
    const monthlyEquivalent = monthlyBaseTotal;
    // Discount % compared to monthly
    const savingsPercent = monthlyEquivalent > 0 && months > 1
      ? Math.round(((monthlyEquivalent - perMonth) / monthlyEquivalent) * 100)
      : 0;
    return { plan, totalPrice, perMonth, months, savingsPercent };
  }

  // Compute current unit price
  const currentUnitPrice = selectedPlan
    ? basePrice + variantExtra + Number(selectedPlan.price)
    : basePrice + variantExtra;

  const handleAddToCart = () => {
    const months = selectedPlan ? planMonths(selectedPlan.billing_period, selectedPlan.billing_interval) : 1;
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_type: product.product_type,
      variant_id: selectedVariant?.id,
      variant_label: selectedVariant ? `${selectedVariant.attribute_name}: ${selectedVariant.attribute_value}` : undefined,
      plan_id: selectedPlan?.id,
      plan_name: selectedPlan?.name,
      plan_billing_period: selectedPlan?.billing_period,
      unit_price: currentUnitPrice * months,
      monthly_equivalent: currentUnitPrice,
      quantity,
    });
    toast.success(`${product.name} added to cart!`);
  };

  // Placeholder images
  const images = [0, 1, 2];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/shop/products" className="hover:text-foreground">All Products</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="hover:text-foreground">{product.product_type}</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Link to={`/products`}>
              <Button size="sm" variant="outline">
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            </Link>
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              <Trash2 className="h-4 w-4 mr-1" /> {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left: Image Gallery ── */}
        <div className="flex gap-4">
          {/* Thumbnails */}
          <div className="flex flex-col gap-2">
            {images.map((i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-20 h-20 rounded-lg border-2 flex items-center justify-center bg-muted transition-colors ${selectedImage === i ? "border-primary" : "border-transparent hover:border-muted-foreground/30"}`}
              >
                <Package className="h-8 w-8 text-muted-foreground/40" />
              </button>
            ))}
          </div>
          {/* Main image */}
          <div className="flex-1 aspect-square rounded-xl border bg-muted flex items-center justify-center">
            <Package className="h-32 w-32 text-muted-foreground/20" />
          </div>
        </div>

        {/* ── Right: Product Info ── */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            {product.description && (
              <p className="text-muted-foreground mt-2">{product.description}</p>
            )}
          </div>

          {/* Pricing Table (Subscription Plans) */}
          {plans.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2.5 font-medium">Plan</th>
                      <th className="text-right px-4 py-2.5 font-medium">Total</th>
                      <th className="text-right px-4 py-2.5 font-medium">Per Month</th>
                      <th className="px-4 py-2.5 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => {
                      const row = computePlanRow(plan);
                      const isSelected = selectedPlan?.id === plan.id;
                      return (
                        <tr
                          key={plan.id}
                          onClick={() => setSelectedPlan(isSelected ? null : plan)}
                          className={`border-b cursor-pointer transition-colors ${isSelected ? "bg-primary/5 border-primary/20" : "hover:bg-muted/30"}`}
                        >
                          <td className="px-4 py-3 font-medium">
                            {periodLabel(plan.billing_period, plan.billing_interval)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            ₹{row.totalPrice.toFixed(0)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            ₹{row.perMonth.toFixed(0)}/mo
                          </td>
                          <td className="px-4 py-3 text-right">
                            {row.savingsPercent > 0 && (
                              <Badge className="bg-green-500/15 text-green-700 border-green-500/30 text-xs">
                                {row.savingsPercent}%
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Product Category */}
          <div>
            <span className="text-sm font-medium text-muted-foreground">Product Category: </span>
            <Badge variant="outline">{product.product_type}</Badge>
          </div>

          {/* Variants */}
          {Object.keys(variantGroups).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Variants Available</h3>
              {Object.entries(variantGroups).map(([attrName, attrVariants]) => (
                <div key={attrName}>
                  <span className="text-sm text-muted-foreground mb-1 block">{attrName}</span>
                  <div className="flex flex-wrap gap-2">
                    {attrVariants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(isSelected ? null : v)}
                          className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${isSelected ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50"}`}
                        >
                          {v.attribute_value}
                          {Number(v.extra_price) > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">(+₹{Number(v.extra_price).toFixed(0)})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity + Add to Cart — hidden for admin */}
          {!(user?.role === "ADMIN" || user?.role === "INTERNAL") && (
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center border rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-muted transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 min-w-[3rem] text-center font-medium tabular-nums border-x">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button size="lg" onClick={handleAddToCart} className="flex-1 max-w-xs">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart — ₹{(currentUnitPrice * quantity * (selectedPlan ? planMonths(selectedPlan.billing_period, selectedPlan.billing_interval) : 1)).toFixed(0)}
              </Button>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-green-600" />
              Terms and Conditions
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RotateCcw className="h-4 w-4 text-green-600" />
              30 Day Money Back Guarantee
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4 text-green-600" />
              Shipping: 2-3 Business Days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
