import { supabase } from "@/integrations/supabase/client";
import type { CurrencyCode, Invoice } from "./types";
import { SEED_INVOICES, COMPANY as SEED_COMPANY } from "./seed";

export interface CompanyProfile {
  name: string;
  industry: string;
  baseCurrency: CurrencyCode;
  fiscalYearStart: string;
}

export interface CompanySnapshot {
  version: 1;
  profile: CompanyProfile;
  invoices: Invoice[];
  dismissedAlerts: string[];
  activeMonth: number;
}

export interface CompanyRow {
  id: string;
  name: string;
  industry: string | null;
  base_currency: string;
  fiscal_year_start: number;
  is_sample: boolean;
  data: CompanySnapshot;
  created_at: string;
}

export function makeSampleSnapshot(name = SEED_COMPANY.name): CompanySnapshot {
  return {
    version: 1,
    profile: {
      name,
      industry: SEED_COMPANY.industry,
      baseCurrency: SEED_COMPANY.baseCurrency,
      fiscalYearStart: SEED_COMPANY.fiscalYearStart,
    },
    invoices: SEED_INVOICES,
    dismissedAlerts: [],
    activeMonth: 11,
  };
}

export function makeBlankSnapshot(name: string): CompanySnapshot {
  return {
    version: 1,
    profile: {
      name,
      industry: "—",
      baseCurrency: "USD",
      fiscalYearStart: "January",
    },
    invoices: [],
    dismissedAlerts: [],
    activeMonth: 11,
  };
}

export async function listCompanies(): Promise<CompanyRow[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CompanyRow[];
}

export async function createCompany(
  name: string,
  kind: "sample" | "blank",
): Promise<CompanyRow> {
  const snapshot = kind === "sample" ? makeSampleSnapshot(name) : makeBlankSnapshot(name);
  const { data, error } = await supabase
    .from("companies")
    .insert({
      name,
      industry: snapshot.profile.industry,
      base_currency: snapshot.profile.baseCurrency,
      fiscal_year_start: 1,
      is_sample: kind === "sample",
      data: snapshot as unknown as Record<string, unknown>,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as CompanyRow;
}

export async function saveSnapshot(id: string, snapshot: CompanySnapshot): Promise<void> {
  const { error } = await supabase
    .from("companies")
    .update({
      data: snapshot as unknown as Record<string, unknown>,
      name: snapshot.profile.name,
      industry: snapshot.profile.industry,
      base_currency: snapshot.profile.baseCurrency,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
}

export async function importCompany(
  name: string,
  snapshot: CompanySnapshot,
): Promise<CompanyRow> {
  const clean: CompanySnapshot = {
    version: 1,
    profile: { ...snapshot.profile, name },
    invoices: Array.isArray(snapshot.invoices) ? snapshot.invoices : [],
    dismissedAlerts: Array.isArray(snapshot.dismissedAlerts) ? snapshot.dismissedAlerts : [],
    activeMonth: typeof snapshot.activeMonth === "number" ? snapshot.activeMonth : 11,
  };
  const { data, error } = await supabase
    .from("companies")
    .insert({
      name,
      industry: clean.profile.industry,
      base_currency: clean.profile.baseCurrency,
      fiscal_year_start: 1,
      is_sample: false,
      data: clean as unknown as Record<string, unknown>,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as CompanyRow;
}

export function validateSnapshot(obj: unknown): obj is CompanySnapshot {
  if (!obj || typeof obj !== "object") return false;
  const s = obj as Partial<CompanySnapshot>;
  return (
    s.version === 1 &&
    !!s.profile &&
    typeof s.profile.name === "string" &&
    Array.isArray(s.invoices)
  );
}