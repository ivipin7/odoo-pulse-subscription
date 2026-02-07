import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopNav } from "@/components/layout/TopNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { initialCartItems, type CartItem } from "@/data/mockData";

const Cart = () => {
  const [items, setItems] = useState<CartItem[]>(initialCartItems);
  const [discountCode, setDiscountCode] = useState("");

  const updateQty = (idx: number, delta: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.18);
  const discount = 500;
  const total = subtotal + tax - discount;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <PageHeader
          title="Cart"
          breadcrumbs={[{ label: "Home", to: "/" }, { label: "Shop", to: "/shop" }, { label: "Cart" }]}
        />

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Your cart is empty.</p>
            <Button variant="accent" asChild>
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.variant} • ₹{item.price.toLocaleString()} / {item.period}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(idx, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(idx, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="w-28 text-right">
                    <span className="font-semibold text-foreground">
                      ₹{(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="rounded-lg border bg-card p-6 shadow-sm h-fit space-y-4">
              <h3 className="font-semibold text-foreground">Order Summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (18%)</span>
                  <span>₹{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-foreground text-base">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Discount code */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <Button variant="outline" size="sm">
                  Apply
                </Button>
              </div>

              <Button variant="accent" className="w-full" asChild>
                <Link to="/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
