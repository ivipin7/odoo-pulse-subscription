import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Subscription, UsageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Trash2, FileText, CheckCircle, Play, XCircle, Send, Receipt, Pause, RotateCcw, Ban, Timer, CalendarDays, TrendingUp, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const statusConfig: Record<string, { color: string; label: string; icon: typeof FileText }> = {
  DRAFT: { color: "bg-gray-100 text-gray-700 border border-gray-300", label: "Draft", icon: FileText },
  QUOTATION: { color: "bg-amber-50 text-amber-700 border border-amber-300", label: "Quotation", icon: Send },
  CONFIRMED: { color: "bg-blue-50 text-blue-700 border border-blue-300", label: "Confirmed", icon: CheckCircle },
  ACTIVE: { color: "bg-emerald-50 text-emerald-700 border border-emerald-300", label: "Active", icon: Play },
  PAUSED: { color: "bg-orange-50 text-orange-700 border border-orange-300", label: "Paused", icon: Pause },
  CANCELLED: { color: "bg-rose-50 text-rose-700 border border-rose-300", label: "Cancelled", icon: Ban },
  CLOSED: { color: "bg-red-50 text-red-700 border border-red-300", label: "Closed", icon: XCircle },
};

const allStatuses = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"];

const CANCELLATION_REASONS = [
  "Too expensive",
  "No longer needed",
  "Switching to competitor",
  "Poor service quality",
  "Missing features",
  "Business closed",
  "Other",
];

export default function SubscriptionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "INTERNAL";

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelDetail, setCancelDetail] = useState("");

  const { data: sub, isLoading } = useQuery<Subscription & { lines: any[] }>({
    queryKey: ["subscription", id],
    queryFn: async () => {
      const res = await api.get(`/subscriptions/${id}`);
      return res.data.data;
    },
  });

  const { data: usage } = useQuery<UsageData>({
    queryKey: ["subscription-usage", id],
    queryFn: async () => {
      const res = await api.get(`/subscriptions/${id}/usage`);
      return res.data.data;
    },
    enabled: !!sub && (sub.status === "ACTIVE" || sub.status === "PAUSED"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ status, cancellation_reason }: { status: string; cancellation_reason?: string }) =>
      api.patch(`/subscriptions/${id}/status`, { status, cancellation_reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", id] });
      queryClient.invalidateQueries({ queryKey: ["subscription-usage", id] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Status updated");
      setShowCancelModal(false);
      setCancelReason("");
      setCancelDetail("");
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed"),
  });

  const generateInvoice = useMutation({
    mutationFn: async () => api.post("/invoices/generate", { subscription_id: id }),
    onSuccess: () => {
      toast.success("Invoice generated");
      navigate("/invoices");
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed to generate invoice"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/subscriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Subscription deleted");
      navigate("/subscriptions");
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed to delete"),
  });

  const renewMutation = useMutation({
    mutationFn: async () => api.post(`/subscriptions/${id}/renew`),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Subscription renewed! A new draft has been created.");
      navigate(`/subscriptions/${res.data.data.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || "Failed to renew"),
  });

  if (isLoading) return <PageLoader />;
  if (!sub) return <p className="text-destructive p-6">Subscription not found</p>;

  const currentIdx = allStatuses.indexOf(sub.status);
  const isPaused = sub.status === "PAUSED";
  const isCancelled = sub.status === "CANCELLED";
  const isClosed = sub.status === "CLOSED";
  const isActive = sub.status === "ACTIVE";

  // Calculate totals from lines
  const lines = sub.lines || [];
  const untaxedTotal = lines.reduce((s, l) => s + Number(l.subtotal || 0), 0);
  const taxTotal = lines.reduce((s, l) => s + Number(l.tax_amount || 0), 0);
  const grandTotal = untaxedTotal + taxTotal;

  const handleCancel = () => {
    const reason = cancelReason === "Other" ? cancelDetail : cancelReason;
    if (!reason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }
    statusMutation.mutate({ status: "CANCELLED", cancellation_reason: reason });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-rose-700 flex items-center gap-2">
              <Ban className="h-5 w-5" /> Cancel Subscription
            </h2>
            <p className="text-sm text-muted-foreground">
              Please tell us why you're cancelling <strong>{sub.subscription_number}</strong>. This helps us improve.
            </p>
            <div className="space-y-3">
              <label className="text-sm font-medium">Reason</label>
              <div className="space-y-2">
                {CANCELLATION_REASONS.map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cancel_reason"
                      value={r}
                      checked={cancelReason === r}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="accent-rose-600"
                    />
                    <span className="text-sm">{r}</span>
                  </label>
                ))}
              </div>
              {cancelReason === "Other" && (
                <textarea
                  placeholder="Please explain..."
                  value={cancelDetail}
                  onChange={(e) => setCancelDetail(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm h-20 resize-none"
                />
              )}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCancelModal(false)}>
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                disabled={!cancelReason || statusMutation.isPending}
              >
                {statusMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/subscriptions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{sub.subscription_number}</h1>
              <Badge className={`text-sm ${statusConfig[sub.status]?.color}`}>
                {statusConfig[sub.status]?.label || sub.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Created {new Date(sub.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {/* Pause button (ACTIVE → PAUSED) */}
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
              onClick={() => statusMutation.mutate({ status: "PAUSED" })}
              disabled={statusMutation.isPending}
            >
              <Pause className="h-4 w-4 mr-1" /> Pause
            </Button>
          )}
          {/* Resume button (PAUSED → ACTIVE) */}
          {isPaused && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => statusMutation.mutate({ status: "ACTIVE" })}
              disabled={statusMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Resume
            </Button>
          )}
          {/* Cancel button (ACTIVE or PAUSED → CANCELLED) */}
          {(isActive || isPaused) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowCancelModal(true)}
            >
              <Ban className="h-4 w-4 mr-1" /> Cancel
            </Button>
          )}
          {isActive && (
            <Button onClick={() => generateInvoice.mutate()} disabled={generateInvoice.isPending} size="sm">
              <Receipt className="h-4 w-4 mr-1" /> Generate Invoice
            </Button>
          )}
          {/* Standard workflow actions for admin */}
          {isAdmin && sub.status === "DRAFT" && (
            <Button size="sm" onClick={() => statusMutation.mutate({ status: "QUOTATION" })}>
              Send Quotation →
            </Button>
          )}
          {isAdmin && sub.status === "QUOTATION" && (
            <Button size="sm" onClick={() => statusMutation.mutate({ status: "CONFIRMED" })}>
              Confirm →
            </Button>
          )}
          {isAdmin && sub.status === "CONFIRMED" && (
            <Button size="sm" onClick={() => statusMutation.mutate({ status: "ACTIVE" })}>
              Activate →
            </Button>
          )}
          {isAdmin && isActive && (
            <Button variant="outline" size="sm" onClick={() => statusMutation.mutate({ status: "CLOSED" })}>
              Close
            </Button>
          )}
          {/* Renew button for CLOSED/CANCELLED subscriptions */}
          {(isClosed || isCancelled) && (
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => { if (confirm("Create a new subscription based on this one?")) renewMutation.mutate(); }}
              disabled={renewMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> {renewMutation.isPending ? "Renewing..." : "Renew Subscription"}
            </Button>
          )}
          {!isAdmin && sub.status === "DRAFT" && (
            <Button size="sm" onClick={() => statusMutation.mutate({ status: "QUOTATION" })}>
              Send Quotation →
            </Button>
          )}
          {(sub.status === "DRAFT" || sub.status === "QUOTATION") && (
            <Link to={`/subscriptions/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            </Link>
          )}
          {sub.status === "DRAFT" && isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { if (confirm("Delete this subscription?")) deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Status Flow */}
      {!isPaused && !isCancelled && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {allStatuses.map((s, i) => {
                const isCompleted = i < currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCurrent
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? "✓" : i + 1}
                      </div>
                      <span className={`text-xs mt-1 ${isCurrent ? "font-bold text-primary" : isCompleted ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {statusConfig[s]?.label || s}
                      </span>
                    </div>
                    {i < allStatuses.length - 1 && (
                      <div className={`h-0.5 w-full mx-1 ${i < currentIdx ? "bg-emerald-400" : "bg-muted"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paused Banner */}
      {isPaused && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pause className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-800">Subscription Paused</p>
                <p className="text-sm text-orange-600">
                  Paused on {sub.paused_at ? new Date(sub.paused_at).toLocaleDateString() : "—"}
                  {sub.resumed_at && ` · Last resumed: ${new Date(sub.resumed_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => statusMutation.mutate({ status: "ACTIVE" })}>
              <RotateCcw className="h-4 w-4 mr-1" /> Resume Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Banner */}
      {isCancelled && (
        <Card className="border-rose-300 bg-rose-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Ban className="h-6 w-6 text-rose-600" />
              <div>
                <p className="font-semibold text-rose-800">Subscription Cancelled</p>
                <p className="text-sm text-rose-600">
                  Cancelled on {sub.cancelled_at ? new Date(sub.cancelled_at).toLocaleDateString() : "—"}
                </p>
                {sub.cancellation_reason && (
                  <p className="text-sm text-rose-700 mt-1">
                    <span className="font-medium">Reason:</span> {sub.cancellation_reason}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Meter */}
      {usage && (isActive || isPaused) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" /> Billing Cycle Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cycle Progress</span>
                <span className="font-medium">{usage.progress_percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usage.progress_percent > 80 ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{ width: `${usage.progress_percent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{usage.cycle_start_date}</span>
                <span>{usage.next_billing_date}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <CalendarDays className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{usage.days_into_cycle}</p>
                <p className="text-xs text-muted-foreground">Days Elapsed</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Timer className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{usage.days_remaining}</p>
                <p className="text-xs text-muted-foreground">Days Remaining</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">#{usage.current_cycle}</p>
                <p className="text-xs text-muted-foreground">Current Cycle</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Receipt className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{usage.paid_invoices}/{usage.total_invoices}</p>
                <p className="text-xs text-muted-foreground">Invoices Paid</p>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm border-t pt-3">
              <span className="text-muted-foreground">
                Billing: Every {usage.billing_interval > 1 ? `${usage.billing_interval} ` : ""}
                {usage.billing_period.toLowerCase()}{usage.billing_interval > 1 ? "s" : ""} ({usage.cycle_days} days)
              </span>
              <span className="font-medium">
                Total Paid: ₹{usage.total_paid.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Subscription Number" value={sub.subscription_number} />
            <DetailRow label="Customer" value={sub.customer_name || sub.customer_email || "—"} />
            <DetailRow label="Plan" value={sub.plan_name || "—"} />
            <DetailRow label="Payment Terms" value={formatPaymentTerm(sub.payment_terms)} />
            <DetailRow label="Start Date" value={sub.start_date ? new Date(sub.start_date).toLocaleDateString() : "—"} />
            <DetailRow label="Expiration Date" value={sub.expiration_date ? new Date(sub.expiration_date).toLocaleDateString() : "—"} />
            {sub.paused_at && <DetailRow label="Last Paused" value={new Date(sub.paused_at).toLocaleDateString()} />}
            {sub.resumed_at && <DetailRow label="Last Resumed" value={new Date(sub.resumed_at).toLocaleDateString()} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Untaxed Amount</span>
                <span>₹{untaxedTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes</span>
                <span>₹{taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            {sub.notes && (
              <div className="border-t pt-3 mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{sub.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Lines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Lines</CardTitle>
        </CardHeader>
        <CardContent>
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No line items</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Product</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead className="text-right">Tax Amount</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.product_name || l.product_id}</TableCell>
                    <TableCell className="text-center">{l.quantity}</TableCell>
                    <TableCell className="text-right">₹{Number(l.unit_price).toFixed(2)}</TableCell>
                    <TableCell>
                      {l.tax_name ? (
                        <Badge variant="outline" className="text-xs">
                          {l.tax_name} ({l.tax_rate}{l.tax_computation === "PERCENTAGE" ? "%" : " fixed"})
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">₹{Number(l.tax_amount || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">₹{Number(l.amount || l.subtotal || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-dashed last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function formatPaymentTerm(term: string) {
  const map: Record<string, string> = {
    IMMEDIATE: "Immediate Payment",
    NET_15: "Net 15 Days",
    NET_30: "Net 30 Days",
    NET_60: "Net 60 Days",
  };
  return map[term] || term;
}
