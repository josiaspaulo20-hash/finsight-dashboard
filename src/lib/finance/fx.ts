import type { CurrencyCode } from "./types";

export const FX_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.921,
  GBP: 0.789,
  JPY: 149.55,
  CAD: 1.362,
  AUD: 1.534,
};

export const CURRENCY_META: Record<
  CurrencyCode,
  { symbol: string; flag: string; name: string; decimals: number }
> = {
  USD: { symbol: "$", flag: "🇺🇸", name: "US Dollar", decimals: 2 },
  EUR: { symbol: "€", flag: "🇪🇺", name: "Euro", decimals: 2 },
  GBP: { symbol: "£", flag: "🇬🇧", name: "British Pound", decimals: 2 },
  JPY: { symbol: "¥", flag: "🇯🇵", name: "Japanese Yen", decimals: 0 },
  CAD: { symbol: "CA$", flag: "🇨🇦", name: "Canadian Dollar", decimals: 2 },
  AUD: { symbol: "AU$", flag: "🇦🇺", name: "Australian Dollar", decimals: 2 },
};

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount;
  const usd = amount / FX_RATES[from];
  return usd * FX_RATES[to];
}

export const ALL_CURRENCIES: CurrencyCode[] = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];
