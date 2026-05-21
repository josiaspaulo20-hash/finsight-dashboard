import { CURRENCY_META, convert } from "./fx";
import type { CurrencyCode } from "./types";

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
    body = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(abs);
  } else {
    body = new Intl.NumberFormat("en-US", {
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
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}
