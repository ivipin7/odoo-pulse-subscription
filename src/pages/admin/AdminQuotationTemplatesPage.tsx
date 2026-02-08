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
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { QuotationTemplate, Product, RecurringPlan } from "@/types";
import { Plus, Trash2, Search, FileText, Layers, Eye, Pencil, X } from "lucide-react";

/* ── Zod schemas ─────────────────────────────────── */
const lineSchema = z.object({
  product_id: z.string().min(1, "Select a product"),
  quantity: z.coerce.number().int().min(1).default(1),
  description: z.string().optional(),
});

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  recurring_plan_id: z.string().optional(),
  validity_days: z.coerce.number().int().min(1).default(30),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, "At least one product line is required"),
});

type TemplateForm = z.infer<typeof templateSchema>;

const EMPTY_DEFAULTS: TemplateForm = {
  name: "",
  recurring_plan_id: "",
  validity_days: 30,
  notes: "",
  lines: [{ product_id: "", quantity: 1, description: "" }],
};

/* ── Component ───────────────────────────────────── */
export default function AdminQuotationTemplatesPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [mode, setMode] = useState<"list" | "create" | "edit" | "view">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  /* ── Queries ─────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ["quotation-templates", appliedSearch, page],
    queryFn: async () => {
      const r = await api.get("/quotation-templates", { params: { search: appliedSearch, page, limit: 20 } });
      return r.data;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => { const r = await api.get("/products", { params: { limit: 200 } }); return r.data; },
  });

  const { data: plansData } = useQuery({
    queryKey: ["plans-list"],
    queryFn: async () => { const r = await api.get("/recurring-plans", { params: { limit: 100 } }); return r.data; },
  });

  const { data: viewTemplate, isLoading: loadingView } = useQuery<QuotationTemplate>({
    queryKey: ["quotation-template", selectedId],
    queryFn: async () => { const r = await api.get(`/quotation-templates/${selectedId}`); return r.data.data; },
    enabled: !!selectedId && (mode === "view" || mode === "edit"),
  });

  /* ── Form ──────────────────────────────────── */
  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema) as any,
    defaultValues: EMPTY_DEFAULTS,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && viewTemplate) {
      reset({
        name: viewTemplate.name,
        recurring_plan_id: viewTemplate.recurring_plan_id || "",
        validity_days: viewTemplate.validity_days,
        notes: viewTemplate.notes || "",
        lines: viewTemplate.lines?.length
          ? viewTemplate.lines.map((l) => ({
              product_id: l.product_id,
              quantity: l.quantity,
              description: l.description || "",
            }))
          : [{ product_id: "", quantity: 1, description: "" }],
      });
    }
  }, [mode, viewTemplate, reset]);

  /* ── Mutations ─────────────────────────────── */
  const saveMutation = useMutation({
    mutationFn: async (d: TemplateForm) => {
      if (mode === "edit" && selectedId) return api.put(`/quotation-templates/${selectedId}`, d);
      return api.post("/quotation-templates", d);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation-templates"] });
      if (selectedId) queryClient.invalidateQueries({ queryKey: ["quotation-template", selectedId] });
      toast.success(mode === "edit" ? "Template updated" : "Template created");
      handleClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/quotation-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation-templates"] });
      toast.success("Template deleted");
      if (selectedId) setSelectedId(null);
      setMode("list");
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed"),
  });

  /* ── Helpers ───────────────────────────────── */
  const handleClose = () => { setMode("list"); setSelectedId(null); reset(EMPTY_DEFAULTS); };
  const openCreate = () => { setMode("create"); setSelectedId(null); reset(EMPTY_DEFAULTS); };
  const openEdit = (id: string) => { setSelectedId(id); setMode("edit"); };
  const openView = (id: string) => { setSelectedId(id); setMode("view"); };

  if (isLoading) return <PageLoader />;

  const templates: QuotationTemplate[] = data?.data || [];
  const products: Product[] = productsData?.data || [];
  const plans: RecurringPlan[] = plansData?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const planOptions = [
    { value: "", label: "— No Plan —" },
    ...plans.map((p) => ({ value: p.id, label: `${p.name} (${p.billing_period})` })),
  ];

  /* ── VIEW MODE ─────────────────────────────── */
  if (mode === "view" && selectedId) {
    if (loadingView) return <PageLoader />;
    if (!viewTemplate) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleClose}><X className="h-4 w-4" /></Button>
            <div>
              <h1 className="text-2xl font-bold">{viewTemplate.name}</h1>
              <p className="text-sm text-muted-foreground">Quotation Template Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openEdit(selectedId)}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { if (confirm("Delete this template?")) deleteMutation.mutate(selectedId); }}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-medium">Recurring Plan</p>
              <p className="text-lg font-semibold">{viewTemplate.plan_name || "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-medium">Validity</p>
              <p className="text-lg font-semibold">{viewTemplate.validity_days} days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-medium">Product Lines</p>
              <p className="text-lg font-semibold">{viewTemplate.lines?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {viewTemplate.notes && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Notes</p>
              <p className="text-sm">{viewTemplate.notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-lg">Product Lines</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewTemplate.lines?.map((l, i) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{l.product_name}</TableCell>
                    <TableCell>{l.quantity}</TableCell>
                    <TableCell>₹{Number(l.unit_price || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{l.description || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── CREATE / EDIT MODE ────────────────────── */
  if (mode === "create" || mode === "edit") {
    if (mode === "edit" && loadingView) return <PageLoader />;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleClose}><X className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{mode === "edit" ? "Edit Template" : "New Quotation Template"}</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "edit" ? "Update template details and product lines" : "Create a reusable template for subscriptions"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Template Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Template Name <span className="text-destructive">*</span></Label>
                <Input {...register("name")} placeholder="e.g. Basic SaaS Package" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Recurring Plan</Label>
                <Select {...register("recurring_plan_id")} options={planOptions} />
              </div>
              <div className="space-y-2">
                <Label>Validity (days)</Label>
                <Input type="number" min="1" {...register("validity_days")} />
                {errors.validity_days && <p className="text-xs text-destructive">{errors.validity_days.message}</p>}
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>Notes</Label>
                <Textarea {...register("notes")} placeholder="Optional notes..." rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Product Lines</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ product_id: "", quantity: 1, description: "" })}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Line
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {errors.lines && typeof errors.lines === "object" && "message" in errors.lines && (
                <p className="text-xs text-destructive">{errors.lines.message as string}</p>
              )}

              <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-1" />
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-muted/30 border">
                  <div className="col-span-12 md:col-span-5 space-y-1">
                    <Label className="text-xs md:hidden">Product</Label>
                    <Select
                      {...register(`lines.${index}.product_id`)}
                      options={products.map((p) => ({ value: p.id, label: `${p.name} (₹${Number(p.sales_price).toFixed(2)})` }))}
                      placeholder="Select product"
                    />
                    {errors.lines?.[index]?.product_id && <p className="text-xs text-destructive">{errors.lines[index].product_id.message}</p>}
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-1">
                    <Label className="text-xs md:hidden">Qty</Label>
                    <Input type="number" min="1" {...register(`lines.${index}.quantity`)} />
                    {errors.lines?.[index]?.quantity && <p className="text-xs text-destructive">{errors.lines[index].quantity.message}</p>}
                  </div>
                  <div className="col-span-6 md:col-span-4 space-y-1">
                    <Label className="text-xs md:hidden">Description</Label>
                    <Input {...register(`lines.${index}.description`)} placeholder="Optional" />
                  </div>
                  <div className="col-span-2 md:col-span-1 flex justify-end">
                    {fields.length > 1 && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : mode === "edit" ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  /* ── LIST MODE (default) ─────────────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotation Templates</h1>
          <p className="text-sm text-muted-foreground">Predefined templates to speed up subscription setups</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><FileText className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total Templates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600"><Layers className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{templates.reduce((s, t: any) => s + Number(t.line_count || 0), 0)}</p>
              <p className="text-xs text-muted-foreground">Total Product Lines</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><Search className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{templates.length}</p>
              <p className="text-xs text-muted-foreground">On This Page</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search templates by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setAppliedSearch(search); setPage(1); } }}
              />
            </div>
            <Button variant="outline" onClick={() => { setAppliedSearch(search); setPage(1); }}>
              Search
            </Button>
            {appliedSearch && (
              <Button variant="ghost" onClick={() => { setSearch(""); setAppliedSearch(""); setPage(1); }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">No templates found</p>
              <p className="text-sm">Create your first quotation template to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Recurring Plan</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Lines</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t: any) => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openView(t.id)}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.plan_name || "—"}</TableCell>
                    <TableCell>{t.validity_days} days</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.line_count || 0} items</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? "default" : "destructive"}>
                        {t.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => openView(t.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Delete this template?")) deleteMutation.mutate(t.id); }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} &middot; {total} templates
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
  );
}
