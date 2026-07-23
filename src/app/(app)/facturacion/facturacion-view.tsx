"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Receipt, ChevronRight, X, Loader2 } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { invoiceStatusLabel, invoiceStatusStyle } from "@/lib/labels";
import { formatRD, formatDate } from "@/lib/utils";
import type { Invoice, Client } from "@/lib/types";
import { createInvoiceAction } from "@/app/actions/invoices";

export function FacturacionView({ invoices, clients }: { invoices: Invoice[]; clients: Client[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const pending = invoices.filter((i) => i.status === "pendiente");
  const pendingTotal = pending.reduce((s, i) => s + i.total, 0);
  const paidTotal = invoices.filter((i) => i.status === "pagada").reduce((s, i) => s + i.total, 0);
  const itbisTotal = invoices.filter((i) => i.status !== "anulada").reduce((s, i) => s + i.itbis, 0);

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
          <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="h-4 w-4" />Nueva factura</button>
        </div>
      </Reveal>

      {invoices.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
          Aún no hay facturas. Genera una desde el cierre de una orden o crea una manual.
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
                <Link href={`/facturacion/${inv.id}`}>
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
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                    </div>
                  </motion.div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </>
      )}

      <p className="text-center text-xs text-slate-400">
        Formato NCF simulado (B01/B02) para fines de demostración — sin e-CF real de DGII.
      </p>

      <AnimatePresence>
        {modalOpen && <NewInvoiceModal clients={clients} onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function NewInvoiceModal({ clients, onClose }: { clients: Client[]; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const itbis = Math.round(subtotal * 0.18 * 100) / 100;
  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createInvoiceAction({ clientId, description, subtotal });
      if (!res.ok) { setError(res.error ?? "No se pudo crear."); return; }
      router.refresh();
      onClose();
    });
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
        <form onSubmit={submit} className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Nueva factura</h3>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3">
            <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className={field}>
              {clients.length === 0 && <option value="">Sin clientes</option>}
              {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <input required placeholder="Concepto / descripción" className={field} value={description} onChange={(e) => setDescription(e.target.value)} />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Subtotal (antes de ITBIS)</label>
              <input required type="number" min={1} step="0.01" className={field} value={subtotal || ""} onChange={(e) => setSubtotal(Math.max(0, Number(e.target.value)))} />
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/[0.03]">
              <div className="flex justify-between"><span className="text-slate-500">ITBIS 18%</span><span className="tabular-nums">{formatRD(itbis)}</span></div>
              <div className="mt-1 flex justify-between font-semibold"><span>Total</span><span className="tabular-nums text-volt-600 dark:text-volt-400">{formatRD(subtotal + itbis)}</span></div>
            </div>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={pending || !clientId} className="btn-primary">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? "Creando…" : "Crear factura"}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
