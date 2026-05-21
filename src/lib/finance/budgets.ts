import { MONTHLY } from "./seed";
import type { ExpenseBreakdown, ExpenseCategory } from "./types";

export const CATEGORY_LABEL: Record<keyof ExpenseBreakdown, string> = {
  payroll: "Payroll",
  software: "Software & SaaS",
  marketing: "Marketing",
  operations: "Operations",
  travel: "Travel",
  professional: "Professional Fees",
  other: "Other",
};

export function getExpenseCategories(monthIndex: number): ExpenseCategory[] {
  const m = MONTHLY[monthIndex];
  const trendMonths = MONTHLY.slice(Math.max(0, monthIndex - 5), monthIndex + 1);
  return (Object.keys(CATEGORY_LABEL) as Array<keyof ExpenseBreakdown>).map((id) => {
    const actual = m.expenseBreakdown[id];
    const avg = trendMonths.reduce((s, x) => s + x.expenseBreakdown[id], 0) / trendMonths.length;
    const factor = id === "marketing" ? 0.85 : id === "travel" ? 1.1 : 1.0;
    const budget = Math.round(avg * factor);
    const variance = actual - budget;
    const variancePct = (variance / Math.max(1, budget)) * 100;
    const trend = trendMonths.map((x) => x.expenseBreakdown[id]);
    return { id, name: CATEGORY_LABEL[id], budget, actual, variance, variancePct, trend };
  });
}
