"use client";

import { motion } from "framer-motion";
import { Plus, Phone, Award, Wrench, FileText } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { technicians } from "@/lib/demo-data";
import { formatRD, initials } from "@/lib/utils";

// Nómina estimada de la quincena (demo).
const payrollByTech: Record<string, { horas: number; pago: number }> = {
  t1: { horas: 82, pago: 61_500 },
  t2: { horas: 76, pago: 57_000 },
  t3: { horas: 68, pago: 47_600 },
  t4: { horas: 71, pago: 49_700 },
};

export default function TecnicosPage() {
  const totalNomina = Object.values(payrollByTech).reduce((s, p) => s + p.pago, 0);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {technicians.length} técnicos · Nómina quincenal estimada {formatRD(totalNomina, { decimals: false })}
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Técnicos y nómina</h2>
          </div>
          <button className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo técnico
          </button>
        </div>
      </Reveal>

      <Stagger className="grid gap-4 sm:grid-cols-2">
        {technicians.map((t) => {
          const pay = payrollByTech[t.id];
          return (
            <StaggerItem key={t.id}>
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="glass-card p-5 transition-shadow hover:shadow-card-light-hover"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-volt-gradient text-lg font-bold text-ink-950">
                    {initials(t.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-tight">{t.name}</h3>
                    <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                      <Phone className="h-3.5 w-3.5" /> {t.phone}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {t.specialties.map((s) => (
                        <Badge
                          key={s}
                          className="bg-volt-500/10 text-volt-700 ring-volt-500/20 dark:text-volt-300"
                        >
                          <Wrench className="h-3 w-3" />
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  {t.certifications.map((c) => (
                    <p
                      key={c}
                      className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"
                    >
                      <Award className="h-3.5 w-3.5 text-volt-500" /> {c}
                    </p>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
                  <div>
                    <p className="text-xs text-slate-400">Órdenes</p>
                    <p className="font-semibold tabular-nums">{t.activeOrders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Horas</p>
                    <p className="font-semibold tabular-nums">{pay?.horas ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Nómina</p>
                    <p className="font-semibold tabular-nums text-volt-600 dark:text-volt-400">
                      {formatRD(pay?.pago ?? 0, { decimals: false })}
                    </p>
                  </div>
                </div>

                <button className="btn-ghost mt-4 w-full py-2 text-xs">
                  <FileText className="h-3.5 w-3.5" />
                  Generar volante de pago
                </button>
              </motion.div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
