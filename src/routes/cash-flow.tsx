import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Briefcase, Cpu, FileText, HandCoins, Home, Megaphone, Plane, Receipt, ShieldCheck, Users } from "lucide-react";
import { useFinance } from "@/lib/finance/context";
import { MONTHLY, generateDailyBalance } from "@/lib/finance/seed";
import { formatConverted, formatMoney } from "@/lib/finance/format";
import { Card, KPICard } from "@/components/finance/primitives";
import { MoneyTooltip } from "@/components/finance/ChartTooltip";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/cash-flow")({ component: CashFlowPage });

function CashFlowPage() {
  const { state, dispatch } = useFinance();
  const home = state.currency;
  const m = MONTHLY[state.activeMonth];
  const [drill, setDrill] = useState<number | null>(null);

  const waterfall = MONTHLY.map((mm) => ({
    label: mm.label,
    Inflow: mm.cashInflow,
    Outflow: -mm.cashOutflow,
    Net: mm.cashInflow - mm.cashOutflow,
    Balance: mm.closingBalance,
  }));

  const daily = useMemo(() => generateDailyBalance(state.activeMonth), [state.activeMonth]);
  const minBalance = Math.min(...daily.map((d) => d.balance));
  const dangerThreshold = Math.max(15000, m.expenses * 0.15);

  // Projected next month
  const projClosing = m.closingBalance + (m.cashInflow * 0.95 - m.cashOutflow * 1.02);
  const shortfall = projClosing < m.expenses * 0.15;

  const inflowItems = [
    { label: "Client Payments", value: m.cashInflow * 0.96, icon: HandCoins, color: "text-success" },
    { label: "Interest", value: m.cashInflow * 0.02, icon: ShieldCheck, color: "text-info" },
    { label: "Other", value: m.cashInflow * 0.02, icon: FileText, color: "text-muted-foreground" },
  ];
  const outflowItems = [
    { label: "Payroll", value: m.expenseBreakdown.payroll, icon: Users, color: "text-destructive" },
    { label: "Rent", value: Math.round(m.expenseBreakdown.operations * 0.5), icon: Home, color: "text-destructive" },
    { label: "Software", value: m.expenseBreakdown.software, icon: Cpu, color: "text-destructive" },
    { label: "Marketing", value: m.expenseBreakdown.marketing, icon: Megaphone, color: "text-destructive" },
    { label: "Tax", value: Math.round(m.expenses * 0.06), icon: Receipt, color: "text-destructive" },
    { label: "Other", value: m.expenseBreakdown.other + m.expenseBreakdown.travel + m.expenseBreakdown.professional, icon: Briefcase, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Opening Balance" value={formatConverted(m.openingBalance, "USD", home)} subtitle={`Start of ${m.label}`} />
        <KPICard
          label="Net Movement"
          value={formatConverted(m.cashInflow - m.cashOutflow, "USD", home)}
          tone={m.cashInflow - m.cashOutflow >= 0 ? "success" : "danger"}
          subtitle={`Inflows ${formatConverted(m.cashInflow, "USD", home, { compact: true })} · Outflows ${formatConverted(m.cashOutflow, "USD", home, { compact: true })}`}
        />
        <KPICard label="Closing Balance" value={formatConverted(m.closingBalance, "USD", home)} subtitle={`End of ${m.label}`} />
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold">Monthly Waterfall</h2>
            <p className="text-xs text-muted-foreground">Inflows, outflows, and running balance. Click a month to drill in.</p>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {MONTHLY.map((mm, i) => (
              <button
                key={mm.label}
                onClick={() => dispatch({ type: "SET_ACTIVE_MONTH", month: i })}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                  state.activeMonth === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >{mm.label}</button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={waterfall} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} onClick={(e) => {
              if (e && typeof e.activeTooltipIndex === "number") setDrill(e.activeTooltipIndex);
            }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <YAxis yAxisId="l" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => formatConverted(v, "USD", home, { compact: true })} />
              <YAxis yAxisId="r" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => formatConverted(v, "USD", home, { compact: true })} />
              <Tooltip content={<MoneyTooltip fromCurrency="USD" />} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
              <Bar yAxisId="l" dataKey="Inflow" fill="var(--color-success)" stackId="a" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar yAxisId="l" dataKey="Outflow" fill="var(--color-destructive)" stackId="a" radius={[0, 0, 4, 4]} maxBarSize={28} />
              <Line yAxisId="r" type="monotone" dataKey="Balance" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <h3 className="text-sm font-semibold mb-1">Daily Balance — {m.label}</h3>
          <p className="text-xs text-muted-foreground mb-3">Min: {formatConverted(minBalance, "USD", home)} · Danger threshold: {formatConverted(dangerThreshold, "USD", home)}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => formatConverted(v, "USD", home, { compact: true })} />
                <Tooltip content={<MoneyTooltip fromCurrency="USD" />} />
                <ReferenceLine y={dangerThreshold} stroke="var(--color-destructive)" strokeDasharray="4 4" label={{ value: "Min safe", fontSize: 10, fill: "var(--color-destructive)", position: "insideTopRight" }} />
                <Area type="monotone" dataKey="balance" stroke="var(--color-primary)" strokeWidth={2} fill="url(#bal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3">Inflows vs Outflows</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Inflows</div>
              <ul className="space-y-1.5">
                {inflowItems.map((i) => (
                  <li key={i.label} className="flex items-center gap-2 text-xs">
                    <i.icon className={cn("h-3.5 w-3.5", i.color)} />
                    <span className="flex-1 truncate">{i.label}</span>
                    <span className="tabular text-success">{formatConverted(i.value, "USD", home, { compact: true })}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Outflows</div>
              <ul className="space-y-1.5">
                {outflowItems.map((i) => (
                  <li key={i.label} className="flex items-center gap-2 text-xs">
                    <i.icon className={cn("h-3.5 w-3.5", i.color)} />
                    <span className="flex-1 truncate">{i.label}</span>
                    <span className="tabular text-destructive">{formatConverted(i.value, "USD", home, { compact: true })}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {shortfall && (
        <Card className="border-warning/40 bg-warning/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-foreground" />
            <div className="text-xs">
              <div className="font-semibold text-sm text-foreground mb-0.5">Projected cash shortfall next month</div>
              <p className="text-muted-foreground">
                Projected closing balance is {formatConverted(projClosing, "USD", home)} — below 15% of monthly expenses.
                Consider accelerating receivables collection or deferring non-critical expenses.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Sheet open={drill !== null} onOpenChange={(o) => !o && setDrill(null)}>
        <SheetContent className="sm:max-w-md">
          {drill !== null && (
            <>
              <SheetHeader>
                <SheetTitle>{MONTHLY[drill].label} {MONTHLY[drill].year}</SheetTitle>
                <SheetDescription>Transaction drill-down for the selected month.</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                <DrillRow label="Inflows" value={formatConverted(MONTHLY[drill].cashInflow, "USD", home)} tone="success" />
                <DrillRow label="Outflows" value={formatConverted(MONTHLY[drill].cashOutflow, "USD", home)} tone="danger" />
                <DrillRow label="Net" value={formatConverted(MONTHLY[drill].cashInflow - MONTHLY[drill].cashOutflow, "USD", home)} />
                <DrillRow label="Closing Balance" value={formatConverted(MONTHLY[drill].closingBalance, "USD", home)} />
                <div className="pt-3 mt-3 border-t border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Outflow breakdown</div>
                  <ul className="space-y-1.5 text-xs">
                    {(Object.entries(MONTHLY[drill].expenseBreakdown) as Array<[string, number]>).map(([k, v]) => (
                      <li key={k} className="flex justify-between"><span className="capitalize">{k}</span><span className="tabular">{formatConverted(v, "USD", home)}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DrillRow({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular font-medium", tone === "success" && "text-success", tone === "danger" && "text-destructive")}>{value}</span>
    </div>
  );
}
