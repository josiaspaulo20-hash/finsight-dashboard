import { Sidebar, MobileTabBar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Toaster } from "@/components/ui/sonner";
import { useFinance } from "@/lib/finance/context";
import { WifiOff } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { online } = useFinance();
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        {!online && (
          <div className="flex items-center gap-2 px-4 md:px-6 py-2 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 border-b border-amber-500/20">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span>
              Offline — showing read-only sample data. Changes won't be saved until connection is restored.
            </span>
          </div>
        )}
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 pb-24 md:pb-10 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
      <MobileTabBar />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
