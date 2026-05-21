import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  DollarSign,
  Waves,
  ClipboardList,
  Wallet,
  FileText,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/finance/i18n";

const NAV = [
  { to: "/", key: "nav.overview", icon: LayoutDashboard },
  { to: "/revenue", key: "nav.revenue", icon: DollarSign },
  { to: "/cash-flow", key: "nav.cashFlow", icon: Waves },
  { to: "/receivables", key: "nav.receivables", icon: ClipboardList },
  { to: "/expenses", key: "nav.expenses", icon: Wallet },
  { to: "/reports", key: "nav.reports", icon: FileText },
  { to: "/settings", key: "nav.settings", icon: Settings },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();

  return (
    <aside
      className={cn(
        "hidden md:flex sticky top-0 h-screen flex-col bg-sidebar border-r border-sidebar-border transition-[width] duration-250",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className={cn("flex items-center gap-2 h-16 px-5 border-b border-sidebar-border")}>
        <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold">
          F
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="font-semibold tracking-tight">FinBoard</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Pro</span>
          </div>
        )}
      </div>
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{t(item.key)}</span>}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="mx-2 mb-3 flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent/40 transition-colors"
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        {!collapsed && <span>{t("sidebar.collapse")}</span>}
      </button>
    </aside>
  );
}

export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV.slice(0, 6);
  const t = useT();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar border-t border-sidebar-border flex justify-around py-1.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px]",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
