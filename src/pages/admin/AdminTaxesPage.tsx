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
import { Plus, Search, Percent, Hash, X, Edit, Trash2, Eye, Calculator, Receipt, Info } from "lucide-react";

const taxSchema = z.object({
  name: z.string().min(1, "Tax name is required"),
  tax_computation: z.enum(["PERCENTAGE", "FIXED"]),
  amount: z.coerce.number().min(0, "Amount must be non-negative"),
});

type TaxForm = z.infer<typeof taxSchema>;

export default function AdminTaxesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewTax, setViewTax] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["taxes"],
    queryFn: async () => { const r = await api.get("/taxes"); return r.data; },
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<TaxForm>({
    resolver: zodResolver(taxSchema) as any,
    defaultValues: { tax_computation: "PERCENTAGE" },
  });

  const watchComputation = watch("tax_computation");

  const saveMutation = useMutation({
    mutationFn: async (d: TaxForm) => {
      if (editId) return api.put(`/taxes/${editId}`, d);
      return api.post("/taxes", d);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
      toast.success(editId ? "Tax updated" : "Tax created");
      closeForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/taxes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
      toast.success("Tax deactivated");
      if (viewTax?.id === deleteMutation.variables) setViewTax(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed"),
  });

  const closeForm = () => { setShowForm(false); setEditId(null); reset({ tax_computation: "PERCENTAGE" }); };

  const startEdit = (t: any) => {
    setEditId(t.id);
    setValue("name", t.name);
    setValue("tax_computation", t.tax_computation);
    setValue("amount", Number(t.amount));
    setShowForm(true);
    setViewTax(null);
  };

  const allTaxes: any[] = data?.data || [];

  const filtered = useMemo(() => {
    return allTaxes.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && t.tax_computation !== filterType) return false;
      return true;
    });
  }, [allTaxes, search, filterType]);

  const percentageCount = allTaxes.filter((t) => t.tax_computation === "PERCENTAGE").length;
  const fixedCount = allTaxes.filter((t) => t.tax_computation === "FIXED").length;

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tax Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure tax rules applied on invoice lines
          </p>
        </div>
        <Button onClick={() => { if (showForm) closeForm(); else { setShowForm(true); setViewTax(null); } }}>
          {showForm ? <><X className="h-4 w-4 mr-2" /> Cancel</> : <><Plus className="h-4 w-4 mr-2" /> New Tax</>}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50"><Calculator className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Taxes</p>
              <p className="text-xl font-bold">{allTaxes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50"><Percent className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Percentage Based</p>
              <p className="text-xl font-bold">{percentageCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50"><Hash className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Fixed Amount</p>
              <p className="text-xl font-bold">{fixedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-calculation info banner */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Auto-calculated during invoice generation</p>
            <p className="text-blue-700 mt-0.5">
              Taxes assigned to products are automatically applied when subscription invoices are generated.
              Percentage taxes are calculated on the line subtotal; fixed taxes are applied per line.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">{editId ? "Edit Tax" : "Create New Tax"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Tax Name <span className="text-destructive">*</span></Label>
                  <Input {...register("name")} placeholder="e.g. GST 18%" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Computation Type <span className="text-destructive">*</span></Label>
                  <Select {...register("tax_computation")} options={[
                    { value: "PERCENTAGE", label: "Percentage (%)" },
                    { value: "FIXED", label: "Fixed Amount (₹)" },
                  ]} />
                </div>
                <div className="space-y-1">
                  <Label>Amount <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input type="number" step="0.01" {...register("amount")} placeholder="0" className="pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {watchComputation === "PERCENTAGE" ? "%" : "₹"}
                    </span>
                  </div>
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium">Preview:</span>{" "}
                  {watchComputation === "PERCENTAGE"
                    ? `On a ₹1,000 subtotal, this tax adds ₹${(1000 * (watch("amount") || 0) / 100).toFixed(2)}`
                    : `This tax adds a flat ₹${(watch("amount") || 0).toFixed(2)} per invoice line`}
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editId ? "Update Tax" : "Create Tax"}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Detail Panel */}
      {viewTax && !showForm && (
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg">{viewTax.name}</CardTitle>
              <Badge className={viewTax.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-300 mt-1" : "bg-gray-100 text-gray-600 border border-gray-300 mt-1"}>
                {viewTax.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => startEdit(viewTax)}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setViewTax(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <DetailRow label="Computation Type" value={viewTax.tax_computation === "PERCENTAGE" ? "Percentage" : "Fixed Amount"} />
            <DetailRow label="Amount" value={viewTax.tax_computation === "PERCENTAGE" ? `${viewTax.amount}%` : `₹${Number(viewTax.amount).toFixed(2)}`} />
            <DetailRow label="Example (₹1,000 subtotal)" value={
              viewTax.tax_computation === "PERCENTAGE"
                ? `₹${(1000 * Number(viewTax.amount) / 100).toFixed(2)} tax`
                : `₹${Number(viewTax.amount).toFixed(2)} tax (flat)`
            } />
            <DetailRow label="Created" value={new Date(viewTax.created_at).toLocaleDateString()} />
            <div className="md:col-span-2 pt-2 border-t mt-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Receipt className="h-4 w-4" />
                <span>Applied automatically to invoice lines when products with this tax are billed.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter + Table */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search taxes..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-44">
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                options={[
                  { value: "", label: "All Types" },
                  { value: "PERCENTAGE", label: "Percentage" },
                  { value: "FIXED", label: "Fixed Amount" },
                ]}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">No taxes found</p>
              <Button className="mt-4" variant="outline" onClick={() => { setShowForm(true); setViewTax(null); }}>
                Create your first tax rule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tax Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Example (₹1,000)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t: any) => (
                  <TableRow
                    key={t.id}
                    className={`group cursor-pointer ${viewTax?.id === t.id ? "bg-muted/50" : ""}`}
                    onClick={() => { setViewTax(t); setShowForm(false); }}
                  >
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {t.tax_computation === "PERCENTAGE" ? <Percent className="h-3 w-3" /> : <Hash className="h-3 w-3" />}
                        {t.tax_computation === "PERCENTAGE" ? "Percentage" : "Fixed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {t.tax_computation === "PERCENTAGE" ? `${t.amount}%` : `₹${Number(t.amount).toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.tax_computation === "PERCENTAGE"
                        ? `+ ₹${(1000 * Number(t.amount) / 100).toFixed(2)}`
                        : `+ ₹${Number(t.amount).toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      <Badge className={t.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-300" : "bg-gray-100 text-gray-600 border border-gray-300"}>
                        {t.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => { setViewTax(t); setShowForm(false); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {t.is_active && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { if (confirm(`Deactivate "${t.name}"?`)) deleteMutation.mutate(t.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
