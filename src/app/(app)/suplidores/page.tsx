"use client";

import { motion } from "framer-motion";
import { Plus, Phone, MapPin, Building2, CreditCard } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { formatRD, initials } from "@/lib/utils";

const suppliers = [
  { id: "s1", name: "Eléctricos del Caribe SRL", rnc: "1-30-12345-6", contact: "Ventas — Pedro Jiménez", phone: "809-567-8800", address: "Av. San Martín 88, Santo Domingo", pending: 128_400, purchases: 42 },
  { id: "s2", name: "Distribuidora Solar RD", rnc: "1-31-98765-4", contact: "Ing. Laura Cruz", phone: "829-604-1122", address: "Av. 27 de Febrero 210, Santo Domingo", pending: 0, purchases: 18 },
  { id: "s3", name: "Ferretería Industrial Duarte", rnc: "1-30-55443-2", contact: "Mostrador", phone: "809-333-4455", address: "Av. Duarte 340, Santiago", pending: 34_900, purchases: 27 },
  { id: "s4", name: "CCTV Import Dominicana", rnc: "1-32-11223-8", contact: "Soporte — Miguel Reyes", phone: "849-210-9988", address: "Plaza Central, Local 12, Santo Domingo", pending: 12_600, purchases: 9 },
];

export default function SuplidoresPage() {
  const totalPending = suppliers.reduce((s, x) => s + x.pending, 0);
  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {suppliers.length} suplidores · {formatRD(totalPending, { decimals: false })} en pagos pendientes
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Suplidores</h2>
          </div>
          <button className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo suplidor
          </button>
        </div>
      </Reveal>

      <Stagger className="grid gap-4 sm:grid-cols-2">
        {suppliers.map((s) => (
          <StaggerItem key={s.id}>
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="glass-card p-5 transition-shadow hover:shadow-card-light-hover"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-volt-gradient text-sm font-bold text-ink-950">
                  {initials(s.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold leading-tight">{s.name}</h3>
                  <p className="text-xs text-slate-400">RNC {s.rnc}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <p className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> {s.contact}</p>
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {s.phone}</p>
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span className="line-clamp-1">{s.address}</span></p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/[0.06]">
                <div>
                  <p className="text-xs text-slate-400">Compras</p>
                  <p className="font-semibold tabular-nums">{s.purchases}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Pendiente</p>
                  <p className={`flex items-center gap-1 font-semibold tabular-nums ${s.pending > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    <CreditCard className="h-3.5 w-3.5" />
                    {formatRD(s.pending, { decimals: false })}
                  </p>
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
