"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Phone, MapPin, Building2, CreditCard, ChevronRight, X, Loader2, Scale } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { formatRD, initials } from "@/lib/utils";
import type { Supplier } from "@/lib/types";
import { createSupplierAction, type SupplierInput } from "@/app/actions/suppliers";

export function SuplidoresView({ suppliers }: { suppliers: Supplier[] }) {
  const [modalOpen, setModalOpen] = useState(false);
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
          <div className="flex gap-2">
            <Link href="/suplidores/comparar" className="btn-ghost"><Scale className="h-4 w-4" />Comparar precios</Link>
            <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="h-4 w-4" />Nuevo suplidor</button>
          </div>
        </div>
      </Reveal>

      {suppliers.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
          Aún no hay suplidores. Crea el primero o aplica la migración con el seed.
        </div>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2">
          {suppliers.map((s) => (
            <StaggerItem key={s.id}>
              <Link href={`/suplidores/${s.id}`}>
                <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="glass-card p-5 transition-shadow hover:shadow-card-light-hover">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-volt-gradient text-sm font-bold text-ink-950">{initials(s.name)}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold leading-tight">{s.name}</h3>
                      {s.rnc && <p className="text-xs text-slate-400">RNC {s.rnc}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                    {s.contact && <p className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> {s.contact}</p>}
                    {s.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {s.phone}</p>}
                    {s.address && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span className="line-clamp-1">{s.address}</span></p>}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/[0.06]">
                    <div><p className="text-xs text-slate-400">Compras</p><p className="font-semibold tabular-nums">{s.purchaseCount}</p></div>
                    <div className="text-right"><p className="text-xs text-slate-400">Pendiente</p>
                      <p className={`flex items-center gap-1 font-semibold tabular-nums ${s.pending > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        <CreditCard className="h-3.5 w-3.5" />{formatRD(s.pending, { decimals: false })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <AnimatePresence>{modalOpen && <NewSupplierModal onClose={() => setModalOpen(false)} />}</AnimatePresence>
    </div>
  );
}

function NewSupplierModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierInput>({ name: "", rnc: "", contact: "", phone: "", email: "", address: "", paymentTerms: "" });
  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createSupplierAction(form);
      if (!res.ok) { setError(res.error ?? "No se pudo guardar."); return; }
      router.refresh(); onClose();
    });
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed inset-0 z-50 m-auto h-fit max-h-[92vh] w-[92vw] max-w-lg overflow-y-auto">
        <form onSubmit={submit} className="glass-card max-h-[88vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Nuevo suplidor</h3>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3">
            <input required placeholder="Nombre del suplidor *" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="RNC" className={field} value={form.rnc} onChange={(e) => setForm({ ...form, rnc: e.target.value })} />
              <input placeholder="Contacto" className={field} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Teléfono" className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input placeholder="Correo" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <input placeholder="Dirección" className={field} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <input placeholder="Condiciones de pago (ej. Crédito 30 días)" className={field} value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} />
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={pending} className="btn-primary">{pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? "Guardando…" : "Guardar"}</button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
