import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  TrendingUp,
  X,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useFinance } from "@/lib/finance/context";
import { CLIENTS, MONTHLY, RECENT_TRANSACTIONS, clientById } from "@/lib/finance/seed";
import { convert } from "@/lib/finance/fx";
import { formatConverted, formatMoney, formatPct } from "@/lib/finance/format";
import { Card, DeltaBadge, KPICard, Section } from "@/components/finance/primitives";
import { MoneyTooltip } from "@/components/finance/ChartTooltip";
import { cn } from "@/lib/utils";
import { useT, useMonthShort, useDistanceToNow } from "@/lib/finance/i18n";

export const Route = createFileRoute("/")({
  component: OverviewPage,
});

const CHART_COLORS = [
  "var(--color-primary)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-destructive)",
  "var(--color-info)",
];

function OverviewPage() {
  const { state, alerts, dispatch } = useFinance();
  const home = state.currency;
  const t = useT();
  const tMonth = useMonthShort();
  const dist = useDistanceToNow();

  const last = MONTHLY[MONTHLY.length - 1];
  const prev = MONTHLY[MONTHLY.length - 2];
  const totalRevenue = MONTHLY.reduce((s, m) => s + m.revenue, 0);
  const prevTotalRevenue = MONTHLY.slice(0, -1).reduce((s, m) => s + m.revenue, 0);
  const revenueDelta = ((last.revenue - prev.revenue) / prev.revenue) * 100;

  const closingBalance = last.closingBalance;
  const monthsRunway = closingBalance / Math.max(1, last.expenses);

  // outstanding from context invoices
  const outstandingByCurrency = state.invoices
    .filter((i) => i.status !== "paid")
    .reduce<Record<string, number>>((acc, i) => {
      acc[i.currency] = (acc[i.currency] ?? 0) + i.amount;
      return acc;
    }, {});
  const outstandingUsd = Object.entries(outstandingByCurrency).reduce(
    (s, [c, a]) => s + convert(a, c as never, "USD"),
    0,
  );
  const overdueCount = state.invoices.filter((i) => i.daysOverdue > 0 && i.status !== "paid").length;
  const openCount = state.invoices.filter((i) => i.status !== "paid").length;
  const criticalCount = state.invoices.filter((i) => i.status === "critical").length;

  const opex = last.expenses;
  const expenseRatio = (opex / last.revenue) * 100;
  const expenseDelta = ((last.expenses - prev.expenses) / prev.expenses) * 100;

  const sparkRevenue = MONTHLY.slice(-7).map((m) => ({ label: tMonth(m.label), value: m.revenue }));

  const revenueMix = Object.entries(last.revenueBySource).map(([k, v]) => ({ name: t(`src.${k}`), value: v }));
  const totalMix = revenueMix.reduce((s, r) => s + r.value, 0);

  const topClients = useMemo(() => {
    const totals = CLIENTS.map((c) => {
      // Approx: monthlyRevenue × 12 in USD
      const annualNative = c.monthlyRevenue * 12 + (c.id === "c6" ? 28000 : 0);
      const usd = convert(annualNative, c.currency, "USD");
      return { client: c, usd };
    })
      .sort((a, b) => b.usd - a.usd)
      .slice(0, 5);
    const top5Total = totals.reduce((s, t) => s + t.usd, 0);
    return totals.map((t) => ({ ...t, share: (t.usd / top5Total) * 100 }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label={t("kpi.totalRevenue")}
          value={formatConverted(totalRevenue, "USD", home, { compact: true })}
          delta={revenueDelta}
          subtitle={t("kpi.acrossAllCcy", { ccy: home })}
          spark={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkRevenue} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sp1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  strokeWidth={1.5}
                  fill="url(#sp1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          }
        />
        <KPICard
          label={t("kpi.netCashPosition")}
          value={formatConverted(closingBalance, "USD", home, { compact: true })}
          tone={monthsRunway >= 3 ? "success" : monthsRunway >= 1 ? "warning" : "danger"}
          subtitle={
            <span>
              <span className="font-medium tabular text-foreground">{monthsRunway.toFixed(1)}</span>{" "}
              {t("kpi.monthsCovered")}
            </span>
          }
        />
        <KPICard
          label={t("kpi.outstandingReceivables")}
          value={formatConverted(outstandingUsd, "USD", home, { compact: true })}
          subtitle={`${openCount} ${t("kpi.invoices")} · ${overdueCount} ${t("kpi.overdueShort")}`}
          tone={criticalCount > 0 ? "danger" : overdueCount > 0 ? "warning" : "success"}
          badge={
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                criticalCount > 0
                  ? "bg-destructive/15 text-destructive"
                  : overdueCount > 0
                    ? "bg-warning/20 text-warning-foreground"
                    : "bg-success/15 text-success",
              )}
            >
              {criticalCount > 0 ? t("kpi.critical") : overdueCount > 0 ? t("kpi.atRisk") : t("kpi.healthy")}
            </span>
          }
        />
        <KPICard
          label={t("kpi.operatingExpenses")}
          value={formatConverted(opex, "USD", home, { compact: true })}
          delta={expenseDelta}
          subtitle={
            <span>
              <span className="font-medium text-foreground tabular">{expenseRatio.toFixed(1)}%</span>{" "}
              {t("kpi.ofCurrentRevenue")}
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">{t("card.revenueVsExpenses")}</h2>
              <p className="text-xs text-muted-foreground">{t("card.revenueVsExpensesSub")}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Legend swatch="var(--color-primary)" label={t("card.revenue")} />
              <Legend swatch="var(--color-destructive)" label={t("card.expenses")} />
              <Legend swatch="var(--color-success)" label={t("card.marginPct")} dashed />
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={MONTHLY.map((m) => ({
                  label: tMonth(m.label),
                  Revenue: m.revenue,
                  Expenses: m.expenses,
                  Margin: m.grossMargin,
                }))}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis yAxisId="l" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => formatConverted(v, "USD", home, { compact: true })} />
                <YAxis yAxisId="r" orientation="right" domain={[0, 60]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<MoneyTooltip fromCurrency="USD" pctKeys={["Margin"]} />} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
                <Bar yAxisId="l" dataKey="Revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar yAxisId="l" dataKey="Expenses" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Line yAxisId="r" type="monotone" dataKey="Margin" stroke="var(--color-success)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2 flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-semibold">{t("card.revenueMix")}</h2>
            <p className="text-xs text-muted-foreground">{t("card.revenueMixSub")}</p>
          </div>
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueMix}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke="var(--color-background)"
                  strokeWidth={2}
                >
                  {revenueMix.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<MoneyTooltip fromCurrency="USD" />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("card.total")}</span>
              <span className="text-lg font-semibold tabular">
                {formatConverted(totalMix, "USD", home, { compact: true })}
              </span>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs">
            {revenueMix.map((r, i) => (
              <li key={r.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="flex-1 text-muted-foreground">{r.name}</span>
                <span className="tabular">{formatConverted(r.value, "USD", home, { compact: true })}</span>
                <span className="tabular w-12 text-right text-muted-foreground">
                  {((r.value / totalMix) * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <h3 className="text-sm font-semibold mb-3">{t("card.topClients")}</h3>
          <ul className="space-y-3">
            {topClients.map((t) => (
              <li key={t.client.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 truncate">
                    <span>{t.client.flag}</span>
                    <span className="font-medium truncate">{t.client.name}</span>
                  </span>
                  <span className="tabular text-muted-foreground">
                    {formatConverted(t.usd, "USD", home, { compact: true })}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.max(4, t.share)}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground tabular text-right">
                  {t.share.toFixed(1)}{t.share ? "" : ""}% {`· ${""}`}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-3">{t("card.recentActivity")}</h3>
          <ul className="divide-y divide-border -mx-2">
            {RECENT_TRANSACTIONS.slice(0, 8).map((t) => {
              const c = t.clientId ? clientById(t.clientId) : null;
              return (
                <li key={t.id} className="flex items-center gap-3 px-2 py-2.5">
                  <span
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-[11px]",
                      t.type === "inflow"
                        ? "bg-success/15 text-success"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {t.type === "inflow" ? "+" : "−"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{t.description}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {c ? `${c.flag} ${c.name} · ` : ""}
                      {dist(t.date)}
                    </div>
                  </div>
                  <div className="text-xs tabular text-right">
                    <div className={t.type === "inflow" ? "text-success" : "text-destructive"}>
                      {t.type === "inflow" ? "+" : "−"}
                      {formatMoney(t.amount, t.currency)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">{t("card.smartAlerts")}</h3>
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <ul className="space-y-2">
            {alerts.length === 0 && (
              <li className="text-xs text-muted-foreground py-6 text-center">{t("common.noAlerts")}</li>
            )}
            {alerts.map((a) => {
              const Icon =
                a.severity === "danger"
                  ? AlertTriangle
                  : a.severity === "warning"
                    ? AlertTriangle
                    : a.severity === "success"
                      ? CheckCircle2
                      : Info;
              const toneBg =
                a.severity === "danger"
                  ? "bg-destructive/10 border-destructive/20"
                  : a.severity === "warning"
                    ? "bg-warning/15 border-warning/25"
                    : a.severity === "success"
                      ? "bg-success/10 border-success/20"
                      : "bg-info/10 border-info/20";
              const iconColor =
                a.severity === "danger"
                  ? "text-destructive"
                  : a.severity === "warning"
                    ? "text-warning-foreground"
                    : a.severity === "success"
                      ? "text-success"
                      : "text-info";
              return (
                <li
                  key={a.id}
                  className={cn(
                    "relative rounded-md border p-3 text-xs animate-in fade-in slide-in-from-right-2 duration-200",
                    toneBg,
                  )}
                >
                  <button
                    onClick={() => dispatch({ type: "DISMISS_ALERT", id: a.id })}
                    aria-label="Dismiss alert"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="flex items-start gap-2 pr-5">
                    <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", iconColor)} />
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">{a.title}</div>
                      <div className="text-muted-foreground">{a.message}</div>
                      {a.actionLabel && (
                        <a href={a.actionLink} className="inline-block mt-1 font-medium text-primary hover:underline">
                          {a.actionLabel} →
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Legend({ swatch, label, dashed }: { swatch: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn("inline-block h-2 w-3 rounded-sm", dashed && "border-t-2 h-0 w-3 rounded-none")}
        style={dashed ? { borderColor: swatch } : { background: swatch }}
      />
      <span>{label}</span>
    </span>
  );
}
