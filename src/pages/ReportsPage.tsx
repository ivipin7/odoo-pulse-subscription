import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  BarChart3, TrendingUp, CreditCard, AlertTriangle, Users, Package,
  DollarSign, Receipt, ArrowUpRight, ArrowDownRight, Clock, RefreshCw,
  Wallet, FileText, PieChart,
} from "lucide-react";

type Tab = "overview" | "revenue" | "subscriptions" | "payments" | "overdue";

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState(30);
  const [revMonths, setRevMonths] = useState(12);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["reports-summary", period],
    queryFn: async () => (await api.get("/reports/summary", { params: { days: period } })).data.data,
  });

  const { data: revenue, isLoading: loadingRevenue } = useQuery({
    queryKey: ["reports-revenue", revMonths],
    queryFn: async () => (await api.get("/reports/revenue", { params: { months: revMonths } })).data.data,
    enabled: tab === "overview" || tab === "revenue",
  });

  const { data: overdue, isLoading: loadingOverdue } = useQuery({
    queryKey: ["reports-overdue"],
    queryFn: async () => (await api.get("/reports/overdue")).data.data,
    enabled: tab === "overview" || tab === "overdue",
  });

  const { data: subAnalytics, isLoading: loadingSubs } = useQuery({
    queryKey: ["reports-subscriptions", revMonths],
    queryFn: async () => (await api.get("/reports/subscriptions", { params: { months: revMonths } })).data.data,
    enabled: tab === "overview" || tab === "subscriptions",
  });

  const { data: payAnalytics, isLoading: loadingPay } = useQuery({
    queryKey: ["reports-payments", revMonths],
    queryFn: async () => (await api.get("/reports/payments", { params: { months: revMonths } })).data.data,
    enabled: tab === "overview" || tab === "payments",
  });

  if (loadingSummary) return <PageLoader />;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: PieChart },
    { key: "revenue", label: "Revenue", icon: DollarSign },
    { key: "subscriptions", label: "Subscriptions", icon: RefreshCw },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "overdue", label: "Overdue", icon: AlertTriangle },
  ];

  const s = summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reporting &amp; Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Active subscriptions, revenue, payments &amp; overdue invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Period:</span>
          <Select
            value={String(period)}
            onChange={(e) => setPeriod(parseInt(e.target.value))}
            options={[
              { value: "7", label: "7 Days" },
              { value: "30", label: "30 Days" },
              { value: "90", label: "90 Days" },
              { value: "365", label: "1 Year" },
            ]}
          />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b pb-0.5 overflow-x-auto">
        {tabs.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "default" : "ghost"}
            size="sm"
            className="gap-1.5"
            onClick={() => setTab(t.key)}
          >
            <t.icon className="h-4 w-4" /> {t.label}
            {t.key === "overdue" && overdue?.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 text-[10px]">{overdue.length}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* ━━━━ OVERVIEW TAB ━━━━ */}
      {tab === "overview" && s && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={RefreshCw} iconBg="bg-blue-50" iconColor="text-blue-600"
              title="Active Subscriptions" value={s.subscriptions?.active || 0}
              sub={`${s.subscriptions?.new_period || 0} new this period`} trend="up" />
            <KpiCard icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600"
              title="Total Revenue" value={`₹${Number(s.payments?.total_collected || 0).toLocaleString("en-IN")}`}
              sub={`₹${Number(s.payments?.period_collected || 0).toLocaleString("en-IN")} this period`} trend="up" />
            <KpiCard icon={CreditCard} iconBg="bg-purple-50" iconColor="text-purple-600"
              title="Payments Collected" value={s.payments?.completed || 0}
              sub={`${s.payments?.pending || 0} pending, ${s.payments?.failed || 0} failed`} />
            <KpiCard icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600"
              title="Overdue Invoices" value={s.invoices?.overdue || 0}
              sub={`₹${Number(s.invoices?.overdue_amount || 0).toLocaleString("en-IN")} outstanding`} trend="down" />
          </div>

          {/* Row: Revenue Chart + Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Revenue Trend</CardTitle>
                <Select value={String(revMonths)} onChange={(e) => setRevMonths(parseInt(e.target.value))}
                  options={[{ value: "6", label: "6M" }, { value: "12", label: "12M" }, { value: "24", label: "24M" }]} />
              </CardHeader>
              <CardContent>
                {loadingRevenue ? <p className="text-sm text-muted-foreground">Loading...</p> : <BarChartSection data={revenue || []} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Invoices by Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {s.invoicesByStatus?.map((item: any) => (
                  <StatusRow key={item.status} label={item.status} count={parseInt(item.count)}
                    amount={Number(item.amount)} color={invoiceColor(item.status)} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Row: Top Customers + Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Top Customers</CardTitle></CardHeader>
              <CardContent>
                {!s.topCustomers?.length ? <p className="text-sm text-muted-foreground">No data yet</p> : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Customer</TableHead><TableHead>Invoices</TableHead><TableHead>Active Subs</TableHead><TableHead>Revenue</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {s.topCustomers.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell><div><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></div></TableCell>
                          <TableCell>{c.invoice_count}</TableCell>
                          <TableCell>{c.subscription_count}</TableCell>
                          <TableCell className="font-semibold">₹{Number(c.total_revenue).toLocaleString("en-IN")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Top Products</CardTitle></CardHeader>
              <CardContent>
                {!s.topProducts?.length ? <p className="text-sm text-muted-foreground">No data yet</p> : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Product</TableHead><TableHead>Subscriptions</TableHead><TableHead>Revenue</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {s.topProducts.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.subscription_count}</TableCell>
                          <TableCell className="font-semibold">₹{Number(p.total_revenue).toLocaleString("en-IN")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row: By Plan + By Payment Method */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Subscriptions by Plan</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {s.subscriptionsByPlan?.length ? s.subscriptionsByPlan.map((p: any) => {
                  const total = s.subscriptionsByPlan.reduce((s: number, x: any) => s + parseInt(x.count), 0);
                  const pct = total > 0 ? (parseInt(p.count) / total * 100) : 0;
                  return (
                    <div key={p.plan_name} className="flex items-center gap-3">
                      <span className="text-sm w-28 truncate">{p.plan_name}</span>
                      <div className="flex-1 bg-muted rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs text-muted-foreground w-12 text-right">{p.count}</span>
                    </div>
                  );
                }) : <p className="text-sm text-muted-foreground">No active plans</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Payments by Method</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {s.paymentsByMethod?.length ? s.paymentsByMethod.map((m: any) => {
                  const total = s.paymentsByMethod.reduce((s: number, x: any) => s + Number(x.total), 0);
                  const pct = total > 0 ? (Number(m.total) / total * 100) : 0;
                  return (
                    <div key={m.payment_method} className="flex items-center gap-3">
                      <span className="text-sm w-32 truncate">{methodLabel(m.payment_method)}</span>
                      <div className="flex-1 bg-muted rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs text-muted-foreground w-24 text-right">₹{Number(m.total).toLocaleString("en-IN")}</span>
                    </div>
                  );
                }) : <p className="text-sm text-muted-foreground">No payment data</p>}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ━━━━ REVENUE TAB ━━━━ */}
      {tab === "revenue" && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Monthly Revenue</h2>
            <Select value={String(revMonths)} onChange={(e) => setRevMonths(parseInt(e.target.value))}
              options={[{ value: "3", label: "3M" }, { value: "6", label: "6M" }, { value: "12", label: "12M" }, { value: "24", label: "24M" }]} />
          </div>

          <Card>
            <CardContent className="p-4">
              {loadingRevenue ? <p className="text-sm text-muted-foreground">Loading...</p> : <BarChartSection data={revenue || []} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Revenue Details</CardTitle></CardHeader>
            <CardContent>
              {!revenue?.length ? <p className="text-sm text-muted-foreground">No revenue data</p> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Month</TableHead><TableHead>Invoices Paid</TableHead><TableHead>Revenue</TableHead>
                    <TableHead>Tax Collected</TableHead><TableHead>Discounts Given</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {revenue.map((r: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(r.month).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</TableCell>
                        <TableCell>{r.invoice_count}</TableCell>
                        <TableCell className="font-semibold text-emerald-700">₹{Number(r.revenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>₹{Number(r.tax_collected || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>₹{Number(r.discounts_given || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ━━━━ SUBSCRIPTIONS TAB ━━━━ */}
      {tab === "subscriptions" && (
        <>
          {s && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatMini label="Active" value={s.subscriptions?.active || 0} icon={RefreshCw} color="text-emerald-600" />
              <StatMini label="Confirmed" value={s.subscriptions?.confirmed || 0} icon={FileText} color="text-blue-600" />
              <StatMini label="Draft" value={s.subscriptions?.draft || 0} icon={Clock} color="text-amber-600" />
              <StatMini label="MRR" value={`₹${Number(subAnalytics?.mrr || 0).toLocaleString("en-IN")}`} icon={TrendingUp} color="text-purple-600" />
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Subscription Growth</CardTitle>
              <Select value={String(revMonths)} onChange={(e) => setRevMonths(parseInt(e.target.value))}
                options={[{ value: "3", label: "3M" }, { value: "6", label: "6M" }, { value: "12", label: "12M" }]} />
            </CardHeader>
            <CardContent>
              {loadingSubs ? <p className="text-sm text-muted-foreground">Loading...</p> : !subAnalytics?.growth?.length
                ? <p className="text-sm text-muted-foreground">No data</p>
                : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Month</TableHead><TableHead>New Subscriptions</TableHead><TableHead>Active at Period</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {subAnalytics.growth.map((g: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{new Date(g.month).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</TableCell>
                          <TableCell><Badge variant="outline">{g.new_subscriptions}</Badge></TableCell>
                          <TableCell className="font-medium">{g.active_at_period}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </CardContent>
          </Card>

          {subAnalytics?.churn?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base text-red-700">Churn (Closed Subscriptions)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Closed</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {subAnalytics.churn.map((c: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(c.month).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</TableCell>
                        <TableCell><Badge variant="destructive">{c.closed}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ━━━━ PAYMENTS TAB ━━━━ */}
      {tab === "payments" && (
        <>
          {s && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatMini label="Completed" value={s.payments?.completed || 0} icon={CreditCard} color="text-emerald-600" />
              <StatMini label="Pending" value={s.payments?.pending || 0} icon={Clock} color="text-amber-600" />
              <StatMini label="Failed" value={s.payments?.failed || 0} icon={AlertTriangle} color="text-red-600" />
              <StatMini label="Collected" value={`₹${Number(s.payments?.total_collected || 0).toLocaleString("en-IN")}`} icon={Wallet} color="text-blue-600" />
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Payment Trend</CardTitle>
              <Select value={String(revMonths)} onChange={(e) => setRevMonths(parseInt(e.target.value))}
                options={[{ value: "3", label: "3M" }, { value: "6", label: "6M" }, { value: "12", label: "12M" }]} />
            </CardHeader>
            <CardContent>
              {loadingPay ? <p className="text-sm text-muted-foreground">Loading...</p> : !payAnalytics?.trend?.length
                ? <p className="text-sm text-muted-foreground">No data</p>
                : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Month</TableHead><TableHead>Total</TableHead><TableHead>Completed</TableHead>
                      <TableHead>Failed</TableHead><TableHead>Amount</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {payAnalytics.trend.map((t: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{new Date(t.month).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</TableCell>
                          <TableCell>{t.count}</TableCell>
                          <TableCell><Badge className="bg-emerald-50 text-emerald-700 border border-emerald-300">{t.completed}</Badge></TableCell>
                          <TableCell>{Number(t.failed) > 0 ? <Badge variant="destructive">{t.failed}</Badge> : <span className="text-muted-foreground">0</span>}</TableCell>
                          <TableCell className="font-semibold">₹{Number(t.total).toLocaleString("en-IN")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </CardContent>
          </Card>

          {/* Payment Methods Breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-base">Payment Methods</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {!payAnalytics?.byMethod?.length ? <p className="text-sm text-muted-foreground">No data</p>
                : payAnalytics.byMethod.map((m: any) => {
                  const total = payAnalytics.byMethod.reduce((s: number, x: any) => s + Number(x.total), 0);
                  const pct = total > 0 ? (Number(m.total) / total * 100) : 0;
                  return (
                    <div key={m.payment_method} className="flex items-center gap-3">
                      <span className="w-32 text-sm font-medium">{methodLabel(m.payment_method)}</span>
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div className="bg-purple-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm w-28 text-right">{m.count} txns</span>
                      <span className="text-sm font-semibold w-28 text-right">₹{Number(m.total).toLocaleString("en-IN")}</span>
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          {/* Failed payments */}
          {payAnalytics?.recentFailed?.length > 0 && (
            <Card className="border-red-200">
              <CardHeader><CardTitle className="text-base text-red-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Recent Failed Payments</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Payment #</TableHead><TableHead>Invoice</TableHead><TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead><TableHead>Date</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {payAnalytics.recentFailed.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.payment_number}</TableCell>
                        <TableCell>{p.invoice_number}</TableCell>
                        <TableCell>{p.customer_name}</TableCell>
                        <TableCell>₹{Number(p.amount).toFixed(2)}</TableCell>
                        <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ━━━━ OVERDUE TAB ━━━━ */}
      {tab === "overdue" && (
        <>
          {s && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatMini label="Overdue Invoices" value={s.invoices?.overdue || 0} icon={AlertTriangle} color="text-red-600" />
              <StatMini label="Overdue Amount" value={`₹${Number(s.invoices?.overdue_amount || 0).toLocaleString("en-IN")}`} icon={DollarSign} color="text-red-600" />
              <StatMini label="Outstanding" value={`₹${Number(s.invoices?.outstanding || 0).toLocaleString("en-IN")}`} icon={Receipt} color="text-amber-600" />
            </div>
          )}

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Overdue Invoices
                {overdue?.length > 0 && <Badge variant="destructive">{overdue.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOverdue ? <p className="text-sm text-muted-foreground">Loading...</p> : !overdue?.length ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                  <p className="text-muted-foreground">No overdue invoices — great job!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Total</TableHead>
                    <TableHead>Due Date</TableHead><TableHead>Days Overdue</TableHead><TableHead>Severity</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {overdue.map((inv: any) => {
                      const daysOver = Math.ceil((Date.now() - new Date(inv.due_date).getTime()) / 86400000);
                      const severity = daysOver > 60 ? "Critical" : daysOver > 30 ? "High" : daysOver > 7 ? "Medium" : "Low";
                      const sevColor = daysOver > 60 ? "bg-red-100 text-red-800 border-red-300"
                        : daysOver > 30 ? "bg-orange-100 text-orange-800 border-orange-300"
                        : daysOver > 7 ? "bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-yellow-50 text-yellow-800 border-yellow-300";
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                          <TableCell>{inv.customer_name}</TableCell>
                          <TableCell className="font-semibold">₹{Number(inv.total).toFixed(2)}</TableCell>
                          <TableCell>{new Date(inv.due_date).toLocaleDateString()}</TableCell>
                          <TableCell><Badge variant="destructive">{daysOver} days</Badge></TableCell>
                          <TableCell><Badge className={`border ${sevColor}`}>{severity}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ── Helpers ──

function KpiCard({ icon: Icon, iconBg, iconColor, title, value, sub, trend }: {
  icon: React.ElementType; iconBg: string; iconColor: string;
  title: string; value: string | number; sub: string; trend?: "up" | "down";
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}><Icon className={`h-5 w-5 ${iconColor}`} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xl font-bold">{value}</p>
            {trend === "up" && <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
            {trend === "down" && <ArrowDownRight className="h-4 w-4 text-red-500" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatMini({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color}`} />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, count, amount, color }: { label: string; count: number; amount: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-right">
        <span className="font-semibold text-sm">{count}</span>
        <span className="text-xs text-muted-foreground ml-2">₹{Number(amount).toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}

function BarChartSection({ data }: { data: any[] }) {
  if (!data.length) return <p className="text-sm text-muted-foreground">No revenue data yet</p>;
  const sorted = [...data].sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  const maxRev = Math.max(...sorted.map((r) => Number(r.revenue)));
  return (
    <div className="space-y-2">
      {sorted.map((r, i) => {
        const pct = maxRev > 0 ? (Number(r.revenue) / maxRev) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-24 text-right shrink-0">
              {new Date(r.month).toLocaleDateString("en-IN", { year: "2-digit", month: "short" })}
            </span>
            <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
              <div className="bg-primary h-full rounded-full flex items-center justify-end px-2 transition-all duration-500"
                style={{ width: `${Math.max(pct, 3)}%` }}>
                {pct > 18 && <span className="text-[10px] text-primary-foreground font-medium">₹{Number(r.revenue).toLocaleString("en-IN")}</span>}
              </div>
            </div>
            {pct <= 18 && <span className="text-xs text-muted-foreground">₹{Number(r.revenue).toLocaleString("en-IN")}</span>}
          </div>
        );
      })}
    </div>
  );
}

function invoiceColor(status: string) {
  switch (status) {
    case "PAID": return "bg-emerald-500";
    case "CONFIRMED": return "bg-blue-500";
    case "DRAFT": return "bg-gray-400";
    case "FAILED": return "bg-red-500";
    default: return "bg-gray-400";
  }
}

function methodLabel(m: string) {
  switch (m) {
    case "CREDIT_CARD": return "Credit Card";
    case "BANK_TRANSFER": return "Bank Transfer";
    case "CASH": return "Cash";
    case "OTHER": return "Other";
    default: return m;
  }
}
