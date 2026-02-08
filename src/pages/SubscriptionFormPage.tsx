import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { Plus, Trash2, ArrowLeft, ShoppingCart, Info, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { useMemo, useEffect } from "react";
import type { QuotationTemplate } from "@/types";

const lineSchema = z.object({
  product_id: z.string().min(1, "Select a product"),
  quantity: z.coerce.number().min(1),
  unit_price: z.coerce.number().min(0),
  tax_id: z.string().optional(),
  discount_id: z.string().optional(),
});

const subscriptionSchema = z.object({
  customer_id: z.string().min(1, "Select a customer"),
  recurring_plan_id: z.string().optional(),
  payment_terms: z.enum(["IMMEDIATE", "NET_15", "NET_30", "NET_60"]),
  start_date: z.string().optional(),
  expiration_date: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, "At least one line is required"),
});

type SubForm = z.infer<typeof subscriptionSchema>;

export default function SubscriptionFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isPortal = user?.role === "PORTAL";

  // Fetch lookup data (skip for PORTAL users — they are auto-assigned)
  const { data: customers } = useQuery({
    queryKey: ["users-portal"],
    queryFn: async () => {
      const r = await api.get("/users", { params: { role: "PORTAL", limit: 500 } });
      return r.data.data;
    },
    enabled: !isPortal,
  });
  const { data: plans } = useQuery({
    queryKey: ["plans-list"],
    queryFn: async () => { const r = await api.get("/recurring-plans"); return r.data.data; },
  });
  const { data: products } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => { const r = await api.get("/products"); return r.data.data; },
  });
  const { data: taxes } = useQuery({
    queryKey: ["taxes-list"],
    queryFn: async () => { const r = await api.get("/taxes"); return r.data.data; },
  });
  const { data: discounts } = useQuery({
    queryKey: ["discounts-list"],
    queryFn: async () => { const r = await api.get("/discounts"); return r.data.data; },
  });
  const { data: templatesData } = useQuery({
    queryKey: ["quotation-templates-list"],
    queryFn: async () => { const r = await api.get("/quotation-templates", { params: { limit: 100 } }); return r.data; },
  });

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["subscription", id],
    queryFn: async () => { const r = await api.get(`/subscriptions/${id}`); return r.data.data; },
    enabled: isEdit,
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SubForm>({
    resolver: zodResolver(subscriptionSchema) as any,
    defaultValues: { payment_terms: "IMMEDIATE", customer_id: isPortal ? user?.id || "" : "", lines: [{ product_id: "", quantity: 1, unit_price: 0 }] },
    values: isEdit && existing
      ? {
          customer_id: existing.customer_id,
          recurring_plan_id: existing.recurring_plan_id || "",
          payment_terms: existing.payment_terms,
          start_date: existing.start_date?.slice(0, 10) || "",
          expiration_date: existing.expiration_date?.slice(0, 10) || "",
          notes: existing.notes || "",
          lines: existing.lines?.map((l: any) => ({
            product_id: l.product_id,
            quantity: l.quantity,
            unit_price: Number(l.unit_price),
            tax_id: l.tax_id || "",
            discount_id: l.discount_id || "",
          })) || [{ product_id: "", quantity: 1, unit_price: 0 }],
        }
      : undefined,
  });

  // For PORTAL users, ensure customer_id is always set to their own ID
  useEffect(() => {
    if (isPortal && user?.id) {
      setValue("customer_id", user.id);
    }
  }, [isPortal, user?.id, setValue]);

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const watchedLines = useWatch({ control, name: "lines" });

  // Calculate totals
  const taxList = taxes || [];
  const lineTotals = useMemo(() => {
    return (watchedLines || []).map((line) => {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.unit_price) || 0;
      const subtotal = qty * price;
      const tax = taxList.find((t: any) => t.id === line.tax_id);
      let taxAmt = 0;
      if (tax) {
        taxAmt = tax.tax_computation === "PERCENTAGE"
          ? subtotal * Number(tax.amount) / 100
          : Number(tax.amount) * qty;
      }
      return { subtotal, taxAmt, total: subtotal + taxAmt };
    });
  }, [watchedLines, taxList]);

  const grandUntaxed = lineTotals.reduce((s, l) => s + l.subtotal, 0);
  const grandTax = lineTotals.reduce((s, l) => s + l.taxAmt, 0);
  const grandTotal = grandUntaxed + grandTax;

  const mutation = useMutation({
    mutationFn: async (data: SubForm) => {
      if (isEdit) return api.put(`/subscriptions/${id}`, data);
      return api.post("/subscriptions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success(isEdit ? "Subscription updated" : "Subscription created");
      navigate("/subscriptions");
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed to save"),
  });

  if (isEdit && loadingExisting) return <PageLoader />;

  const productList = products || [];
  const productOptions = productList.map((p: any) => ({
    value: p.id,
    label: `${p.name} (₹${Number(p.sales_price).toFixed(2)})`,
  }));
  const customerOptions = (customers || [])
    .map((c: any) => ({
      value: c.id,
      label: `${c.first_name} ${c.last_name} (${c.email})`,
    }));
  const planOptions = [
    { value: "", label: "— No Plan —" },
    ...(plans || []).map((p: any) => ({ value: p.id, label: p.name })),
  ];
  const taxOptions = [
    { value: "", label: "No Tax" },
    ...(taxList).map((t: any) => ({
      value: t.id,
      label: `${t.name} (${t.amount}${t.tax_computation === "PERCENTAGE" ? "%" : " fixed"})`,
    })),
  ];
  const discountOptions = [
    { value: "", label: "No Discount" },
    ...(discounts || []).map((d: any) => ({ value: d.id, label: d.name })),
  ];

  const handleProductChange = (idx: number, productId: string) => {
    const product = productList.find((p: any) => p.id === productId);
    if (product) {
      setValue(`lines.${idx}.unit_price`, Number(product.sales_price));
      if (product.tax_id) {
        setValue(`lines.${idx}.tax_id`, product.tax_id);
      }
    }
  };

  const templateList: QuotationTemplate[] = templatesData?.data || [];

  const handleApplyTemplate = async (templateId: string) => {
    if (!templateId) return;
    try {
      const res = await api.get(`/quotation-templates/${templateId}`);
      const tpl: QuotationTemplate = res.data.data;
      // Set plan if template has one
      if (tpl.recurring_plan_id) {
        setValue("recurring_plan_id", tpl.recurring_plan_id);
      }
      // Replace lines with template lines
      if (tpl.lines && tpl.lines.length > 0) {
        // Clear existing lines and set new ones
        const newLines = tpl.lines.map((l) => {
          const product = productList.find((p: any) => p.id === l.product_id);
          return {
            product_id: l.product_id,
            quantity: l.quantity,
            unit_price: Number(l.unit_price || product?.sales_price || 0),
            tax_id: product?.tax_id || "",
            discount_id: "",
          };
        });
        setValue("lines", newLines);
      }
      toast.success(`Template "${tpl.name}" applied`);
    } catch {
      toast.error("Failed to load template");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/subscriptions")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? "Edit Subscription" : "New Subscription"}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? "Update subscription details and line items" : "Create a new subscription for a customer"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        {/* Subscription Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isPortal && (
              <div className="space-y-2">
                <Label>Customer <span className="text-destructive">*</span></Label>
                <Select {...register("customer_id")} options={customerOptions} placeholder="Select customer" />
                {errors.customer_id && <p className="text-xs text-destructive">{errors.customer_id.message}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select {...register("recurring_plan_id")} options={planOptions} />
            </div>
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select
                {...register("payment_terms")}
                options={[
                  { value: "IMMEDIATE", label: "Immediate Payment" },
                  { value: "NET_15", label: "Net 15 Days" },
                  { value: "NET_30", label: "Net 30 Days" },
                  { value: "NET_60", label: "Net 60 Days" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" {...register("start_date")} />
            </div>
            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <Input type="date" {...register("expiration_date")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea {...register("notes")} placeholder="Optional internal notes..." rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Apply Quotation Template */}
        {!isEdit && templateList.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="text-sm font-medium">Apply Quotation Template</Label>
                  <p className="text-xs text-muted-foreground">Auto-fill plan and product lines from a template</p>
                </div>
                <Select
                  options={[
                    { value: "", label: "— Select Template —" },
                    ...templateList.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="w-64"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Lines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Order Lines</CardTitle>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product_id: "", quantity: 1, unit_price: 0 })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Line
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {errors.lines?.root && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <Info className="h-3 w-3" /> {errors.lines.root.message}
              </p>
            )}

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1 hidden md:grid">
              <div className="col-span-3">Product</div>
              <div className="col-span-1">Qty</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2">Tax</div>
              <div className="col-span-2">Discount</div>
              <div className="col-span-1 text-right">Amount</div>
              <div className="col-span-1" />
            </div>

            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-muted/30 border">
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-xs md:hidden">Product</Label>
                  <Select
                    {...register(`lines.${idx}.product_id`)}
                    options={productOptions}
                    placeholder="Select product"
                    onChange={(e) => {
                      register(`lines.${idx}.product_id`).onChange(e);
                      handleProductChange(idx, e.target.value);
                    }}
                  />
                  {errors.lines?.[idx]?.product_id && <p className="text-xs text-destructive">{errors.lines[idx].product_id.message}</p>}
                </div>
                <div className="col-span-4 md:col-span-1 space-y-1">
                  <Label className="text-xs md:hidden">Qty</Label>
                  <Input type="number" min="1" {...register(`lines.${idx}.quantity`)} />
                  {errors.lines?.[idx]?.quantity && <p className="text-xs text-destructive">{errors.lines[idx].quantity.message}</p>}
                </div>
                <div className="col-span-4 md:col-span-2 space-y-1">
                  <Label className="text-xs md:hidden">Unit Price</Label>
                  <Input type="number" step="0.01" {...register(`lines.${idx}.unit_price`)} />
                  {errors.lines?.[idx]?.unit_price && <p className="text-xs text-destructive">{errors.lines[idx].unit_price.message}</p>}
                </div>
                <div className="col-span-4 md:col-span-2 space-y-1">
                  <Label className="text-xs md:hidden">Tax</Label>
                  <Select {...register(`lines.${idx}.tax_id`)} options={taxOptions} />
                </div>
                <div className="col-span-6 md:col-span-2 space-y-1">
                  <Label className="text-xs md:hidden">Discount</Label>
                  <Select {...register(`lines.${idx}.discount_id`)} options={discountOptions} />
                </div>
                <div className="col-span-4 md:col-span-1 text-right">
                  <p className="text-sm font-medium">
                    ₹{(lineTotals[idx]?.total || 0).toFixed(2)}
                  </p>
                  {(lineTotals[idx]?.taxAmt || 0) > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      tax: ₹{lineTotals[idx].taxAmt.toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-end">
                  {fields.length > 1 && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => remove(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="border-t pt-4 mt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Untaxed Amount</span>
                <span>₹{grandUntaxed.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes</span>
                <span>₹{grandTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/subscriptions")}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEdit ? "Update Subscription" : "Create Subscription"}
          </Button>
        </div>
      </form>
    </div>
  );
}
