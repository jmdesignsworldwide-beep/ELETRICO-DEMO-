"use client";

import { motion } from "framer-motion";
import { Plus, Receipt, Download, Send } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { invoiceStatusLabel, invoiceStatusStyle } from "@/lib/labels";
import { formatRD, formatDate } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

export function FacturacionView({ invoices }: { invoices: Invoice[] }) {
  const pending = invoices.filter((i) => i.status === "pendiente");
  const pendingTotal = pending.reduce((s, i) => s + i.total, 0);
  const paidTotal = invoices.filter((i) => i.status === "pagada").reduce((s, i) => s + i.total, 0);
  const itbisTotal = invoices.reduce((s, i) => s + i.itbis, 0);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {pending.length} pendientes · {formatRD(pendingTotal, { decimals: false })} por cobrar
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Facturación</h2>
          </div>
          <button className="btn-primary"><Plus className="h-4 w-4" />Nueva factura</button>
        </div>
      </Reveal>

      {invoices.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
          Aún no hay facturas. Conecta Supabase y aplica la migración con el seed.
        </div>
      ) : (
        <>
          <Reveal delay={0.04}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="glass-card p-4"><p className="text-xs text-slate-400">Cobrado</p><p className="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatRD(paidTotal, { decimals: false })}</p></div>
              <div className="glass-card p-4"><p className="text-xs text-slate-400">Por cobrar</p><p className="mt-1 text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{formatRD(pendingTotal, { decimals: false })}</p></div>
              <div className="glass-card col-span-2 p-4 sm:col-span-1"><p className="text-xs text-slate-400">ITBIS acumulado (18%)</p><p className="mt-1 text-xl font-bold tabular-nums">{formatRD(itbisTotal, { decimals: false })}</p></div>
            </div>
          </Reveal>

          <Stagger className="space-y-3">
            {invoices.map((inv) => (
              <StaggerItem key={inv.id}>
                <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="glass-card p-4 transition-shadow hover:shadow-card-light-hover sm:p-5">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-volt-500/10 ring-1 ring-inset ring-volt-500/20"><Receipt className="h-5 w-5 text-volt-500" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-400">{inv.number}</span>
                        <Badge className={invoiceStatusStyle[inv.status]}>{invoiceStatusLabel[inv.status]}</Badge>
                      </div>
                      <h3 className="mt-0.5 truncate font-semibold">{inv.clientName}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">NCF {inv.ncf} · {formatDate(inv.createdAt)}{inv.paymentMethod && ` · ${inv.paymentMethod}`}</p>
                    </div>
                    <div className="text-right"><p className="text-lg font-bold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(inv.total)}</p></div>
                    <div className="flex w-full items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06] sm:w-auto sm:border-0 sm:pt-0">
                      <button className="btn-ghost px-3 py-2 text-xs"><Download className="h-3.5 w-3.5" />PDF</button>
                      <button className="btn-ghost px-3 py-2 text-xs"><Send className="h-3.5 w-3.5" />Enviar</button>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </>
      )}

      <p className="text-center text-xs text-slate-400">
        Formato NCF simulado (B01/B02) para fines de demostración — sin e-CF real de DGII.
      </p>
    </div>
  );
}
