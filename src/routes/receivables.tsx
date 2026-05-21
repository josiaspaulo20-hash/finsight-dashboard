import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Check, Mail, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/lib/finance/context";
import { clientById, MONTHLY } from "@/lib/finance/seed";
import { convert } from "@/lib/finance/fx";
import { formatConverted, formatMoney } from "@/lib/finance/format";
import { Card, KPICard, OriginalAndConverted, StatusBadge } from "@/components/finance/primitives";
import { MoneyTooltip } from "@/components/finance/ChartTooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/lib/finance/types";

export const Route = createFileRoute("/receivables")({ component: ReceivablesPage });

const AGING_BUCKETS = [
  { key: "current", label: "Current (0–30d)", min: 0, max: 30, color: "var(--color-success)", border: "border-success/40" },
  { key: "late", label: "Late (31–60d)", min: 31, max: 60, color: "var(--color-warning)", border: "border-warning/40" },
  { key: "overdue", label: "Overdue (61–90d)", min: 61, max: 90, color: "#fb923c", border: "border-orange-500/40" },
  { key: "critical", label: "Critical (90d+)", min: 91, max: 999, color: "var(--color-destructive)", border: "border-destructive/40" },
] as const;

function bucketOf(days: number) {
  return AGING_BUCKETS.find((b) => days >= b.min && days <= b.max) ?? AGING_BUCKETS[0];
}

function ReceivablesPage() {
  const { state, dispatch } = useFinance();
  const home = state.currency;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [bucketFilter, setBucketFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"amount" | "due" | "overdue">("overdue");
  const [detail, setDetail] = useState<Invoice | null>(null);

  const open = state.invoices.filter((i) => i.status !== "paid");

  const totals = AGING_BUCKETS.map((b) => {
    const inv = open.filter((i) => i.daysOverdue >= b.min && i.daysOverdue <= b.max);
    const usd = inv.reduce((s, i) => s + convert(i.amount, i.currency, "USD"), 0);
    return { ...b, count: inv.length, usd };
  });

  const donutData = totals.map((t) => ({ name: t.label, value: t.usd, color: t.color }));

  const collectionTrend = MONTHLY.slice(-6).map((m, idx) => {
    const raised = Math.round(m.revenue * 1.02);
    const collected = Math.round(m.revenue * (0.88 + idx * 0.02));
    return { label: m.label, Raised: raised, Collected: collected };
  });
  const avgDaysToPayment = 28;

  const filtered = open
    .filter((i) => (statusFilter === "all" ? true : i.status === statusFilter))
    .filter((i) => {
      if (bucketFilter === "all") return true;
      const b = bucketOf(i.daysOverdue);
      return b.key === bucketFilter;
    })
    .filter((i) => {
      const c = clientById(i.clientId);
      const q = search.toLowerCase();
      return !q || i.invoiceNumber.toLowerCase().includes(q) || (c && c.name.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sortBy === "amount") return convert(b.amount, b.currency, "USD") - convert(a.amount, a.currency, "USD");
      if (sortBy === "due") return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
      return b.daysOverdue - a.daysOverdue;
    });

  const totalOutstanding = open.reduce((s, i) => s + convert(i.amount, i.currency, "USD"), 0);
  const totalOverdue = open.filter((i) => i.daysOverdue > 0).reduce((s, i) => s + convert(i.amount, i.currency, "USD"), 0);
  const collectionRate = (1 - totalOverdue / Math.max(1, totalOutstanding)) * 100;

  const markPaid = (inv: Invoice) => {
    const prev = inv;
    dispatch({ type: "MARK_PAID", id: inv.id });
    toast.success(`${inv.invoiceNumber} marked as paid`, {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => dispatch({ type: "UNMARK_PAID", id: inv.id, prev }),
      },
    });
  };

  const followUp = (inv: Invoice) => {
    const c = clientById(inv.clientId);
    const body = `Hi ${c?.name?.split(" ")[0] ?? "there"},\n\nThis is a friendly reminder that invoice ${inv.invoiceNumber} for ${formatMoney(inv.amount, inv.currency)} was due on ${format(parseISO(inv.dueDate), "dd MMM yyyy")} and is now ${inv.daysOverdue} days overdue.\n\nCould you please confirm the status of payment at your earliest convenience? If payment is already on its way, please disregard this note.\n\nWe appreciate your prompt attention.\n\nKind regards,\nAcme Consulting Ltd`;
    navigator.clipboard?.writeText(body).then(
      () => toast.success("Email copied to clipboard", { duration: 3000 }),
      () => toast.error("Could not copy to clipboard"),
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {totals.map((b) => (
          <KPICard
            key={b.key}
            label={b.label}
            value={formatConverted(b.usd, "USD", home, { compact: true })}
            subtitle={`${b.count} invoice${b.count === 1 ? "" : "s"}`}
            tone={b.key === "current" ? "success" : b.key === "late" ? "warning" : "danger"}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold mb-2">Aging Breakdown</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="var(--color-background)" strokeWidth={2}>
                  {donutData.map((d, i) => (<Cell key={i} fill={d.color} />))}
                </Pie>
                <Tooltip content={<MoneyTooltip fromCurrency="USD" />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {totals.map((t) => (
              <li key={t.key} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm" style={{ background: t.color }} />
                <span className="flex-1 truncate text-muted-foreground">{t.label}</span>
                <span className="tabular">{t.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="flex items-end justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold">Collection Trend</h3>
              <p className="text-xs text-muted-foreground">Raised vs collected · last 6 months</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Avg days to payment</div>
              <div className="text-lg font-semibold tabular">{avgDaysToPayment}</div>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={collectionTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => formatConverted(v, "USD", home, { compact: true })} />
                <Tooltip content={<MoneyTooltip fromCurrency="USD" />} />
                <Line type="monotone" dataKey="Raised" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Collected" stroke="var(--color-success)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-2 mb-3">
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-sm font-semibold">Invoice Management</h3>
            <p className="text-xs text-muted-foreground">Mark paid, follow up, or open invoice details.</p>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search invoice or client" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-8 text-xs" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as never)}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={bucketFilter} onValueChange={setBucketFilter}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Bucket" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All buckets</SelectItem>
              {AGING_BUCKETS.map((b) => (<SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as never)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="overdue">Sort: Most overdue</SelectItem>
              <SelectItem value="amount">Sort: Amount</SelectItem>
              <SelectItem value="due">Sort: Due date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card">
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-2 font-medium">Invoice</th>
                <th className="py-2 pr-2 font-medium">Client</th>
                <th className="py-2 pr-2 font-medium">Issued</th>
                <th className="py-2 pr-2 font-medium">Due</th>
                <th className="py-2 pr-2 font-medium text-right">Amount</th>
                <th className="py-2 pr-2 font-medium text-right">Overdue</th>
                <th className="py-2 pr-2 font-medium">Status</th>
                <th className="py-2 pr-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No invoices matching your filters.</td></tr>
              )}
              {filtered.map((i, idx) => {
                const c = clientById(i.clientId);
                return (
                  <tr key={i.id} className={cn("border-b border-border/60 hover:bg-muted/40 transition-colors", idx % 2 === 1 ? "bg-muted/20" : "")}>
                    <td className="py-2 pr-2 font-medium tabular">{i.invoiceNumber}</td>
                    <td className="py-2 pr-2"><span className="inline-flex items-center gap-1.5"><span>{c?.flag}</span>{c?.name}</span></td>
                    <td className="py-2 pr-2 tabular text-muted-foreground">{format(parseISO(i.issueDate), "dd MMM")}</td>
                    <td className="py-2 pr-2 tabular text-muted-foreground">{format(parseISO(i.dueDate), "dd MMM")}</td>
                    <td className="py-2 pr-2 text-right"><OriginalAndConverted amount={i.amount} currency={i.currency} /></td>
                    <td className={cn("py-2 pr-2 text-right tabular font-medium", i.daysOverdue > 0 ? "text-destructive" : "text-muted-foreground")}>{i.daysOverdue > 0 ? `${i.daysOverdue}d` : "—"}</td>
                    <td className="py-2 pr-2"><StatusBadge status={i.status} /></td>
                    <td className="py-2 pr-2">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => markPaid(i)} aria-label="Mark paid"><Check className="h-3.5 w-3.5 text-success" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => followUp(i)} aria-label="Follow up"><Mail className="h-3.5 w-3.5 text-info" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDetail(i)} aria-label="View details"><Eye className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border text-xs">
                <td colSpan={4} className="py-3 text-muted-foreground">Summary</td>
                <td className="py-3 text-right tabular font-medium">{formatConverted(totalOutstanding, "USD", home)}</td>
                <td className="py-3 text-right tabular text-destructive font-medium">{formatConverted(totalOverdue, "USD", home)}</td>
                <td className="py-3 text-muted-foreground tabular" colSpan={2}>Collection rate: <span className="text-foreground font-medium">{collectionRate.toFixed(1)}%</span></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="sm:max-w-md">
          {detail && (() => {
            const c = clientById(detail.clientId);
            return (
              <>
                <SheetHeader>
                  <SheetTitle>{detail.invoiceNumber}</SheetTitle>
                  <SheetDescription>{c?.name} — {c?.country}</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-3 text-xs">
                  <Row label="Status"><StatusBadge status={detail.status} /></Row>
                  <Row label="Amount"><OriginalAndConverted amount={detail.amount} currency={detail.currency} /></Row>
                  <Row label="Issue date">{format(parseISO(detail.issueDate), "dd MMM yyyy")}</Row>
                  <Row label="Due date">{format(parseISO(detail.dueDate), "dd MMM yyyy")}</Row>
                  <Row label="Days overdue">{detail.daysOverdue}</Row>
                  <Row label="Contact">{c?.contactEmail}</Row>
                  <Row label="Industry">{c?.industry}</Row>
                  <div className="pt-2 flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => { markPaid(detail); setDetail(null); }}>Mark paid</Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => followUp(detail)}>Copy reminder</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-border/60">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right tabular">{children}</span>
    </div>
  );
}
