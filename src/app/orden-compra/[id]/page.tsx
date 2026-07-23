import { notFound } from "next/navigation";
import { getPurchaseOrder } from "@/lib/data";
import { formatRD, formatDate, formatNumber } from "@/lib/utils";
import { PrintButton } from "../../factura/[id]/print-button";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = { borrador: "Borrador", enviada: "Enviada", recibida_parcial: "Recibida parcial", recibida: "Recibida", cancelada: "Cancelada" };

export default async function OrdenCompraPrintPage({ params }: { params: { id: string } }) {
  const po = await getPurchaseOrder(params.id);
  if (!po) notFound();

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-ink-900 print:bg-white print:py-0">
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 14mm; } }`}</style>

      <div className="mx-auto max-w-3xl bg-white p-8 shadow-xl print:max-w-none print:p-0 print:shadow-none sm:p-12">
        <div className="flex items-start justify-between border-b-2 border-volt-500 pb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-xl" style={{ background: "linear-gradient(135deg,#ffd91f,#e6b800)" }}>
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#0a0a0c"><path d="M13.5 2 4 13.5h6L9 22l10.5-12.5h-6L13.5 2Z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">JM Electric</h1>
              <p className="text-sm text-slate-500">Servicios eléctricos · RNC 1-31-00000-0</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-wide text-slate-700">Orden de compra</h2>
            <p className="mt-1 font-mono text-sm font-semibold">{po.number}</p>
            <p className="text-xs font-semibold uppercase text-slate-600">{statusLabel[po.status] ?? po.status}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Suplidor</p>
            <p className="mt-1 font-semibold">{po.supplierName}</p>
            {po.supplierPhone && <p className="text-sm text-slate-600">{po.supplierPhone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fecha</p>
            <p className="mt-1 font-medium">{formatDate(po.createdAt)}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-2 font-semibold">Material</th>
              <th className="pb-2 text-center font-semibold">Cant.</th>
              <th className="pb-2 text-right font-semibold">Precio</th>
              <th className="pb-2 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((it) => (
              <tr key={it.id} className="border-b border-slate-100">
                <td className="py-2.5 pr-2">{it.name}</td>
                <td className="py-2.5 text-center tabular-nums text-slate-500">{formatNumber(it.qtyOrdered)}</td>
                <td className="py-2.5 text-right tabular-nums text-slate-500">{formatRD(it.unitPrice, { decimals: false })}</td>
                <td className="py-2.5 text-right tabular-nums font-medium">{formatRD(it.qtyOrdered * it.unitPrice, { decimals: false })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs">
          <div className="flex justify-between border-t-2 border-slate-200 pt-2 text-base font-bold"><span>Total</span><span className="tabular-nums">{formatRD(po.total)}</span></div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          <p>JM Electric · Orden de compra generada el {formatDate(new Date())}</p>
          <p className="mt-2">Diseñado por JM Nexus Designs</p>
        </div>
      </div>

      <PrintButton />
    </div>
  );
}
