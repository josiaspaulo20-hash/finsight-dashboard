import { createFileRoute } from "@tanstack/react-router";
import { useFinance } from "@/lib/finance/context";
import { ALL_CURRENCIES, CURRENCY_META, FX_RATES } from "@/lib/finance/fx";
import { COMPANY } from "@/lib/finance/seed";
import { Card } from "@/components/finance/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { CurrencyCode } from "@/lib/finance/types";
import { LANGUAGES, useT, type Language } from "@/lib/finance/i18n";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { state, dispatch } = useFinance();
  const t = useT();

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <h3 className="text-sm font-semibold mb-4">{t("settings.company")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("settings.companyName")}><Input defaultValue={COMPANY.name} /></Field>
          <Field label={t("settings.industry")}><Input defaultValue={COMPANY.industry} /></Field>
          <Field label={t("settings.fiscalYear")}>
            <Select defaultValue={COMPANY.fiscalYearStart}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["January", "April", "July", "October"].map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("settings.baseCurrency")}>
            <Select value={state.currency} onValueChange={(v) => dispatch({ type: "SET_CURRENCY", currency: v as CurrencyCode })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_CURRENCIES.map((c) => (<SelectItem key={c} value={c}>{CURRENCY_META[c].flag} {c} — {CURRENCY_META[c].name}</SelectItem>))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-4">{t("settings.display")}</h3>
        <div className="space-y-3">
          <ToggleRow label={t("settings.darkMode")} description={t("settings.darkModeDesc")}
            checked={state.theme === "dark"}
            onChange={(v) => dispatch({ type: "SET_THEME", theme: v ? "dark" : "light" })} />
          <Field label={t("settings.language")}>
            <Select value={state.language} onValueChange={(v) => dispatch({ type: "SET_LANGUAGE", language: v as Language })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("settings.dateFormat")}>
            <Select defaultValue="DD/MM/YYYY">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="ISO">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("settings.numberFormat")}>
            <Select defaultValue="us">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="us">1,000.00</SelectItem>
                <SelectItem value="eu">1.000,00</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-4">{t("settings.fx")}</h3>
        <table className="w-full text-xs">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="py-2">Currency</th><th className="py-2">Active</th><th className="py-2 text-right">Rate (1 USD = …)</th>
          </tr></thead>
          <tbody>
            {ALL_CURRENCIES.map((c) => (
              <tr key={c} className="border-b border-border/60">
                <td className="py-2"><span className="mr-2">{CURRENCY_META[c].flag}</span>{c} — <span className="text-muted-foreground">{CURRENCY_META[c].name}</span></td>
                <td className="py-2"><Switch defaultChecked /></td>
                <td className="py-2 text-right tabular">{FX_RATES[c].toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-4">{t("settings.notifications")}</h3>
        <div className="space-y-3">
          <ToggleRow label="Overdue invoice alerts" description="Notify when invoices pass 30, 60 or 90 days." defaultChecked />
          <ToggleRow label="Cash runway warnings" description="Notify when runway drops below 3 months." defaultChecked />
          <ToggleRow label="Budget overrun alerts" description="Notify when any category exceeds budget by 10%." defaultChecked />
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({ label, description, checked, defaultChecked, onChange }: { label: string; description: string; checked?: boolean; defaultChecked?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/60 last:border-b-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} defaultChecked={defaultChecked} onCheckedChange={onChange} />
    </div>
  );
}
