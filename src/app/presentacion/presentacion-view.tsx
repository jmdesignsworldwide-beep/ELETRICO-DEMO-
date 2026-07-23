"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Star, Zap } from "lucide-react";
import { BeforeAfter } from "@/components/before-after";
import type { PortfolioWork } from "@/lib/types";

export function PresentacionView({ works }: { works: PortfolioWork[] }) {
  const [i, setI] = useState(0);
  if (works.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-950 px-6 text-center text-slate-400">
        <div>
          <Zap className="mx-auto mb-3 h-10 w-10 text-volt-500" fill="currentColor" />
          <p>No hay trabajos visibles en el portafolio todavía.</p>
        </div>
      </div>
    );
  }
  const w = works[i];
  const prev = () => setI((v) => (v - 1 + works.length) % works.length);
  const next = () => setI((v) => (v + 1) % works.length);

  return (
    <div className="flex min-h-screen flex-col bg-ink-950 text-white">
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-volt-gradient text-ink-950"><Zap className="h-4 w-4" fill="currentColor" /></div>
          <span className="text-sm font-bold">JM <span className="text-volt-500">Electric</span></span>
        </div>
        <a href="/portafolio" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Salir"><X className="h-5 w-5" /></a>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div key={w.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
              <div className="overflow-hidden rounded-3xl shadow-glow-lg ring-1 ring-white/10">
                <BeforeAfter id={w.id} beforeUrl={w.beforeUrl} afterUrl={w.afterUrl} className="aspect-[4/3]" />
              </div>
              <div className="mt-5 text-center">
                <div className="mb-1 flex items-center justify-center gap-2">
                  {w.favorite && <Star className="h-4 w-4 fill-volt-500 text-volt-500" />}
                  <span className="text-xs font-semibold uppercase tracking-widest text-volt-500">{w.categoryLabel}</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{w.title}</h1>
                {w.description && <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">{w.description}</p>}
                {w.technicianName && <p className="mt-2 text-xs text-slate-500">Ejecutado por {w.technicianName}</p>}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button onClick={prev} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-white transition-colors hover:bg-white/5" aria-label="Anterior"><ChevronLeft className="h-5 w-5" /></button>
            <div className="flex gap-1.5">
              {works.map((_, idx) => (
                <button key={idx} onClick={() => setI(idx)} className={idx === i ? "h-2 w-6 rounded-full bg-volt-500" : "h-2 w-2 rounded-full bg-white/20"} aria-label={`Ir a ${idx + 1}`} />
              ))}
            </div>
            <button onClick={next} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-white transition-colors hover:bg-white/5" aria-label="Siguiente"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <p className="mt-4 text-center text-xs text-slate-600">Desliza el comparador para ver el antes y después</p>
        </div>
      </div>

      <footer className="pb-5 text-center text-xs text-slate-600">Diseñado por JM Nexus Designs</footer>
    </div>
  );
}
