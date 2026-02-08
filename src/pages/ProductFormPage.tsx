import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageLoader } from "@/components/ui/spinner";
import toast from "react-hot-toast";
import { useState } from "react";
import type { ProductVariant, ProductAttribute } from "@/types";
import { Trash2, Plus } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  product_type: z.enum(["CONSUMABLE", "SERVICE"]),
  sales_price: z.coerce.number().min(0, "Price must be non-negative"),
  cost_price: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  tax_id: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema) as any,
    values: isEdit && product
      ? { name: product.name, product_type: product.product_type, sales_price: Number(product.sales_price), cost_price: Number(product.cost_price || 0), description: product.description || "", tax_id: product.tax_id || "" }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      if (isEdit) {
        return api.put(`/products/${id}`, data);
      }
      return api.post("/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(isEdit ? "Product updated" : "Product created");
      navigate("/products");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || "Failed to save product");
    },
  });

  if (isEdit && isLoading) return <PageLoader />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{isEdit ? "Edit Product" : "New Product"}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Update product details" : "Create a new product"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" placeholder="e.g. Cloud Hosting Plan" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_type">Type</Label>
                <Select
                  id="product_type"
                  {...register("product_type")}
                  options={[
                    { value: "CONSUMABLE", label: "Consumable" },
                    { value: "SERVICE", label: "Service" },
                  ]}
                />
                {errors.product_type && <p className="text-xs text-destructive">{errors.product_type.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales_price">Sales Price (₹)</Label>
                <Input id="sales_price" type="number" step="0.01" placeholder="0.00" {...register("sales_price")} />
                {errors.sales_price && <p className="text-xs text-destructive">{errors.sales_price.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost Price (₹)</Label>
                <Input id="cost_price" type="number" step="0.01" placeholder="0.00" {...register("cost_price")} />
                {errors.cost_price && <p className="text-xs text-destructive">{errors.cost_price.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Optional description..." {...register("description")} />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/products")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Variants Section - only for edit mode */}
      {isEdit && <ProductVariantsSection productId={id!} />}
    </div>
  );
}

function ProductVariantsSection({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAttrValue, setSelectedAttrValue] = useState("");
  const [variantSku, setVariantSku] = useState("");
  const [variantPrice, setVariantPrice] = useState("");

  const { data: variants = [] } = useQuery<ProductVariant[]>({
    queryKey: ["product-variants", productId],
    queryFn: async () => { const r = await api.get(`/products/${productId}/variants`); return r.data.data; },
  });

  const { data: attributes = [] } = useQuery<ProductAttribute[]>({
    queryKey: ["product-attributes"],
    queryFn: async () => { const r = await api.get("/products/attributes/all"); return r.data.data; },
  });

  const addMutation = useMutation({
    mutationFn: async (data: { attribute_value_id: string; sku?: string; price_override?: number }) =>
      api.post(`/products/${productId}/variants`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      toast.success("Variant added");
      setShowAddForm(false);
      setSelectedAttrValue("");
      setVariantSku("");
      setVariantPrice("");
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed"),
  });

  const removeMutation = useMutation({
    mutationFn: async (variantId: string) => api.delete(`/products/${productId}/variants/${variantId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      toast.success("Variant removed");
    },
  });

  // Build flat list of attribute values for selection
  const attrValueOptions = attributes.flatMap((a) =>
    a.values.map((v) => ({ value: v.id, label: `${a.name}: ${v.value} (+₹${Number(v.extra_price).toFixed(2)})` }))
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Product Variants</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : <><Plus className="h-3 w-3 mr-1" /> Add Variant</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="flex gap-3 items-end p-3 bg-muted rounded-md">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Attribute Value</Label>
              <Select
                value={selectedAttrValue}
                onChange={(e) => setSelectedAttrValue(e.target.value)}
                options={attrValueOptions}
                placeholder="Select an attribute..."
              />
            </div>
            <div className="w-32 space-y-1">
              <Label className="text-xs">SKU</Label>
              <Input value={variantSku} onChange={(e) => setVariantSku(e.target.value)} placeholder="Optional" />
            </div>
            <div className="w-32 space-y-1">
              <Label className="text-xs">Price Override</Label>
              <Input type="number" step="0.01" value={variantPrice} onChange={(e) => setVariantPrice(e.target.value)} placeholder="Optional" />
            </div>
            <Button size="sm" onClick={() => addMutation.mutate({
              attribute_value_id: selectedAttrValue,
              sku: variantSku || undefined,
              price_override: variantPrice ? parseFloat(variantPrice) : undefined,
            })} disabled={!selectedAttrValue || addMutation.isPending}>
              Add
            </Button>
          </div>
        )}

        {variants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No variants configured. Add attributes to create variants.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attribute</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Extra Price</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price Override</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v) => (
                <TableRow key={v.id}>
                  <TableCell><Badge variant="outline">{v.attribute_name}</Badge></TableCell>
                  <TableCell>{v.attribute_value}</TableCell>
                  <TableCell>+₹{Number(v.extra_price).toFixed(2)}</TableCell>
                  <TableCell>{v.sku || "—"}</TableCell>
                  <TableCell>{v.price_override ? `₹${Number(v.price_override).toFixed(2)}` : "—"}</TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => removeMutation.mutate(v.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
