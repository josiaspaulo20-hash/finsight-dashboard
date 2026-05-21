import type { TooltipProps } from "recharts";
import { formatConverted, formatMoney, formatNumber } from "@/lib/finance/format";
import { useFinance } from "@/lib/finance/context";
import type { CurrencyCode } from "@/lib/finance/types";

export function MoneyTooltip({
  active,
  payload,
  label,
  fromCurrency = "USD",
  pctKeys = [],
}: TooltipProps<number, string> & { fromCurrency?: CurrencyCode; pctKeys?: string[] }) {
  const { state } = useFinance();
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-border bg-popover text-popover-foreground shadow-md px-3 py-2 text-xs">
      <div className="font-medium mb-1.5">{label}</div>
      <div className="space-y-1">
        {payload.map((p) => {
          const isPct = pctKeys.includes(String(p.dataKey));
          const value =
            typeof p.value === "number"
              ? isPct
                ? `${formatNumber(p.value, 1)}%`
                : formatConverted(p.value, fromCurrency, state.currency)
              : String(p.value);
          return (
            <div key={String(p.dataKey)} className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: p.color }} />
              <span className="text-muted-foreground capitalize">{String(p.name ?? p.dataKey)}</span>
              <span className="ml-auto tabular font-medium">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlainMoneyTooltip(props: TooltipProps<number, string>) {
  return <MoneyTooltip {...props} />;
}

export function NativeTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-border bg-popover text-popover-foreground shadow-md px-3 py-2 text-xs">
      <div className="font-medium mb-1.5">{label}</div>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={String(p.dataKey)} className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: p.color }} />
            <span className="text-muted-foreground capitalize">{String(p.name ?? p.dataKey)}</span>
            <span className="ml-auto tabular font-medium">
              {typeof p.value === "number" ? formatMoney(p.value, "USD") : String(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
