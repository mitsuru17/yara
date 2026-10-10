import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { Brand } from "@/components/logo";
import { getSession } from "@/lib/session";

async function SessionShell({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await getSession();

  let unread = 0;
  if (profile) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false);
    unread = count ?? 0;
  }

  return (
    <AppShell profile={profile} unreadCount={unread}>
      {children}
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <SessionShell>{children}</SessionShell>
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6 px-4 py-10 sm:px-8">
      <div className="h-10 w-2/3 rounded-xl bg-slate-100" />
      <div className="h-5 w-1/2 rounded-lg bg-slate-100" />
      <div className="h-64 rounded-2xl bg-slate-100" />
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center justify-between border-b border-line px-4 lg:h-[76px] lg:px-8">
        <Brand compact />
        <span className="h-10 w-28 animate-pulse rounded-full bg-slate-100" />
      </header>
      <div className="flex">
        <aside className="hidden h-[calc(100vh-76px)] w-72 shrink-0 border-r border-line bg-canvas lg:block" />
        <div className="flex-1">
          <PageSkeleton />
        </div>
      </div>
    </div>
  );
}
