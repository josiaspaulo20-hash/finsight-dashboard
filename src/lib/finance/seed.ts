import { addDays, format } from "date-fns";
import type {
  Client,
  CurrencyCode,
  ExpenseBreakdown,
  Invoice,
  MonthlyRecord,
  Transaction,
} from "./types";
import { convert } from "./fx";

export const COMPANY = {
  name: "Acme Consulting Ltd",
  industry: "Strategy & Management Consulting",
  baseCurrency: "USD" as CurrencyCode,
  fiscalYearStart: "January",
};

export const CLIENTS: Client[] = [
  { id: "c1", name: "Nexus Group", country: "United States", countryCode: "US", flag: "🇺🇸", industry: "Technology", currency: "USD", contactEmail: "sarah.chen@nexusgroup.com", monthlyRevenue: 12000, isRetainer: true },
  { id: "c2", name: "Meridian Partners", country: "United Kingdom", countryCode: "GB", flag: "🇬🇧", industry: "Financial Services", currency: "GBP", contactEmail: "james.whitfield@meridianpartners.co.uk", monthlyRevenue: 11000, isRetainer: false },
  { id: "c3", name: "Vantage Capital", country: "Germany", countryCode: "DE", flag: "🇩🇪", industry: "Private Equity", currency: "EUR", contactEmail: "anna.mueller@vantagecapital.de", monthlyRevenue: 8500, isRetainer: true },
  { id: "c4", name: "BlueSky Agency", country: "Canada", countryCode: "CA", flag: "🇨🇦", industry: "Marketing", currency: "CAD", contactEmail: "marc.tremblay@blueskyagency.ca", monthlyRevenue: 10000, isRetainer: false },
  { id: "c5", name: "Apex Solutions", country: "Australia", countryCode: "AU", flag: "🇦🇺", industry: "Enterprise Software", currency: "AUD", contactEmail: "lisa.park@apexsolutions.com.au", monthlyRevenue: 9000, isRetainer: true },
  { id: "c6", name: "Crestwood Holdings", country: "United States", countryCode: "US", flag: "🇺🇸", industry: "Real Estate", currency: "USD", contactEmail: "robert.hayes@crestwoodholdings.com", monthlyRevenue: 0, isRetainer: false },
  { id: "c7", name: "Solaris Tech", country: "Netherlands", countryCode: "NL", flag: "🇳🇱", industry: "Clean Energy", currency: "EUR", contactEmail: "eva.vandenberg@solaristech.nl", monthlyRevenue: 5200, isRetainer: true },
  { id: "c8", name: "Ironclad Ventures", country: "United Kingdom", countryCode: "GB", flag: "🇬🇧", industry: "Venture Capital", currency: "GBP", contactEmail: "david.macleod@ironcladventures.co.uk", monthlyRevenue: 2250, isRetainer: true },
  { id: "c9", name: "Pacific Rim Corp", country: "Canada", countryCode: "CA", flag: "🇨🇦", industry: "Logistics", currency: "CAD", contactEmail: "jennifer.wu@pacificrimcorp.ca", monthlyRevenue: 3833, isRetainer: false },
  { id: "c10", name: "Summit Analytics", country: "Australia", countryCode: "AU", flag: "🇦🇺", industry: "Data Analytics", currency: "AUD", contactEmail: "thomas.nguyen@summitanalytics.com.au", monthlyRevenue: 2400, isRetainer: false },
];

export function clientById(id: string): Client | undefined {
  return CLIENTS.find((c) => c.id === id);
}

const REVENUE_USD: number[] = [38200, 41500, 44800, 39100, 46200, 43700, 40300, 34600, 47900, 51200, 53800, 58400];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CLIENT_SHARES: Record<string, number> = {
  c1: 0.20, c2: 0.14, c3: 0.13, c4: 0.10, c5: 0.13,
  c6: 0.05, c7: 0.08, c8: 0.04, c9: 0.06, c10: 0.07,
};

const EXPENSE_RATIOS = [0.68, 0.66, 0.64, 0.70, 0.65, 0.67, 0.71, 0.72, 0.66, 0.64, 0.65, 0.66];
const CATEGORY_SPLIT: Record<keyof ExpenseBreakdown, number> = {
  payroll: 0.48,
  software: 0.09,
  marketing: 0.14,
  operations: 0.11,
  travel: 0.07,
  professional: 0.06,
  other: 0.05,
};

const REVENUE_SOURCE_SPLIT: Record<string, number> = {
  Retainer: 0.42,
  Consulting: 0.28,
  Services: 0.16,
  Products: 0.09,
  Other: 0.05,
};

const CURRENT_YEAR = new Date().getFullYear();

export const MONTHLY: MonthlyRecord[] = REVENUE_USD.map((rev, i) => {
  const expenses = Math.round(rev * EXPENSE_RATIOS[i]);
  const breakdown: ExpenseBreakdown = {
    payroll: Math.round(expenses * CATEGORY_SPLIT.payroll),
    software: Math.round(expenses * CATEGORY_SPLIT.software),
    marketing: Math.round(expenses * CATEGORY_SPLIT.marketing),
    operations: Math.round(expenses * CATEGORY_SPLIT.operations),
    travel: Math.round(expenses * CATEGORY_SPLIT.travel),
    professional: Math.round(expenses * CATEGORY_SPLIT.professional),
    other: Math.round(expenses * CATEGORY_SPLIT.other),
  };

  const revByCurrency: Record<CurrencyCode, number> = {
    USD: 0, EUR: 0, GBP: 0, JPY: 0, CAD: 0, AUD: 0, AOA: 0,
  };
  CLIENTS.forEach((c) => {
    const shareUsd = rev * (CLIENT_SHARES[c.id] ?? 0);
    const native = convert(shareUsd, "USD", c.currency);
    revByCurrency[c.currency] += Math.round(native);
  });

  const revenueBySource: Record<string, number> = {};
  Object.entries(REVENUE_SOURCE_SPLIT).forEach(([k, v]) => {
    revenueBySource[k] = Math.round(rev * v);
  });

  return {
    month: i,
    year: CURRENT_YEAR,
    label: MONTH_LABELS[i],
    revenue: rev,
    expenses,
    grossMargin: ((rev - expenses) / rev) * 100,
    cashInflow: rev,
    cashOutflow: expenses,
    openingBalance: 0,
    closingBalance: 0,
    expenseBreakdown: breakdown,
    revenueByCurrency: revByCurrency,
    revenueBySource,
  };
});

const OPENING = 47500;
{
  let bal = OPENING;
  MONTHLY.forEach((m) => {
    m.openingBalance = bal;
    bal = bal + (m.cashInflow - m.cashOutflow);
    m.closingBalance = bal;
  });
}

export const OPENING_BALANCE = OPENING;

const today = new Date();
function daysAgo(n: number): string {
  return format(addDays(today, -n), "yyyy-MM-dd");
}
function daysAhead(n: number): string {
  return format(addDays(today, n), "yyyy-MM-dd");
}
function inv(
  num: string,
  clientId: string,
  amount: number,
  currency: CurrencyCode,
  daysOverdue: number,
  paid = false,
): Invoice {
  const issueOffset = paid ? 65 : 30 + Math.max(daysOverdue, 0);
  const issue = daysAgo(issueOffset);
  const due = daysOverdue > 0 ? daysAgo(daysOverdue) : daysAhead(14);
  let status: Invoice["status"] = "pending";
  if (paid) status = "paid";
  else if (daysOverdue >= 91) status = "critical";
  else if (daysOverdue >= 61) status = "overdue";
  else if (daysOverdue >= 31) status = "late";
  else if (daysOverdue > 0) status = "late";
  return {
    id: num,
    invoiceNumber: num,
    clientId,
    issueDate: issue,
    dueDate: due,
    amount,
    currency,
    status,
    daysOverdue: Math.max(0, daysOverdue),
  };
}

export const SEED_INVOICES: Invoice[] = [
  inv("INV-1041", "c1", 12000, "USD", 0),
  inv("INV-1042", "c2", 8400, "GBP", 45),
  inv("INV-1043", "c3", 8500, "EUR", 0),
  inv("INV-1044", "c4", 6200, "CAD", 12),
  inv("INV-1045", "c5", 9000, "AUD", 0),
  inv("INV-1046", "c7", 5200, "EUR", 67),
  inv("INV-1047", "c8", 6750, "GBP", 91),
  inv("INV-1048", "c9", 11500, "CAD", 0),
  inv("INV-1049", "c10", 7200, "AUD", 8),
  inv("INV-1050", "c1", 12000, "USD", 0),
  inv("INV-1051", "c3", 8500, "EUR", 33),
  inv("INV-1052", "c4", 8800, "CAD", 105),
  inv("INV-1030", "c1", 12000, "USD", 0, true),
  inv("INV-1031", "c2", 9200, "GBP", 0, true),
  inv("INV-1032", "c3", 8500, "EUR", 0, true),
  inv("INV-1033", "c5", 9000, "AUD", 0, true),
  inv("INV-1034", "c6", 28000, "USD", 0, true),
  inv("INV-1035", "c4", 7400, "CAD", 0, true),
];

export const RECENT_TRANSACTIONS: Transaction[] = [
  { id: "t1", date: daysAgo(1), clientId: "c1", type: "inflow", amount: 12000, currency: "USD", category: "client_payment", description: "Nexus Group — Retainer payment", status: "completed" },
  { id: "t2", date: daysAgo(2), type: "outflow", amount: 24800, currency: "USD", category: "payroll", description: "Payroll — mid-month run", status: "completed" },
  { id: "t3", date: daysAgo(3), clientId: "c3", type: "inflow", amount: 8500, currency: "EUR", category: "client_payment", description: "Vantage Capital — Advisory", status: "completed" },
  { id: "t4", date: daysAgo(4), type: "outflow", amount: 4200, currency: "USD", category: "software", description: "Software & SaaS — monthly", status: "completed" },
  { id: "t5", date: daysAgo(5), clientId: "c5", type: "inflow", amount: 9000, currency: "AUD", category: "client_payment", description: "Apex Solutions — Implementation", status: "completed" },
  { id: "t6", date: daysAgo(7), type: "outflow", amount: 6500, currency: "USD", category: "marketing", description: "Q4 Brand Campaign", status: "completed" },
  { id: "t7", date: daysAgo(8), clientId: "c2", type: "inflow", amount: 9200, currency: "GBP", category: "client_payment", description: "Meridian Partners — Project Phase 2", status: "completed" },
  { id: "t8", date: daysAgo(10), type: "outflow", amount: 5100, currency: "USD", category: "rent", description: "Office Rent — monthly", status: "completed" },
];

export function generateDailyBalance(monthIndex: number): { day: number; balance: number; movement: number; note?: string }[] {
  const m = MONTHLY[monthIndex];
  let bal = m.openingBalance;
  const daysInMonth = new Date(CURRENT_YEAR, monthIndex + 1, 0).getDate();
  const out: { day: number; balance: number; movement: number; note?: string }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    let mv = 0;
    let note: string | undefined;
    if (d === 1 || d === 15) {
      mv -= Math.round(m.expenseBreakdown.payroll / 2);
      note = "Payroll";
    }
    if (d === 5) mv -= Math.round(m.expenseBreakdown.software);
    if (d === 10) mv -= Math.round(m.expenseBreakdown.operations / 2);
    if ([3, 8, 12, 18, 22, 27].includes(d)) {
      mv += Math.round(m.cashInflow / 7);
      if (!note) note = "Client payment";
    }
    if (d === 25) mv -= Math.round(m.expenseBreakdown.marketing);
    bal += mv;
    out.push({ day: d, balance: bal, movement: mv, note });
  }
  return out;
}

export type AlertSpec = {
  id: string;
  type: "receivables" | "cash" | "revenue" | "expenses";
  severity: "danger" | "warning" | "success" | "info";
  titleKey: string;
  messageKey: string;
  actionKey?: string;
  actionLink: string;
  params: Record<string, string | number>;
  createdAt: string;
};

export function generateAlertSpecs(invoices: Invoice[]): AlertSpec[] {
  const alerts: AlertSpec[] = [];
  const overdue = invoices.filter((i) => i.daysOverdue >= 45 && i.status !== "paid")
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
  overdue.slice(0, 2).forEach((i) => {
    const c = clientById(i.clientId);
    alerts.push({
      id: `inv-${i.id}`,
      type: "receivables",
      severity: i.daysOverdue >= 90 ? "danger" : "warning",
      titleKey: "alert.invoiceOverdue.title",
      messageKey: "alert.invoiceOverdue.msg",
      actionKey: "alert.invoiceOverdue.action",
      params: {
        num: i.invoiceNumber,
        days: i.daysOverdue,
        name: c?.name ?? "Client",
        amt: `${i.currency} ${i.amount.toLocaleString()}`,
        contact: c?.contactEmail ?? "—",
      },
      actionLink: "/receivables",
      createdAt: new Date().toISOString(),
    });
  });

  const last = MONTHLY[MONTHLY.length - 1];
  const monthsCovered = last.closingBalance / Math.max(1, last.expenses);
  if (monthsCovered < 3) {
    alerts.push({
      id: "cash-runway",
      type: "cash",
      severity: monthsCovered < 1 ? "danger" : "warning",
      titleKey: "alert.cashRunway.title",
      messageKey: "alert.cashRunway.msg",
      actionKey: "alert.cashRunway.action",
      params: { months: monthsCovered.toFixed(1) },
      actionLink: "/cash-flow",
      createdAt: new Date().toISOString(),
    });
  }

  const q3 = MONTHLY.slice(6, 9).reduce((s, m) => s + m.revenue, 0);
  const q4 = MONTHLY.slice(9, 12).reduce((s, m) => s + m.revenue, 0);
  const q4Delta = ((q4 - q3) / q3) * 100;
  if (q4Delta > 10) {
    alerts.push({
      id: "q4-strong",
      type: "revenue",
      severity: "success",
      titleKey: "alert.q4Strong.title",
      messageKey: "alert.q4Strong.msg",
      actionKey: "alert.q4Strong.action",
      params: { pct: q4Delta.toFixed(0) },
      actionLink: "/revenue",
      createdAt: new Date().toISOString(),
    });
  }

  alerts.push({
    id: "mkt-budget",
    type: "expenses",
    severity: "warning",
    titleKey: "alert.mktBudget.title",
    messageKey: "alert.mktBudget.msg",
    actionKey: "alert.mktBudget.action",
    params: {},
    actionLink: "/expenses",
    createdAt: new Date().toISOString(),
  });

  return alerts;
}
