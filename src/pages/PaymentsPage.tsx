import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Payment } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "INTERNAL";
  const isPortal = user?.role === "PORTAL";
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["payments", page],
    queryFn: async () => {
      const res = await api.get("/payments", { params: { page, limit: 20 } });
      return res.data;
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (invoiceId: string) => api.post(`/payments/retry/${invoiceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment retried");
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Retry failed"),
  });

  if (isLoading) return <PageLoader />;

  const payments: Payment[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{isPortal ? "My Payments" : "Payments"}</h1>

      <Card>
        <CardContent className="p-4">
          {payments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No payments found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Invoice</TableHead>
                  {isAdmin && <TableHead>Customer</TableHead>}
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.payment_number}</TableCell>
                    <TableCell>{p.invoice_number || "—"}</TableCell>
                    {isAdmin && <TableCell>{(p as any).customer_name || "—"}</TableCell>}
                    <TableCell>₹{Number(p.amount).toFixed(2)}</TableCell>
                    <TableCell><Badge variant="outline">{p.payment_method}</Badge></TableCell>
                    <TableCell>
                      <Badge className={statusColors[p.status]}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        {p.status === "FAILED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={retryMutation.isPending}
                            onClick={() => retryMutation.mutate(p.invoice_id)}
                          >
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    )}
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
