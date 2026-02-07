import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useProducts } from "@/hooks/useApi";

const AdminProducts = () => {
  const { data: prodData } = useProducts();
  const products = (prodData ?? []) as any[];
  return (
    <div>
      <PageHeader
        title="Products"
        actions={
          <Button variant="accent" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Product
          </Button>
        }
      />

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Base Price</th>
              <th>Variants</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="font-medium text-foreground">{product.name}</td>
                <td>
                  <span className="status-badge status-badge-info">{product.category}</span>
                </td>
                <td className="text-foreground">
                  ₹{product.price.toLocaleString()} / {product.period}
                </td>
                <td className="text-muted-foreground">
                  {product.variants.map((v) => v.name).join(", ")}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;
