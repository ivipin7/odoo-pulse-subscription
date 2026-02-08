import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";

const paymentSchema = z.object({
  invoice_id: z.string().uuid("Invalid invoice ID"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  payment_method: z.enum(["CREDIT_CARD", "BANK_TRANSFER", "CASH", "OTHER"]),
  notes: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

export default function PaymentFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: {
      invoice_id: searchParams.get("invoiceId") || "",
      payment_method: "CREDIT_CARD",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PaymentForm) => api.post("/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment recorded");
      navigate("/payments");
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Payment failed"),
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Record Payment</h1>
      <Card>
        <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label>Invoice ID</Label>
              <Input placeholder="Invoice UUID" {...register("invoice_id")} />
              {errors.invoice_id && <p className="text-xs text-destructive">{errors.invoice_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" step="0.01" placeholder="0.00" {...register("amount")} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                {...register("payment_method")}
                options={[
                  { value: "CREDIT_CARD", label: "Credit Card" },
                  { value: "BANK_TRANSFER", label: "Bank Transfer" },
                  { value: "CASH", label: "Cash" },
                  { value: "OTHER", label: "Other" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input placeholder="Payment notes" {...register("notes")} />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Processing..." : "Record Payment"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/payments")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
