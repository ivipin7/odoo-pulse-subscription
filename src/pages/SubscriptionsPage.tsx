import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import type { Subscription } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileText, ChevronRight, Calendar, Users, IndianRupee } from "lucide-react";
import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

const statusConfig: Record<string, { color: string; label: string }> = {
  DRAFT: { color: "bg-gray-100 text-gray-700 border border-gray-300", label: "Draft" },
  QUOTATION: { color: "bg-amber-50 text-amber-700 border border-amber-300", label: "Quotation" },
  CONFIRMED: { color: "bg-blue-50 text-blue-700 border border-blue-300", label: "Confirmed" },
  ACTIVE: { color: "bg-emerald-50 text-emerald-700 border border-emerald-300", label: "Active" },
  PAUSED: { color: "bg-orange-50 text-orange-700 border border-orange-300", label: "Paused" },
  CANCELLED: { color: "bg-rose-50 text-rose-700 border border-rose-300", label: "Cancelled" },
  CLOSED: { color: "bg-red-50 text-red-700 border border-red-300", label: "Closed" },
};

const nextStatusMap: Record<string, { status: string; label: string }> = {
  DRAFT: { status: "QUOTATION", label: "Send Quotation" },
  QUOTATION: { status: "CONFIRMED", label: "Confirm" },
  CONFIRMED: { status: "ACTIVE", label: "Activate" },
  ACTIVE: { status: "CLOSED", label: "Close" },
};

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "INTERNAL";

  const doSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions", page, statusFilter, search],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get("/subscriptions", { params });
      return res.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.patch(`/subscriptions/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Status updated");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error?.message || "Failed to update status"),
  });

  if (isLoading) return <PageLoader />;

  const subs: (Subscription & { untaxed_amount?: number; tax_amount?: number; total_amount?: number })[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  // Summary stats
  const activeCount = subs.filter((s) => s.status === "ACTIVE").length;
  const draftCount = subs.filter((s) => s.status === "DRAFT").length;
  const totalRevenue = subs.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isAdmin ? "Subscriptions" : "My Subscriptions"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? "Manage customer subscriptions and their lifecycle" : "View and track your active subscriptions"}
          </p>
        </div>
        {isAdmin && (
          <Link to="/subscriptions/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" /> New Subscription
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Drafts</p>
              <p className="text-xl font-bold">{draftCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <IndianRupee className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Page Total</p>
              <p className="text-xl font-bold">₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by number, customer name or email..."
                className="pl-9"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
              />
            </div>
            <div className="w-44">
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                options={[
                  { value: "", label: "All Statuses" },
                  { value: "DRAFT", label: "Draft" },
                  { value: "QUOTATION", label: "Quotation" },
                  { value: "CONFIRMED", label: "Confirmed" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "PAUSED", label: "Paused" },
                  { value: "CANCELLED", label: "Cancelled" },
                  { value: "CLOSED", label: "Closed" },
                ]}
              />
            </div>
            <Button variant="outline" onClick={doSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {subs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">No subscriptions found</p>
              <Link to="/subscriptions/new">
                <Button className="mt-4" variant="outline">Create your first subscription</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  {isAdmin && <TableHead>Customer</TableHead>}
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                      <TableHead>{isAdmin ? "Actions" : ""}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map((s) => {
                  const next = isAdmin ? nextStatusMap[s.status] : undefined;
                  return (
                    <TableRow key={s.id} className="group">
                      <TableCell className="font-medium">
                        <Link to={`/subscriptions/${s.id}`} className="text-primary hover:underline flex items-center gap-1">
                          {s.subscription_number}
                          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{s.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{s.customer_email}</p>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{s.plan_name || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig[s.status]?.color}>
                          {statusConfig[s.status]?.label || s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.start_date ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(s.start_date).toLocaleDateString()}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.expiration_date ? new Date(s.expiration_date).toLocaleDateString() : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{Number(s.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link to={`/subscriptions/${s.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                          {next && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={statusMutation.isPending}
                              onClick={() => statusMutation.mutate({ id: s.id, status: next.status })}
                            >
                              {next.label} →
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
