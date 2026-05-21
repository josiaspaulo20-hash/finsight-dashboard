import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { useFinance } from "@/lib/finance/context";
import { MONTHLY } from "@/lib/finance/seed";
import { getExpenseCategories, CATEGORY_LABEL } from "@/lib/finance/budgets";
import { formatConverted, formatPct } from "@/lib/finance/format";
import { Card, KPICard } from "@/components/finance/primitives";
import { MoneyTooltip } from "@/components/finance/ChartTooltip";
import { cn } from "@/lib/utils";
import type { ExpenseBreakdown } from "@/lib/finance/types";

export const Route = createFileRoute("/expenses")({ component: ExpensesPage });

const COLORS = ["var(--color-primary)", "var(--color-success)", "var(--color-warning)", "var(--color-destructive)", "var(--color-info)", "#a78bfa", "#94a3b8"];

function ExpensesPage() {
  const { state, dispatch } = useFinance();
  const home = state.currency;
  const m = MONTHLY[state.activeMonth];
  const cats = useMemo(() => getExpenseCategories(state.activeMonth), [state.activeMonth]);
  const [filter, setFilter] = useState<keyof ExpenseBreakdown | null>(null);
  const [hidden, setHidden] = useState<Set<keyof ExpenseBreakdown>>(new Set());

  const totalBudget = cats.reduce((s, c) => s + c.budget, 0);
  const variance = m.expenses - totalBudget;
  const variancePct = (variance / Math.max(1, totalBudget)) * 100;
  const largest = [...cats].sort((a, b) => b.actual - a.actual)[0];

  const donut = cats.map((c) => ({ name: c.name, value: c.actual, id: c.id }));

  const trend = MONTHLY.map((mm) => {
    const row: Record<string, number | string> = { label: mm.label };
    (Object.keys(CATEGORY_LABEL) as Array<keyof ExpenseBreakdown>).forEach((k) => {
      row[CATEGORY_LABEL[k]] = mm.expenseBreakdown[k];
    });
    return row;
  });

  const displayedCats = filter ? cats.filter((c) => c.id === filter) : cats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Total Expenses" value={formatConverted(m.expenses, "USD", home, { compact: true })} subtitle={`${m.label} ${m.year}`} />
        <KPICard label="vs Budget" value={formatConverted(variance, "USD", home, { compact: true })} delta={variancePct} tone={variance > 0 ? "danger" : "success"} subtitle={`Budget ${formatConverted(totalBudget, "USD", home, { compact: true })}`} />
        <KPICard label="Largest Category" value={largest.name} subtitle={formatConverted(largest.actual, "USD", home, { compact: true })} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold mb-2">Expense Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-2">Click a segment to filter the table.</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donut} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2}
                  stroke="var(--color-background)" strokeWidth={2}
                  onClick={(d: { id?: keyof ExpenseBreakdown }) => d?.id && setFilter(filter === d.id ? null : d.id)}
                >
                  {donut.map((d, i) => (
                    <Cell key={d.id} fill={COLORS[i % COLORS.length]} opacity={filter && filter !== d.id ? 0.35 : 1} style={{ cursor: "pointer" }} />
                  ))}
                </Pie>
                <Tooltip content={<MoneyTooltip fromCurrency="USD" />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
            {donut.map((d, i) => (
              <button key={d.id} onClick={() => setFilter(filter === d.id ? null : d.id)} className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border", filter === d.id ? "border-primary bg-primary/10" : "border-border")}>
                <span className="h-2 w-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                {d.name}
              </button>
            ))}
            {filter && <button onClick={() => setFilter(null)} className="text-xs text-muted-foreground underline">Clear filter</button>}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-2">Monthly Trend</h3>
          <p className="text-xs text-muted-foreground mb-2">Click legend to show/hide a series.</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => formatConverted(v, "USD", home, { compact: true })} />
                <Tooltip content={<MoneyTooltip fromCurrency="USD" />} />
                {(Object.keys(CATEGORY_LABEL) as Array<keyof ExpenseBreakdown>).map((k, i) => (
                  !hidden.has(k) && (
                    <Line key={k} type="monotone" dataKey={CATEGORY_LABEL[k]} stroke={COLORS[i % COLORS.length]} strokeWidth={1.75} dot={false} />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
            {(Object.keys(CATEGORY_LABEL) as Array<keyof ExpenseBreakdown>).map((k, i) => (
              <button key={k} onClick={() => {
                setHidden((h) => { const n = new Set(h); if (n.has(k)) n.delete(k); else n.add(k); return n; });
              }} className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-opacity", hidden.has(k) ? "opacity-40 border-border" : "border-border")}>
                <span className="h-2 w-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                {CATEGORY_LABEL[k]}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold mb-3">Budget vs Actual</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-2 font-medium">Category</th>
                <th className="py-2 pr-2 font-medium text-right">Budget</th>
                <th className="py-2 pr-2 font-medium text-right">Actual</th>
                <th className="py-2 pr-2 font-medium text-right">Variance</th>
                <th className="py-2 pr-2 font-medium text-right">Variance %</th>
                <th className="py-2 pr-2 font-medium">Status</th>
                <th className="py-2 pr-2 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {displayedCats.map((c, idx) => {
                const over = c.variancePct > 10;
                const slightlyOver = c.variancePct > 0 && c.variancePct <= 10;
                const tone = over ? "text-destructive" : slightlyOver ? "text-warning-foreground" : "text-success";
                return (
                  <tr key={c.id} className={cn("border-b border-border/60", idx % 2 === 1 ? "bg-muted/20" : "")}>
                    <td className="py-2 pr-2 font-medium">{c.name}</td>
                    <td className="py-2 pr-2 text-right tabular">{formatConverted(c.budget, "USD", home, { compact: true })}</td>
                    <td className="py-2 pr-2 text-right tabular">{formatConverted(c.actual, "USD", home, { compact: true })}</td>
                    <td className={cn("py-2 pr-2 text-right tabular", tone)}>{formatConverted(c.variance, "USD", home, { compact: true })}</td>
                    <td className={cn("py-2 pr-2 text-right tabular", tone)}>{formatPct(c.variancePct)}</td>
                    <td className="py-2 pr-2">
                      {over && <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle className="h-3 w-3" />Over</span>}
                      {slightlyOver && <span className="text-warning-foreground">Near</span>}
                      {!over && !slightlyOver && <span className="text-success">On track</span>}
                    </td>
                    <td className="py-2 pr-2">
                      <div className="h-6 w-20">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={c.trend.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                            <Line type="monotone" dataKey="v" stroke={over ? "var(--color-destructive)" : "var(--color-primary)"} strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-3">Month</h3>
        <div className="flex flex-wrap gap-1.5">
          {MONTHLY.map((mm, i) => (
            <button key={mm.label} onClick={() => dispatch({ type: "SET_ACTIVE_MONTH", month: i })}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", state.activeMonth === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}>
              {mm.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
