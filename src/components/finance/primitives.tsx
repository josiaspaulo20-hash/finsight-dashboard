import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { CurrencyCode, InvoiceStatus } from "@/lib/finance/types";
import { useFinance } from "@/lib/finance/context";
import { formatConverted, formatMoney, formatPct } from "@/lib/finance/format";

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-2">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Money({
  amount,
  from,
  compact,
  className,
}: {
  amount: number;
  from: CurrencyCode;
  compact?: boolean;
  className?: string;
}) {
  const { state } = useFinance();
  return (
    <span className={cn("tabular", className)}>
      {formatConverted(amount, from, state.currency, { compact })}
    </span>
  );
}

export function DeltaBadge({ value, suffix = "" }: { value: number; suffix?: string }) {
  const positive = value > 0;
  const zero = Math.abs(value) < 0.05;
  const Icon = zero ? Minus : positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular",
        zero
          ? "bg-muted text-muted-foreground"
          : positive
            ? "bg-success/15 text-success"
            : "bg-destructive/15 text-destructive",
      )}
    >
      <Icon className="h-3 w-3" />
      {formatPct(value)}
      {suffix}
    </span>
  );
}

export function KPICard({
  label,
  value,
  delta,
  subtitle,
  spark,
  tone = "neutral",
  badge,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number;
  subtitle?: React.ReactNode;
  spark?: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
  badge?: React.ReactNode;
}) {
  const toneRing: Record<typeof tone, string> = {
    neutral: "border-border",
    success: "border-success/30",
    warning: "border-warning/40",
    danger: "border-destructive/40",
  };
  return (
    <Card className={cn("flex flex-col gap-3", toneRing[tone])}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {badge}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold tracking-tight tabular truncate">{value}</div>
        {delta !== undefined && <DeltaBadge value={delta} />}
      </div>
      {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      {spark && <div className="h-10 -mx-1 mt-1">{spark}</div>}
    </Card>
  );
}

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  paid: "bg-success/15 text-success border-success/20",
  pending: "bg-info/15 text-info border-info/20",
  late: "bg-warning/20 text-warning-foreground border-warning/30",
  overdue: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
  critical: "bg-destructive/15 text-destructive border-destructive/20",
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  late: "Late",
  overdue: "Overdue",
  critical: "Critical",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function OriginalAndConverted({
  amount,
  currency,
}: {
  amount: number;
  currency: CurrencyCode;
}) {
  const { state } = useFinance();
  const showBoth = currency !== state.currency;
  return (
    <span className="tabular">
      {formatMoney(amount, currency)}
      {showBoth && (
        <span className="text-muted-foreground text-xs ml-1">
          / {formatConverted(amount, currency, state.currency)}
        </span>
      )}
    </span>
  );
}
