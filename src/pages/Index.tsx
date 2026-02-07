import { Link } from "react-router-dom";
import { ArrowRight, Layers, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/layout/TopNav";

const features = [
  {
    icon: Layers,
    title: "Unified Platform",
    description: "Manage all your subscriptions, invoices, and payments in one place.",
  },
  {
    icon: Shield,
    title: "Secure Billing",
    description: "Automated recurring billing with built-in compliance and tax support.",
  },
  {
    icon: Zap,
    title: "Smart Recovery",
    description: "Intelligent dunning workflows to recover failed payments automatically.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      {/* Hero */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <span className="text-base font-bold text-primary-foreground">OP</span>
              </div>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                OdooPulse
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
              Subscription Management,{" "}
              <span className="text-accent">Simplified</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-lg">
              Manage subscriptions, invoices, and recurring payments from a single unified platform
              built for modern businesses.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="accent" size="lg" asChild>
                <Link to="/shop">
                  Browse Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/admin">Admin Panel</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 mb-4">
                <feature.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 OdooPulse — SNS × Odoo Hackathon Project
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
