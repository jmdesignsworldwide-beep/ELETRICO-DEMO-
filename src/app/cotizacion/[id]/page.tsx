import { notFound } from "next/navigation";
import { getQuote } from "@/lib/data";
import { quoteStatusLabel } from "@/lib/labels";
import { formatRD, formatDate } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

const kindLabel: Record<string, string> = {
  material: "Material",
  mano_obra: "Mano de obra",
  transporte: "Transporte",
  otro: "Otro",
};

export default async function CotizacionPrintPage({ params }: { params: { id: string } }) {
  const q = await getQuote(params.id);
  if (!q) notFound();

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-ink-900 print:bg-white print:py-0">
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 14mm; } }`}</style>

      <div className="mx-auto max-w-3xl bg-white p-8 shadow-xl print:max-w-none print:p-0 print:shadow-none sm:p-12">
        {/* Membrete */}
        <div className="flex items-start justify-between border-b-2 border-volt-500 pb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-xl" style={{ background: "linear-gradient(135deg,#ffd91f,#e6b800)" }}>
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#0a0a0c"><path d="M13.5 2 4 13.5h6L9 22l10.5-12.5h-6L13.5 2Z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">JM Electric</h1>
              <p className="text-sm text-slate-500">Servicios eléctricos profesionales</p>
              <p className="text-xs text-slate-400">RNC 1-31-00000-0 · Santo Domingo, R.D. · 809-555-0100</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-wide text-slate-700">Cotización</h2>
            <p className="mt-1 font-mono text-sm font-semibold">{q.number}</p>
            <p className="mt-1 text-xs font-semibold uppercase text-slate-600">{quoteStatusLabel[q.status]}</p>
          </div>
        </div>

        {/* Cliente + fechas */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preparada para</p>
            <p className="mt-1 font-semibold">{q.clientName}</p>
            {q.clientAddress && <p className="text-sm text-slate-600">{q.clientAddress}</p>}
            {q.clientPhone && <p className="text-sm text-slate-600">{q.clientPhone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fecha de emisión</p>
            <p className="mt-1 font-medium">{formatDate(q.createdAt)}</p>
            <p className="mt-1 text-sm text-slate-600">Válida hasta {formatDate(q.validUntil)}</p>
          </div>
        </div>

        {/* Detalle */}
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-2 font-semibold">Descripción</th>
              <th className="pb-2 text-center font-semibold">Cant.</th>
              <th className="pb-2 text-right font-semibold">Precio</th>
              <th className="pb-2 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody>
            {q.items.length === 0 ? (
              <tr><td colSpan={4} className="py-4 text-slate-400">Servicios eléctricos y materiales</td></tr>
            ) : (
              q.items.map((it) => (
                <tr key={it.id} className="border-b border-slate-100">
                  <td className="py-2.5 pr-2">
                    {it.description}
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">{kindLabel[it.kind] ?? it.kind}</span>
                  </td>
                  <td className="py-2.5 text-center tabular-nums text-slate-500">{it.qty}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-500">{formatRD(it.unitPrice, { decimals: false })}</td>
                  <td className="py-2.5 text-right tabular-nums font-medium">{formatRD(it.lineTotal, { decimals: false })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="tabular-nums">{formatRD(q.subtotal)}</span></div>
          {q.discount > 0 && (
            <div className="flex justify-between"><span className="text-slate-500">Descuento</span><span className="tabular-nums">− {formatRD(q.discount)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-slate-500">ITBIS 18%</span><span className="tabular-nums">{formatRD(q.itbis)}</span></div>
          <div className="flex justify-between border-t-2 border-slate-200 pt-2 text-base font-bold"><span>Total</span><span className="tabular-nums">{formatRD(q.total)}</span></div>
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">Condiciones</p>
          <p className="mt-1">Precios en pesos dominicanos (RD$), ITBIS incluido. Cotización válida hasta la fecha indicada. Los materiales están sujetos a disponibilidad de inventario al momento de la aprobación.</p>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          <p>Gracias por su preferencia · JM Electric</p>
          <p className="mt-1">Cotización simulada para fines de demostración — sin valor fiscal.</p>
          <p className="mt-2">Diseñado por JM Nexus Designs</p>
        </div>
      </div>

      <PrintButton />
    </div>
  );
}
