import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import type { Invoice } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-orange-100 text-orange-800",
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const res = await api.get(`/invoices/${id}`);
      return res.data.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => api.patch(`/invoices/${id}/status`, { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      if (status === "CONFIRMED") {
        toast.success("Invoice confirmed & payment recorded automatically!");
      } else {
        toast.success("Status updated");
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed"),
  });

  if (isLoading) return <PageLoader />;
  if (!invoice) return <p className="text-destructive">Invoice not found</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
          <Badge className={`mt-1 ${statusColors[invoice.status]}`}>{invoice.status}</Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          {invoice.status === "DRAFT" && (
            <>
              <Button onClick={() => statusMutation.mutate("CONFIRMED")} disabled={statusMutation.isPending}>
                Confirm & Record Payment
              </Button>
              <Button variant="destructive" onClick={() => statusMutation.mutate("CANCELLED")} disabled={statusMutation.isPending}>
                Cancel
              </Button>
            </>
          )}
          {invoice.status === "CONFIRMED" && (
            <>
              <Button variant="destructive" onClick={() => statusMutation.mutate("CANCELLED")} disabled={statusMutation.isPending}>
                Cancel
              </Button>
            </>
          )}
          {invoice.status === "FAILED" && (
            <Button onClick={() => statusMutation.mutate("CONFIRMED")} disabled={statusMutation.isPending}>
              Retry (Confirm & Pay)
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Invoice Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{invoice.customer_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Subscription</span><span>{invoice.subscription_number}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}</span></div>
            {invoice.paid_date && <div className="flex justify-between"><span className="text-muted-foreground">Paid Date</span><span>{new Date(invoice.paid_date).toLocaleDateString()}</span></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Totals</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{Number(invoice.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>₹{Number(invoice.tax_amount).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-₹{Number(invoice.discount_amount).toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-2 font-bold text-base"><span>Total</span><span>₹{Number(invoice.total).toFixed(2)}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Line Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines?.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.product_name}</TableCell>
                  <TableCell>{l.quantity}</TableCell>
                  <TableCell>₹{Number(l.unit_price).toFixed(2)}</TableCell>
                  <TableCell>₹{Number(l.tax_amount).toFixed(2)}</TableCell>
                  <TableCell>-₹{Number(l.discount_amount).toFixed(2)}</TableCell>
                  <TableCell className="font-medium">₹{Number(l.subtotal).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => navigate("/invoices")}>← Back to Invoices</Button>
    </div>
  );
}
