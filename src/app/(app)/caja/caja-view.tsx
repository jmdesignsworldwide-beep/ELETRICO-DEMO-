"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, TrendingUp, TrendingDown, Plus, Loader2, X, Lock, DoorOpen,
  Receipt, Camera, RefreshCw, Paperclip,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { formatRD, formatDate, cn } from "@/lib/utils";
import type { RegisterSummary, RecurringExpense, CashRegister } from "@/lib/types";
import {
  openRegisterAction, addExpenseAction, closeRegisterAction, generateRecurringAction,
  createRecurringAction, EXPENSE_CATEGORIES, PAYMENT_METHODS,
} from "@/app/actions/cash";

const catLabel: Record<string, string> = {
  combustible: "Combustible", transporte: "Transporte", herramientas: "Herramientas",
  materiales_menores: "Materiales menores", nomina: "Nómina", alquiler: "Alquiler",
  servicios: "Servicios", mantenimiento_vehiculo: "Mant. vehículo", otros: "Otros",
};
const methodLabel: Record<string, string> = {
  efectivo: "Efectivo", transferencia: "Transferencia", debito: "Débito", credito: "Crédito",
};

export function CajaView({ summary, recurring, history }: {
  summary: RegisterSummary | null;
  recurring: RecurringExpense[];
  history: CashRegister[];
}) {
  if (!summary) return <OpenRegister history={history} />;
  return <OpenState summary={summary} recurring={recurring} history={history} />;
}

function OpenRegister({ history }: { history: CashRegister[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState(15000);
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    startTransition(async () => {
      const res = await openRegisterAction(amount);
      if (!res.ok) { setError(res.error ?? "No se pudo abrir."); return; }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">No hay caja abierta</p>
          <h2 className="text-2xl font-bold tracking-tight">Caja y gastos</h2>
        </div>
      </Reveal>
      <Reveal delay={0.04}>
        <div className="glass-card mx-auto max-w-md p-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-volt-500/10 text-volt-500"><DoorOpen className="h-7 w-7" /></div>
          <h3 className="text-lg font-semibold">Abrir caja del día</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ingresa el monto inicial en efectivo.</p>
          <div className="mt-4">
            <label className="mb-1.5 block text-left text-sm font-medium text-slate-600 dark:text-slate-300">Monto de apertura (RD$)</label>
            <input type="number" min={0} step="0.01" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-center text-lg font-semibold tabular-nums outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]" />
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button onClick={open} disabled={pending} className="btn-primary mt-4 w-full py-3">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DoorOpen className="h-4 w-4" />}{pending ? "Abriendo…" : "Abrir caja"}</button>
        </div>
      </Reveal>
      <History history={history} />
    </div>
  );
}

function OpenState({ summary, recurring, history }: { summary: RegisterSummary; recurring: RecurringExpense[]; history: CashRegister[] }) {
  const router = useRouter();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [genPending, startGen] = useTransition();
  const s = summary;

  function generate() {
    startGen(async () => { await generateRecurringAction(); router.refresh(); });
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Caja abierta por {s.register.openerName ?? "—"} · {formatDate(s.register.openedAt)} · apertura {formatRD(s.register.openingAmount, { decimals: false })}
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Caja y gastos</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setExpenseOpen(true)} className="btn-ghost"><Plus className="h-4 w-4" />Registrar gasto</button>
            <button onClick={() => setCloseOpen(true)} className="btn-primary"><Lock className="h-4 w-4" />Cerrar caja</button>
          </div>
        </div>
      </Reveal>

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StaggerItem>
          <div className="glass-card p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-400"><TrendingUp className="h-4 w-4 text-emerald-500" /><span className="text-xs">Ingresos del día</span></div>
            <div className="kpi-value text-emerald-600 dark:text-emerald-400"><CountUp value={s.incomeTotal} format={(n) => formatRD(n, { decimals: false })} /></div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="glass-card p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-400"><TrendingDown className="h-4 w-4 text-red-500" /><span className="text-xs">Gastos del día</span></div>
            <div className="kpi-value text-red-500 dark:text-red-400"><CountUp value={s.expensesTotal} format={(n) => formatRD(n, { decimals: false })} /></div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="glass-card p-5 ring-1 ring-inset ring-volt-500/20">
            <div className="mb-2 flex items-center gap-2 text-slate-400"><Wallet className="h-4 w-4 text-volt-500" /><span className="text-xs">Efectivo esperado</span></div>
            <div className="kpi-value text-volt-600 dark:text-volt-400"><CountUp value={s.expectedCash} format={(n) => formatRD(n, { decimals: false })} /></div>
          </div>
        </StaggerItem>
      </Stagger>

      {/* Ingresos por método */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <div className="glass-card p-5">
            <h3 className="mb-3 font-semibold">Ingresos por método</h3>
            {Object.keys(s.incomeByMethod).length === 0 ? (
              <p className="py-2 text-sm text-slate-400">Sin cobros registrados en esta caja aún.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(s.incomeByMethod).map(([m, v]) => (
                  <div key={m} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-white/[0.03]">
                    <span className="capitalize text-slate-600 dark:text-slate-300">{methodLabel[m] ?? m}</span>
                    <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatRD(v, { decimals: false })}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-slate-400">Alimentado en tiempo real de las facturas pagadas.</p>
          </div>
        </Reveal>

        {/* Gastos */}
        <Reveal delay={0.07}>
          <div className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Gastos del día</h3>
              {recurring.some((r) => r.active) && (
                <button onClick={generate} disabled={genPending} className="inline-flex items-center gap-1.5 text-xs font-medium text-volt-600 hover:underline dark:text-volt-400">
                  {genPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Generar recurrentes
                </button>
              )}
            </div>
            {s.expenses.length === 0 ? (
              <p className="py-2 text-sm text-slate-400">Sin gastos registrados.</p>
            ) : (
              <div className="space-y-1.5">
                {s.expenses.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-500"><Receipt className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.description}</p>
                      <p className="text-xs text-slate-400">{catLabel[e.category] ?? e.category} · {methodLabel[e.paymentMethod] ?? e.paymentMethod}</p>
                    </div>
                    {e.hasReceipt && <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                    <span className="shrink-0 font-semibold tabular-nums text-red-500 dark:text-red-400">−{formatRD(e.amount, { decimals: false })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      </div>

      <RecurringSection recurring={recurring} />

      <History history={history} />

      <AnimatePresence>
        {expenseOpen && <ExpenseModal onClose={() => setExpenseOpen(false)} />}
        {closeOpen && <CloseModal summary={s} onClose={() => setCloseOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function ExpenseModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addExpenseAction(fd);
      if (!res.ok) { setError(res.error ?? "No se pudo registrar."); return; }
      router.refresh(); onClose();
    });
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed inset-0 z-50 m-auto h-fit max-h-[92vh] w-[92vw] max-w-md overflow-y-auto">
        <form ref={formRef} onSubmit={submit} className="glass-card max-h-[88vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Registrar gasto</h3>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3">
            <input required name="description" placeholder="Descripción del gasto *" className={field} />
            <div className="grid grid-cols-2 gap-3">
              <select name="category" className={field} defaultValue="combustible">
                {EXPENSE_CATEGORIES.map((c) => (<option key={c} value={c}>{catLabel[c]}</option>))}
              </select>
              <select name="paymentMethod" className={field} defaultValue="efectivo">
                {PAYMENT_METHODS.map((m) => (<option key={m} value={m}>{methodLabel[m]}</option>))}
              </select>
            </div>
            <input required name="amount" type="number" min={1} step="0.01" placeholder="Monto (RD$) *" className={field} />
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-500 hover:border-volt-400 dark:border-white/15 dark:text-slate-400">
              <Camera className="h-4 w-4" />
              <span className="truncate">{fileName ?? "Adjuntar comprobante (opcional)"}</span>
              <input name="receipt" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
            </label>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={pending} className="btn-primary">{pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? "Guardando…" : "Registrar gasto"}</button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function CloseModal({ summary, onClose }: { summary: RegisterSummary; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [counted, setCounted] = useState(summary.expectedCash);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const diff = Math.round((counted - summary.expectedCash) * 100) / 100;
  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await closeRegisterAction(counted, notes);
      if (!res.ok) { setError(res.error ?? "No se pudo cerrar."); return; }
      router.refresh(); onClose();
    });
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed inset-0 z-50 m-auto h-fit max-h-[92vh] w-[92vw] max-w-md overflow-y-auto">
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Cerrar caja — cuadre</h3>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/[0.03]">
            <div className="flex justify-between"><span className="text-slate-500">Apertura</span><span className="tabular-nums">{formatRD(summary.register.openingAmount, { decimals: false })}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">+ Ingresos en efectivo</span><span className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatRD(summary.incomeByMethod["efectivo"] ?? 0, { decimals: false })}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">− Gastos en efectivo</span><span className="tabular-nums text-red-500">{formatRD(summary.expensesByMethod["efectivo"] ?? 0, { decimals: false })}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold dark:border-white/10"><span>Efectivo esperado</span><span className="tabular-nums text-volt-600 dark:text-volt-400">{formatRD(summary.expectedCash, { decimals: false })}</span></div>
          </div>
          <div className="mt-3">
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Efectivo contado (real)</label>
            <input type="number" min={0} step="0.01" value={counted || ""} onChange={(e) => setCounted(Number(e.target.value))} className={cn(field, "text-lg font-semibold tabular-nums")} />
          </div>
          <div className={cn("mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-sm", diff === 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>
            <span>{diff === 0 ? "Cuadra exacto" : diff > 0 ? "Sobrante" : "Faltante"}</span>
            <span className="font-semibold tabular-nums">{formatRD(Math.abs(diff))}</span>
          </div>
          {diff !== 0 && (
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Nota obligatoria de la diferencia…" className={cn(field, "mt-3")} />
          )}
          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="btn-ghost">Cancelar</button>
            <button onClick={submit} disabled={pending} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}{pending ? "Cerrando…" : "Cerrar caja"}</button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function RecurringSection({ recurring }: { recurring: RecurringExpense[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<string>("alquiler");
  const [method, setMethod] = useState<string>("transferencia");
  const field = "rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]";

  function add() {
    setError(null);
    startTransition(async () => {
      const res = await createRecurringAction({ category, description: desc, amount, paymentMethod: method });
      if (!res.ok) { setError(res.error ?? "No se pudo crear."); return; }
      setDesc(""); setAmount(0); router.refresh();
    });
  }

  return (
    <Reveal delay={0.08}>
      <div className="glass-card p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><RefreshCw className="h-5 w-5 text-volt-500" />Gastos recurrentes</h3>
        {recurring.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {recurring.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-white/[0.03]">
                <div><span className="font-medium">{r.description}</span><span className="ml-2 text-xs text-slate-400">{catLabel[r.category] ?? r.category} · {methodLabel[r.paymentMethod] ?? r.paymentMethod}</span></div>
                <span className="font-semibold tabular-nums">{formatRD(r.amount, { decimals: false })}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06] sm:flex-row sm:flex-wrap">
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción" className={cn(field, "min-w-0 flex-1")} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
            {EXPENSE_CATEGORIES.map((c) => (<option key={c} value={c}>{catLabel[c]}</option>))}
          </select>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={field}>
            {PAYMENT_METHODS.map((m) => (<option key={m} value={m}>{methodLabel[m]}</option>))}
          </select>
          <input type="number" min={0} step="0.01" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Monto" className={cn(field, "w-28 tabular-nums")} />
          <button onClick={add} disabled={pending} className="btn-primary px-4 py-2 text-sm">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Agregar</button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </Reveal>
  );
}

function History({ history }: { history: CashRegister[] }) {
  if (history.length === 0) return null;
  return (
    <Reveal delay={0.09}>
      <div>
        <h3 className="mb-3 text-lg font-semibold">Historial de cierres</h3>
        <div className="glass-card divide-y divide-slate-100 p-1 dark:divide-white/[0.05]">
          {history.map((r) => (
            <a key={r.id} href={`/cierre-caja/${r.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-volt-500/10 text-volt-500"><Wallet className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{r.closedAt ? formatDate(r.closedAt) : "—"}</p>
                <p className="text-xs text-slate-400">Contado {formatRD(r.countedCash ?? 0, { decimals: false })}</p>
              </div>
              <span className={cn("shrink-0 text-sm font-semibold tabular-nums", (r.difference ?? 0) === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                {(r.difference ?? 0) === 0 ? "Cuadró" : `${(r.difference ?? 0) > 0 ? "+" : ""}${formatRD(r.difference ?? 0, { decimals: false })}`}
              </span>
            </a>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
