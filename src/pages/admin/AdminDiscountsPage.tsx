import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Percent, Tag, Calendar, ShieldCheck, X, Edit, Trash2, Eye, Gift } from "lucide-react";

const discountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  discount_type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().min(0, "Value must be positive"),
  min_purchase: z.coerce.number().min(0).optional(),
  min_quantity: z.coerce.number().int().min(0).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit_usage: z.coerce.number().int().min(1).optional(),
  applies_to: z.enum(["ALL", "PRODUCTS", "SUBSCRIPTIONS"]).default("ALL"),
});

type DiscountForm = z.infer<typeof discountSchema>;

function getDiscountStatus(d: any): { label: string; color: string } {
  if (!d.is_active) return { label: "Inactive", color: "bg-gray-100 text-gray-600 border border-gray-300" };
  const now = new Date();
  if (d.end_date && new Date(d.end_date) < now) return { label: "Expired", color: "bg-red-50 text-red-700 border border-red-300" };
  if (d.start_date && new Date(d.start_date) > now) return { label: "Scheduled", color: "bg-amber-50 text-amber-700 border border-amber-300" };
  if (d.limit_usage && d.usage_count >= d.limit_usage) return { label: "Exhausted", color: "bg-orange-50 text-orange-700 border border-orange-300" };
  return { label: "Active", color: "bg-emerald-50 text-emerald-700 border border-emerald-300" };
}

export default function AdminDiscountsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewDiscount, setViewDiscount] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterApplies, setFilterApplies] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["discounts"],
    queryFn: async () => { const r = await api.get("/discounts"); return r.data; },
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<DiscountForm>({
    resolver: zodResolver(discountSchema) as any,
    defaultValues: { discount_type: "PERCENTAGE", applies_to: "ALL" },
  });

  const watchType = watch("discount_type");

  const saveMutation = useMutation({
    mutationFn: async (d: DiscountForm) => {
      const payload = {
        ...d,
        min_purchase: d.min_purchase || 0,
        min_quantity: d.min_quantity || 0,
        start_date: d.start_date || null,
        end_date: d.end_date || null,
        limit_usage: d.limit_usage || null,
      };
      if (editId) return api.put(`/discounts/${editId}`, payload);
      return api.post("/discounts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast.success(editId ? "Discount updated" : "Discount created");
      closeForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/discounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Discount deactivated");
      if (viewDiscount?.id === deleteMutation.variables) setViewDiscount(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed"),
  });

  const closeForm = () => { setShowForm(false); setEditId(null); reset({ discount_type: "PERCENTAGE", applies_to: "ALL" }); };

  const startEdit = (d: any) => {
    setEditId(d.id);
    setValue("name", d.name);
    setValue("discount_type", d.discount_type);
    setValue("value", Number(d.value));
    setValue("min_purchase", d.min_purchase ? Number(d.min_purchase) : 0);
    setValue("min_quantity", d.min_quantity || 0);
    setValue("start_date", d.start_date?.slice(0, 10) || "");
    setValue("end_date", d.end_date?.slice(0, 10) || "");
    setValue("limit_usage", d.limit_usage || undefined);
    setValue("applies_to", d.applies_to || "ALL");
    setShowForm(true);
    setViewDiscount(null);
  };

  const allDiscounts: any[] = data?.data || [];

  const filtered = useMemo(() => {
    return allDiscounts.filter((d) => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && d.discount_type !== filterType) return false;
      if (filterApplies && (d.applies_to || "ALL") !== filterApplies) return false;
      return true;
    });
  }, [allDiscounts, search, filterType, filterApplies]);

  // Stats
  const activeCount = allDiscounts.filter((d) => d.is_active && getDiscountStatus(d).label === "Active").length;
  const totalUsage = allDiscounts.reduce((s, d) => s + (d.usage_count || 0), 0);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discount Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage discount rules for products and subscriptions
          </p>
        </div>
        <Button onClick={() => { if (showForm) closeForm(); else { setShowForm(true); setViewDiscount(null); } }}>
          {showForm ? <><X className="h-4 w-4 mr-2" /> Cancel</> : <><Plus className="h-4 w-4 mr-2" /> New Discount</>}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50"><Tag className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{allDiscounts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50"><ShieldCheck className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50"><Percent className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Percentage</p>
              <p className="text-xl font-bold">{allDiscounts.filter((d) => d.discount_type === "PERCENTAGE").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50"><Gift className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Uses</p>
              <p className="text-xl font-bold">{totalUsage}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">{editId ? "Edit Discount" : "Create New Discount"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-5">
              {/* Row 1: Core fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Discount Name <span className="text-destructive">*</span></Label>
                  <Input {...register("name")} placeholder="e.g. Summer Sale 20%" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Type <span className="text-destructive">*</span></Label>
                  <Select {...register("discount_type")} options={[
                    { value: "PERCENTAGE", label: "Percentage (%)" },
                    { value: "FIXED", label: "Fixed Amount (₹)" },
                  ]} />
                </div>
                <div className="space-y-1">
                  <Label>Value <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input type="number" step="0.01" {...register("value")} placeholder="0" className="pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {watchType === "PERCENTAGE" ? "%" : "₹"}
                    </span>
                  </div>
                  {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
                </div>
              </div>

              {/* Row 2: Conditions */}
              <div>
                <p className="text-sm font-medium mb-2 text-muted-foreground">Conditions</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>Minimum Purchase (₹)</Label>
                    <Input type="number" step="0.01" {...register("min_purchase")} placeholder="0" />
                    {errors.min_purchase && <p className="text-xs text-destructive">{errors.min_purchase.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Minimum Quantity</Label>
                    <Input type="number" {...register("min_quantity")} placeholder="0" />
                    {errors.min_quantity && <p className="text-xs text-destructive">{errors.min_quantity.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Limit Usage</Label>
                    <Input type="number" min="1" {...register("limit_usage")} placeholder="Unlimited" />
                    {errors.limit_usage && <p className="text-xs text-destructive">{errors.limit_usage.message}</p>}
                  </div>
                </div>
              </div>

              {/* Row 3: Date range & applies to */}
              <div>
                <p className="text-sm font-medium mb-2 text-muted-foreground">Validity & Scope</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>Start Date</Label>
                    <Input type="date" {...register("start_date")} />
                  </div>
                  <div className="space-y-1">
                    <Label>End Date</Label>
                    <Input type="date" {...register("end_date")} />
                  </div>
                  <div className="space-y-1">
                    <Label>Applies To</Label>
                    <Select {...register("applies_to")} options={[
                      { value: "ALL", label: "All (Products & Subscriptions)" },
                      { value: "PRODUCTS", label: "Products Only" },
                      { value: "SUBSCRIPTIONS", label: "Subscriptions Only" },
                    ]} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editId ? "Update Discount" : "Create Discount"}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Detail Panel */}
      {viewDiscount && !showForm && (
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg">{viewDiscount.name}</CardTitle>
              <Badge className={`mt-1 ${getDiscountStatus(viewDiscount).color}`}>
                {getDiscountStatus(viewDiscount).label}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => startEdit(viewDiscount)}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setViewDiscount(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <DetailRow label="Type" value={viewDiscount.discount_type === "PERCENTAGE" ? "Percentage" : "Fixed Amount"} />
            <DetailRow label="Value" value={viewDiscount.discount_type === "PERCENTAGE" ? `${viewDiscount.value}%` : `₹${Number(viewDiscount.value).toFixed(2)}`} />
            <DetailRow label="Minimum Purchase" value={Number(viewDiscount.min_purchase) > 0 ? `₹${Number(viewDiscount.min_purchase).toFixed(2)}` : "None"} />
            <DetailRow label="Minimum Quantity" value={viewDiscount.min_quantity > 0 ? String(viewDiscount.min_quantity) : "None"} />
            <DetailRow label="Start Date" value={viewDiscount.start_date ? new Date(viewDiscount.start_date).toLocaleDateString() : "No start date"} />
            <DetailRow label="End Date" value={viewDiscount.end_date ? new Date(viewDiscount.end_date).toLocaleDateString() : "No end date"} />
            <DetailRow label="Applies To" value={viewDiscount.applies_to === "ALL" ? "Products & Subscriptions" : viewDiscount.applies_to === "PRODUCTS" ? "Products Only" : "Subscriptions Only"} />
            <div className="space-y-1">
              <span className="text-muted-foreground">Usage</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: viewDiscount.limit_usage ? `${Math.min(100, (viewDiscount.usage_count / viewDiscount.limit_usage) * 100)}%` : "0%" }}
                  />
                </div>
                <span className="font-medium text-xs">{viewDiscount.usage_count || 0}{viewDiscount.limit_usage ? ` / ${viewDiscount.limit_usage}` : " / ∞"}</span>
              </div>
            </div>
            <DetailRow label="Created" value={new Date(viewDiscount.created_at).toLocaleDateString()} />
          </CardContent>
        </Card>
      )}

      {/* Filters + Table */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search discounts..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                options={[
                  { value: "", label: "All Types" },
                  { value: "PERCENTAGE", label: "Percentage" },
                  { value: "FIXED", label: "Fixed" },
                ]}
              />
            </div>
            <div className="w-44">
              <Select
                value={filterApplies}
                onChange={(e) => setFilterApplies(e.target.value)}
                options={[
                  { value: "", label: "All Scopes" },
                  { value: "ALL", label: "All" },
                  { value: "PRODUCTS", label: "Products" },
                  { value: "SUBSCRIPTIONS", label: "Subscriptions" },
                ]}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">No discounts found</p>
              <Button className="mt-4" variant="outline" onClick={() => { setShowForm(true); setViewDiscount(null); }}>
                Create your first discount
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d: any) => {
                  const status = getDiscountStatus(d);
                  return (
                    <TableRow key={d.id} className={`group cursor-pointer ${viewDiscount?.id === d.id ? "bg-muted/50" : ""}`} onClick={() => { setViewDiscount(d); setShowForm(false); }}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {d.discount_type === "PERCENTAGE" ? <Percent className="h-3 w-3" /> : <Tag className="h-3 w-3" />}
                          {d.discount_type === "PERCENTAGE" ? "Percent" : "Fixed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {d.discount_type === "PERCENTAGE" ? `${d.value}%` : `₹${Number(d.value).toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {d.applies_to === "ALL" ? "All" : d.applies_to === "PRODUCTS" ? "Products" : "Subscriptions"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.start_date || d.end_date ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {d.start_date ? new Date(d.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "—"}
                            {" → "}
                            {d.end_date ? new Date(d.end_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "—"}
                          </span>
                        ) : <span className="text-muted-foreground">Always</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: d.limit_usage ? `${Math.min(100, ((d.usage_count || 0) / d.limit_usage) * 100)}%` : "0%" }}
                            />
                          </div>
                          <span className="text-xs">{d.usage_count || 0}{d.limit_usage ? `/${d.limit_usage}` : "/∞"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => { setViewDiscount(d); setShowForm(false); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(d)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {d.is_active && (
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { if (confirm(`Deactivate "${d.name}"?`)) deleteMutation.mutate(d.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-dashed last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
