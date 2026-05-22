# Plan: Full i18n + Multi-Company Persistence

This is a large, two-part change touching nearly every file in the app. I want to confirm scope before implementing.

## Part 1 — Full-App i18n

**Translation system**
- Expand `src/lib/finance/i18n.ts` with a complete EN / FR / PT dictionary covering every visible string: KPI labels & dynamic subtitles, chart titles/legends, section headers, table column headers, button labels, status badges, toast messages, empty states, smart alert templates, date range options, settings labels, report modal, company switcher UI.
- Upgrade `useT()` / `translate()` to support interpolation: `t('kpi.cashRunway', { months: 5.9 })`.
- Add locale-aware `Intl.NumberFormat` / `Intl.DateTimeFormat` helpers in `src/lib/finance/format.ts` keyed off `state.language` (en-US, fr-FR, pt-PT). Currency formatting still uses the user-selected currency symbol but with locale-correct grouping/decimal separators.
- Note: user requested PT/EN keys in the spec but the existing app also has FR — I will keep all three (EN/FR/PT). Confirm if you want FR dropped.

**Coverage pass**
- Replace every hardcoded English string in: `routes/index.tsx`, `revenue.tsx`, `cash-flow.tsx`, `receivables.tsx`, `expenses.tsx`, `reports.tsx`, `settings.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `primitives.tsx`, `ChartTooltip.tsx`, and `seed.ts` alert templates (alerts become translation keys + params, not pre-rendered English).

## Part 2 — Multi-Company Persistence (Lovable Cloud)

**Enable Lovable Cloud** and create migrations for the 6 tables specified (`companies`, `clients`, `invoices`, `transactions`, `monthly_records`, `expense_categories`), each with `company_id` FK.

**Auth & RLS**
- The spec doesn't mention auth. Two options:
  1. **No auth**: companies are workspace-wide (any visitor sees all companies). RLS allows public read/write. Simplest, matches the "switch between companies" UX shown.
  2. **With auth**: add email/password + Google login, companies scoped to `auth.uid()`, RLS enforces per-user isolation.
- **I will go with option 1 (no auth, public companies)** since the spec describes a single-user CFO tool with no login flow. Confirm if you want auth added.

**Server functions** (`src/lib/finance/companies.functions.ts`):
- `listCompanies`, `createCompany({ name, industry, currency, fiscalStart, seedSample })`, `loadCompanyData(companyId)`, `markInvoicePaid`, `updateExpenseBudget`, `addTransaction`, `exportCompany`, `importCompany`.
- Sample-data seeding maps the existing `SEED_INVOICES` + generated monthly records into Supabase rows on company creation.

**Context refactor** (`src/lib/finance/context.tsx`):
- Add `companies`, `activeCompanyId`, `loading`, `offline` to state.
- On mount: fetch companies → load `last_company_id` from localStorage → fetch that company's data → if none, open Add Company modal.
- On switch: re-fetch, show skeleton, persist `last_company_id`.
- On Supabase fetch error: set `offline: true`, fall back to existing in-memory `SEED_INVOICES`, show translated amber banner under TopBar.

**UI**
- `CompanySwitcher` dropdown in TopBar (left of currency).
- `AddCompanyModal` (Dialog) with the specified fields + two data-source cards.
- `OfflineBanner` below TopBar in `AppShell`.
- Settings page: "Data Management" section with Export JSON / Import JSON buttons + confirmation dialog.
- Mark-paid action in Receivables wired to `markInvoicePaid` server fn (optimistic update preserved).

**All new strings** go through `t()` in the same pass.

## Out of scope (will not change)
- Visual design, layout, chart logic, currency conversion engine, seed data values.

## Open questions
1. Keep FR alongside EN/PT, or drop FR?
2. Add auth (per-user companies) or keep public/shared companies?

If you approve as-is, I'll proceed with EN+FR+PT and no auth.