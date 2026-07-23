"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Printer, MessageCircle, Send, Ban, CheckCircle2, Loader2, PackageCheck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { formatRD, formatDate, cn } from "@/lib/utils";
import type { PurchaseOrderDetail } from "@/lib/types";
import { updatePurchaseOrderStatusAction, receivePurchaseOrderAction, type ReceiptInput } from "@/app/actions/purchase-orders";

const statusLabel: Record<string, string> = { borrador: "Borrador", enviada: "Enviada", recibida_parcial: "Recibida parcial", recibida: "Recibida", cancelada: "Cancelada" };
const statusStyle: Record<string, string> = {
  borrador: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/15 dark:text-slate-300",
  enviada: "bg-blue-50 text-blue-700 ring-blue-500/25 dark:bg-blue-500/15 dark:text-blue-300",
  recibida_parcial: "bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300",
  recibida: "bg-emerald-50 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelada: "bg-red-50 text-red-700 ring-red-500/25 dark:bg-red-500/15 dark:text-red-300",
};

export function OrdenCompraDetalleView({ po }: { po: PurchaseOrderDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const canReceive = po.status === "enviada" || po.status === "recibida_parcial";
  const canSend = po.status === "borrador";
  const canCancel = po.status !== "recibida" && po.status !== "cancelada";

  const waPhone = (po.supplierPhone ?? "").replace(/\D/g, "");
  const waMsg = encodeURIComponent(`Saludos, les compartimos la orden de compra ${po.number} de JM Electric por ${formatRD(po.total)}. Quedamos atentos. Gracias.`);
  const waLink = waPhone ? `https://wa.me/1${waPhone}?text=${waMsg}` : null;

  function setStatus(status: string) {
    startTransition(async () => { await updatePurchaseOrderStatusAction(po.id, status); router.refresh(); });
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-center justify-between">
          <Link href="/compras" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-volt-600 dark:text-slate-400"><ArrowLeft className="h-4 w-4" /> Volver a compras</Link>
          <div className="flex items-center gap-2">
            <a href={`/orden-compra/${po.id}`} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-2 text-xs"><Printer className="h-3.5 w-3.5" />PDF</a>
            {waLink && <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-2 text-xs"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.03}>
        <div className="glass-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-400">{po.number}</span>
                <Badge className={statusStyle[po.status] ?? statusStyle.borrador}>{statusLabel[po.status] ?? po.status}</Badge>
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-tight">{po.supplierName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{po.itemCount} materiales · {formatDate(po.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-2xl font-bold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(po.total)}</p>
            </div>
          </div>

          {(canSend || canCancel) && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
              {canSend && <button onClick={() => setStatus("enviada")} disabled={pending} className="btn-primary px-4 py-2 text-sm">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Marcar enviada</button>}
              {canCancel && <button onClick={() => setStatus("cancelada")} disabled={pending} className="btn-ghost px-4 py-2 text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"><Ban className="h-4 w-4" />Cancelar orden</button>}
            </div>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        {canReceive ? (
          <ReceiveForm po={po} onDone={() => router.refresh()} />
        ) : (
          <div className="glass-card p-5">
            <h3 className="mb-3 font-semibold">Materiales</h3>
            <ItemsTable po={po} />
          </div>
        )}
      </Reveal>
    </div>
  );
}

function ItemsTable({ po }: { po: PurchaseOrderDetail }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/[0.06]">
            <th className="py-2 pr-2 font-semibold">Material</th>
            <th className="px-2 py-2 text-center font-semibold">Pedido</th>
            <th className="px-2 py-2 text-center font-semibold">Recibido</th>
            <th className="py-2 pl-2 text-right font-semibold">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {po.items.map((it) => {
            const diff = it.qtyReceived - it.qtyOrdered;
            return (
              <tr key={it.id} className="border-b border-slate-50 last:border-0 dark:border-white/[0.03]">
                <td className="py-2.5 pr-2">
                  <p className="font-medium">{it.name}</p>
                  {it.discrepancyNote && <p className="text-xs text-amber-600 dark:text-amber-400">⚠ {it.discrepancyNote}</p>}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums">{it.qtyOrdered}</td>
                <td className="px-2 py-2.5 text-center tabular-nums">
                  {it.qtyReceived}
                  {diff !== 0 && <span className={cn("ml-1 text-xs", diff > 0 ? "text-emerald-500" : "text-red-500")}>({diff > 0 ? "+" : ""}{diff})</span>}
                </td>
                <td className="py-2.5 pl-2 text-right tabular-nums">{formatRD(it.qtyOrdered * it.unitPrice, { decimals: false })}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReceiveForm({ po, onDone }: { po: PurchaseOrderDetail; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<Record<string, { qty: number; note: string }>>(
    Object.fromEntries(po.items.map((it) => [it.id, { qty: it.qtyReceived || it.qtyOrdered, note: it.discrepancyNote ?? "" }]))
  );

  const set = (id: string, patch: Partial<{ qty: number; note: string }>) =>
    setReceipts((r) => ({ ...r, [id]: { ...r[id], ...patch } }));

  function submit() {
    setError(null);
    const payload: ReceiptInput[] = po.items.map((it) => ({
      itemId: it.id, qtyReceived: receipts[it.id].qty, note: receipts[it.id].note,
    }));
    startTransition(async () => {
      const res = await receivePurchaseOrderAction(po.id, payload);
      if (!res.ok) { setError(res.error ?? "No se pudo recibir."); return; }
      onDone();
    });
  }

  const field = "rounded-lg border border-slate-200 bg-white/70 px-2 py-1.5 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]";

  return (
    <div className="glass-card p-5">
      <h3 className="mb-1 flex items-center gap-2 font-semibold"><PackageCheck className="h-5 w-5 text-volt-500" />Recibir mercancía</h3>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Confirma lo recibido. Si difiere de lo pedido, la nota es obligatoria. Al confirmar, el inventario se actualiza.</p>

      <div className="space-y-3">
        {po.items.map((it) => {
          const rec = receipts[it.id];
          const discrepancy = rec.qty !== it.qtyOrdered;
          return (
            <div key={it.id} className="rounded-xl border border-slate-100 p-3 dark:border-white/[0.06]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0"><p className="truncate font-medium">{it.name}</p><p className="text-xs text-slate-400">Pedido: {it.qtyOrdered}</p></div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Recibido</label>
                  <input type="number" min={0} value={rec.qty} onChange={(e) => set(it.id, { qty: Math.max(0, Number(e.target.value)) })} className={cn(field, "w-20 text-center tabular-nums")} />
                </div>
              </div>
              {discrepancy && (
                <input value={rec.note} onChange={(e) => set(it.id, { note: e.target.value })} placeholder="Nota de discrepancia (obligatoria)…" className={cn(field, "mt-2 w-full border-amber-300 dark:border-amber-500/30")} />
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button onClick={submit} disabled={pending} className="btn-primary mt-4 w-full py-3">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{pending ? "Recibiendo…" : "Confirmar recepción"}</button>
    </div>
  );
}
