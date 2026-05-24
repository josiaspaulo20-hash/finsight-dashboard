import { Bell, Moon, Sun, Calendar, Languages } from "lucide-react";
import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useFinance } from "@/lib/finance/context";
import { ALL_CURRENCIES, CURRENCY_META } from "@/lib/finance/fx";
import type { CurrencyCode, DateRangeKey } from "@/lib/finance/types";
import { LANGUAGES, useT, type Language } from "@/lib/finance/i18n";
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
import { CompanySwitcher } from "./CompanySwitcher";

const PAGE_META: Record<string, { titleKey: string; subtitleKey: string }> = {
  "/": { titleKey: "page.overview.title", subtitleKey: "page.overview.subtitle" },
  "/revenue": { titleKey: "page.revenue.title", subtitleKey: "page.revenue.subtitle" },
  "/cash-flow": { titleKey: "page.cashFlow.title", subtitleKey: "page.cashFlow.subtitle" },
  "/receivables": { titleKey: "page.receivables.title", subtitleKey: "page.receivables.subtitle" },
  "/expenses": { titleKey: "page.expenses.title", subtitleKey: "page.expenses.subtitle" },
  "/reports": { titleKey: "page.reports.title", subtitleKey: "page.reports.subtitle" },
  "/settings": { titleKey: "page.settings.title", subtitleKey: "page.settings.subtitle" },
};

const RANGES: { key: DateRangeKey; labelKey: string }[] = [
  { key: "30d", labelKey: "topbar.range.30d" },
  { key: "quarter", labelKey: "topbar.range.quarter" },
  { key: "12m", labelKey: "topbar.range.12m" },
  { key: "ytd", labelKey: "topbar.range.ytd" },
];

export function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, dispatch, alerts } = useFinance();
  const [openNotif, setOpenNotif] = useState(false);
  const t = useT();
  const meta = PAGE_META[pathname];
  const title = meta ? t(meta.titleKey) : "FinBoard";
  const subtitle = meta ? t(meta.subtitleKey) : "";
  const currentLang = LANGUAGES.find((l) => l.code === state.language) ?? LANGUAGES[0];

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 md:px-6 bg-background/80 backdrop-blur border-b border-border">
      <div className="min-w-0 flex-1">
        <h1 className="text-base md:text-lg font-semibold tracking-tight truncate">{title}</h1>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>

      <CompanySwitcher />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 hidden sm:inline-flex">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs">{t(RANGES.find((r) => r.key === state.dateRange)?.labelKey ?? "")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>{t("topbar.dateRange")}</DropdownMenuLabel>
          {RANGES.map((r) => (
            <DropdownMenuItem
              key={r.key}
              onClick={() => dispatch({ type: "SET_RANGE", range: r.key })}
            >
              {t(r.labelKey)}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>{t("topbar.customRange")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5" aria-label={t("topbar.language")}>
            <Languages className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase">{currentLang.code}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>{t("topbar.language")}</DropdownMenuLabel>
          {LANGUAGES.map((l) => (
            <DropdownMenuItem
              key={l.code}
              onClick={() => dispatch({ type: "SET_LANGUAGE", language: l.code as Language })}
            >
              <span className="mr-2">{l.flag}</span>
              <span className="flex-1">{l.name}</span>
              <span className="text-xs text-muted-foreground tabular uppercase">{l.code}</span>
            </DropdownMenuItem>
          ))}
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
          <DropdownMenuLabel>{t("topbar.homeCurrency")}</DropdownMenuLabel>
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
          <Button variant="ghost" size="icon" className="relative" aria-label={t("topbar.notifications")}>
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 bg-destructive text-destructive-foreground text-[10px]">
                {alerts.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>{t("topbar.alerts")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {alerts.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              {t("topbar.allCaughtUp")}
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
        aria-label={t("topbar.toggleTheme")}
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
