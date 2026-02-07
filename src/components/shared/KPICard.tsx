import { type LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export const KPICard = ({ title, value, icon: Icon, trend, trendUp }: KPICardProps) => (
  <div className="kpi-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="kpi-label">{title}</p>
        <p className="kpi-value mt-2">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
            {trend}
          </p>
        )}
      </div>
      <div className="rounded-lg bg-accent/10 p-3">
        <Icon className="h-5 w-5 text-accent" />
      </div>
    </div>
  </div>
);
