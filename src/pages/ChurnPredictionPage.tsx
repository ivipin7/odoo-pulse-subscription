import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import type { ChurnData, AtRiskSubscription } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  Shield,
  ChevronRight,
  Brain,
  Activity,
  DollarSign,
  Target,
} from "lucide-react";
import { useState } from "react";

const riskLevelConfig: Record<
  string,
  { color: string; bg: string; icon: typeof AlertTriangle; label: string }
> = {
  CRITICAL: { color: "text-red-700", bg: "bg-red-50 border-red-200", icon: ShieldAlert, label: "Critical" },
  HIGH: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: AlertTriangle, label: "High" },
  MEDIUM: { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: Shield, label: "Medium" },
  LOW: { color: "text-green-700", bg: "bg-green-50 border-green-200", icon: ShieldCheck, label: "Low" },
};

function RiskBadge({ level, score }: { level: string; score: number }) {
  const config = riskLevelConfig[level] || riskLevelConfig.LOW;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label} ({score})
    </span>
  );
}

function RiskScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-red-500" : score >= 45 ? "bg-orange-500" : score >= 20 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono font-bold w-8 text-right">{score}</span>
    </div>
  );
}

function ExpandedRow({ sub }: { sub: AtRiskSubscription }) {
  return (
    <TableRow>
      <TableCell colSpan={7} className="bg-gray-50/70 p-0">
        <div className="p-4 space-y-4">
          {/* Risk factors */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Activity className="h-4 w-4" /> Risk Factors
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sub.risk_factors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 bg-white rounded-lg border p-3">
                  <div className="shrink-0 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${
                      f.score >= 12 ? "bg-red-500" : f.score >= 6 ? "bg-orange-500" : "bg-yellow-500"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{f.factor} <span className="text-muted-foreground">(+{f.score})</span></p>
                    <p className="text-xs text-muted-foreground">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended actions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Target className="h-4 w-4" /> Recommended Actions
            </h4>
            <ul className="space-y-1.5">
              {sub.recommended_actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ChurnPredictionPage() {
  const [filterLevel, setFilterLevel] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<ChurnData>({
    queryKey: ["churn-prediction"],
    queryFn: async () => {
      const res = await api.get("/churn/at-risk");
      return res.data.data;
    },
  });

  if (isLoading) return <PageLoader />;
  if (error) return <p className="text-destructive">Failed to load churn predictions</p>;
  if (!data) return null;

  const { atRisk, summary } = data;
  const filtered = filterLevel ? atRisk.filter((s) => s.risk_level === filterLevel) : atRisk;

  const summaryCards = [
    {
      label: "Critical",
      value: summary.critical,
      color: "text-red-600 bg-red-50 border-red-200",
      filterVal: "CRITICAL",
    },
    {
      label: "High",
      value: summary.high,
      color: "text-orange-600 bg-orange-50 border-orange-200",
      filterVal: "HIGH",
    },
    {
      label: "Medium",
      value: summary.medium,
      color: "text-yellow-600 bg-yellow-50 border-yellow-200",
      filterVal: "MEDIUM",
    },
    {
      label: "Low",
      value: summary.low,
      color: "text-green-600 bg-green-50 border-green-200",
      filterVal: "LOW",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold tracking-tight">Churn Prediction</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {summary.total} active subscription(s) — identifying customers likely to cancel
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {summaryCards.map((c) => (
          <button
            key={c.filterVal}
            onClick={() => setFilterLevel(filterLevel === c.filterVal ? "" : c.filterVal)}
            className={`rounded-xl border p-4 text-left transition-all hover:shadow-md ${
              filterLevel === c.filterVal ? "ring-2 ring-offset-1 ring-purple-500" : ""
            } ${c.color}`}
          >
            <p className="text-xs font-medium opacity-80">{c.label} Risk</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </button>
        ))}

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-purple-600">Avg Risk Score</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{summary.avg_score}<span className="text-sm font-normal">/100</span></p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-red-600">At-Risk Revenue</p>
            <p className="text-lg font-bold text-red-700 mt-1">₹{summary.at_risk_revenue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution Visual */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4" /> Risk Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex rounded-full overflow-hidden h-5 bg-gray-100">
            {summary.total > 0 && (
              <>
                {summary.critical > 0 && (
                  <div className="bg-red-500 transition-all" style={{ width: `${(summary.critical / summary.total) * 100}%` }} title={`Critical: ${summary.critical}`} />
                )}
                {summary.high > 0 && (
                  <div className="bg-orange-500 transition-all" style={{ width: `${(summary.high / summary.total) * 100}%` }} title={`High: ${summary.high}`} />
                )}
                {summary.medium > 0 && (
                  <div className="bg-yellow-400 transition-all" style={{ width: `${(summary.medium / summary.total) * 100}%` }} title={`Medium: ${summary.medium}`} />
                )}
                {summary.low > 0 && (
                  <div className="bg-green-500 transition-all" style={{ width: `${(summary.low / summary.total) * 100}%` }} title={`Low: ${summary.low}`} />
                )}
              </>
            )}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Critical</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" />High</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />Medium</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />Low</span>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {filterLevel ? `${filterLevel} Risk Subscriptions` : "All Subscriptions"} ({filtered.length})
            </CardTitle>
            {filterLevel && (
              <Button variant="outline" size="sm" onClick={() => setFilterLevel("")}>
                Clear Filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No at-risk subscriptions found</p>
              <p className="text-xs text-muted-foreground mt-1">All subscriptions are healthy</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sub) => (
                  <>
                    <TableRow
                      key={sub.subscription_id}
                      className="cursor-pointer hover:bg-gray-50/80"
                      onClick={() => setExpandedId(expandedId === sub.subscription_id ? null : sub.subscription_id)}
                    >
                      <TableCell className="font-medium">
                        <Link
                          to={`/subscriptions/${sub.subscription_id}`}
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {sub.subscription_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{sub.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{sub.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{sub.plan_name || "—"}</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-300">{sub.status}</Badge>
                      </TableCell>
                      <TableCell className="w-40">
                        <RiskScoreBar score={sub.risk_score} />
                      </TableCell>
                      <TableCell>
                        <RiskBadge level={sub.risk_level} score={sub.risk_score} />
                      </TableCell>
                      <TableCell>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === sub.subscription_id ? "rotate-90" : ""}`} />
                      </TableCell>
                    </TableRow>
                    {expandedId === sub.subscription_id && <ExpandedRow sub={sub} />}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
