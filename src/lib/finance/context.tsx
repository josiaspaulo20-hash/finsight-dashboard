import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { CurrencyCode, DateRangeKey, Invoice } from "./types";
import { SEED_INVOICES, generateAlerts } from "./seed";

interface State {
  currency: CurrencyCode;
  dateRange: DateRangeKey;
  theme: "light" | "dark";
  invoices: Invoice[];
  dismissedAlerts: string[];
  activeMonth: number; // 0-11
}

type Action =
  | { type: "SET_CURRENCY"; currency: CurrencyCode }
  | { type: "SET_RANGE"; range: DateRangeKey }
  | { type: "SET_THEME"; theme: "light" | "dark" }
  | { type: "MARK_PAID"; id: string }
  | { type: "UNMARK_PAID"; id: string; prev: Invoice }
  | { type: "DISMISS_ALERT"; id: string }
  | { type: "SET_ACTIVE_MONTH"; month: number };

const initial: State = {
  currency: "USD",
  dateRange: "12m",
  theme: "light",
  invoices: SEED_INVOICES,
  dismissedAlerts: [],
  activeMonth: 11,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_CURRENCY":
      return { ...state, currency: action.currency };
    case "SET_RANGE":
      return { ...state, dateRange: action.range };
    case "SET_THEME":
      return { ...state, theme: action.theme };
    case "MARK_PAID":
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === action.id ? { ...i, status: "paid", daysOverdue: 0 } : i,
        ),
      };
    case "UNMARK_PAID":
      return {
        ...state,
        invoices: state.invoices.map((i) => (i.id === action.id ? action.prev : i)),
      };
    case "DISMISS_ALERT":
      return { ...state, dismissedAlerts: [...state.dismissedAlerts, action.id] };
    case "SET_ACTIVE_MONTH":
      return { ...state, activeMonth: action.month };
    default:
      return state;
  }
}

interface Ctx {
  state: State;
  dispatch: React.Dispatch<Action>;
  alerts: ReturnType<typeof generateAlerts>;
}

const FinanceContext = createContext<Ctx | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial, (s) => {
    if (typeof window === "undefined") return s;
    const theme = (localStorage.getItem("finboard.theme") as "light" | "dark" | null) ?? s.theme;
    const currency = (localStorage.getItem("finboard.currency") as CurrencyCode | null) ?? s.currency;
    return { ...s, theme, currency };
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", state.theme === "dark");
    localStorage.setItem("finboard.theme", state.theme);
  }, [state.theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("finboard.currency", state.currency);
  }, [state.currency]);

  const alerts = useMemo(
    () => generateAlerts(state.invoices).filter((a) => !state.dismissedAlerts.includes(a.id)),
    [state.invoices, state.dismissedAlerts],
  );

  const value = useMemo(() => ({ state, dispatch, alerts }), [state, alerts]);
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): Ctx {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
