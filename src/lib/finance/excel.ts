import * as XLSX from "xlsx";
import type { CompanySnapshot } from "./companies";
import type { Invoice, CurrencyCode } from "./types";

export function snapshotToWorkbook(snapshot: CompanySnapshot): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const profileRows = [
    { Field: "version", Value: snapshot.version },
    { Field: "name", Value: snapshot.profile.name },
    { Field: "industry", Value: snapshot.profile.industry },
    { Field: "baseCurrency", Value: snapshot.profile.baseCurrency },
    { Field: "fiscalYearStart", Value: snapshot.profile.fiscalYearStart },
    { Field: "activeMonth", Value: snapshot.activeMonth },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profileRows), "Profile");

  const invoiceRows = snapshot.invoices.map((i) => ({
    id: i.id,
    invoiceNumber: i.invoiceNumber,
    clientId: i.clientId,
    issueDate: i.issueDate,
    dueDate: i.dueDate,
    amount: i.amount,
    currency: i.currency,
    status: i.status,
    daysOverdue: i.daysOverdue,
    notes: i.notes ?? "",
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(invoiceRows, {
      header: [
        "id", "invoiceNumber", "clientId", "issueDate", "dueDate",
        "amount", "currency", "status", "daysOverdue", "notes",
      ],
    }),
    "Invoices",
  );

  const alertRows = snapshot.dismissedAlerts.map((id) => ({ id }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(alertRows, { header: ["id"] }),
    "DismissedAlerts",
  );

  return wb;
}

export function snapshotToXlsxBlob(snapshot: CompanySnapshot): Blob {
  const wb = snapshotToWorkbook(snapshot);
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function workbookFromFile(file: File): Promise<XLSX.WorkBook> {
  const buf = await file.arrayBuffer();
  return XLSX.read(buf, { type: "array" });
}

function getSheet(wb: XLSX.WorkBook, name: string): XLSX.WorkSheet | undefined {
  const found = wb.SheetNames.find((n) => n.toLowerCase() === name.toLowerCase());
  return found ? wb.Sheets[found] : undefined;
}

export function workbookToSnapshot(wb: XLSX.WorkBook): CompanySnapshot | null {
  const profileSheet = getSheet(wb, "Profile");
  const invoiceSheet = getSheet(wb, "Invoices");
  if (!profileSheet || !invoiceSheet) return null;

  const profileRows = XLSX.utils.sheet_to_json<{ Field: string; Value: unknown }>(profileSheet);
  const p = new Map(profileRows.map((r) => [String(r.Field), r.Value]));

  const name = String(p.get("name") ?? "Imported Company");
  const industry = String(p.get("industry") ?? "—");
  const baseCurrency = String(p.get("baseCurrency") ?? "USD") as CurrencyCode;
  const fiscalYearStart = String(p.get("fiscalYearStart") ?? "January");
  const activeMonth = Number(p.get("activeMonth") ?? 11);

  const invoiceRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(invoiceSheet);
  const invoices: Invoice[] = invoiceRaw.map((r) => ({
    id: String(r.id ?? crypto.randomUUID()),
    invoiceNumber: String(r.invoiceNumber ?? ""),
    clientId: String(r.clientId ?? ""),
    issueDate: String(r.issueDate ?? ""),
    dueDate: String(r.dueDate ?? ""),
    amount: Number(r.amount ?? 0),
    currency: String(r.currency ?? "USD") as CurrencyCode,
    status: (String(r.status ?? "pending")) as Invoice["status"],
    daysOverdue: Number(r.daysOverdue ?? 0),
    notes: r.notes ? String(r.notes) : undefined,
  }));

  const alertSheet = getSheet(wb, "DismissedAlerts");
  const dismissedAlerts = alertSheet
    ? XLSX.utils
        .sheet_to_json<{ id?: unknown }>(alertSheet)
        .map((r) => String(r.id ?? ""))
        .filter(Boolean)
    : [];

  return {
    version: 1,
    profile: { name, industry, baseCurrency, fiscalYearStart },
    invoices,
    dismissedAlerts,
    activeMonth: Number.isFinite(activeMonth) ? activeMonth : 11,
  };
}