import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import type { Product } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";
import { Search, Package, ShoppingBag, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function ShopPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "ADMIN" || user?.role === "INTERNAL";
  const [searchParams, setSearchParams] = useSearchParams();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [productType, setProductType] = useState(searchParams.get("type") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "created_at");
  const [sortDir, setSortDir] = useState(searchParams.get("dir") || "desc");
  const [minPrice, setMinPrice] = useState(searchParams.get("min") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));

  // Sync search params
  useEffect(() => {
    const p: Record<string, string> = {};
    if (search) p.q = search;
    if (productType) p.type = productType;
    if (sortBy !== "created_at") p.sort = sortBy;
    if (sortDir !== "desc") p.dir = sortDir;
    if (minPrice) p.min = minPrice;
    if (maxPrice) p.max = maxPrice;
    if (page > 1) p.page = String(page);
    setSearchParams(p, { replace: true });
  }, [search, productType, sortBy, sortDir, minPrice, maxPrice, page]);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: async () => (await api.get("/shop/categories")).data.data,
  });

  // Fetch price range
  const { data: priceRange } = useQuery({
    queryKey: ["shop-price-range"],
    queryFn: async () => (await api.get("/shop/price-range")).data.data,
  });

  // Fetch products
  const { data, isLoading } = useQuery({
    queryKey: ["shop-products", page, search, productType, sortBy, sortDir, minPrice, maxPrice],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 12 };
      if (search) params.search = search;
      if (productType) params.product_type = productType;
      if (sortBy) params.sort = sortBy;
      if (sortDir) params.dir = sortDir;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      const res = await api.get("/shop/products", { params });
      return res.data;
    },
  });

  const products: Product[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 12);
  const categories: { product_type: string; count: string }[] = categoriesData || [];

  const clearFilters = () => {
    setSearch("");
    setProductType("");
    setSortBy("created_at");
    setSortDir("desc");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-6">
        {/* ── Left Sidebar: Filters ── */}
        <aside className="w-full md:w-56 shrink-0 space-y-6">
          {/* Category */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Category</h3>
            <div className="space-y-1">
              <button
                onClick={() => { setProductType(""); setPage(1); }}
                className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${!productType ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                All Products
              </button>
              {categories.map((c) => (
                <button
                  key={c.product_type}
                  onClick={() => { setProductType(c.product_type); setPage(1); }}
                  className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${productType === c.product_type ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {c.product_type} ({c.count})
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Price Range</h3>
            {priceRange && (
              <p className="text-xs text-muted-foreground mb-2">
                ₹{Number(priceRange.min).toFixed(0)} – ₹{Number(priceRange.max).toFixed(0)}
              </p>
            )}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                className="text-xs"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
              />
              <Input
                type="number"
                placeholder="Max"
                className="text-xs"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
            Clear Filters
          </Button>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">All Products</h1>
            <p className="text-sm text-muted-foreground">
              {productType || "All product types"} &middot; {total} products
            </p>
          </div>

          {/* Search + Sort row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap text-muted-foreground">Sort By:</Label>
              <Select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [s, d] = e.target.value.split("-");
                  setSortBy(s);
                  setSortDir(d);
                  setPage(1);
                }}
                options={[
                  { value: "created_at-desc", label: "Newest" },
                  { value: "price-asc", label: "Price: Low → High" },
                  { value: "price-desc", label: "Price: High → Low" },
                  { value: "name-asc", label: "Name: A → Z" },
                  { value: "name-desc", label: "Name: Z → A" },
                ]}
              />
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <PageLoader />
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((p) => (
                <Link to={`/shop/products/${p.id}`} key={p.id}>
                  <Card className="group h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                    {/* Product image placeholder */}
                    <div className="aspect-square bg-muted flex items-center justify-center border-b">
                      <Package className="h-16 w-16 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{p.description || "No description"}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-lg font-bold text-primary">₹{Number(p.sales_price).toFixed(2)}</span>
                        <Badge variant="outline" className="text-xs">{p.product_type}</Badge>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Link to={`/products`} onClick={(e) => e.stopPropagation()} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full">
                              <Pencil className="h-3 w-3 mr-1" /> Edit
                            </Button>
                          </Link>
                          <Button size="sm" variant="destructive" className="flex-1" onClick={(e) => handleDelete(e, p.id)} disabled={deleteMutation.isPending}>
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} products)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
