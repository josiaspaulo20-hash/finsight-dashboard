import { Bell, Moon, Sun, Calendar } from "lucide-react";
import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useFinance } from "@/lib/finance/context";
import { ALL_CURRENCIES, CURRENCY_META } from "@/lib/finance/fx";
import type { CurrencyCode, DateRangeKey } from "@/lib/finance/types";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Overview", subtitle: "Your financial pulse at a glance" },
  "/revenue": { title: "Revenue", subtitle: "Growth, mix, and client concentration" },
  "/cash-flow": { title: "Cash Flow", subtitle: "Inflows, outflows, and runway" },
  "/receivables": { title: "Receivables", subtitle: "Outstanding invoices and aging" },
  "/expenses": { title: "Expenses", subtitle: "Budget vs actual across categories" },
  "/reports": { title: "Reports", subtitle: "Generate and export financial reports" },
  "/settings": { title: "Settings", subtitle: "Workspace and display preferences" },
};

const RANGES: { key: DateRangeKey; label: string }[] = [
  { key: "30d", label: "Last 30 days" },
  { key: "quarter", label: "Last quarter" },
  { key: "12m", label: "Last 12 months" },
  { key: "ytd", label: "Year to date" },
];

export function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, dispatch, alerts } = useFinance();
  const [openNotif, setOpenNotif] = useState(false);
  const meta = PAGE_META[pathname] ?? { title: "FinBoard", subtitle: "" };

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 md:px-6 bg-background/80 backdrop-blur border-b border-border">
      <div className="min-w-0 flex-1">
        <h1 className="text-base md:text-lg font-semibold tracking-tight truncate">{meta.title}</h1>
        <p className="text-xs text-muted-foreground truncate">{meta.subtitle}</p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 hidden sm:inline-flex">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs">{RANGES.find((r) => r.key === state.dateRange)?.label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Date range</DropdownMenuLabel>
          {RANGES.map((r) => (
            <DropdownMenuItem
              key={r.key}
              onClick={() => dispatch({ type: "SET_RANGE", range: r.key })}
            >
              {r.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>Custom range…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <span>{CURRENCY_META[state.currency].flag}</span>
            <span className="text-xs font-medium tabular">{state.currency}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Home currency</DropdownMenuLabel>
          {ALL_CURRENCIES.map((c) => (
            <DropdownMenuItem
              key={c}
              onClick={() => dispatch({ type: "SET_CURRENCY", currency: c as CurrencyCode })}
            >
              <span className="mr-2">{CURRENCY_META[c].flag}</span>
              <span className="flex-1">{CURRENCY_META[c].name}</span>
              <span className="text-xs text-muted-foreground tabular">{c}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu open={openNotif} onOpenChange={setOpenNotif}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 bg-destructive text-destructive-foreground text-[10px]">
                {alerts.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Alerts</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {alerts.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              You're all caught up.
            </div>
          )}
          {alerts.slice(0, 5).map((a) => (
            <div key={a.id} className="px-3 py-2 text-xs border-b last:border-b-0 border-border">
              <div className="font-medium text-foreground">{a.title}</div>
              <div className="text-muted-foreground line-clamp-2 mt-0.5">{a.message}</div>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        onClick={() => dispatch({ type: "SET_THEME", theme: state.theme === "dark" ? "light" : "dark" })}
      >
        {state.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
        AC
      </div>
    </header>
  );
}
