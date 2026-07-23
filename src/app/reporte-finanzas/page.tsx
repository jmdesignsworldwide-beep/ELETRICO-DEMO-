import { getFinanceReport } from "@/lib/data";
import { formatRD, formatDate, formatNumber } from "@/lib/utils";
import { PrintButton } from "../factura/[id]/print-button";

export const dynamic = "force-dynamic";

export default async function ReporteFinanzasPage() {
  const r = await getFinanceReport();

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-ink-900 print:bg-white print:py-0">
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 12mm; } }`}</style>

      <div className="mx-auto max-w-3xl bg-white p-8 shadow-xl print:max-w-none print:p-0 print:shadow-none sm:p-12">
        <div className="flex items-start justify-between border-b-2 border-volt-500 pb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-xl" style={{ background: "linear-gradient(135deg,#ffd91f,#e6b800)" }}>
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#0a0a0c"><path d="M13.5 2 4 13.5h6L9 22l10.5-12.5h-6L13.5 2Z" /></svg>
            </div>
            <div><h1 className="text-2xl font-bold">JM Electric</h1><p className="text-sm text-slate-500">Reporte financiero y estadístico</p></div>
          </div>
          <p className="text-sm font-medium text-slate-500">{formatDate(new Date())}</p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-400">Ingresos (6m)</p><p className="mt-1 text-lg font-bold tabular-nums text-emerald-600">{formatRD(r.totals.ingresos, { decimals: false })}</p></div>
          <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-400">Gastos (6m)</p><p className="mt-1 text-lg font-bold tabular-nums text-red-600">{formatRD(r.totals.gastos, { decimals: false })}</p></div>
          <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-400">Ganancia neta</p><p className="mt-1 text-lg font-bold tabular-nums">{formatRD(r.totals.ganancia, { decimals: false })}</p></div>
        </div>

        <h2 className="mt-8 mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Rentabilidad por tipo de servicio</h2>
        <table className="w-full text-sm">
          <thead><tr className="border-b-2 border-slate-200 text-left text-xs uppercase text-slate-500"><th className="pb-2 font-semibold">Servicio</th><th className="pb-2 text-right font-semibold">Ingresos</th><th className="pb-2 text-right font-semibold">Costo</th><th className="pb-2 text-right font-semibold">Margen</th></tr></thead>
          <tbody>
            {r.serviceProfit.map((s) => (
              <tr key={s.name} className="border-b border-slate-100"><td className="py-2">{s.name}</td><td className="py-2 text-right tabular-nums">{formatRD(s.income, { decimals: false })}</td><td className="py-2 text-right tabular-nums text-slate-500">{formatRD(s.cost, { decimals: false })}</td><td className="py-2 text-right tabular-nums font-semibold">{s.margin}%</td></tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Gastos por categoría</h2>
            <ul className="space-y-1 text-sm">
              {r.expensesByCategory.map((e) => (<li key={e.name} className="flex justify-between border-b border-slate-100 py-1"><span>{e.name}</span><span className="tabular-nums">{formatRD(e.value, { decimals: false })}</span></li>))}
            </ul>
            <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Conversión de cotizaciones</h2>
            <p className="text-sm">Tasa de aprobación: <span className="font-bold">{r.quoteConversion.rate}%</span></p>
            <p className="text-xs text-slate-500">Enviadas {r.quoteConversion.enviadas} · Aprobadas {r.quoteConversion.aprobadas} · Rechazadas {r.quoteConversion.rechazadas}</p>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Ingresos por técnico</h2>
            <ul className="space-y-1 text-sm">
              {r.incomeByTech.map((t) => (<li key={t.name} className="flex justify-between border-b border-slate-100 py-1"><span>{t.name}</span><span className="tabular-nums">{formatRD(t.value, { decimals: false })}</span></li>))}
            </ul>
            <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Materiales más usados</h2>
            <ul className="space-y-1 text-sm">
              {r.mostUsedMaterials.slice(0, 6).map((m) => (<li key={m.name} className="flex justify-between border-b border-slate-100 py-1"><span className="truncate pr-2">{m.name}</span><span className="tabular-nums">{formatNumber(m.qty)}</span></li>))}
            </ul>
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
