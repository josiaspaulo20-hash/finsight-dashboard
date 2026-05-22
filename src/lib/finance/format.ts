import { CURRENCY_META, convert } from "./fx";
import type { CurrencyCode } from "./types";

let currentLocale = "en-US";
export function setFormatLocale(locale: string) {
  currentLocale = locale;
}
export function getFormatLocale() {
  return currentLocale;
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode,
  opts: { compact?: boolean; showSymbol?: boolean; parensNegative?: boolean } = {},
): string {
  const meta = CURRENCY_META[currency];
  const isNeg = amount < 0;
  const abs = Math.abs(amount);
  let body: string;
  if (opts.compact && abs >= 1000) {
    body = new Intl.NumberFormat(currentLocale, { notation: "compact", maximumFractionDigits: 1 }).format(abs);
  } else {
    body = new Intl.NumberFormat(currentLocale, {
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(abs);
  }
  const out = (opts.showSymbol === false ? "" : meta.symbol) + body;
  if (isNeg) return opts.parensNegative === false ? `-${out}` : `(${out})`;
  return out;
}

export function formatConverted(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  opts?: Parameters<typeof formatMoney>[2],
): string {
  return formatMoney(convert(amount, from, to), to, opts);
}

export function formatPct(pct: number, decimals = 1): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(decimals)}%`;
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat(currentLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatDate(d: Date, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }): string {
  return new Intl.DateTimeFormat(currentLocale, opts).format(d);
}
