import { useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/layout/TopNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductCard } from "@/components/shared/ProductCard";
import { useProducts, useCategories } from "@/hooks/useApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Shop = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();

  const filtered = useMemo(() => {
    let result = (products as any[]).filter((p: any) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "All" || p.category === category || p.categoryName === category;
      return matchSearch && matchCategory;
    });

    if (sortBy === "price-asc") result.sort((a: any, b: any) => (a.price ?? a.basePrice) - (b.price ?? b.basePrice));
    if (sortBy === "price-desc") result.sort((a: any, b: any) => (b.price ?? b.basePrice) - (a.price ?? a.basePrice));

    return result;
  }, [search, category, sortBy, products]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <PageHeader
          title="Shop"
          breadcrumbs={[{ label: "Home", to: "/" }, { label: "Shop" }]}
        />

        {/* Search and sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="sm:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Filters sidebar */}
          <aside
            className={`shrink-0 w-48 space-y-6 ${
              showFilters ? "block" : "hidden sm:block"
            }`}
          >
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                Category
              </h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      category === cat
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                Price Range
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <button className="block w-full text-left px-3 py-2 rounded-md hover:bg-muted/50">
                  Under ₹500
                </button>
                <button className="block w-full text-left px-3 py-2 rounded-md hover:bg-muted/50">
                  ₹500 – ₹1,000
                </button>
                <button className="block w-full text-left px-3 py-2 rounded-md hover:bg-muted/50">
                  Above ₹1,000
                </button>
              </div>
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No products found matching your criteria.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
