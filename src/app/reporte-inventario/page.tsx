import { getInventoryReport } from "@/lib/data";
import { formatRD, formatDate, formatNumber } from "@/lib/utils";
import { PrintButton } from "../factura/[id]/print-button";

export const dynamic = "force-dynamic";

export default async function ReporteInventarioPage() {
  const { items, costValue, saleValue, lowStock, mostUsed } = await getInventoryReport();

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-ink-900 print:bg-white print:py-0">
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 12mm; } }`}</style>

      <div className="mx-auto max-w-4xl bg-white p-8 shadow-xl print:max-w-none print:p-0 print:shadow-none sm:p-12">
        {/* Membrete */}
        <div className="flex items-start justify-between border-b-2 border-volt-500 pb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-xl" style={{ background: "linear-gradient(135deg,#ffd91f,#e6b800)" }}>
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#0a0a0c"><path d="M13.5 2 4 13.5h6L9 22l10.5-12.5h-6L13.5 2Z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">JM Electric</h1>
              <p className="text-sm text-slate-500">Reporte de inventario</p>
            </div>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p className="font-medium">{formatDate(new Date())}</p>
            <p className="text-xs">{items.length} materiales</p>
          </div>
        </div>

        {/* Valor total */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400">Valor a costo</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{formatRD(costValue, { decimals: false })}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400">Valor a venta</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-volt-600">{formatRD(saleValue, { decimals: false })}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400">Utilidad potencial</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600">{formatRD(saleValue - costValue, { decimals: false })}</p>
          </div>
        </div>

        {/* Tabla completa */}
        <h2 className="mt-8 mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Detalle de materiales</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-2 font-semibold">Material</th>
              <th className="pb-2 text-right font-semibold">Costo</th>
              <th className="pb-2 text-right font-semibold">Venta</th>
              <th className="pb-2 text-right font-semibold">Stock</th>
              <th className="pb-2 text-right font-semibold">Valor costo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-slate-100">
                <td className="py-2 pr-2"><span className="font-medium">{i.name}</span><span className="ml-1 text-xs text-slate-400">{i.sku}</span></td>
                <td className="py-2 text-right tabular-nums text-slate-500">{formatRD(i.costPrice, { decimals: false })}</td>
                <td className="py-2 text-right tabular-nums text-slate-500">{formatRD(i.salePrice, { decimals: false })}</td>
                <td className="py-2 text-right tabular-nums">{formatNumber(i.stock)} {i.unit}</td>
                <td className="py-2 text-right tabular-nums font-medium">{formatRD(i.costPrice * i.stock, { decimals: false })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Stock bajo + más usados */}
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-600">Reabastecer ({lowStock.length})</h2>
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-400">Todo por encima del mínimo.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {lowStock.map((i) => (
                  <li key={i.id} className="flex justify-between border-b border-slate-100 py-1">
                    <span>{i.name}</span>
                    <span className="tabular-nums font-semibold text-amber-600">{i.stock}/{i.minStock}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Materiales más usados</h2>
            {mostUsed.length === 0 ? (
              <p className="text-sm text-slate-400">Sin consumo registrado aún.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {mostUsed.map((m) => (
                  <li key={m.name} className="flex justify-between border-b border-slate-100 py-1">
                    <span>{m.name}</span>
                    <span className="tabular-nums font-semibold">{formatNumber(m.qty)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          <p>JM Electric · Reporte generado el {formatDate(new Date())}</p>
          <p className="mt-2">Diseñado por JM Nexus Designs</p>
        </div>
      </div>

      <PrintButton />
    </div>
  );
}
