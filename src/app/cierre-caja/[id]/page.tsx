import { notFound } from "next/navigation";
import { getRegister } from "@/lib/data";
import { formatRD, formatDate } from "@/lib/utils";
import { PrintButton } from "../../factura/[id]/print-button";

export const dynamic = "force-dynamic";

const catLabel: Record<string, string> = {
  combustible: "Combustible", transporte: "Transporte", herramientas: "Herramientas",
  materiales_menores: "Materiales menores", nomina: "Nómina", alquiler: "Alquiler",
  servicios: "Servicios", mantenimiento_vehiculo: "Mant. vehículo", otros: "Otros",
};
const methodLabel: Record<string, string> = {
  efectivo: "Efectivo", transferencia: "Transferencia", debito: "Débito", credito: "Crédito",
};

export default async function CierreCajaPage({ params }: { params: { id: string } }) {
  const s = await getRegister(params.id);
  if (!s) notFound();
  const r = s.register;

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-ink-900 print:bg-white print:py-0">
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 14mm; } }`}</style>

      <div className="mx-auto max-w-2xl bg-white p-8 shadow-xl print:max-w-none print:p-0 print:shadow-none sm:p-12">
        <div className="flex items-start justify-between border-b-2 border-volt-500 pb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-xl" style={{ background: "linear-gradient(135deg,#ffd91f,#e6b800)" }}>
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#0a0a0c"><path d="M13.5 2 4 13.5h6L9 22l10.5-12.5h-6L13.5 2Z" /></svg>
            </div>
            <div><h1 className="text-2xl font-bold">JM Electric</h1><p className="text-sm text-slate-500">Cierre de caja</p></div>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p className="font-medium">{r.closedAt ? formatDate(r.closedAt) : formatDate(r.openedAt)}</p>
            <p className="text-xs">Responsable: {r.openerName ?? "—"}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-400">Ingresos del día</p><p className="mt-1 text-xl font-bold tabular-nums text-emerald-600">{formatRD(s.incomeTotal, { decimals: false })}</p></div>
          <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-400">Gastos del día</p><p className="mt-1 text-xl font-bold tabular-nums text-red-600">{formatRD(s.expensesTotal, { decimals: false })}</p></div>
        </div>

        <h2 className="mt-8 mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Cuadre por método de pago</h2>
        <table className="w-full text-sm">
          <thead><tr className="border-b-2 border-slate-200 text-left text-xs uppercase text-slate-500"><th className="pb-2 font-semibold">Método</th><th className="pb-2 text-right font-semibold">Ingresos</th><th className="pb-2 text-right font-semibold">Gastos</th></tr></thead>
          <tbody>
            {["efectivo", "transferencia", "debito", "credito"].map((m) => {
              const inc = s.incomeByMethod[m] ?? 0;
              const exp = s.expensesByMethod[m] ?? 0;
              if (inc === 0 && exp === 0) return null;
              return (
                <tr key={m} className="border-b border-slate-100">
                  <td className="py-2">{methodLabel[m]}</td>
                  <td className="py-2 text-right tabular-nums text-emerald-600">{formatRD(inc, { decimals: false })}</td>
                  <td className="py-2 text-right tabular-nums text-red-600">{formatRD(exp, { decimals: false })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {s.expenses.length > 0 && (
          <>
            <h2 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Detalle de gastos</h2>
            <ul className="space-y-1 text-sm">
              {s.expenses.map((e) => (
                <li key={e.id} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{e.description} <span className="text-xs text-slate-400">({catLabel[e.category] ?? e.category})</span></span>
                  <span className="tabular-nums">{formatRD(e.amount, { decimals: false })}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-8 space-y-1.5 rounded-xl border border-slate-200 p-4 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Apertura</span><span className="tabular-nums">{formatRD(r.openingAmount, { decimals: false })}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Efectivo esperado</span><span className="tabular-nums">{formatRD(r.expectedCash ?? s.expectedCash, { decimals: false })}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Efectivo contado</span><span className="tabular-nums">{formatRD(r.countedCash ?? 0, { decimals: false })}</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold"><span>Diferencia</span><span className={`tabular-nums ${(r.difference ?? 0) === 0 ? "text-emerald-600" : "text-amber-600"}`}>{formatRD(r.difference ?? 0)}</span></div>
          {r.closingNotes && <p className="pt-2 text-xs text-slate-500">Nota: {r.closingNotes}</p>}
        </div>

        <div className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          <p>JM Electric · Cierre de caja</p>
          <p className="mt-2">Diseñado por JM Nexus Designs</p>
        </div>
      </div>

      <PrintButton />
    </div>
  );
}
