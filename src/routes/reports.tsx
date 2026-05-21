import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { FileText, BarChart3, Wallet, ClipboardList, TrendingUp, Users, Printer, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/lib/finance/context";
import { COMPANY, MONTHLY, CLIENTS } from "@/lib/finance/seed";
import { convert } from "@/lib/finance/fx";
import { formatConverted, formatMoney } from "@/lib/finance/format";
import { Card } from "@/components/finance/primitives";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

const REPORTS = [
  { id: "monthly", title: "Monthly Financial Summary", icon: BarChart3, desc: "Revenue, expenses, cash and receivables for a month." },
  { id: "quarterly", title: "Quarterly Business Review", icon: TrendingUp, desc: "Three-month performance against targets." },
  { id: "aging", title: "Receivables Aging Report", icon: ClipboardList, desc: "Outstanding invoices grouped by aging bucket." },
  { id: "cash", title: "Cash Flow Statement", icon: Wallet, desc: "Inflows, outflows and closing balance." },
  { id: "pnl", title: "Annual P&L Overview", icon: FileText, desc: "Full-year revenue, expenses, and net income." },
  { id: "clients", title: "Client Revenue Report", icon: Users, desc: "Revenue concentration by client." },
];

const SECTIONS = ["KPI Summary", "Revenue Breakdown", "Expense Analysis", "Cash Position", "Receivables Status", "Charts"];

function ReportsPage() {
  const { state } = useFinance();
  const home = state.currency;
  const [reportId, setReportId] = useState("monthly");
  const [periodIdx, setPeriodIdx] = useState(MONTHLY.length - 1);
  const [sections, setSections] = useState<string[]>(SECTIONS.slice(0, 5));
  const [open, setOpen] = useState(false);

  const report = REPORTS.find((r) => r.id === reportId)!;
  const m = MONTHLY[periodIdx];

  const totalRev = MONTHLY.reduce((s, x) => s + x.revenue, 0);
  const totalExp = MONTHLY.reduce((s, x) => s + x.expenses, 0);
  const outstanding = state.invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + convert(i.amount, i.currency, "USD"), 0);

  const copySummary = () => {
    const lines = [
      `${COMPANY.name} — ${report.title}`,
      `Period: ${m.label} ${m.year}`,
      `Revenue: ${formatConverted(m.revenue, "USD", home)}`,
      `Expenses: ${formatConverted(m.expenses, "USD", home)}`,
      `Net: ${formatConverted(m.revenue - m.expenses, "USD", home)}`,
      `Closing balance: ${formatConverted(m.closingBalance, "USD", home)}`,
      `Outstanding receivables: ${formatConverted(outstanding, "USD", home)}`,
    ];
    navigator.clipboard?.writeText(lines.join("\n")).then(
      () => toast.success("Summary copied to clipboard"),
      () => toast.error("Could not copy"),
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-semibold mb-3">1. Select report type</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REPORTS.map((r) => {
            const Icon = r.icon;
            const active = reportId === r.id;
            return (
              <button key={r.id} onClick={() => setReportId(r.id)}
                className={cn("text-left rounded-lg border p-4 transition-colors", active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}>
                <Icon className={cn("h-5 w-5 mb-2", active ? "text-primary" : "text-muted-foreground")} />
                <div className="font-medium text-sm">{r.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.desc}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-3">2. Select period</h3>
        <div className="flex flex-wrap gap-1.5">
          {MONTHLY.map((mm, i) => (
            <button key={mm.label} onClick={() => setPeriodIdx(i)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", periodIdx === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}>
              {mm.label} {mm.year}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-3">3. Include sections</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SECTIONS.map((s) => (
            <label key={s} className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={sections.includes(s)} onCheckedChange={(v) => {
                setSections((cur) => v ? [...cur, s] : cur.filter((x) => x !== s));
              }} />
              {s}
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>Generate Report</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 print:max-w-none print:max-h-none">
          <div className="flex items-center justify-between px-6 py-3 border-b border-border print:hidden">
            <div className="text-xs text-muted-foreground">Report preview</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1" />Print / PDF</Button>
              <Button size="sm" variant="outline" onClick={copySummary}><Copy className="h-3.5 w-3.5 mr-1" />Copy summary</Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="bg-white text-black px-10 py-8 print:p-0 print:bg-white print:text-black">
            <div className="border-b border-zinc-300 pb-5 mb-6 flex items-start justify-between">
              <div>
                <div className="h-10 w-10 rounded bg-zinc-900 text-white flex items-center justify-center font-bold mb-2">A</div>
                <div className="font-semibold text-lg">{COMPANY.name}</div>
                <div className="text-xs text-zinc-600">{COMPANY.industry}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">{report.title}</div>
                <div className="text-xs text-zinc-600">Period: {m.label} {m.year}</div>
                <div className="text-xs text-zinc-600">Reporting currency: {home}</div>
              </div>
            </div>

            {sections.includes("KPI Summary") && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 mb-2">KPI Summary</h2>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <RKpi label="Revenue" value={formatConverted(m.revenue, "USD", home)} />
                  <RKpi label="Expenses" value={formatConverted(m.expenses, "USD", home)} />
                  <RKpi label="Net Income" value={formatConverted(m.revenue - m.expenses, "USD", home)} />
                  <RKpi label="Closing Cash" value={formatConverted(m.closingBalance, "USD", home)} />
                </div>
              </section>
            )}

            {sections.includes("Revenue Breakdown") && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 mb-2">Revenue Breakdown</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-zinc-300 text-zinc-600"><th className="text-left py-1.5">Source</th><th className="text-right py-1.5">Amount</th><th className="text-right py-1.5">% Total</th></tr></thead>
                  <tbody>
                    {Object.entries(m.revenueBySource).map(([k, v]) => (
                      <tr key={k} className="border-b border-zinc-100"><td className="py-1.5">{k}</td><td className="text-right tabular">{formatConverted(v, "USD", home)}</td><td className="text-right tabular">{((v / m.revenue) * 100).toFixed(1)}%</td></tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {sections.includes("Expense Analysis") && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 mb-2">Expense Analysis</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-zinc-300 text-zinc-600"><th className="text-left py-1.5">Category</th><th className="text-right py-1.5">Amount</th><th className="text-right py-1.5">% Expenses</th></tr></thead>
                  <tbody>
                    {Object.entries(m.expenseBreakdown).map(([k, v]) => (
                      <tr key={k} className="border-b border-zinc-100"><td className="py-1.5 capitalize">{k}</td><td className="text-right tabular">{formatConverted(v, "USD", home)}</td><td className="text-right tabular">{((v / m.expenses) * 100).toFixed(1)}%</td></tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {sections.includes("Cash Position") && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 mb-2">Cash Position</h2>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <RKpi label="Opening" value={formatConverted(m.openingBalance, "USD", home)} />
                  <RKpi label="Net Movement" value={formatConverted(m.cashInflow - m.cashOutflow, "USD", home)} />
                  <RKpi label="Closing" value={formatConverted(m.closingBalance, "USD", home)} />
                </div>
              </section>
            )}

            {sections.includes("Receivables Status") && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 mb-2">Receivables Status</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-zinc-300 text-zinc-600"><th className="text-left py-1.5">Invoice</th><th className="text-left py-1.5">Client</th><th className="text-right py-1.5">Amount</th><th className="text-right py-1.5">Overdue</th></tr></thead>
                  <tbody>
                    {state.invoices.filter((i) => i.status !== "paid").slice(0, 10).map((i) => {
                      const c = CLIENTS.find((x) => x.id === i.clientId);
                      return (<tr key={i.id} className="border-b border-zinc-100"><td className="py-1.5 tabular">{i.invoiceNumber}</td><td className="py-1.5">{c?.name}</td><td className="text-right tabular">{formatMoney(i.amount, i.currency)}</td><td className="text-right tabular">{i.daysOverdue > 0 ? `${i.daysOverdue}d` : "—"}</td></tr>);
                    })}
                  </tbody>
                </table>
              </section>
            )}

            {sections.includes("Charts") && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 mb-2">Annual Performance</h2>
                <div className="text-sm">Total revenue: <span className="tabular font-medium">{formatConverted(totalRev, "USD", home)}</span> · Total expenses: <span className="tabular font-medium">{formatConverted(totalExp, "USD", home)}</span> · Net: <span className="tabular font-medium">{formatConverted(totalRev - totalExp, "USD", home)}</span></div>
              </section>
            )}

            <div className="border-t border-zinc-300 pt-3 text-xs text-zinc-500">
              Generated by FinBoard Pro on {format(new Date(), "dd MMM yyyy 'at' HH:mm")}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-200 p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="text-base font-semibold tabular mt-0.5">{value}</div>
    </div>
  );
}
