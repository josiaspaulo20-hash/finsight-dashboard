import { Sidebar, MobileTabBar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Toaster } from "@/components/ui/sonner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 pb-24 md:pb-10 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
      <MobileTabBar />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
