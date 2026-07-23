import { notFound } from "next/navigation";
import { getInvoice } from "@/lib/data";
import { invoiceStatusLabel } from "@/lib/labels";
import { formatRD, formatDate } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function FacturaPrintPage({ params }: { params: { id: string } }) {
  const inv = await getInvoice(params.id);
  if (!inv) notFound();

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
            <h2 className="text-xl font-bold uppercase tracking-wide text-slate-700">Factura</h2>
            <p className="mt-1 font-mono text-sm font-semibold">{inv.number}</p>
            <p className="text-xs text-slate-500">NCF {inv.ncf}</p>
            <p className="mt-1 text-xs font-semibold uppercase text-slate-600">{invoiceStatusLabel[inv.status]}</p>
          </div>
        </div>

        {/* Cliente + fecha */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Facturar a</p>
            <p className="mt-1 font-semibold">{inv.clientName}</p>
            {inv.clientAddress && <p className="text-sm text-slate-600">{inv.clientAddress}</p>}
            {inv.clientPhone && <p className="text-sm text-slate-600">{inv.clientPhone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fecha de emisión</p>
            <p className="mt-1 font-medium">{formatDate(inv.createdAt)}</p>
            {inv.orderNumber && <p className="mt-1 text-sm text-slate-600">Orden vinculada: {inv.orderNumber}</p>}
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
            {inv.items.length === 0 ? (
              <tr><td colSpan={4} className="py-4 text-slate-400">Servicios eléctricos y materiales</td></tr>
            ) : (
              inv.items.map((it) => (
                <tr key={it.id} className="border-b border-slate-100">
                  <td className="py-2.5 pr-2">{it.description}</td>
                  <td className="py-2.5 text-center tabular-nums text-slate-500">{it.qty}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-500">{formatRD(it.unitPrice, { decimals: false })}</td>
                  <td className="py-2.5 text-right tabular-nums font-medium">{formatRD(it.lineTotal, { decimals: false })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="tabular-nums">{formatRD(inv.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">ITBIS 18%</span><span className="tabular-nums">{formatRD(inv.itbis)}</span></div>
          <div className="flex justify-between border-t-2 border-slate-200 pt-2 text-base font-bold"><span>Total</span><span className="tabular-nums">{formatRD(inv.total)}</span></div>
        </div>

        {inv.status === "anulada" && inv.voidReason && (
          <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span className="font-semibold">FACTURA ANULADA:</span> {inv.voidReason}
          </p>
        )}

        <div className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          <p>Gracias por su preferencia · JM Electric</p>
          <p className="mt-1">Factura simulada para fines de demostración — sin valor fiscal (NCF de demo).</p>
          <p className="mt-2">Diseñado por JM Nexus Designs</p>
        </div>
      </div>

      <PrintButton />
    </div>
  );
}
