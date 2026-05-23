import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { CurrencyCode, DateRangeKey, Invoice } from "./types";
import { SEED_INVOICES, generateAlertSpecs } from "./seed";
import type { Language } from "./i18n";
import { LOCALE, translate } from "./i18n";
import { setActiveLocale } from "./format";

interface State {
  currency: CurrencyCode;
  dateRange: DateRangeKey;
  theme: "light" | "dark";
  language: Language;
  invoices: Invoice[];
  dismissedAlerts: string[];
  activeMonth: number; // 0-11
}

type Action =
  | { type: "SET_CURRENCY"; currency: CurrencyCode }
  | { type: "SET_RANGE"; range: DateRangeKey }
  | { type: "SET_THEME"; theme: "light" | "dark" }
  | { type: "SET_LANGUAGE"; language: Language }
  | { type: "MARK_PAID"; id: string }
  | { type: "UNMARK_PAID"; id: string; prev: Invoice }
  | { type: "DISMISS_ALERT"; id: string }
  | { type: "SET_ACTIVE_MONTH"; month: number };

const initial: State = {
  currency: "USD",
  dateRange: "12m",
  theme: "light",
  language: "en",
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
    case "SET_LANGUAGE":
      return { ...state, language: action.language };
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
  alerts: Array<{
    id: string;
    type: "receivables" | "cash" | "revenue" | "expenses";
    severity: "danger" | "warning" | "success" | "info";
    title: string;
    message: string;
    actionLabel?: string;
    actionLink: string;
    createdAt: string;
  }>;
}

const FinanceContext = createContext<Ctx | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  // Hydrate from localStorage after mount to avoid SSR/client mismatch.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const theme = localStorage.getItem("finboard.theme") as "light" | "dark" | null;
    const currency = localStorage.getItem("finboard.currency") as CurrencyCode | null;
    const language = localStorage.getItem("finboard.language") as Language | null;
    if (theme && theme !== state.theme) dispatch({ type: "SET_THEME", theme });
    if (currency && currency !== state.currency) dispatch({ type: "SET_CURRENCY", currency });
    if (language && language !== state.language) dispatch({ type: "SET_LANGUAGE", language });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", state.theme === "dark");
    localStorage.setItem("finboard.theme", state.theme);
  }, [state.theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("finboard.currency", state.currency);
  }, [state.currency]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("finboard.language", state.language);
    document.documentElement.lang = state.language;
    setActiveLocale(LOCALE[state.language]);
  }, [state.language]);

  const alerts = useMemo(() => {
    const specs = generateAlertSpecs(state.invoices);
    return specs
      .filter((a) => !state.dismissedAlerts.includes(a.id))
      .map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        actionLink: a.actionLink,
        createdAt: a.createdAt,
        title: translate(state.language, a.titleKey, a.params),
        message: translate(state.language, a.messageKey, a.params),
        actionLabel: a.actionKey ? translate(state.language, a.actionKey) : undefined,
      }));
  }, [state.invoices, state.dismissedAlerts, state.language]);

  const value = useMemo(() => ({ state, dispatch, alerts }), [state, alerts]);
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): Ctx {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
