"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, Bell, LogOut, Clock, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { Footer } from "@/components/footer";
import { navItems } from "@/lib/nav";
import { initials } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth-actions";

interface Props {
  children: React.ReactNode;
  isOwner?: boolean;
  demoDaysRemaining?: number | null;
  userName?: string;
}

export function AppShell({ children, isOwner = false, demoDaysRemaining = null, userName }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const ownerItem = isOwner && pathname.startsWith("/cuentas");
  const current = navItems.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
  const name = userName || "Usuario";
  const showBanner = demoDaysRemaining !== null && demoDaysRemaining >= 0 && demoDaysRemaining <= 5;

  return (
    <div className="app-bg min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/[0.06] dark:bg-ink-900/60 lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200/70 px-5 dark:border-white/[0.06]">
          <Link href="/dashboard"><Logo glow /></Link>
        </div>
        <div className="flex-1 overflow-y-auto"><SidebarNav isOwner={isOwner} /></div>
        <div className="border-t border-slate-200/70 p-3 dark:border-white/[0.06]"><LogoutButton /></div>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm lg:hidden" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 380, damping: 38 }} className="fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-xs flex-col border-r border-slate-200/70 bg-white dark:border-white/[0.06] dark:bg-ink-900 lg:hidden">
              <div className="flex h-16 items-center justify-between border-b border-slate-200/70 px-5 dark:border-white/[0.06]">
                <Logo glow />
                <button onClick={() => setMobileOpen(false)} aria-label="Cerrar menú" className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto"><SidebarNav isOwner={isOwner} onNavigate={() => setMobileOpen(false)} /></div>
              <div className="border-t border-slate-200/70 p-3 dark:border-white/[0.06]"><LogoutButton /></div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/70 px-4 backdrop-blur-xl dark:border-white/[0.06] dark:bg-ink-950/60 sm:px-6">
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300 lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight sm:text-lg">{ownerItem ? "Cuentas de demo" : current?.label}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input placeholder="Buscar…" className="w-56 rounded-xl border border-slate-200 bg-white/70 py-2 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:w-64 focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]" />
            </div>
            <button aria-label="Notificaciones" className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"><Bell className="h-[18px] w-[18px]" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-volt-500 ring-2 ring-white dark:ring-ink-950" /></button>
            <ThemeToggle />
            <div className="ml-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/60 py-1 pl-1 pr-3 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-volt-gradient text-xs font-bold text-ink-950">{initials(name)}</div>
              <div className="hidden text-left leading-tight sm:block">
                <div className="text-xs font-semibold">{name}</div>
                <div className="text-[10px] text-slate-400">{isOwner ? "Propietaria" : "Cuenta demo"}</div>
              </div>
            </div>
          </div>
        </header>

        {showBanner && (
          <div className="flex items-center justify-center gap-2 border-b border-volt-500/20 bg-volt-500/10 px-4 py-2 text-center text-xs font-medium text-volt-700 dark:text-volt-300">
            <Clock className="h-3.5 w-3.5" />
            Tu demo {demoDaysRemaining === 0 ? "expira hoy" : `expira en ${demoDaysRemaining} día${demoDaysRemaining === 1 ? "" : "s"}`} · contacta a JM Nexus Designs para renovar
          </div>
        )}

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function logout() {
    startTransition(async () => { await signOutAction(); router.push("/"); router.refresh(); });
  }
  return (
    <button onClick={logout} disabled={pending} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-slate-400">
      {pending ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <LogOut className="h-[18px] w-[18px]" />}
      Cerrar sesión
    </button>
  );
}
