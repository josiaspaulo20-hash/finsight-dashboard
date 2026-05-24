import { useState } from "react";
import { Building2, Plus, Check, Trash2, WifiOff } from "lucide-react";
import { useFinance } from "@/lib/finance/context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function CompanySwitcher() {
  const {
    companies,
    activeCompany,
    switchCompany,
    createCompany,
    deleteCompanyById,
    online,
  } = useFinance();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"sample" | "blank">("sample");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createCompany(name.trim(), kind);
      toast.success(`Created “${name.trim()}”`);
      setOpen(false);
      setName("");
      setKind("sample");
    } catch (e) {
      toast.error("Could not create company");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete “${label}”? This cannot be undone.`)) return;
    try {
      await deleteCompanyById(id);
      toast.success(`Deleted “${label}”`);
    } catch {
      toast.error("Could not delete");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 max-w-[200px]"
            aria-label="Switch company"
          >
            {online ? (
              <Building2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            )}
            <span className="text-xs font-medium truncate">
              {activeCompany?.name ?? (online ? "Select company" : "Offline demo")}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Companies</DropdownMenuLabel>
          {!online && (
            <div className="px-3 py-2 text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
              <WifiOff className="h-3 w-3 mt-0.5 shrink-0" />
              <span>Offline — showing read-only sample data.</span>
            </div>
          )}
          {companies.length === 0 && online && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No companies yet.</div>
          )}
          {companies.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onSelect={(e) => {
                e.preventDefault();
                switchCompany(c.id);
              }}
              className="group flex items-center gap-2"
            >
              <Check
                className={
                  "h-3.5 w-3.5 " +
                  (c.id === activeCompany?.id ? "opacity-100" : "opacity-0")
                }
              />
              <span className="flex-1 truncate">{c.name}</span>
              {c.is_sample && (
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  sample
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(c.id, c.name);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-1 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${c.name}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!online}
            onSelect={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            New company…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new company</DialogTitle>
            <DialogDescription>
              Start with realistic sample data or a blank ledger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cname">Company name</Label>
              <Input
                id="cname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc."
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKind("sample")}
                className={
                  "rounded-md border p-3 text-left transition-colors " +
                  (kind === "sample"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40")
                }
              >
                <div className="text-sm font-medium">Sample data</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Clients, invoices, 12 months of history.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setKind("blank")}
                className={
                  "rounded-md border p-3 text-left transition-colors " +
                  (kind === "blank"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40")
                }
              >
                <div className="text-sm font-medium">Blank</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Empty invoice ledger. Charts use reference data.
                </div>
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={busy || !name.trim()}>
              {busy ? "Creating…" : "Create company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}