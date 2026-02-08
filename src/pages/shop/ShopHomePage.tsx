import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Product } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package, ArrowRight, ShoppingBag, Zap, Shield, RotateCcw,
  TrendingUp, Star, Clock,
} from "lucide-react";

export default function ShopHomePage() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["shop-featured"],
    queryFn: async () =>
      (await api.get("/shop/products", { params: { limit: 8, sort: "created_at", dir: "desc" } })).data,
  });

  const products: Product[] = data?.data || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/10 p-8 md:p-10">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary mb-2">
            Welcome back, {user?.first_name || "Guest"}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Subscription Store
          </h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Browse our catalog, pick a plan that fits, and manage your
            subscriptions — all in one place.
          </p>
          <Link to="/shop/products">
            <Button size="lg" className="shadow-sm">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats / Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-card">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Flexible Plans</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Monthly, 6-month, and yearly billing with automatic discounts.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-card">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Secure & Reliable</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enterprise-grade security with full transparency on pricing.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-card">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <RotateCcw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">30-Day Guarantee</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Not satisfied? Full refund within 30 days, no questions asked.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Products */}
      {products.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold">Featured Products</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Latest additions to our catalog</p>
            </div>
            <Link
              to="/shop/products"
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.slice(0, 4).map((p) => (
              <Link to={`/shop/products/${p.id}`} key={p.id}>
                <Card className="group h-full hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer overflow-hidden">
                  <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border-b">
                    <Package className="h-12 w-12 text-muted-foreground/25 group-hover:scale-110 group-hover:text-primary/30 transition-all duration-200" />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {p.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-lg font-bold text-primary">
                        ₹{Number(p.sales_price).toFixed(0)}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {p.product_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/shop/orders">
          <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Order History</h3>
                <p className="text-xs text-muted-foreground">Track your purchases</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/subscriptions">
          <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">My Subscriptions</h3>
                <p className="text-xs text-muted-foreground">Manage active plans</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/shop/profile">
          <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">My Profile</h3>
                <p className="text-xs text-muted-foreground">Update your details</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
