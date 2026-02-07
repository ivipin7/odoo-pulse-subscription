import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, CreditCard, MapPin, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TopNav } from "@/components/layout/TopNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { useProfile } from "@/hooks/useApi";

const steps = ["Address", "Payment", "Confirmation"];

const Checkout = () => {
  const [step, setStep] = useState(0);
  const { data: profileData } = useProfile();
  const userProfile = profileData as any;
  const defaultAddr = userProfile?.addresses?.find((a: any) => a.isDefault) ?? userProfile?.addresses?.[0] ?? { label: "", line1: "", line2: "", city: "", state: "", pin: "" };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        <PageHeader
          title="Checkout"
          breadcrumbs={[
            { label: "Home", to: "/" },
            { label: "Cart", to: "/cart" },
            { label: "Checkout" },
          ]}
        />

        {/* Steps */}
        <div className="flex items-center mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    i < step
                      ? "bg-accent text-accent-foreground"
                      : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`text-sm font-medium ${
                    i <= step ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-4 ${
                    i < step ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Address */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 shrink-0">
                  <MapPin className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{defaultAddr.label}</h3>
                    <span className="status-badge status-badge-success">Default</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {defaultAddr.line1}, {defaultAddr.line2}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {defaultAddr.city}, {defaultAddr.state} – {defaultAddr.pin}
                  </p>
                </div>
              </div>
            </div>

            <button className="w-full rounded-lg border border-dashed bg-card p-4 text-sm text-muted-foreground hover:text-foreground hover:border-accent transition-colors text-center">
              + Add New Address
            </button>

            <div className="flex justify-end">
              <Button variant="accent" onClick={() => setStep(1)}>
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-foreground">Payment Details</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="card-name" className="text-sm">
                    Name on Card
                  </Label>
                  <Input id="card-name" defaultValue={userProfile?.name || ""} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="card-number" className="text-sm">
                    Card Number
                  </Label>
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    className="mt-1 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry" className="text-sm">
                      Expiry
                    </Label>
                    <Input id="expiry" placeholder="MM/YY" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="cvv" className="text-sm">
                      CVV
                    </Label>
                    <Input id="cvv" placeholder="•••" className="mt-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button variant="accent" onClick={() => setStep(2)}>
                Pay ₹3,858
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 2 && (
          <div className="rounded-lg border bg-card p-8 shadow-sm text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
              <Check className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Order Confirmed!</h2>
            <p className="text-muted-foreground mt-2">
              Your order has been placed successfully.
            </p>
            <div className="mt-6 rounded-lg bg-muted/50 p-4 inline-block">
              <span className="text-sm text-muted-foreground">Order ID:</span>
              <span className="ml-2 font-mono font-semibold text-foreground">
                ORD-2025-006
              </span>
            </div>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="outline" asChild>
                <Link to="/orders/ORD-2025-001">
                  <Printer className="mr-2 h-4 w-4" />
                  View Order
                </Link>
              </Button>
              <Button variant="accent" asChild>
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
