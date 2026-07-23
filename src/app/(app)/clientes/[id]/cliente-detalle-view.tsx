"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Phone, MapPin, Building2, Home, Factory, Pencil, Trash2, X, Loader2,
  Wrench, Receipt, Zap, Gauge, AlertTriangle, History, UserRound, Navigation,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import {
  propertyTypeLabel, serviceTypeLabel, orderStatusLabel, orderStatusStyle,
  invoiceStatusLabel, invoiceStatusStyle,
} from "@/lib/labels";
import { formatRD, formatDate, initials, cn } from "@/lib/utils";
import type { ClientDetail, PropertyType, OrderStatus, InvoiceStatus } from "@/lib/types";
import { updateClientAction, deleteClientAction, type ClientInput } from "@/app/actions/clients";

const propIcon: Record<PropertyType, typeof Home> = { residencial: Home, comercial: Building2, industrial: Factory };

export function ClienteDetalleView({ client }: { client: ClientDetail }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const Icon = propIcon[client.propertyType];

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-volt-600 dark:text-slate-400">
            <ArrowLeft className="h-4 w-4" /> Volver a clientes
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditOpen(true)} className="btn-ghost px-3 py-2 text-xs"><Pencil className="h-3.5 w-3.5" />Editar</button>
            <button onClick={() => setDeleteOpen(true)} className="btn-ghost px-3 py-2 text-xs text-red-600 hover:bg-red-500/10 dark:text-red-400"><Trash2 className="h-3.5 w-3.5" />Eliminar</button>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ficha + expediente */}
        <Reveal delay={0.03} className="lg:col-span-2">
          <div className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-volt-gradient text-lg font-bold text-ink-950">{initials(client.name)}</div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold tracking-tight">{client.name}</h2>
                <Badge className={cn("mt-1")}><Icon className="h-3 w-3" />{propertyTypeLabel[client.propertyType]}</Badge>
                <div className="mt-3 space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" /><span>{client.phone}</span>{client.contactoAlterno && <span className="text-slate-400">· alt. {client.contactoAlterno}</span>}</div>
                  {client.address && <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{client.address}</span></div>}
                  {client.direccionReferencia && <div className="flex items-start gap-2"><Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{client.direccionReferencia}</span></div>}
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5 dark:border-white/[0.06]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Expediente técnico</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Spec icon={Zap} label="Tipo de panel" value={client.panelType} />
                <Spec icon={Gauge} label="Voltaje" value={client.voltage} />
                <Spec icon={Zap} label="Breaker principal" value={client.breakerPrincipal} />
              </div>
              <div className="mt-3 space-y-3">
                <LongSpec icon={AlertTriangle} label="Problemas conocidos" value={client.problemasConocidos} />
                <LongSpec icon={History} label="Historial de instalaciones" value={client.historialInstalaciones} />
                <LongSpec icon={UserRound} label="Notas técnicas" value={client.notes} />
              </div>
            </div>
          </div>
        </Reveal>

        {/* KPIs */}
        <div className="space-y-4">
          <Reveal delay={0.05}>
            <div className="glass-card p-5">
              <p className="text-xs text-slate-400">Total facturado</p>
              <p className="text-2xl font-bold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(client.totalSpent, { decimals: false })}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm dark:border-white/[0.06]">
                <span className="text-slate-500 dark:text-slate-400">Servicios realizados</span>
                <span className="font-semibold tabular-nums">{client.serviceCount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Cliente desde</span>
                <span className="font-medium">{formatDate(client.createdAt)}</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Historial de órdenes */}
      <Reveal delay={0.06}>
        <div className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><Wrench className="h-5 w-5 text-volt-500" />Historial de órdenes</h3>
          {client.orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Este cliente aún no tiene órdenes de servicio.</p>
          ) : (
            <div className="space-y-2">
              {client.orders.map((o) => (
                <Link key={o.id} href={`/ordenes/${o.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:border-volt-300 hover:bg-volt-500/[0.03] dark:border-white/[0.06]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-400">{o.number}</span>
                      <Badge className={orderStatusStyle[o.status as OrderStatus]}>{orderStatusLabel[o.status as OrderStatus]}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm">{serviceTypeLabel[o.serviceType as keyof typeof serviceTypeLabel] ?? o.serviceType} · {formatDate(o.scheduledDate)}</p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">{formatRD(o.total, { decimals: false })}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      {/* Historial de facturas */}
      <Reveal delay={0.07}>
        <div className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><Receipt className="h-5 w-5 text-volt-500" />Facturas</h3>
          {client.invoices.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Sin facturas emitidas todavía.</p>
          ) : (
            <div className="space-y-2">
              {client.invoices.map((f) => (
                <Link key={f.id} href={`/facturacion/${f.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:border-volt-300 hover:bg-volt-500/[0.03] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-400">{f.number}</span>
                    <Badge className={invoiceStatusStyle[f.status as InvoiceStatus]}>{invoiceStatusLabel[f.status as InvoiceStatus]}</Badge>
                    <span className="text-xs text-slate-400">{formatDate(f.createdAt)}</span>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">{formatRD(f.total, { decimals: false })}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      <AnimatePresence>
        {editOpen && <EditClientModal client={client} onClose={() => setEditOpen(false)} />}
        {deleteOpen && <DeleteClientDialog client={client} onClose={() => setDeleteOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function Spec({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.03]">
      <p className="flex items-center gap-1.5 text-xs text-slate-400"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-1 text-sm font-medium">{value?.trim() || "—"}</p>
    </div>
  );
}

function LongSpec({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-slate-400"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{value}</p>
    </div>
  );
}

function toInput(c: ClientDetail): ClientInput {
  return {
    name: c.name, phone: c.phone, address: c.address, propertyType: c.propertyType,
    panelType: c.panelType ?? "", voltage: c.voltage ?? "", notes: c.notes ?? "",
    breakerPrincipal: c.breakerPrincipal ?? "", contactoAlterno: c.contactoAlterno ?? "",
    direccionReferencia: c.direccionReferencia ?? "", problemasConocidos: c.problemasConocidos ?? "",
    historialInstalaciones: c.historialInstalaciones ?? "",
  };
}

function EditClientModal({ client, onClose }: { client: ClientDetail; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ClientInput>(toInput(client));
  const set = (patch: Partial<ClientInput>) => setForm((f) => ({ ...f, ...patch }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateClientAction(client.id, form);
      if (!res.ok) { setError(res.error ?? "No se pudo actualizar."); return; }
      router.refresh();
      onClose();
    });
  }

  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
        <form onSubmit={submit} className="glass-card max-h-[88vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Editar cliente</h3>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Datos generales</p>
              <div className="space-y-3">
                <input required placeholder="Nombre del cliente *" className={field} value={form.name} onChange={(e) => set({ name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Teléfono *" className={field} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
                  <input placeholder="Contacto alterno" className={field} value={form.contactoAlterno} onChange={(e) => set({ contactoAlterno: e.target.value })} />
                </div>
                <select className={field} value={form.propertyType} onChange={(e) => set({ propertyType: e.target.value })}>
                  <option value="residencial">Residencial</option>
                  <option value="comercial">Comercial</option>
                  <option value="industrial">Industrial</option>
                </select>
                <input placeholder="Dirección" className={field} value={form.address} onChange={(e) => set({ address: e.target.value })} />
                <input placeholder="Punto de referencia (cómo llegar)" className={field} value={form.direccionReferencia} onChange={(e) => set({ direccionReferencia: e.target.value })} />
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Expediente técnico</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Tipo de panel" className={field} value={form.panelType} onChange={(e) => set({ panelType: e.target.value })} />
                  <input placeholder="Voltaje (110V / 220V…)" className={field} value={form.voltage} onChange={(e) => set({ voltage: e.target.value })} />
                </div>
                <input placeholder="Breaker principal (amperaje)" className={field} value={form.breakerPrincipal} onChange={(e) => set({ breakerPrincipal: e.target.value })} />
                <textarea placeholder="Problemas conocidos" rows={2} className={field} value={form.problemasConocidos} onChange={(e) => set({ problemasConocidos: e.target.value })} />
                <textarea placeholder="Historial de instalaciones previas" rows={2} className={field} value={form.historialInstalaciones} onChange={(e) => set({ historialInstalaciones: e.target.value })} />
                <textarea placeholder="Notas técnicas adicionales" rows={2} className={field} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
              </div>
            </div>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={pending} className="btn-primary">{pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? "Guardando…" : "Guardar cambios"}</button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function DeleteClientDialog({ client, onClose }: { client: ClientDetail; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await deleteClientAction(client.id);
      if (!res.ok) { setError(res.error ?? "No se pudo eliminar."); return; }
      router.push("/clientes");
    });
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className="glass-card p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-red-600 dark:text-red-400"><Trash2 className="h-5 w-5" />Eliminar cliente</h3>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
          </div>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">¿Seguro que deseas eliminar a <span className="font-semibold text-ink-900 dark:text-white">{client.name}</span>? Esta acción no se puede deshacer. No podrás eliminarlo si tiene órdenes asociadas.</p>
          {error && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-ghost">Cancelar</button>
            <button onClick={confirm} disabled={pending} className="btn-primary" style={{ background: "#ef4444" }}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Eliminar</button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
