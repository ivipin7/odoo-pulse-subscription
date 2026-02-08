import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageLoader } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Calendar,
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

const planSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  billing_period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  billing_interval: z.coerce.number().int().min(1).default(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be non-negative").default(0),
  min_quantity: z.coerce.number().int().min(1, "Min qty must be at least 1").default(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  auto_close: z.boolean().default(false),
  closable: z.boolean().default(true),
  pausable: z.boolean().default(false),
  renewable: z.boolean().default(true),
});

type PlanForm = z.infer<typeof planSchema>;

const periodColors: Record<string, string> = {
  DAILY: "bg-blue-100 text-blue-800",
  WEEKLY: "bg-green-100 text-green-800",
  MONTHLY: "bg-purple-100 text-purple-800",
  YEARLY: "bg-orange-100 text-orange-800",
};

export default function AdminPlansPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewPlan, setViewPlan] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["plans", page],
    queryFn: async () => {
      const r = await api.get("/recurring-plans", { params: { page, limit: 50 } });
      return r.data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PlanForm>({
    resolver: zodResolver(planSchema) as any,
    defaultValues: {
      billing_interval: 1,
      price: 0,
      min_quantity: 1,
      auto_close: false,
      closable: true,
      pausable: false,
      renewable: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (d: PlanForm) => {
      if (editId) return api.put(`/recurring-plans/${editId}`, d);
      return api.post("/recurring-plans", d);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success(editId ? "Plan updated" : "Plan created");
      closeForm();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/recurring-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan deleted");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error?.message || "Failed"),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    reset();
  };

  const startEdit = (p: any) => {
    setEditId(p.id);
    setValue("name", p.name);
    setValue("billing_period", p.billing_period);
    setValue("billing_interval", p.billing_interval);
    setValue("description", p.description || "");
    setValue("price", Number(p.price) || 0);
    setValue("min_quantity", p.min_quantity || 1);
    setValue("start_date", p.start_date?.slice(0, 10) || "");
    setValue("end_date", p.end_date?.slice(0, 10) || "");
    setValue("auto_close", p.auto_close ?? false);
    setValue("closable", p.closable ?? true);
    setValue("pausable", p.pausable ?? false);
    setValue("renewable", p.renewable ?? true);
    setShowForm(true);
    setViewPlan(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete plan "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <PageLoader />;

  const allPlans = data?.data || [];
  const total = data?.total || allPlans.length;
  const totalPages = Math.ceil(total / 50);

  // Client-side filtering
  const plans = allPlans.filter((p: any) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesPeriod = !filterPeriod || p.billing_period === filterPeriod;
    return matchesSearch && matchesPeriod;
  });

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recurring Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage billing rules for subscription products
          </p>
        </div>
        <Button
          onClick={() => {
            if (showForm) closeForm();
            else {
              setShowForm(true);
              setViewPlan(null);
            }
          }}
        >
          {showForm ? (
            <><X className="h-4 w-4 mr-2" /> Cancel</>
          ) : (
            <><Plus className="h-4 w-4 mr-2" /> Add Plan</>
          )}
        </Button>
      </div>

      {/* View Detail Panel */}
      {viewPlan && !showForm && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{viewPlan.name}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(viewPlan)}>
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewPlan(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Billing Period</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${periodColors[viewPlan.billing_period] || ""}`}>
                  {viewPlan.billing_period}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Billing Interval</p>
                <p className="font-medium">Every {viewPlan.billing_interval} cycle(s)</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-medium text-green-700">₹{Number(viewPlan.price || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Min Quantity</p>
                <p className="font-medium">{viewPlan.min_quantity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium">{formatDate(viewPlan.start_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="font-medium">{formatDate(viewPlan.end_date)}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="font-medium">{viewPlan.description || "No description"}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Plan Options</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={viewPlan.auto_close ? "default" : "outline"} className="text-xs">
                  {viewPlan.auto_close ? "✓" : "✗"} Auto-close
                </Badge>
                <Badge variant={viewPlan.closable ? "default" : "outline"} className="text-xs">
                  {viewPlan.closable ? "✓" : "✗"} Closable
                </Badge>
                <Badge variant={viewPlan.pausable ? "default" : "outline"} className="text-xs">
                  {viewPlan.pausable ? "✓" : "✗"} Pausable
                </Badge>
                <Badge variant={viewPlan.renewable ? "default" : "outline"} className="text-xs">
                  {viewPlan.renewable ? "✓" : "✗"} Renewable
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{editId ? "Edit Plan" : "Create New Plan"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-5">
              {/* Plan Fields */}
              <div className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" /> Plan Fields
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <Label>Plan Name <span className="text-destructive">*</span></Label>
                    <Input {...register("name")} placeholder="e.g. Monthly Basic" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Price (₹) <span className="text-destructive">*</span></Label>
                    <Input type="number" step="0.01" min="0" {...register("price")} />
                    {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Billing Period <span className="text-destructive">*</span></Label>
                    <Select
                      {...register("billing_period")}
                      options={[
                        { value: "DAILY", label: "Daily" },
                        { value: "WEEKLY", label: "Weekly" },
                        { value: "MONTHLY", label: "Monthly" },
                        { value: "YEARLY", label: "Yearly" },
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Billing Interval</Label>
                    <Input type="number" min="1" {...register("billing_interval")} />
                    {errors.billing_interval && <p className="text-xs text-destructive">{errors.billing_interval.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Minimum Quantity</Label>
                    <Input type="number" min="1" {...register("min_quantity")} />
                    {errors.min_quantity && <p className="text-xs text-destructive">{errors.min_quantity.message}</p>}
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Date Range
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <Label>Start Date</Label>
                    <Input type="date" {...register("start_date")} />
                  </div>
                  <div className="space-y-1">
                    <Label>End Date</Label>
                    <Input type="date" {...register("end_date")} />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea {...register("description")} placeholder="Optional plan description..." rows={2} />
              </div>

              {/* Plan Options */}
              <div className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground">Plan Options</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <label className="flex items-center gap-2 text-sm p-2 rounded border cursor-pointer hover:bg-accent transition-colors">
                    <input type="checkbox" {...register("auto_close")} className="rounded" /> Auto-close
                  </label>
                  <label className="flex items-center gap-2 text-sm p-2 rounded border cursor-pointer hover:bg-accent transition-colors">
                    <input type="checkbox" {...register("closable")} className="rounded" /> Closable
                  </label>
                  <label className="flex items-center gap-2 text-sm p-2 rounded border cursor-pointer hover:bg-accent transition-colors">
                    <input type="checkbox" {...register("pausable")} className="rounded" /> Pausable
                  </label>
                  <label className="flex items-center gap-2 text-sm p-2 rounded border cursor-pointer hover:bg-accent transition-colors">
                    <input type="checkbox" {...register("renewable")} className="rounded" /> Renewable
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editId ? "Update Plan" : "Create Plan"}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              options={[
                { value: "", label: "All Periods" },
                { value: "DAILY", label: "Daily" },
                { value: "WEEKLY", label: "Weekly" },
                { value: "MONTHLY", label: "Monthly" },
                { value: "YEARLY", label: "Yearly" },
              ]}
            />
          </div>

          {plans.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {search || filterPeriod
                ? "No plans match your filters"
                : "No plans configured yet. Click 'Add Plan' to create one."}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden md:table-cell">Min Qty</TableHead>
                    <TableHead className="hidden md:table-cell">Dates</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((p: any) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setViewPlan(p)}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{p.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${periodColors[p.billing_period] || ""}`}>
                          {p.billing_period}
                        </span>
                        {p.billing_interval > 1 && (
                          <span className="text-xs text-muted-foreground ml-1">×{p.billing_interval}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-green-700">₹{Number(p.price || 0).toFixed(2)}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.min_quantity}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-xs">
                          {p.start_date || p.end_date ? (
                            <>{formatDate(p.start_date)} — {formatDate(p.end_date)}</>
                          ) : (
                            <span className="text-muted-foreground">No dates</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.auto_close && <Badge variant="outline" className="text-[10px] px-1">Auto-close</Badge>}
                          {p.closable && <Badge variant="outline" className="text-[10px] px-1">Closable</Badge>}
                          {p.pausable && <Badge variant="outline" className="text-[10px] px-1">Pausable</Badge>}
                          {p.renewable && <Badge variant="outline" className="text-[10px] px-1">Renewable</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => setViewPlan(p)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Showing {plans.length} of {total} plans</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm pt-1">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
