import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

const statusMap: Record<string, StatusVariant> = {
  ACTIVE: "success",
  PAID: "success",
  DELIVERED: "success",
  SUCCESS: "success",
  ACCEPTED: "success",
  AT_RISK: "warning",
  PENDING: "warning",
  SENT: "warning",
  DRAFT: "neutral",
  PROCESSING: "info",
  CONFIRMED: "info",
  REFUNDED: "info",
  FAILED: "danger",
  REJECTED: "danger",
  EXPIRED: "neutral",
  DISABLED: "neutral",
  CLOSED: "neutral",
  INACTIVE: "neutral",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const variant = statusMap[status] || "neutral";
  return (
    <span className={cn("status-badge", `status-badge-${variant}`, className)}>
      {status.replace(/_/g, " ")}
    </span>
  );
};
