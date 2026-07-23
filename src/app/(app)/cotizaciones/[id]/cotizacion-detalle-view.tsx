"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Printer, MessageCircle, Mail, Wrench, ArrowRightCircle, Loader2, CheckCircle2,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { quoteStatusLabel, quoteStatusStyle } from "@/lib/labels";
import { formatRD, formatDate, cn } from "@/lib/utils";
import type { QuoteDetail, QuoteStatus } from "@/lib/types";

const QUOTE_STATUSES: QuoteStatus[] = ["borrador", "enviada", "aprobada", "rechazada", "vencida"];
import { updateQuoteStatusAction, convertQuoteToOrderAction } from "@/app/actions/quotes";

const kindLabel: Record<string, string> = {
  material: "Material",
  mano_obra: "Mano de obra",
  transporte: "Transporte",
  otro: "Otro",
};

export function CotizacionDetalleView({ quote }: { quote: QuoteDetail }) {
  const waMessage = encodeURIComponent(
    `Hola ${quote.clientName}, le compartimos su cotización ${quote.number} de JM Electric por ${formatRD(quote.total)}. Quedamos atentos.`
  );
  const waPhone = (quote.clientPhone ?? "").replace(/\D/g, "");
  const waLink = waPhone ? `https://wa.me/1${waPhone}?text=${waMessage}` : null;
  const mailLink = `mailto:?subject=${encodeURIComponent(`Cotización ${quote.number} — JM Electric`)}&body=${waMessage}`;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/cotizaciones" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-volt-600 dark:text-slate-400">
            <ArrowLeft className="h-4 w-4" /> Volver a cotizaciones
          </Link>
          <div className="flex items-center gap-2">
            <a href={`/cotizacion/${quote.id}`} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-2 text-xs"><Printer className="h-3.5 w-3.5" />PDF</a>
            {waLink ? (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-2 text-xs"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
            ) : (
              <span className="btn-ghost cursor-not-allowed px-3 py-2 text-xs opacity-50" title="Cliente sin teléfono"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</span>
            )}
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
                <Badge className={quoteStatusStyle[quote.status]}>{quoteStatusLabel[quote.status]}</Badge>
                <p className="mt-1 font-mono text-sm font-semibold">{quote.number}</p>
                <p className="text-xs text-slate-400">Cotización</p>
              </div>
            </div>

            <div className="grid gap-4 border-b border-slate-100 p-6 dark:border-white/[0.06] sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Cliente</p>
                <p className="mt-0.5 font-semibold">{quote.clientName}</p>
                {quote.clientAddress && <p className="text-sm text-slate-500 dark:text-slate-400">{quote.clientAddress}</p>}
                {quote.clientPhone && <p className="text-sm text-slate-500 dark:text-slate-400">{quote.clientPhone}</p>}
              </div>
              <div className="sm:text-right">
                <p className="text-xs uppercase tracking-wide text-slate-400">Emitida</p>
                <p className="mt-0.5 font-medium">{formatDate(quote.createdAt)}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Válida hasta {formatDate(quote.validUntil)}</p>
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
                  {quote.items.length === 0 ? (
                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Sin líneas de detalle.</td></tr>
                  ) : (
                    quote.items.map((it) => (
                      <tr key={it.id} className="border-b border-slate-50 dark:border-white/[0.03]">
                        <td className="py-2.5 pr-2">
                          <span className="font-medium">{it.description}</span>
                          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">{kindLabel[it.kind] ?? it.kind}</span>
                        </td>
                        <td className="py-2.5 text-center tabular-nums text-slate-500">{it.qty}</td>
                        <td className="py-2.5 text-right tabular-nums text-slate-500">{formatRD(it.unitPrice, { decimals: false })}</td>
                        <td className="py-2.5 text-right tabular-nums font-medium">{formatRD(it.lineTotal, { decimals: false })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Subtotal</span><span className="tabular-nums">{formatRD(quote.subtotal)}</span></div>
                {quote.discount > 0 && (
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Descuento</span><span className="tabular-nums text-red-500">− {formatRD(quote.discount)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">ITBIS 18%</span><span className="tabular-nums">{formatRD(quote.itbis)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-bold dark:border-white/10"><span>Total</span><span className="tabular-nums text-volt-600 dark:text-volt-400">{formatRD(quote.total)}</span></div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Panel de estado + acciones */}
        <div className="space-y-4">
          <Reveal delay={0.05}><StatusPanel quote={quote} /></Reveal>
          {quote.status === "aprobada" && <Reveal delay={0.07}><ConvertPanel quote={quote} /></Reveal>}
        </div>
      </div>
    </div>
  );
}

function StatusPanel({ quote }: { quote: QuoteDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setStatus(status: string) {
    if (status === quote.status) return;
    setError(null);
    startTransition(async () => {
      const res = await updateQuoteStatusAction(quote.id, status);
      if (!res.ok) { setError(res.error ?? "No se pudo actualizar."); return; }
      router.refresh();
    });
  }

  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 font-semibold">Estado de la cotización</h3>
      <div className="grid grid-cols-2 gap-2">
        {QUOTE_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            disabled={pending}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              s === quote.status
                ? "border-volt-400 bg-volt-500/10 text-volt-700 dark:text-volt-300"
                : "border-slate-200 text-slate-600 hover:border-volt-300 dark:border-white/10 dark:text-slate-300"
            )}
          >
            {quoteStatusLabel[s]}
          </button>
        ))}
      </div>
      {pending && <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400"><Loader2 className="h-3.5 w-3.5 animate-spin" />Guardando…</p>}
      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function ConvertPanel({ quote }: { quote: QuoteDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function convert() {
    setError(null);
    startTransition(async () => {
      const res = await convertQuoteToOrderAction(quote.id);
      if (!res.ok) { setError(res.error ?? "No se pudo convertir."); return; }
      if (res.orderId) router.push(`/ordenes/${res.orderId}`); else router.refresh();
    });
  }

  return (
    <div className="glass-card p-5">
      <h3 className="mb-1 flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 text-emerald-500" />Cotización aprobada</h3>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Conviértela en orden de servicio con un clic. La orden hereda el cliente y el monto total.</p>
      <button onClick={convert} disabled={pending} className="btn-primary w-full py-3">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightCircle className="h-4 w-4" />}
        {pending ? "Convirtiendo…" : "Convertir en orden"}
      </button>
      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
