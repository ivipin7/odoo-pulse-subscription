import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/layout/TopNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { useProduct, useAddToCart } from "@/hooks/useApi";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, Users, UserCheck, Calculator, Package, Megaphone } from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  ERP: Layers, CRM: Users, HR: UserCheck,
  Accounting: Calculator, Inventory: Package, Marketing: Megaphone,
};

const categoryColors: Record<string, string> = {
  ERP: "from-primary to-primary/80",
  CRM: "from-accent to-accent/80",
  HR: "from-emerald-600 to-emerald-500",
  Accounting: "from-amber-600 to-amber-500",
  Inventory: "from-violet-600 to-violet-500",
  Marketing: "from-rose-600 to-rose-500",
};

const pricingTiers = [
  { label: "Monthly", multiplier: 1, period: "month", discount: 0 },
  { label: "6 Months", multiplier: 6, period: "6 months", discount: 17 },
  { label: "Yearly", multiplier: 12, period: "year", discount: 33 },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product } = useProduct(Number(id));
  const addToCart = useAddToCart();

  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedTier, setSelectedTier] = useState(0);
  const [qty, setQty] = useState(1);

  // Set default variant when product loads
  const effectiveVariant = selectedVariant || (product as any)?.variants?.[0]?.name || "";

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 text-center">
          <h2 className="text-xl font-semibold text-foreground">Product not found</h2>
          <Button variant="accent" asChild className="mt-4">
            <Link to="/shop">Back to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  const Icon = categoryIcons[product.category] || Layers;
  const gradient = categoryColors[product.category] || "from-primary to-primary/80";
  const variant = (product as any)?.variants?.find((v: any) => v.name === effectiveVariant);
  const basePrice = ((product as any)?.price ?? (product as any)?.basePrice ?? 0) + (variant?.extraPrice || 0);
  const tier = pricingTiers[selectedTier];
  const discountedMonthly = Math.round(basePrice * (1 - tier.discount / 100));
  const totalPrice = discountedMonthly * tier.multiplier * qty;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <PageHeader
          title={product.name}
          breadcrumbs={[
            { label: "Home", to: "/" },
            { label: "Shop", to: "/shop" },
            { label: product.name },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product image area */}
          <div className="space-y-4">
            <div className={`bg-gradient-to-br ${gradient} rounded-xl p-16 flex items-center justify-center`}>
              <Icon className="h-24 w-24 text-white/90" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[0.9, 0.7, 0.5].map((opacity, i) => (
                <div
                  key={i}
                  className={`bg-gradient-to-br ${gradient} rounded-lg p-6 flex items-center justify-center cursor-pointer border-2 ${
                    i === 0 ? "border-accent" : "border-transparent"
                  }`}
                >
                  <Icon className="h-8 w-8 text-white" style={{ opacity }} />
                </div>
              ))}
            </div>
          </div>

          {/* Product info */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {(product as any).category || (product as any).categoryName}
            </span>
            <h2 className="text-3xl font-bold text-foreground mt-1">{(product as any).name}</h2>
            <p className="text-muted-foreground mt-2 leading-relaxed">{(product as any).description}</p>
            </div>

            {/* Pricing tiers */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Billing Period</h3>
              <div className="grid grid-cols-3 gap-3">
                {pricingTiers.map((t, i) => {
                  const monthlyPrice = Math.round(basePrice * (1 - t.discount / 100));
                  return (
                    <button
                      key={t.label}
                      onClick={() => setSelectedTier(i)}
                      className={`relative rounded-lg border p-4 text-center transition-colors ${
                        selectedTier === i
                          ? "border-accent bg-accent/5 ring-1 ring-accent"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      {t.discount > 0 && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 status-badge status-badge-success text-[10px]">
                          Save {t.discount}%
                        </span>
                      )}
                      <div className="text-xs text-muted-foreground font-medium">{t.label}</div>
                      <div className="text-lg font-bold text-foreground mt-1">
                        ₹{monthlyPrice.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">/ month</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Variant selector */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Variant</h3>
              <Select value={effectiveVariant} onValueChange={setSelectedVariant}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(product as any).variants?.map((v: any) => (
                    <SelectItem key={v.name} value={v.name}>
                      {v.name}
                      {v.extraPrice > 0 && ` (+₹${v.extraPrice}/mo)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Quantity</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-semibold text-foreground">{qty}</span>
                <Button variant="outline" size="icon" onClick={() => setQty(qty + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Total and CTA */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Base price</span>
                <span>₹{basePrice.toLocaleString()} / mo</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Period</span>
                <span>{tier.label} ({tier.multiplier} mo)</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Qty</span>
                <span>×{qty}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-foreground">
                  ₹{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            <Button variant="accent" size="lg" className="w-full" onClick={() => {
              addToCart.mutate({ productId: (product as any).id, quantity: qty });
              toast.success(`${(product as any).name} added to cart!`);
            }}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>

            {/* Terms */}
            <div className="rounded-lg border bg-card p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">Terms & Notes</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <li>• Subscription auto-renews at the end of each billing period.</li>
                <li>• Prices are exclusive of applicable taxes (GST).</li>
                <li>• Cancel anytime before the next billing cycle.</li>
                <li>• Variant changes take effect from the next billing period.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
