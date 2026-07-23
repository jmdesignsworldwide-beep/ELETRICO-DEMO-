"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Receipt, Printer, MessageCircle, Mail, Ban, Plus, Trash2,
  Loader2, CheckCircle2, Wrench, X,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { invoiceStatusLabel, invoiceStatusStyle } from "@/lib/labels";
import { formatRD, formatDate, cn } from "@/lib/utils";
import type { InvoiceDetail } from "@/lib/types";
import { registerPaymentAction, voidInvoiceAction, type PaymentInput } from "@/app/actions/invoices";

const METHODS = [
  { key: "efectivo", label: "Efectivo" },
  { key: "transferencia", label: "Transferencia" },
  { key: "debito", label: "Tarjeta débito" },
  { key: "credito", label: "Tarjeta crédito" },
];

interface PayLine extends PaymentInput {
  key: string;
}

const cents = (n: number) => Math.round(n * 100);

export function FacturaDetalleView({ invoice }: { invoice: InvoiceDetail }) {
  const isPending = invoice.status === "pendiente";
  const waMessage = encodeURIComponent(
    `Hola ${invoice.clientName}, le compartimos su factura ${invoice.number} de JM Electric por ${formatRD(invoice.total)}. ¡Gracias por su preferencia!`
  );
  const waPhone = (invoice.clientPhone ?? "").replace(/\D/g, "");
  const waLink = waPhone ? `https://wa.me/1${waPhone}?text=${waMessage}` : null;
  const mailLink = `mailto:?subject=${encodeURIComponent(`Factura ${invoice.number} — JM Electric`)}&body=${waMessage}`;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-center justify-between">
          <Link href="/facturacion" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-volt-600 dark:text-slate-400">
            <ArrowLeft className="h-4 w-4" /> Volver a facturación
          </Link>
          <div className="flex items-center gap-2">
            <a href={`/factura/${invoice.id}`} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-2 text-xs"><Printer className="h-3.5 w-3.5" />PDF</a>
            {waLink && <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-2 text-xs"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>}
            <a href={mailLink} className="btn-ghost px-3 py-2 text-xs"><Mail className="h-3.5 w-3.5" />Correo</a>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Documento */}
        <Reveal delay={0.03} className="lg:col-span-2">
          <div className="glass-card overflow-hidden p-0">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-br from-volt-500/5 to-transparent p-6 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-volt-gradient text-ink-950 shadow-glow">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight">JM <span className="text-volt-500">Electric</span></p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Servicios eléctricos · RNC 1-31-00000-0</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className={invoiceStatusStyle[invoice.status]}>{invoiceStatusLabel[invoice.status]}</Badge>
                <p className="mt-1 font-mono text-sm font-semibold">{invoice.number}</p>
                <p className="text-xs text-slate-400">NCF {invoice.ncf}</p>
              </div>
            </div>

            <div className="grid gap-4 border-b border-slate-100 p-6 dark:border-white/[0.06] sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Facturar a</p>
                <p className="mt-0.5 font-semibold">{invoice.clientName}</p>
                {invoice.clientAddress && <p className="text-sm text-slate-500 dark:text-slate-400">{invoice.clientAddress}</p>}
                {invoice.clientPhone && <p className="text-sm text-slate-500 dark:text-slate-400">{invoice.clientPhone}</p>}
              </div>
              <div className="sm:text-right">
                <p className="text-xs uppercase tracking-wide text-slate-400">Fecha</p>
                <p className="mt-0.5 font-medium">{formatDate(invoice.createdAt)}</p>
                {invoice.orderNumber && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Orden {invoice.orderNumber}</p>
                )}
              </div>
            </div>

            <div className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/[0.06]">
                    <th className="pb-2 font-semibold">Descripción</th>
                    <th className="pb-2 text-center font-semibold">Cant.</th>
                    <th className="pb-2 text-right font-semibold">Precio</th>
                    <th className="pb-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.length === 0 ? (
                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Sin líneas de detalle.</td></tr>
                  ) : (
                    invoice.items.map((it) => (
                      <tr key={it.id} className="border-b border-slate-50 dark:border-white/[0.03]">
                        <td className="py-2.5 pr-2 font-medium">{it.description}</td>
                        <td className="py-2.5 text-center tabular-nums text-slate-500">{it.qty}</td>
                        <td className="py-2.5 text-right tabular-nums text-slate-500">{formatRD(it.unitPrice, { decimals: false })}</td>
                        <td className="py-2.5 text-right tabular-nums font-medium">{formatRD(it.lineTotal, { decimals: false })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Subtotal</span><span className="tabular-nums">{formatRD(invoice.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">ITBIS 18%</span><span className="tabular-nums">{formatRD(invoice.itbis)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-bold dark:border-white/10"><span>Total</span><span className="tabular-nums text-volt-600 dark:text-volt-400">{formatRD(invoice.total)}</span></div>
              </div>
            </div>

            {invoice.status === "anulada" && invoice.voidReason && (
              <div className="border-t border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
                <span className="font-semibold">Factura anulada:</span> {invoice.voidReason}
                {invoice.voidedAt && <span className="text-red-500/70"> · {formatDate(invoice.voidedAt)}</span>}
              </div>
            )}
          </div>
        </Reveal>

        {/* Panel de cobro / estado */}
        <div className="space-y-4">
          {isPending ? (
            <Reveal delay={0.05}><PaymentPanel invoice={invoice} /></Reveal>
          ) : invoice.status === "pagada" ? (
            <Reveal delay={0.05}>
              <div className="glass-card p-5">
                <div className="mb-3 flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" /> Factura pagada
                </div>
                {invoice.paidAt && <p className="mb-3 text-xs text-slate-400">Cobrada el {formatDate(invoice.paidAt)}</p>}
                <div className="space-y-2">
                  {invoice.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-white/[0.03]">
                      <span className="capitalize text-slate-600 dark:text-slate-300">
                        {p.method}{p.voucher && <span className="ml-1 text-xs text-slate-400">#{p.voucher}</span>}
                      </span>
                      <span className="font-semibold tabular-nums">{formatRD(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ) : null}

          {invoice.status !== "anulada" && (
            <Reveal delay={0.07}><VoidPanel invoiceId={invoice.id} /></Reveal>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentPanel({ invoice }: { invoice: InvoiceDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<PayLine[]>([
    { key: "p0", method: "efectivo", amount: invoice.total, received: undefined, voucher: "" },
  ]);

  const applied = useMemo(() => lines.reduce((s, l) => s + (Number(l.amount) || 0), 0), [lines]);
  const remaining = invoice.total - applied;
  const balanced = cents(applied) === cents(invoice.total);

  const update = (key: string, patch: Partial<PayLine>) =>
    setLines((l) => l.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const addLine = () =>
    setLines((l) => [...l, { key: `p${l.length}-${cents(applied)}`, method: "efectivo", amount: Math.max(remaining, 0), voucher: "", received: undefined }]);
  const removeLine = (key: string) => setLines((l) => (l.length > 1 ? l.filter((x) => x.key !== key) : l));

  function submit() {
    setError(null);
    startTransition(async () => {
      const payload: PaymentInput[] = lines.map((l) => ({
        method: l.method,
        amount: Number(l.amount),
        voucher: l.method === "transferencia" ? l.voucher : undefined,
        received: l.method === "efectivo" ? l.received : undefined,
      }));
      const res = await registerPaymentAction(invoice.id, payload);
      if (!res.ok) { setError(res.error ?? "No se pudo registrar el pago."); return; }
      router.refresh();
    });
  }

  const field = "w-full rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]";

  return (
    <div className="glass-card p-5">
      <h3 className="mb-1 flex items-center gap-2 font-semibold"><Receipt className="h-5 w-5 text-volt-500" />Registrar cobro</h3>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Total a cobrar: <span className="font-semibold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(invoice.total)}</span></p>

      <div className="space-y-3">
        {lines.map((l, idx) => (
          <div key={l.key} className="rounded-xl border border-slate-100 p-3 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <select value={l.method} onChange={(e) => update(l.key, { method: e.target.value })} className={cn(field, "flex-1")}>
                {METHODS.map((m) => (<option key={m.key} value={m.key}>{m.label}</option>))}
              </select>
              {lines.length > 1 && (
                <button onClick={() => removeLine(l.key)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500" aria-label="Quitar"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <label className="w-16 shrink-0 text-xs text-slate-400">Monto</label>
              <input type="number" min={0} step="0.01" value={l.amount || ""} onChange={(e) => update(l.key, { amount: Math.max(0, Number(e.target.value)) })} className={cn(field, "tabular-nums")} />
            </div>
            {l.method === "efectivo" && (
              <div className="mt-2 flex items-center gap-2">
                <label className="w-16 shrink-0 text-xs text-slate-400">Recibido</label>
                <input type="number" min={0} step="0.01" value={l.received ?? ""} placeholder="Efectivo entregado" onChange={(e) => update(l.key, { received: e.target.value ? Number(e.target.value) : undefined })} className={cn(field, "tabular-nums")} />
                {l.received != null && l.received >= Number(l.amount) && (
                  <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Devuelta {formatRD(l.received - Number(l.amount), { decimals: false })}</span>
                )}
              </div>
            )}
            {l.method === "transferencia" && (
              <div className="mt-2 flex items-center gap-2">
                <label className="w-16 shrink-0 text-xs text-slate-400">Voucher</label>
                <input value={l.voucher ?? ""} onChange={(e) => update(l.key, { voucher: e.target.value })} placeholder="No. de voucher" className={field} />
              </div>
            )}
            {idx === lines.length - 1 && (
              <button onClick={addLine} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-volt-600 hover:underline dark:text-volt-400"><Plus className="h-3 w-3" />Agregar método (pago mixto)</button>
            )}
          </div>
        ))}
      </div>

      <div className={cn("mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-sm", balanced ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>
        <span>{balanced ? "Cuadra exacto" : remaining > 0 ? "Falta por aplicar" : "Excede el total"}</span>
        <span className="font-semibold tabular-nums">{balanced ? formatRD(applied) : formatRD(Math.abs(remaining))}</span>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button onClick={submit} disabled={pending || !balanced} className="btn-primary mt-4 w-full py-3">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {pending ? "Registrando…" : "Confirmar pago"}
      </button>
    </div>
  );
}

function VoidPanel({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await voidInvoiceAction(invoiceId, motivo);
      if (!res.ok) { setError(res.error ?? "No se pudo anular."); return; }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost w-full py-2.5 text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400">
        <Ban className="h-4 w-4" /> Anular factura
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
              <div className="glass-card p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-red-600 dark:text-red-400"><Ban className="h-5 w-5" />Anular factura</h3>
                  <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
                </div>
                <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">La anulación es permanente y queda registrada en la bitácora. El motivo es obligatorio.</p>
                <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la anulación…" className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 dark:border-white/10 dark:bg-white/[0.04]" />
                {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setOpen(false)} className="btn-ghost">Cancelar</button>
                  <button onClick={confirm} disabled={pending} className="btn-primary bg-red-500 text-white hover:bg-red-600" style={{ background: "#ef4444" }}>
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}Anular
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
