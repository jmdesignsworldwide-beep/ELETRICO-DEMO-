"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CornerDownLeft, ShieldCheck } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

interface Cmd { href: string; label: string; group: string; icon: React.ElementType }

export function CommandPalette({ isOwner = false }: { isOwner?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Cmd[]>(() => {
    const base: Cmd[] = navItems.map((i) => ({ href: i.href, label: i.label, group: i.group, icon: i.icon }));
    if (isOwner) base.push({ href: "/cuentas", label: "Cuentas de demo", group: "JM Nexus", icon: ShieldCheck });
    return base;
  }, [isOwner]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(term) || c.group.toLowerCase().includes(term));
  }, [q, commands]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { if (open) { setQ(""); setActive(0); setTimeout(() => inputRef.current?.focus(), 40); } }, [open]);
  useEffect(() => { setActive(0); }, [q]);

  function go(href: string) { setOpen(false); router.push(href); }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active].href); }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/70 py-2 pl-3 pr-2 text-sm text-slate-400 transition-colors hover:border-volt-400 dark:border-white/10 dark:bg-white/[0.04] md:flex"
      >
        <Search className="h-4 w-4" />
        <span className="w-40 text-left">Buscar…</span>
        <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-white/10 dark:bg-white/5">⌘K</kbd>
      </button>
      <button onClick={() => setOpen(true)} aria-label="Buscar" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300 md:hidden">
        <Search className="h-[18px] w-[18px]" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }} transition={{ type: "spring", stiffness: 340, damping: 30 }} className="fixed left-1/2 top-[12vh] z-50 w-[92vw] max-w-lg -translate-x-1/2">
              <div className="glass-card overflow-hidden p-0">
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 dark:border-white/[0.06]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onInputKey} placeholder="Ir a un módulo…" className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400" />
                </div>
                <div className="max-h-[50vh] overflow-y-auto p-2">
                  {results.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-slate-400">Sin resultados para “{q}”.</p>
                  ) : (
                    results.map((c, i) => {
                      const Icon = c.icon;
                      return (
                        <button key={c.href} onClick={() => go(c.href)} onMouseEnter={() => setActive(i)}
                          className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm", i === active ? "bg-volt-500/10 text-ink-950 dark:text-white" : "text-slate-600 dark:text-slate-300")}>
                          <Icon className={cn("h-4 w-4 shrink-0", i === active ? "text-volt-600 dark:text-volt-400" : "text-slate-400")} />
                          <span className="flex-1">{c.label}</span>
                          <span className="text-[10px] uppercase tracking-wide text-slate-400">{c.group}</span>
                          {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-slate-400" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
