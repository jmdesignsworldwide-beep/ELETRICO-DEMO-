import Link from "next/link";
import { ArrowLeft, Scale, Award } from "lucide-react";
import { getPriceComparison } from "@/lib/data";
import { formatRD } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CompararPage() {
  const comparison = await getPriceComparison();

  return (
    <div className="space-y-6">
      <Link href="/suplidores" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-volt-600 dark:text-slate-400">
        <ArrowLeft className="h-4 w-4" /> Volver a suplidores
      </Link>

      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Mejor precio por material entre suplidores</p>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Scale className="h-6 w-6 text-volt-500" />Comparación de precios</h2>
      </div>

      {comparison.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
          No hay materiales con precios en más de un suplidor todavía. Agrega precios al catálogo de cada suplidor.
        </div>
      ) : (
        <div className="space-y-4">
          {comparison.map((m) => {
            const best = m.offers[0];
            const worst = m.offers[m.offers.length - 1];
            const savings = worst.price - best.price;
            return (
              <div key={m.inventoryId} className="glass-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{m.materialName}</h3>
                    <p className="text-xs text-slate-400">{m.sku}</p>
                  </div>
                  {savings > 0 && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Ahorro hasta {formatRD(savings, { decimals: false })}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {m.offers.map((o, i) => (
                    <div key={o.supplierId} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${i === 0 ? "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20" : "bg-slate-50 dark:bg-white/[0.03]"}`}>
                      <Link href={`/suplidores/${o.supplierId}`} className="flex items-center gap-2 hover:underline">
                        {i === 0 && <Award className="h-4 w-4 text-emerald-500" />}
                        <span className={i === 0 ? "font-semibold" : ""}>{o.supplierName}</span>
                      </Link>
                      <span className={`font-semibold tabular-nums ${i === 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{formatRD(o.price, { decimals: false })}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
