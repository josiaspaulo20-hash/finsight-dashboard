export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD";

export interface Client {
  id: string;
  name: string;
  country: string;
  countryCode: string; // ISO-2
  flag: string;
  industry: string;
  currency: CurrencyCode;
  contactEmail: string;
  monthlyRevenue: number; // in own currency
  isRetainer: boolean;
}

export type InvoiceStatus = "paid" | "pending" | "late" | "overdue" | "critical";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  issueDate: string; // ISO
  dueDate: string; // ISO
  amount: number;
  currency: CurrencyCode;
  status: InvoiceStatus;
  daysOverdue: number;
  notes?: string;
}

export type TxType = "inflow" | "outflow";
export type TxCategory =
  | "client_payment"
  | "interest"
  | "other_in"
  | "payroll"
  | "rent"
  | "software"
  | "marketing"
  | "tax"
  | "travel"
  | "professional_fees"
  | "operations"
  | "other_out";

export interface Transaction {
  id: string;
  date: string;
  clientId?: string;
  type: TxType;
  amount: number;
  currency: CurrencyCode;
  category: TxCategory;
  description: string;
  status: "completed" | "pending";
}

export interface ExpenseBreakdown {
  payroll: number;
  software: number;
  marketing: number;
  operations: number;
  travel: number;
  professional: number;
  other: number;
}

export interface MonthlyRecord {
  month: number; // 0-11
  year: number;
  label: string; // "Jan"
  revenue: number; // in USD base
  expenses: number;
  grossMargin: number; // pct
  cashInflow: number;
  cashOutflow: number;
  openingBalance: number;
  closingBalance: number;
  expenseBreakdown: ExpenseBreakdown;
  revenueByCurrency: Record<CurrencyCode, number>; // native amounts
  revenueBySource: Record<string, number>; // USD
}

export interface ExpenseCategory {
  id: keyof ExpenseBreakdown;
  name: string;
  budget: number;
  actual: number;
  variance: number;
  variancePct: number;
  trend: number[];
}

export type AlertSeverity = "info" | "warning" | "danger" | "success";

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionLabel?: string;
  actionLink?: string;
  createdAt: string;
}

export type DateRangeKey = "30d" | "quarter" | "12m" | "ytd";
