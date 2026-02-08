import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight,
  CheckCircle, Tag, MapPin, CreditCard, Package, Printer, Eye,
} from "lucide-react";
import toast from "react-hot-toast";

type Step = "order" | "address" | "payment";
const STEPS: Step[] = ["order", "address", "payment"];
const STEP_LABELS: Record<Step, string> = { order: "Order", address: "Address", payment: "Payment" };

interface DiscountInfo {
  valid: boolean;
  reason?: string;
  discountAmount?: number;
  discount?: {
    id: string;
    name: string;
    code: string;
    discount_type: string;
    value: string;
  };
}

export default function CartPage() {
  const { user } = useAuth();
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  const [step, setStep] = useState<Step>("order");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountInfo | null>(null);
  const [shippingAddress, setShippingAddress] = useState(user?.address || "");
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [notes, setNotes] = useState("");

  // Payment demo state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState(user ? `${user.first_name} ${user.last_name}` : "");

  // Order success state
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderData, setOrderData] = useState<any>(null);

  // Admin redirect
  if (user?.role === "ADMIN" || user?.role === "INTERNAL") {
    return <Navigate to="/dashboard" replace />;
  }

  // Calculate taxes from backend
  const taxQuery = useQuery({
    queryKey: ["cart-taxes", items.map((i) => `${i.product_id}:${i.quantity}:${i.unit_price}`).join(",")],
    queryFn: async () => {
      if (items.length === 0) return { subtotal: 0, tax_amount: 0, total: 0 };
      const res = await api.post("/orders/calculate", {
        items: items.map((i) => ({
          product_id: i.product_id,
          unit_price: i.unit_price,
          quantity: i.quantity,
        })),
      });
      return res.data.data;
    },
    enabled: items.length > 0,
  });

  const taxAmount = taxQuery.data?.tax_amount || 0;
  const discountAmount = appliedDiscount?.valid ? (appliedDiscount.discountAmount || 0) : 0;
  const grandTotal = totalPrice + taxAmount - discountAmount;

  // Apply discount code
  const applyDiscountMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await api.post("/discounts/apply-code", {
        code,
        subtotal: totalPrice,
        quantity: totalItems,
      });
      return res.data.data as DiscountInfo;
    },
    onSuccess: (data) => {
      if (data.valid) {
        setAppliedDiscount(data);
        toast.success("Discount applied successfully!");
      } else {
        toast.error(data.reason || "Invalid discount code");
        setAppliedDiscount(null);
      }
    },
    onError: () => {
      toast.error("Failed to apply discount code");
      setAppliedDiscount(null);
    },
  });

  // Place order
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/orders", {
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_type: item.product_type,
          variant_id: item.variant_id,
          variant_label: item.variant_label,
          plan_id: item.plan_id,
          plan_name: item.plan_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
        })),
        shipping_address: shippingAddress,
        notes,
        discount_code: appliedDiscount?.valid ? appliedDiscount.discount?.code : undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setOrderId(data.data.id);
      setOrderNumber(data.data.order_number);
      setOrderData(data.data);
      clearCart();
      toast.success("Order placed successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to place order");
    },
  });

  // Empty cart
  if (items.length === 0 && !orderId) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Browse our shop to find products you&apos;ll love.</p>
        <Link to="/shop/products">
          <Button><ArrowLeft className="h-4 w-4 mr-2" /> Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  // ── ORDER CONFIRMATION ──
  if (orderId && orderData) {
    const lines = orderData.lines || [];
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center mb-8">
          <CheckCircle className="h-20 w-20 mx-auto text-green-500 mb-4" />
          <h2 className="text-3xl font-bold mb-2">Thank you for your order!</h2>
          <p className="text-xl font-semibold text-primary mb-1">{orderNumber}</p>
          <p className="text-muted-foreground">Your payment has been processed successfully.</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Order Items</h3>
            <div className="divide-y">
              {lines.map((line: any) => (
                <div key={line.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <div>
                      <p className="font-medium">{line.product_name || line.description}</p>
                      <p className="text-sm text-muted-foreground">{line.quantity} &times; &#8377;{Number(line.unit_price).toFixed(0)}</p>
                    </div>
                  </div>
                  <p className="font-semibold">&#8377;{Number(line.subtotal).toFixed(0)}</p>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>&#8377;{Number(orderData.subtotal).toFixed(0)}</span>
              </div>
              {Number(orderData.tax_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes</span>
                  <span>&#8377;{Number(orderData.tax_amount).toFixed(0)}</span>
                </div>
              )}
              {Number(orderData.discount_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">-&#8377;{Number(orderData.discount_amount).toFixed(0)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">&#8377;{Number(orderData.total).toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Link to={`/shop/orders/${orderId}`}>
            <Button>
              <Eye className="h-4 w-4 mr-2" /> View Order Details
            </Button>
          </Link>
          <Link to="/shop/orders">
            <Button variant="outline">My Orders</Button>
          </Link>
          <Link to="/shop/products">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── MULTI-STEP CHECKOUT ──
  const stepIndex = STEPS.indexOf(step);

  const canGoNext = () => {
    if (step === "order") return items.length > 0;
    if (step === "address") return shippingAddress.trim().length > 0;
    if (step === "payment") return cardNumber.replace(/\s/g, "").length >= 12 && cardExpiry.length >= 4 && cardCvv.length >= 3;
    return false;
  };

  const goNext = () => {
    if (step === "payment") {
      placeOrderMutation.mutate();
      return;
    }
    const nextStep = STEPS[stepIndex + 1];
    if (nextStep) setStep(nextStep);
  };

  const goPrev = () => {
    const prevStep = STEPS[stepIndex - 1];
    if (prevStep) setStep(prevStep);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step tabs */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {STEPS.map((s, idx) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => idx <= stepIndex && setStep(s)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${s === step
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : idx < stepIndex
                    ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-default"}`}
            >
              {idx < stepIndex && <CheckCircle className="h-4 w-4" />}
              <span>{idx + 1}. {STEP_LABELS[s]}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Step Content */}
        <div className="lg:col-span-2">
          {/* ── ORDER STEP ── */}
          {step === "order" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">Your Items ({totalItems})</h2>
                <Button variant="outline" size="sm" onClick={clearCart}>
                  <Trash2 className="h-4 w-4 mr-1" /> Clear Cart
                </Button>
              </div>

              {items.map((item) => {
                const key = `${item.product_id}|${item.variant_id || ""}|${item.plan_id || ""}`;
                return (
                  <Card key={key}>
                    <CardContent className="p-4 flex items-center gap-4">
                      {/* Product icon */}
                      <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-7 w-7 text-muted-foreground/40" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link to={`/shop/products/${item.product_id}`} className="font-semibold hover:underline">
                          {item.product_name}
                        </Link>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{item.product_type}</Badge>
                          {item.variant_label && <Badge variant="outline" className="text-xs">{item.variant_label}</Badge>}
                          {item.plan_name && <Badge className="text-xs">{item.plan_name}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">&#8377;{item.unit_price.toFixed(0)} each</p>
                      </div>

                      {/* Price */}
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary text-lg">&#8377;{(item.unit_price * item.quantity).toFixed(0)}</p>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center border rounded-md shrink-0">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_id, item.plan_id)}
                          className="px-2.5 py-1.5 hover:bg-muted"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 py-1.5 text-sm font-medium border-x tabular-nums min-w-[2.5rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id, item.plan_id)}
                          className="px-2.5 py-1.5 hover:bg-muted"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.product_id, item.variant_id, item.plan_id)}
                        className="px-3 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium shrink-0"
                      >
                        Remove
                      </button>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Applied discount inline */}
              {appliedDiscount?.valid && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">
                          {appliedDiscount.discount?.discount_type === "PERCENTAGE"
                            ? `${appliedDiscount.discount?.value}% on your order`
                            : `&#8377;${appliedDiscount.discount?.value} off your order`}
                        </p>
                        <p className="text-sm text-green-600">Code: {appliedDiscount.discount?.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-green-700">-&#8377;{discountAmount.toFixed(0)}</span>
                      <button
                        onClick={() => { setAppliedDiscount(null); setDiscountCode(""); }}
                        className="px-3 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── ADDRESS STEP ── */}
          {step === "address" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Shipping Address</h2>
              <Card>
                <CardContent className="p-6 space-y-4">
                  {user?.address && (
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="useDefault"
                        checked={useDefaultAddress}
                        onChange={(e) => {
                          setUseDefaultAddress(e.target.checked);
                          if (e.target.checked) setShippingAddress(user.address || "");
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="useDefault" className="cursor-pointer">
                        Use my default address
                      </Label>
                    </div>
                  )}

                  {user?.address && useDefaultAddress ? (
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{user.address}</p>
                          {user.phone && <p className="text-sm text-muted-foreground">{user.phone}</p>}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setUseDefaultAddress(false)}
                      >
                        Use a different address
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="shippingAddress">Full Address *</Label>
                        <Textarea
                          id="shippingAddress"
                          placeholder="Enter your complete shipping address..."
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold">Order Notes (Optional)</h3>
                  <Input
                    placeholder="Any special instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── PAYMENT STEP ── */}
          {step === "payment" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Payment Details</h2>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Card Information</h3>
                    <Badge variant="outline" className="text-xs ml-auto">Demo / Test Mode</Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input
                        id="cardName"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                          setCardNumber(v.replace(/(.{4})/g, "$1 ").trim());
                        }}
                        className="mt-1 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cardExpiry">Expiry (MM/YY)</Label>
                        <Input
                          id="cardExpiry"
                          placeholder="12/26"
                          value={cardExpiry}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                            if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                            setCardExpiry(v);
                          }}
                          className="mt-1 font-mono"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardCvv">CVV</Label>
                        <Input
                          id="cardCvv"
                          placeholder="123"
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="mt-1 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 mt-4">
                    <p className="font-medium">Test Mode</p>
                    <p className="text-yellow-700 mt-1">This is a demo payment gateway. Use any card number (e.g., 4242 4242 4242 4242) to simulate a payment.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            {stepIndex > 0 ? (
              <Button variant="outline" onClick={goPrev}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            ) : (
              <Link to="/shop/products">
                <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Continue Shopping</Button>
              </Link>
            )}

            <Button
              onClick={goNext}
              disabled={!canGoNext() || placeOrderMutation.isPending}
            >
              {step === "payment"
                ? placeOrderMutation.isPending
                  ? "Placing Order..."
                  : `Place Order — ₹${grandTotal.toFixed(0)}`
                : <>Next <ArrowRight className="h-4 w-4 ml-2" /></>}
            </Button>
          </div>
        </div>

        {/* Right: Order Summary (visible on all steps) */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Order Summary</h2>

              {/* Items mini list */}
              <div className="divide-y text-sm max-h-48 overflow-y-auto">
                {items.map((item) => {
                  const key = `${item.product_id}|${item.variant_id || ""}|${item.plan_id || ""}`;
                  return (
                    <div key={key} className="flex justify-between py-2">
                      <span className="text-muted-foreground truncate mr-2">
                        {item.product_name} &times; {item.quantity}
                      </span>
                      <span className="shrink-0 font-medium">&#8377;{(item.unit_price * item.quantity).toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>&#8377;{totalPrice.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes</span>
                  <span>{taxQuery.isLoading ? "..." : `₹${taxAmount.toFixed(0)}`}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-&#8377;{discountAmount.toFixed(0)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">&#8377;{grandTotal.toFixed(0)}</span>
                </div>
              </div>

              {/* Discount code input */}
              {!appliedDiscount?.valid && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-sm">Discount Code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => discountCode && applyDiscountMutation.mutate(discountCode)}
                      disabled={!discountCode || applyDiscountMutation.isPending}
                    >
                      {applyDiscountMutation.isPending ? "..." : "Apply"}
                    </Button>
                  </div>
                </div>
              )}

              {appliedDiscount?.valid && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Discount applied!</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {appliedDiscount.discount?.discount_type === "PERCENTAGE"
                      ? `${appliedDiscount.discount?.value}% off`
                      : `₹${appliedDiscount.discount?.value} off`}
                    {" "}&mdash; saves &#8377;{discountAmount.toFixed(0)}
                  </p>
                </div>
              )}

              {/* Checkout CTA */}
              {step === "order" && (
                <Button className="w-full" onClick={() => setStep("address")} disabled={items.length === 0}>
                  Proceed to Checkout <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
