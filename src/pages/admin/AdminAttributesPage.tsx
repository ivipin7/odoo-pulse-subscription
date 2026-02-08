import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, ChevronDown, ChevronRight, Palette, Tag } from "lucide-react";
import type { ProductAttribute } from "@/types";

export default function AdminAttributesPage() {
  const queryClient = useQueryClient();
  const [newAttrName, setNewAttrName] = useState("");
  const [showNewAttr, setShowNewAttr] = useState(false);
  const [expandedAttr, setExpandedAttr] = useState<string | null>(null);
  const [newValueForms, setNewValueForms] = useState<Record<string, { value: string; extra_price: string }>>({});

  const { data: attributes = [], isLoading } = useQuery<ProductAttribute[]>({
    queryKey: ["product-attributes"],
    queryFn: async () => {
      const r = await api.get("/products/attributes/all");
      return r.data.data;
    },
  });

  const createAttrMutation = useMutation({
    mutationFn: async (name: string) => api.post("/products/attributes", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-attributes"] });
      toast.success("Attribute created");
      setNewAttrName("");
      setShowNewAttr(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed"),
  });

  const createValueMutation = useMutation({
    mutationFn: async ({ attrId, value, extra_price }: { attrId: string; value: string; extra_price: number }) =>
      api.post(`/products/attributes/${attrId}/values`, { value, extra_price }),
    onSuccess: (_, { attrId }) => {
      queryClient.invalidateQueries({ queryKey: ["product-attributes"] });
      toast.success("Value added");
      setNewValueForms((prev) => ({ ...prev, [attrId]: { value: "", extra_price: "0" } }));
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed"),
  });

  const toggleExpand = (id: string) => {
    setExpandedAttr((prev) => (prev === id ? null : id));
    if (!newValueForms[id]) {
      setNewValueForms((prev) => ({ ...prev, [id]: { value: "", extra_price: "0" } }));
    }
  };

  const handleAddValue = (attrId: string) => {
    const form = newValueForms[attrId];
    if (!form?.value.trim()) {
      toast.error("Value is required");
      return;
    }
    createValueMutation.mutate({
      attrId,
      value: form.value.trim(),
      extra_price: parseFloat(form.extra_price) || 0,
    });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Variants</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage attributes and their values for product variants
          </p>
        </div>
        <Button onClick={() => setShowNewAttr(!showNewAttr)}>
          {showNewAttr ? "Cancel" : <><Plus className="h-4 w-4 mr-2" /> New Attribute</>}
        </Button>
      </div>

      {/* New Attribute Form */}
      {showNewAttr && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Create New Attribute</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label>Attribute Name</Label>
                <Input
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  placeholder="e.g. Color, Size, Storage, RAM"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newAttrName.trim()) {
                      createAttrMutation.mutate(newAttrName.trim());
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => newAttrName.trim() && createAttrMutation.mutate(newAttrName.trim())}
                disabled={!newAttrName.trim() || createAttrMutation.isPending}
              >
                {createAttrMutation.isPending ? "Creating..." : "Create Attribute"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attributes List */}
      {attributes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">No Attributes Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create attributes like Color, Size, or Storage to build product variants.
            </p>
            <Button onClick={() => setShowNewAttr(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create First Attribute
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {attributes.map((attr) => {
            const isExpanded = expandedAttr === attr.id;
            const form = newValueForms[attr.id] || { value: "", extra_price: "0" };
            return (
              <Card key={attr.id}>
                <CardHeader
                  className="pb-3 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => toggleExpand(attr.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          {attr.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {attr.values.length} value{attr.values.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {attr.values.slice(0, 5).map((v) => (
                        <Badge key={v.id} variant="outline" className="text-xs">
                          {v.value}
                          {Number(v.extra_price) > 0 && (
                            <span className="text-green-600 ml-1">+₹{Number(v.extra_price).toFixed(0)}</span>
                          )}
                        </Badge>
                      ))}
                      {attr.values.length > 5 && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          +{attr.values.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    {/* Add value form */}
                    <div className="flex gap-3 items-end p-3 bg-muted/50 rounded-md mb-4">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Value</Label>
                        <Input
                          value={form.value}
                          onChange={(e) =>
                            setNewValueForms((prev) => ({
                              ...prev,
                              [attr.id]: { ...prev[attr.id], value: e.target.value },
                            }))
                          }
                          placeholder="e.g. Red, Large, 256GB"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddValue(attr.id);
                          }}
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <Label className="text-xs">Extra Price (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.extra_price}
                          onChange={(e) =>
                            setNewValueForms((prev) => ({
                              ...prev,
                              [attr.id]: { ...prev[attr.id], extra_price: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddValue(attr.id)}
                        disabled={!form.value.trim() || createValueMutation.isPending}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>

                    {/* Values table */}
                    {attr.values.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No values yet. Add values above.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Value</TableHead>
                            <TableHead>Extra Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attr.values.map((v) => (
                            <TableRow key={v.id}>
                              <TableCell className="font-medium">{v.value}</TableCell>
                              <TableCell>
                                {Number(v.extra_price) > 0 ? (
                                  <span className="text-green-700">+₹{Number(v.extra_price).toFixed(2)}</span>
                                ) : (
                                  <span className="text-muted-foreground">₹0.00</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Help card */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-2">How Product Variants Work</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Create <strong>attributes</strong> (e.g. Color, Size, Storage) here</li>
            <li>Add <strong>values</strong> to each attribute (e.g. Red, Blue, Green for Color)</li>
            <li>On the <strong>Product Edit</strong> page, assign attribute values to create variants</li>
            <li>Each variant can have an optional SKU and price override</li>
            <li>The <strong>extra price</strong> on a value is added to the base product price</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
