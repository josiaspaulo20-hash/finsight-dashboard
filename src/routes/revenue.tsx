import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, ChevronDown, Search } from "lucide-react";
import { useFinance } from "@/lib/finance/context";
import { CLIENTS, MONTHLY } from "@/lib/finance/seed";
import { ALL_CURRENCIES, convert } from "@/lib/finance/fx";
import { formatConverted, formatMoney, formatNumber } from "@/lib/finance/format";
import { useT, useMonthShort } from "@/lib/finance/i18n";
import { Card, DeltaBadge, Section } from "@/components/finance/primitives";
import { MoneyTooltip, NativeTooltip } from "@/components/finance/ChartTooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/finance/types";

export const Route = createFileRoute("/revenue")({ component: RevenuePage });

const CHART_COLORS = [
  "var(--color-primary)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-destructive)",
  "var(--color-info)",
];

type ChartKind = "area" | "line" | "bar";

function RevenuePage() {
  const { state } = useFinance();
  const t = useT();
  const mShort = useMonthShort();
  const home = state.currency;
  const [kind, setKind] = useState<ChartKind>("area");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [originalCcy, setOriginalCcy] = useState(false);

  const chartData = MONTHLY.map((m) => ({ label: mShort(m.label), Revenue: m.revenue }));
  const maxMonth = chartData.reduce((a, b) => (a.Revenue > b.Revenue ? a : b));
  const minMonth = chartData.reduce((a, b) => (a.Revenue < b.Revenue ? a : b));

  const last = MONTHLY[MONTHLY.length - 1];
  const revenueMix = Object.entries(last.revenueBySource).map(([k, v]) => ({ name: k, label: t(`src.${k}`), value: v }));
  const totalMix = revenueMix.reduce((s, r) => s + r.value, 0);

  const mixTable = useMemo(() => {
    const prev = MONTHLY[MONTHLY.length - 2];
    return revenueMix.map((r) => {
      const prevVal = prev.revenueBySource[r.name] ?? 0;
      const mom = prevVal ? ((r.value - prevVal) / prevVal) * 100 : 0;
      return { ...r, mom, pct: (r.value / totalMix) * 100 };
    });
  }, [revenueMix, totalMix]);

  const stackedData = useMemo(
    () =>
      MONTHLY.map((m) => {
        const row: Record<string, number | string> = { label: mShort(m.label) };
        ALL_CURRENCIES.forEach((c) => {
          const native = m.revenueByCurrency[c];
          row[c] = originalCcy ? native : convert(native, c, home);
        });
        return row;
      }),
    [home, originalCcy, mShort],
  );

  // Client table
  const clientRows = useMemo(() => {
    const totals = CLIENTS.map((c) => {
      const annual = c.monthlyRevenue * 12 + (c.id === "c6" ? 28000 : 0);
      const usd = convert(annual, c.currency, "USD");
      const monthly = MONTHLY.map((m, i) => {
        const base = m.revenue * (clientShare(c.id) ?? 0);
        return Math.round(convert(base, "USD", c.currency));
      });
      const lastVal = monthly[monthly.length - 1];
      const prevVal = monthly[monthly.length - 2] || 0;
      const change = prevVal ? ((lastVal - prevVal) / prevVal) * 100 : 0;
      return { client: c, annualNative: annual, usd, monthly, change };
    }).sort((a, b) => b.usd - a.usd);
    const grand = totals.reduce((s, t) => s + t.usd, 0);
    return totals.map((t, i) => ({ ...t, rank: i + 1, pct: (t.usd / grand) * 100 }));
  }, []);

  const filtered = clientRows.filter(
    (r) =>
      !search ||
      r.client.name.toLowerCase().includes(search.toLowerCase()) ||
      r.client.industry.toLowerCase().includes(search.toLowerCase()),
  );
  const pageSize = 10;
  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-semibold">{t("card.revenueOverTime")}</h2>
            <p className="text-xs text-muted-foreground">{t("card.revenueOverTimeSub")}</p>
          </div>
          <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
            {(["area", "line", "bar"] as ChartKind[]).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={cn(
                  "px-2.5 py-1 rounded transition-colors capitalize",
                  kind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {kind === "area" ? (
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => formatConverted(v, "USD", home, { compact: true })} />
                <Tooltip content={<MoneyTooltip fromCurrency="USD" />} />
                <Area type="monotone" dataKey="Revenue" stroke="var(--color-primary)" strokeWidth={2} fill="url(#revgrad)" />
                <ReferenceDot x={maxMonth.label} y={maxMonth.Revenue} r={5} fill="var(--color-success)" stroke="var(--color-background)" />
                <ReferenceDot x={minMonth.label} y={minMonth.Revenue} r={5} fill="var(--color-warning)" stroke="var(--color-background)" />
                <Brush dataKey="label" height={20} stroke="var(--color-primary)" travellerWidth={8} />
              </AreaChart>
            ) : kind === "line" ? (
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => formatConverted(v, "USD", home, { compact: true })} />
                <Tooltip content={<MoneyTooltip fromCurrency="USD" />} />
                <Line type="monotone" dataKey="Revenue" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-primary)" }} />
                <Brush dataKey="label" height={20} stroke="var(--color-primary)" travellerWidth={8} />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => formatConverted(v, "USD", home, { compact: true })} />
                <Tooltip content={<MoneyTooltip fromCurrency="USD" />} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
                <Bar dataKey="Revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Brush dataKey="label" height={20} stroke="var(--color-primary)" travellerWidth={8} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold mb-3">{t("card.revenueBySource")}</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueMix} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="var(--color-background)" strokeWidth={2}>
                  {revenueMix.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<MoneyTooltip fromCurrency="USD" />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <table className="w-full text-xs mt-4">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 font-medium">{t("common.source")}</th>
                <th className="py-2 font-medium text-right">{t("common.amount")}</th>
                <th className="py-2 font-medium text-right">{t("common.percent")}</th>
                <th className="py-2 font-medium text-right">{t("common.mom")}</th>
              </tr>
            </thead>
            <tbody>
              {mixTable.map((r, i) => (
                <tr key={r.name} className={i % 2 === 1 ? "bg-muted/40" : ""}>
                  <td className="py-2 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {t(`src.${r.name}`)}
                  </td>
                  <td className="py-2 text-right tabular">{formatConverted(r.value, "USD", home, { compact: true })}</td>
                  <td className="py-2 text-right tabular">{r.pct.toFixed(1)}%</td>
                  <td className="py-2 text-right"><DeltaBadge value={r.mom} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">{t("card.revenueByCurrency")}</h3>
            <div className="inline-flex rounded-md border border-border p-0.5 text-[11px]">
              <button onClick={() => setOriginalCcy(false)} className={cn("px-2 py-1 rounded", !originalCcy ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{t("card.converted")}</button>
              <button onClick={() => setOriginalCcy(true)} className={cn("px-2 py-1 rounded", originalCcy ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{t("card.original")}</button>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => formatNumber(v / 1000) + "k"} />
                <Tooltip content={originalCcy ? <NativeTooltip /> : <MoneyTooltip fromCurrency={home} />} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
                {ALL_CURRENCIES.map((c, i) => (
                  <Bar key={c} dataKey={c} stackId="ccy" fill={CHART_COLORS[i % CHART_COLORS.length]} maxBarSize={28} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-muted-foreground">
            {ALL_CURRENCIES.map((c, i) => (
              <span key={c} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {c}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-semibold">{t("card.clientRevenue")}</h3>
            <p className="text-xs text-muted-foreground">{t("card.clientRevenueSub")}</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder={t("card.searchClients")}
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-2 font-medium">#</th>
                <th className="py-2 pr-2 font-medium">{t("common.client")}</th>
                <th className="py-2 pr-2 font-medium">{t("common.industry")}</th>
                <th className="py-2 pr-2 font-medium">{t("common.ccy")}</th>
                <th className="py-2 pr-2 font-medium text-right">{`${t("common.amount")} (${t("card.original")})`}</th>
                <th className="py-2 pr-2 font-medium text-right">{`${t("common.amount")} (${home})`}</th>
                <th className="py-2 pr-2 font-medium text-right">{t("common.percent")}</th>
                <th className="py-2 pr-2 font-medium text-right">{t("common.mom")}</th>
                <th className="py-2 pr-2 font-medium">{t("common.trend")}</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">{t("common.noClientsMatch")}</td></tr>
              )}
              {pageRows.map((r, i) => (
                <>
                  <tr
                    key={r.client.id}
                    className={cn("border-b border-border/60 cursor-pointer hover:bg-muted/40 transition-colors", i % 2 === 1 ? "bg-muted/20" : "")}
                    onClick={() => setExpanded(expanded === r.client.id ? null : r.client.id)}
                  >
                    <td className="py-2 pr-2 tabular text-muted-foreground">{r.rank}</td>
                    <td className="py-2 pr-2 flex items-center gap-1.5"><span>{r.client.flag}</span><span className="font-medium">{r.client.name}</span></td>
                    <td className="py-2 pr-2 text-muted-foreground">{r.client.industry}</td>
                    <td className="py-2 pr-2 tabular">{r.client.currency}</td>
                    <td className="py-2 pr-2 text-right tabular">{formatMoney(r.annualNative, r.client.currency)}</td>
                    <td className="py-2 pr-2 text-right tabular font-medium">{formatConverted(r.usd, "USD", home)}</td>
                    <td className="py-2 pr-2 text-right tabular">{r.pct.toFixed(1)}%</td>
                    <td className="py-2 pr-2 text-right"><DeltaBadge value={r.change} /></td>
                    <td className="py-2 pr-2">
                      <div className="h-6 w-20">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={r.monthly.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                            <Line type="monotone" dataKey="v" stroke="var(--color-primary)" strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                  </tr>
                  {expanded === r.client.id && (
                    <tr className="bg-muted/30">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="text-xs text-muted-foreground mb-2">{t("card.revenueOverTime")} ({r.client.currency})</div>
                        <div className="grid grid-cols-12 gap-1.5">
                          {r.monthly.map((v, i) => (
                            <div key={i} className="text-center">
                              <div className="text-[10px] text-muted-foreground">{mShort(MONTHLY[i].label)}</div>
                              <div className="text-xs font-medium tabular">{formatMoney(v, r.client.currency, { compact: true })}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3 text-xs">
          <span className="text-muted-foreground">
            {filtered.length === 0 ? t("common.nResults_zero") : `${t("common.showing")} ${page * pageSize + 1}–${Math.min(filtered.length, (page + 1) * pageSize)} ${t("common.of")} ${filtered.length}`}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>{t("common.previous")}</Button>
            <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>{t("common.next")}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function clientShare(id: string): number | undefined {
  const m: Record<string, number> = {
    c1: 0.20, c2: 0.14, c3: 0.13, c4: 0.10, c5: 0.13,
    c6: 0.05, c7: 0.08, c8: 0.04, c9: 0.06, c10: 0.07,
  };
  return m[id];
}
