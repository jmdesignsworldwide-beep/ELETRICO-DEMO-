import { notFound } from "next/navigation";
import { getTechnician } from "@/lib/data";
import { formatRD, formatDate } from "@/lib/utils";
import { PrintButton } from "../../factura/[id]/print-button";

export const dynamic = "force-dynamic";

export default async function VolantePage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { period?: string; bonus?: string; deduct?: string };
}) {
  const tech = await getTechnician(params.id);
  if (!tech) notFound();

  const period = searchParams.period === "semanal" ? "semanal" : "quincenal";
  const days = period === "semanal" ? 7 : 15;
  const bonus = Math.max(0, Number(searchParams.bonus) || 0);
  const deduct = Math.max(0, Number(searchParams.deduct) || 0);

  const since = Date.now() - days * 86_400_000;
  const entries = tech.worklog.filter((w) => new Date(w.createdAt).getTime() >= since);
  const hours = entries.reduce((s, w) => s + w.hours, 0);
  const gross = hours * tech.hourlyRate;
  const net = gross + bonus - deduct;

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-ink-900 print:bg-white print:py-0">
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 14mm; } }`}</style>

      <div className="mx-auto max-w-2xl bg-white p-8 shadow-xl print:max-w-none print:p-0 print:shadow-none sm:p-12">
        <div className="flex items-start justify-between border-b-2 border-volt-500 pb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-xl" style={{ background: "linear-gradient(135deg,#ffd91f,#e6b800)" }}>
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#0a0a0c"><path d="M13.5 2 4 13.5h6L9 22l10.5-12.5h-6L13.5 2Z" /></svg>
            </div>
            <div><h1 className="text-2xl font-bold">JM Electric</h1><p className="text-sm text-slate-500">Volante de pago</p></div>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p className="font-medium">{formatDate(new Date())}</p>
            <p className="text-xs capitalize">Período {period}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Empleado</p>
            <p className="mt-1 font-semibold">{tech.name}</p>
            {tech.cedula && <p className="text-sm text-slate-600">Cédula: {tech.cedula}</p>}
            <p className="text-sm text-slate-600">{tech.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tarifa por hora</p>
            <p className="mt-1 font-medium tabular-nums">{formatRD(tech.hourlyRate)}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-100"><td className="py-2.5">Horas trabajadas ({days} días)</td><td className="py-2.5 text-right tabular-nums">{hours} h</td></tr>
            <tr className="border-b border-slate-100"><td className="py-2.5">Salario bruto</td><td className="py-2.5 text-right tabular-nums">{formatRD(gross)}</td></tr>
            <tr className="border-b border-slate-100"><td className="py-2.5">Bonificaciones</td><td className="py-2.5 text-right tabular-nums text-emerald-600">+ {formatRD(bonus)}</td></tr>
            <tr className="border-b border-slate-100"><td className="py-2.5">Deducciones</td><td className="py-2.5 text-right tabular-nums text-red-600">− {formatRD(deduct)}</td></tr>
            <tr className="border-t-2 border-slate-200"><td className="py-3 text-base font-bold">Neto a pagar</td><td className="py-3 text-right text-base font-bold tabular-nums">{formatRD(net)}</td></tr>
          </tbody>
        </table>

        <div className="mt-16 grid grid-cols-2 gap-12 text-center text-xs text-slate-500">
          <div className="border-t border-slate-300 pt-2">Firma del empleado</div>
          <div className="border-t border-slate-300 pt-2">Firma autorizada</div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          <p>JM Electric · Volante de pago sin valor fiscal (demo)</p>
          <p className="mt-2">Diseñado por JM Nexus Designs</p>
        </div>
      </div>

      <PrintButton />
    </div>
  );
}
