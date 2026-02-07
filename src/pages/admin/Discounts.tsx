import { Tag, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDiscounts } from "@/hooks/useApi";

const AdminDiscounts = () => {
  const { data: discData } = useDiscounts();
  const discounts = (discData ?? []) as any[];
  return (
    <div>
      <PageHeader
        title="Discount Codes"
        breadcrumbs={[
          { label: "Admin", to: "/admin" },
          { label: "Discounts" },
        ]}
        actions={
          <Button variant="accent" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Create Discount
          </Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-3 mb-8">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Active Codes</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {discounts.filter((d) => d.status === "ACTIVE").length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Usage</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {discounts.reduce((s, d) => s + d.usedCount, 0)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Remaining Capacity</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {discounts.reduce((s, d) => s + (d.maxUses - d.usedCount), 0)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Type</th>
              <th>Value</th>
              <th>Min Order</th>
              <th>Usage</th>
              <th>Validity</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.id}>
                <td>
                  <span className="font-mono font-bold text-accent">{d.code}</span>
                </td>
                <td className="text-muted-foreground text-sm max-w-[200px] truncate">
                  {d.description}
                </td>
                <td>
                  <span className="status-badge status-badge-info">
                    {d.type === "PERCENTAGE" ? "%" : "₹"}
                  </span>
                </td>
                <td className="font-medium text-foreground">
                  {d.type === "PERCENTAGE" ? `${d.value}%` : `₹${d.value.toLocaleString()}`}
                </td>
                <td className="text-muted-foreground">₹{d.minOrder.toLocaleString()}</td>
                <td className="text-muted-foreground">
                  {d.usedCount}/{d.maxUses}
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div
                      className="bg-accent h-1.5 rounded-full"
                      style={{ width: `${(d.usedCount / d.maxUses) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="text-muted-foreground text-xs">
                  {d.validFrom} → {d.validUntil}
                </td>
                <td>
                  <StatusBadge status={d.status} />
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

export default AdminDiscounts;
