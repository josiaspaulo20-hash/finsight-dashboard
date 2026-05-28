import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, BarChart3, Wallet, ClipboardList, TrendingUp, Users, Printer, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/lib/finance/context";
import { COMPANY, MONTHLY, CLIENTS } from "@/lib/finance/seed";
import { convert } from "@/lib/finance/fx";
import { formatConverted, formatMoney } from "@/lib/finance/format";
import { useT, useMonthShort, useFormatDate } from "@/lib/finance/i18n";
import { Card } from "@/components/finance/primitives";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

const REPORTS = [
  { id: "monthly", titleKey: "reports.monthly.title", descKey: "reports.monthly.desc", icon: BarChart3 },
  { id: "quarterly", titleKey: "reports.quarterly.title", descKey: "reports.quarterly.desc", icon: TrendingUp },
  { id: "aging", titleKey: "reports.aging.title", descKey: "reports.aging.desc", icon: ClipboardList },
  { id: "cash", titleKey: "reports.cash.title", descKey: "reports.cash.desc", icon: Wallet },
  { id: "pnl", titleKey: "reports.pnl.title", descKey: "reports.pnl.desc", icon: FileText },
  { id: "clients", titleKey: "reports.clients.title", descKey: "reports.clients.desc", icon: Users },
];

const SECTIONS = [
  { id: "kpi", key: "reports.kpiSummary" },
  { id: "revenue", key: "reports.revenueBreakdown" },
  { id: "expense", key: "reports.expenseAnalysis" },
  { id: "cash", key: "reports.cashPosition" },
  { id: "receivables", key: "reports.receivablesStatus" },
  { id: "charts", key: "reports.charts" },
];

function ReportsPage() {
  const { state } = useFinance();
  const t = useT();
  const mShort = useMonthShort();
  const fmtDate = useFormatDate();
  const home = state.currency;
  const [reportId, setReportId] = useState("monthly");
  const [periodIdx, setPeriodIdx] = useState(MONTHLY.length - 1);
  const [sections, setSections] = useState<string[]>(SECTIONS.slice(0, 5).map((s) => s.id));
  const [open, setOpen] = useState(false);

  const report = REPORTS.find((r) => r.id === reportId)!;
  const reportTitle = t(report.titleKey);
  const m = MONTHLY[periodIdx];

  const totalRev = MONTHLY.reduce((s, x) => s + x.revenue, 0);
  const totalExp = MONTHLY.reduce((s, x) => s + x.expenses, 0);
  const outstanding = state.invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + convert(i.amount, i.currency, "USD"), 0);

  const copySummary = () => {
    const lines = [
      `${COMPANY.name} — ${reportTitle}`,
      `${t("reports.period")}: ${mShort(m.label)} ${m.year}`,
      `${t("card.revenue")}: ${formatConverted(m.revenue, "USD", home)}`,
      `${t("card.expenses")}: ${formatConverted(m.expenses, "USD", home)}`,
      `${t("card.net")}: ${formatConverted(m.revenue - m.expenses, "USD", home)}`,
      `${t("kpi.closingBalance")}: ${formatConverted(m.closingBalance, "USD", home)}`,
      `${t("kpi.outstandingReceivables")}: ${formatConverted(outstanding, "USD", home)}`,
    ];
    navigator.clipboard?.writeText(lines.join("\n")).then(
      () => toast.success(t("toast.summaryCopied")),
      () => toast.error(t("toast.couldNotCopy")),
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-semibold mb-3">{t("reports.step1")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REPORTS.map((r) => {
            const Icon = r.icon;
            const active = reportId === r.id;
            return (
              <button key={r.id} onClick={() => setReportId(r.id)}
                className={cn("text-left rounded-lg border p-4 transition-colors", active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}>
                <Icon className={cn("h-5 w-5 mb-2", active ? "text-primary" : "text-muted-foreground")} />
                <div className="font-medium text-sm">{t(r.titleKey)}</div>
                <div className="text-xs text-muted-foreground mt-1">{t(r.descKey)}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-3">{t("reports.step2")}</h3>
        <div className="flex flex-wrap gap-1.5">
          {MONTHLY.map((mm, i) => (
            <button key={mm.label} onClick={() => setPeriodIdx(i)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", periodIdx === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}>
              {mShort(mm.label)} {mm.year}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-3">{t("reports.step3")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SECTIONS.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={sections.includes(s.id)} onCheckedChange={(v) => {
                setSections((cur) => v ? [...cur, s.id] : cur.filter((x) => x !== s.id));
              }} />
              {t(s.key)}
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>{t("common.generateReport")}</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 print:max-w-none print:max-h-none">
          <div className="flex items-center justify-between px-6 py-3 border-b border-border print:hidden">
            <div className="text-xs text-muted-foreground">{t("common.reportPreview")}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1" />{t("common.printPdf")}</Button>
              <Button size="sm" variant="outline" onClick={copySummary}><Copy className="h-3.5 w-3.5 mr-1" />{t("common.copySummary")}</Button>
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
                <div className="font-semibold text-lg">{reportTitle}</div>
                <div className="text-xs text-zinc-600">{t("reports.period")}: {mShort(m.label)} {m.year}</div>
                <div className="text-xs text-zinc-600">{t("reports.reportingCurrency")}: {home}</div>
              </div>
            </div>

            {sections.includes("kpi") && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 mb-2">{t("reports.kpiSummary")}</h2>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <RKpi label={t("card.revenue")} value={formatConverted(m.revenue, "USD", home)} />
                  <RKpi label={t("card.expenses")} value={formatConverted(m.expenses, "USD", home)} />
                  <RKpi label={t("reports.netIncome")} value={formatConverted(m.revenue - m.expenses, "USD", home)} />
                  <RKpi label={t("reports.closingCash")} value={formatConverted(m.closingBalance, "USD", home)} />
                </div>
              </section>
            )}

            {sections.includes("revenue") && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 mb-2">{t("reports.revenueBreakdown")}</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-zinc-300 text-zinc-600"><th className="text-left py-1.5">{t("common.source")}</th><th className="text-right py-1.5">{t("common.amount")}</th><th className="text-right py-1.5">{t("common.percent")}</th></tr></thead>
                  <tbody>
                    {Object.entries(m.revenueBySource).map(([k, v]) => (
                      <tr key={k} className="border-b border-zinc-100"><td className="py-1.5">{t(`src.${k}`)}</td><td className="text-right tabular">{formatConverted(v, "USD", home)}</td><td className="text-right tabular">{((v / m.revenue) * 100).toFixed(1)}%</td></tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {sections.includes("expense") && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 mb-2">{t("reports.expenseAnalysis")}</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-zinc-300 text-zinc-600"><th className="text-left py-1.5">{t("common.category")}</th><th className="text-right py-1.5">{t("common.amount")}</th><th className="text-right py-1.5">{t("reports.pctExpenses")}</th></tr></thead>
                  <tbody>
                    {Object.entries(m.expenseBreakdown).map(([k, v]) => (
                      <tr key={k} className="border-b border-zinc-100"><td className="py-1.5">{t(`cat.${k}`)}</td><td className="text-right tabular">{formatConverted(v, "USD", home)}</td><td className="text-right tabular">{((v / m.expenses) * 100).toFixed(1)}%</td></tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {sections.includes("cash") && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 mb-2">{t("reports.cashPosition")}</h2>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <RKpi label={t("reports.opening")} value={formatConverted(m.openingBalance, "USD", home)} />
                  <RKpi label={t("kpi.netMovement")} value={formatConverted(m.cashInflow - m.cashOutflow, "USD", home)} />
                  <RKpi label={t("reports.closing")} value={formatConverted(m.closingBalance, "USD", home)} />
                </div>
              </section>
            )}

            {sections.includes("receivables") && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 mb-2">{t("reports.receivablesStatus")}</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-zinc-300 text-zinc-600"><th className="text-left py-1.5">{t("common.invoice")}</th><th className="text-left py-1.5">{t("common.client")}</th><th className="text-right py-1.5">{t("common.amount")}</th><th className="text-right py-1.5">{t("common.overdue")}</th></tr></thead>
                  <tbody>
                    {state.invoices.filter((i) => i.status !== "paid").slice(0, 10).map((i) => {
                      const c = CLIENTS.find((x) => x.id === i.clientId);
                      return (<tr key={i.id} className="border-b border-zinc-100"><td className="py-1.5 tabular">{i.invoiceNumber}</td><td className="py-1.5">{c?.name}</td><td className="text-right tabular">{formatMoney(i.amount, i.currency)}</td><td className="text-right tabular">{i.daysOverdue > 0 ? `${i.daysOverdue}${t("common.daysSuffix")}` : "—"}</td></tr>);
                    })}
                  </tbody>
                </table>
              </section>
            )}

            {sections.includes("charts") && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 mb-2">{t("reports.annualPerformance")}</h2>
                <div className="text-sm">{t("reports.totalRevenue")}: <span className="tabular font-medium">{formatConverted(totalRev, "USD", home)}</span> · {t("reports.totalExpenses")}: <span className="tabular font-medium">{formatConverted(totalExp, "USD", home)}</span> · {t("card.net")}: <span className="tabular font-medium">{formatConverted(totalRev - totalExp, "USD", home)}</span></div>
              </section>
            )}

            <div className="border-t border-zinc-300 pt-3 text-xs text-zinc-500">
              {t("reports.generatedBy")} {fmtDate(new Date(), "longTime")}
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
