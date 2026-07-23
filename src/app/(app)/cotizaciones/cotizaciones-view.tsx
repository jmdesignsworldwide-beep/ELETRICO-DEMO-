"use client";

import { motion } from "framer-motion";
import { Plus, FileText, Share2, ArrowRightCircle } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { quoteStatusLabel, quoteStatusStyle } from "@/lib/labels";
import { formatRD, formatDate } from "@/lib/utils";
import type { Quote } from "@/lib/types";

export function CotizacionesView({ quotes }: { quotes: Quote[] }) {
  const approved = quotes.filter((q) => q.status === "aprobada").length;
  const sent = quotes.filter((q) => q.status === "enviada").length;
  const conversion = Math.round((approved / Math.max(quotes.length, 1)) * 100);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {sent} enviadas · {approved} aprobadas · {conversion}% conversión
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Cotizaciones</h2>
          </div>
          <button className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva cotización
          </button>
        </div>
      </Reveal>

      {quotes.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
          Aún no hay cotizaciones. Conecta Supabase y aplica la migración con el seed.
        </div>
      ) : (
        <Stagger className="space-y-3">
          {quotes.map((q) => (
            <StaggerItem key={q.id}>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="glass-card p-4 transition-shadow hover:shadow-card-light-hover sm:p-5"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-volt-500/10 ring-1 ring-inset ring-volt-500/20">
                    <FileText className="h-5 w-5 text-volt-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-400">{q.number}</span>
                      <Badge className={quoteStatusStyle[q.status]}>{quoteStatusLabel[q.status]}</Badge>
                    </div>
                    <h3 className="mt-0.5 truncate font-semibold">{q.clientName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Emitida {formatDate(q.createdAt)} · Válida hasta {formatDate(q.validUntil)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(q.total)}</p>
                    <p className="text-xs text-slate-400">ITBIS {formatRD(q.itbis, { decimals: false })}</p>
                  </div>
                  <div className="flex w-full items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06] sm:w-auto sm:border-0 sm:pt-0">
                    <button className="btn-ghost flex-1 px-3 py-2 text-xs sm:flex-none"><Share2 className="h-3.5 w-3.5" />WhatsApp</button>
                    {q.status === "aprobada" && (
                      <button className="btn-primary flex-1 px-3 py-2 text-xs sm:flex-none"><ArrowRightCircle className="h-3.5 w-3.5" />A orden</button>
                    )}
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
