import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import type { Invoice } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { RefreshCw } from "lucide-react";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-orange-100 text-orange-800",
};

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "INTERNAL";
  const isPortal = user?.role === "PORTAL";

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", page, statusFilter],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/invoices", { params });
      return res.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.patch(`/invoices/${id}/status`, { status });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      if (status === "CONFIRMED") {
        toast.success("Invoice confirmed & payment recorded!");
      } else {
        toast.success("Invoice status updated");
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed"),
  });

  const recurringMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/invoices/generate-recurring");
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      const result = data.data;
      if (result.generated > 0) {
        toast.success(`Generated ${result.generated} recurring invoice(s)`);
      } else {
        toast.success("No subscriptions due for billing");
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} invoice(s) failed to generate`);
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed to generate recurring invoices"),
  });

  if (isLoading) return <PageLoader />;

  const invoices: Invoice[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isPortal ? "My Invoices" : "Invoices"}</h1>
        {isAdmin && (
          <Button
            onClick={() => recurringMutation.mutate()}
            disabled={recurringMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recurringMutation.isPending ? "animate-spin" : ""}`} />
            {recurringMutation.isPending ? "Generating..." : "Generate Recurring Invoices"}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 w-48">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              options={[
                { value: "", label: "All Statuses" },
                { value: "DRAFT", label: "Draft" },
                { value: "CONFIRMED", label: "Confirmed" },
                { value: "PAID", label: "Paid" },
                { value: "FAILED", label: "Failed" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
            />
          </div>

          {invoices.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No invoices found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  {isAdmin && <TableHead>Customer</TableHead>}
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      <Link to={`/invoices/${inv.id}`} className="text-primary hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </TableCell>
                    {isAdmin && <TableCell>{inv.customer_name}</TableCell>}
                    <TableCell>₹{Number(inv.total).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[inv.status]}>{inv.status}</Badge>
                    </TableCell>
                    <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link to={`/invoices/${inv.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                        {isAdmin && inv.status === "DRAFT" && (
                          <Button size="sm" variant="outline" disabled={statusMutation.isPending}
                            onClick={() => statusMutation.mutate({ id: inv.id, status: "CONFIRMED" })}>
                            Confirm & Pay
                          </Button>
                        )}
                        {isAdmin && ["DRAFT", "CONFIRMED", "FAILED"].includes(inv.status) && (
                          <Button size="sm" variant="outline" disabled={statusMutation.isPending}
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            onClick={() => statusMutation.mutate({ id: inv.id, status: "CANCELLED" })}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} total)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
