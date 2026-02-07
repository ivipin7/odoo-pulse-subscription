import { Receipt, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useTaxRules } from "@/hooks/useApi";

const AdminTaxes = () => {
  const { data: taxData } = useTaxRules();
  const taxRules = (taxData ?? []) as any[];
  return (
    <div>
      <PageHeader
        title="Tax Configuration"
        breadcrumbs={[
          { label: "Admin", to: "/admin" },
          { label: "Taxes" },
        ]}
        actions={
          <Button variant="accent" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Tax Rule
          </Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-3 mb-8">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Active Rules</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {taxRules.filter((t) => t.status === "ACTIVE").length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Tax Types</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {new Set(taxRules.map((t) => t.type)).size}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Standard Rate</p>
          <p className="text-2xl font-bold text-foreground mt-1">18%</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Tax ID</th>
              <th>Name</th>
              <th>Rate</th>
              <th>Type</th>
              <th>Applicable To</th>
              <th>Region</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {taxRules.map((tax) => (
              <tr key={tax.id}>
                <td>
                  <span className="font-mono font-medium text-foreground">{tax.id}</span>
                </td>
                <td className="font-medium text-foreground">{tax.name}</td>
                <td>
                  <span className="text-lg font-bold text-foreground">{tax.rate}%</span>
                </td>
                <td>
                  <span className="status-badge status-badge-info">{tax.type}</span>
                </td>
                <td className="text-muted-foreground text-sm">{tax.applicableTo}</td>
                <td className="text-muted-foreground">{tax.region}</td>
                <td>
                  <StatusBadge status={tax.status} />
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

export default AdminTaxes;
