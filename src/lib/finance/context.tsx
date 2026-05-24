import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, useCallback } from "react";
import type { CurrencyCode, DateRangeKey, Invoice } from "./types";
import { SEED_INVOICES, generateAlertSpecs } from "./seed";
import type { Language } from "./i18n";
import { LOCALE, translate } from "./i18n";
import { setActiveLocale } from "./format";
import {
  type CompanyRow,
  type CompanySnapshot,
  listCompanies,
  createCompany as dbCreateCompany,
  deleteCompany as dbDeleteCompany,
  saveSnapshot,
  importCompany as dbImportCompany,
  makeSampleSnapshot,
} from "./companies";

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
  | { type: "SET_ACTIVE_MONTH"; month: number }
  | { type: "LOAD_SNAPSHOT"; snapshot: CompanySnapshot };

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
    case "LOAD_SNAPSHOT":
      return {
        ...state,
        invoices: action.snapshot.invoices,
        dismissedAlerts: action.snapshot.dismissedAlerts,
        activeMonth: action.snapshot.activeMonth,
      };
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
  companies: CompanyRow[];
  activeCompany: CompanyRow | null;
  switchCompany: (id: string) => Promise<void>;
  createCompany: (name: string, kind: "sample" | "blank") => Promise<void>;
  deleteCompanyById: (id: string) => Promise<void>;
  importSnapshot: (name: string, snapshot: CompanySnapshot) => Promise<void>;
  exportSnapshot: () => CompanySnapshot | null;
  online: boolean;
  loading: boolean;
}

const FinanceContext = createContext<Ctx | null>(null);

const ACTIVE_KEY = "finboard.activeCompany";

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

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

  // Bootstrap companies from Supabase. Falls back to in-memory seed when offline.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      try {
        let rows = await listCompanies();
        if (rows.length === 0) {
          const seeded = await dbCreateCompany("Acme Consulting Ltd", "sample");
          rows = [seeded];
        }
        if (cancelled) return;
        setCompanies(rows);
        const savedId = localStorage.getItem(ACTIVE_KEY);
        const pick = rows.find((r) => r.id === savedId) ?? rows[0];
        setActiveId(pick.id);
        dispatch({ type: "LOAD_SNAPSHOT", snapshot: pick.data });
        setOnline(true);
      } catch (e) {
        console.warn("[FinBoard] Supabase unavailable, using offline seed.", e);
        if (cancelled) return;
        setOnline(false);
        dispatch({ type: "LOAD_SNAPSHOT", snapshot: makeSampleSnapshot() });
      } finally {
        if (!cancelled) {
          setLoading(false);
          hydratedRef.current = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced save of mutable state back to active company snapshot.
  useEffect(() => {
    if (!hydratedRef.current || !activeId || !online) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const active = companies.find((c) => c.id === activeId);
      if (!active) return;
      const next: CompanySnapshot = {
        ...active.data,
        version: 1,
        invoices: state.invoices,
        dismissedAlerts: state.dismissedAlerts,
        activeMonth: state.activeMonth,
      };
      saveSnapshot(activeId, next)
        .then(() => {
          setCompanies((prev) =>
            prev.map((c) => (c.id === activeId ? { ...c, data: next } : c)),
          );
        })
        .catch((e) => {
          console.warn("[FinBoard] save failed", e);
          setOnline(false);
        });
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state.invoices, state.dismissedAlerts, state.activeMonth, activeId, online, companies]);

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

  // Browser online/offline tracking
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, []);

  const switchCompany = useCallback(async (id: string) => {
    const target = companies.find((c) => c.id === id);
    if (!target) return;
    setActiveId(id);
    localStorage.setItem(ACTIVE_KEY, id);
    dispatch({ type: "LOAD_SNAPSHOT", snapshot: target.data });
  }, [companies]);

  const createCompany = useCallback(async (name: string, kind: "sample" | "blank") => {
    const row = await dbCreateCompany(name, kind);
    setCompanies((prev) => [...prev, row]);
    setActiveId(row.id);
    localStorage.setItem(ACTIVE_KEY, row.id);
    dispatch({ type: "LOAD_SNAPSHOT", snapshot: row.data });
  }, []);

  const deleteCompanyById = useCallback(async (id: string) => {
    await dbDeleteCompany(id);
    const remaining = companies.filter((c) => c.id !== id);
    setCompanies(remaining);
    if (activeId === id) {
      const next = remaining[0] ?? null;
      setActiveId(next?.id ?? null);
      if (next) {
        localStorage.setItem(ACTIVE_KEY, next.id);
        dispatch({ type: "LOAD_SNAPSHOT", snapshot: next.data });
      }
    }
  }, [companies, activeId]);

  const importSnapshot = useCallback(async (name: string, snapshot: CompanySnapshot) => {
    const row = await dbImportCompany(name, snapshot);
    setCompanies((prev) => [...prev, row]);
    setActiveId(row.id);
    localStorage.setItem(ACTIVE_KEY, row.id);
    dispatch({ type: "LOAD_SNAPSHOT", snapshot: row.data });
  }, []);

  const exportSnapshot = useCallback((): CompanySnapshot | null => {
    const active = companies.find((c) => c.id === activeId);
    if (!active) return null;
    return {
      ...active.data,
      invoices: state.invoices,
      dismissedAlerts: state.dismissedAlerts,
      activeMonth: state.activeMonth,
    };
  }, [companies, activeId, state.invoices, state.dismissedAlerts, state.activeMonth]);

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

  const activeCompany = useMemo(
    () => companies.find((c) => c.id === activeId) ?? null,
    [companies, activeId],
  );

  const value = useMemo(
    () => ({
      state,
      dispatch,
      alerts,
      companies,
      activeCompany,
      switchCompany,
      createCompany,
      deleteCompanyById,
      importSnapshot,
      exportSnapshot,
      online,
      loading,
    }),
    [state, alerts, companies, activeCompany, switchCompany, createCompany, deleteCompanyById, importSnapshot, exportSnapshot, online, loading],
  );
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): Ctx {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
