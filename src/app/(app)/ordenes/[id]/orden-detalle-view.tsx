"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Calendar, MapPin, Package, Plus, Loader2, CheckCircle2,
  Receipt, FileText, Lightbulb, AlertTriangle,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { orderStatusLabel, orderStatusStyle, serviceTypeLabel, priorityLabel, priorityStyle } from "@/lib/labels";
import { formatRD, formatDate, daysUntil, cn } from "@/lib/utils";
import type { OrderDetail, InventoryItem } from "@/lib/types";
import { registerMaterialAction, closeOrderAction, convertOrderToInvoiceAction } from "@/app/actions/orders";

const CLOSED = ["completada", "facturada", "pagada", "cancelada"];

export function OrdenDetalleView({ order, inventory, now }: { order: OrderDetail; inventory: InventoryItem[]; now: number }) {
  const router = useRouter();
  const days = daysUntil(order.estimatedEndDate, now);
  const overdue = days < 0 && !CLOSED.includes(order.status);
  const materialsTotal = order.materials.reduce((s, m) => s + m.qtyUsed * m.unitPrice, 0);
  const canInvoice = order.status === "completada" && !order.invoiceId;

  return (
    <div className="space-y-6">
      <Reveal>
        <Link href="/ordenes" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-volt-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Volver a órdenes
        </Link>
      </Reveal>

      <Reveal delay={0.03}>
        <div className="glass-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-400">{order.number}</span>
                <Badge className={orderStatusStyle[order.status]}>{orderStatusLabel[order.status]}</Badge>
                <Badge className={priorityStyle[order.priority]}>{priorityLabel[order.priority]}</Badge>
                {overdue && <span className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400"><AlertTriangle className="h-3.5 w-3.5" />Vencida hace {Math.abs(days)}d</span>}
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-tight">{order.clientName}</h2>
              <p className="text-sm text-volt-600 dark:text-volt-400">{serviceTypeLabel[order.serviceType]}</p>
            </div>
            {order.total > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-400">Monto estimado</p>
                <p className="text-2xl font-bold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(order.total, { decimals: false })}</p>
              </div>
            )}
          </div>

          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{order.description}</p>

          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 dark:border-white/[0.06] dark:text-slate-400 sm:grid-cols-3">
            <span className="flex items-center gap-2"><User className="h-4 w-4" />{order.technicianNames.length ? order.technicianNames.join(", ") : "Sin asignar"}</span>
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" />{formatDate(order.scheduledDate)}</span>
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span className="line-clamp-1">{order.address || "Sin dirección"}</span></span>
          </div>

          {order.invoiceId && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-300">
              <Receipt className="h-4 w-4" /> Esta orden ya fue facturada.
              <Link href="/facturacion" className="ml-auto font-semibold hover:underline">Ver factura</Link>
            </div>
          )}
        </div>
      </Reveal>

      {/* Materiales usados vs estimados */}
      <Reveal delay={0.05}>
        <MaterialsSection order={order} inventory={inventory} materialsTotal={materialsTotal} />
      </Reveal>

      {/* Cierre de orden */}
      {!CLOSED.includes(order.status) && (
        <Reveal delay={0.07}>
          <CloseForm orderId={order.id} onDone={() => router.refresh()} />
        </Reveal>
      )}

      {/* Resumen de cierre si ya está cerrada */}
      {order.finalNotes && (
        <Reveal delay={0.07}>
          <div className="glass-card space-y-4 p-5">
            <div>
              <h3 className="mb-1 flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-volt-500" />Descripción final</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{order.finalNotes}</p>
            </div>
            {order.recommendations && (
              <div>
                <h3 className="mb-1 flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-volt-500" />Recomendaciones al cliente</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{order.recommendations}</p>
              </div>
            )}
          </div>
        </Reveal>
      )}

      {/* Convertir a factura */}
      {canInvoice && (
        <Reveal delay={0.09}>
          <InvoiceButton orderId={order.id} />
        </Reveal>
      )}
    </div>
  );
}

function MaterialsSection({ order, inventory, materialsTotal }: { order: OrderDetail; inventory: InventoryItem[]; materialsTotal: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [itemId, setItemId] = useState(inventory[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const editable = !["facturada", "pagada", "cancelada"].includes(order.status);

  function add() {
    setError(null);
    if (!itemId) return;
    startTransition(async () => {
      const res = await registerMaterialAction(order.id, itemId, qty);
      if (!res.ok) { setError(res.error ?? "No se pudo registrar."); return; }
      setQty(1);
      router.refresh();
    });
  }

  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold"><Package className="h-5 w-5 text-volt-500" />Materiales</h3>
        <span className="text-sm text-slate-400">Total usado: <span className="font-semibold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(materialsTotal, { decimals: false })}</span></span>
      </div>

      {order.materials.length === 0 ? (
        <p className="py-4 text-sm text-slate-400">Aún no se han registrado materiales.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/[0.06]">
                <th className="py-2 pr-2 font-semibold">Material</th>
                <th className="px-2 py-2 text-center font-semibold">Est.</th>
                <th className="px-2 py-2 text-center font-semibold">Usado</th>
                <th className="py-2 pl-2 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.materials.map((m) => {
                const diff = m.qtyUsed - m.qtyEstimated;
                return (
                  <tr key={m.id} className="border-b border-slate-50 last:border-0 dark:border-white/[0.03]">
                    <td className="py-2.5 pr-2 font-medium">{m.name}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-slate-400">{m.qtyEstimated || "—"}</td>
                    <td className="px-2 py-2.5 text-center">
                      <span className="tabular-nums font-semibold">{m.qtyUsed}</span>
                      {m.qtyEstimated > 0 && diff !== 0 && (
                        <span className={cn("ml-1 text-xs", diff > 0 ? "text-red-500" : "text-emerald-500")}>({diff > 0 ? "+" : ""}{diff})</span>
                      )}
                    </td>
                    <td className="py-2.5 pl-2 text-right tabular-nums">{formatRD(m.qtyUsed * m.unitPrice, { decimals: false })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editable && inventory.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Registrar material usado (descuenta inventario)</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]">
              {inventory.map((i) => (<option key={i.id} value={i.id}>{i.name} · stock {i.stock}</option>))}
            </select>
            <div className="flex gap-2">
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="w-20 rounded-lg border border-slate-200 bg-white/70 px-2 py-2 text-center text-sm tabular-nums outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]" />
              <button onClick={add} disabled={pending} className="btn-primary px-4 py-2 text-sm">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Agregar
              </button>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}

function CloseForm({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [recs, setRecs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await closeOrderAction(orderId, notes, recs);
      if (!res.ok) { setError(res.error ?? "No se pudo cerrar."); return; }
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="glass-card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 text-emerald-500" />Cerrar orden</h3>
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Descripción final del trabajo *</label>
          <textarea required rows={3} className={field} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Qué se hizo, estado final, pruebas realizadas…" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Recomendaciones al cliente</label>
          <textarea rows={2} className={field} value={recs} onChange={(e) => setRecs(e.target.value)} placeholder="Sugerencias, próximos mantenimientos…" />
        </div>
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary mt-4 w-full py-3">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {pending ? "Cerrando…" : "Marcar como completada"}
      </button>
    </form>
  );
}

function InvoiceButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function convert() {
    setError(null);
    startTransition(async () => {
      const res = await convertOrderToInvoiceAction(orderId);
      if (!res.ok) { setError(res.error ?? "No se pudo facturar."); return; }
      router.push("/facturacion");
      router.refresh();
    });
  }

  return (
    <motion.div whileHover={{ y: -2 }} className="glass-card p-5 ring-1 ring-inset ring-volt-500/20">
      <h3 className="mb-1 flex items-center gap-2 font-semibold"><Receipt className="h-5 w-5 text-volt-500" />Convertir a factura</h3>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Genera la factura con NCF simulado e ITBIS 18% en un clic.</p>
      <button onClick={convert} disabled={pending} className="btn-primary w-full py-3">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
        {pending ? "Generando…" : "Generar factura"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </motion.div>
  );
}
