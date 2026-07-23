"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, Loader2, ShieldCheck, KeyRound, Clock, Ban, RotateCw, Trash2, CheckCircle2 } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";
import type { DemoAccountRow } from "@/lib/data";
import { createDemoAccountAction, renewAccountAction, setAccountActiveAction, deleteDemoAccountAction } from "@/app/actions/accounts";

const statusStyle: Record<DemoAccountRow["status"], string> = {
  activa: "bg-emerald-50 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300",
  por_vencer: "bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300",
  expirada: "bg-red-50 text-red-700 ring-red-500/25 dark:bg-red-500/15 dark:text-red-300",
  revocada: "bg-slate-100 text-slate-500 ring-slate-500/20 dark:bg-slate-500/15 dark:text-slate-400",
};
const statusLabel: Record<DemoAccountRow["status"], string> = {
  activa: "Activa", por_vencer: "Por vencer", expirada: "Expirada", revocada: "Revocada",
};

export function CuentasView({ accounts }: { accounts: DemoAccountRow[] }) {
  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-volt-500" />
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Panel exclusivo de JM Nexus Designs · acceso de demostración</p>
            <h2 className="text-2xl font-bold tracking-tight">Cuentas de demo</h2>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.04}><CreateCard /></Reveal>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Mis cuentas ({accounts.length})</h3>
        {accounts.length === 0 ? (
          <div className="glass-card p-10 text-center text-sm text-slate-400">Aún no has creado cuentas de demo.</div>
        ) : (
          <Stagger className="space-y-3">
            {accounts.map((a) => <StaggerItem key={a.id}><AccountRow account={a} /></StaggerItem>)}
          </Stagger>
        )}
      </div>
    </div>
  );
}

function CreateCard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState<number | null>(15);
  const [custom, setCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setOk(false);
    startTransition(async () => {
      const res = await createDemoAccountAction(username, password, days);
      if (!res.ok) { setError(res.error ?? "No se pudo crear."); return; }
      setOk(true); setUsername(""); setPassword(""); router.refresh();
      setTimeout(() => setOk(false), 2500);
    });
  }

  const preset = (d: number | null, label: string) => (
    <button type="button" onClick={() => { setDays(d); setCustom(false); }}
      className={cn("rounded-lg px-3 py-2 text-sm font-medium transition-colors", !custom && days === d ? "bg-volt-500 text-ink-950" : "border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400")}>{label}</button>
  );

  return (
    <form onSubmit={submit} className="glass-card p-5">
      <h3 className="mb-4 flex items-center gap-2 font-semibold"><UserPlus className="h-5 w-5 text-volt-500" />Crear cuenta de cliente</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Usuario</label>
          <input required value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" placeholder="ej. cliente_electrisa" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Contraseña</label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input required type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" className={cn(field, "pl-9")} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs text-slate-400">Vigencia</label>
        <div className="flex flex-wrap items-center gap-2">
          {preset(7, "7 días")}{preset(15, "15 días")}{preset(30, "30 días")}{preset(null, "Sin vencimiento")}
          <button type="button" onClick={() => { setCustom(true); setDays(days ?? 20); }} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition-colors", custom ? "bg-volt-500 text-ink-950" : "border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400")}>Personalizado</button>
          {custom && (
            <input type="number" min={1} max={3650} value={days ?? 1} onChange={(e) => setDays(Math.max(1, Number(e.target.value)))} className="w-24 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm tabular-nums outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]" />
          )}
        </div>
        {days !== null && <p className="mt-2 text-xs text-slate-400" suppressHydrationWarning>Vence el {formatDate(new Date(Date.now() + days * 86_400_000))}</p>}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {ok && <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">Cuenta creada ✓</p>}
      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}{pending ? "Creando…" : "Crear cuenta"}</button>
      </div>
    </form>
  );
}

function useCountdown(expiresAt: string | null) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const t = setInterval(() => tick((v) => v + 1), 60_000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (!expiresAt) return "Sin vencimiento";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expirada";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return `${d}d ${h}h`;
}

function AccountRow({ account: a }: { account: DemoAccountRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDel, setConfirmDel] = useState(false);
  const countdown = useCountdown(a.expiresAt);

  const act = (fn: () => Promise<{ ok: boolean }>) => startTransition(async () => { await fn(); router.refresh(); });

  return (
    <motion.div whileHover={{ y: -1 }} className="glass-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-volt-gradient text-sm font-bold text-ink-950">{a.username.slice(0, 2).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{a.username}</span>
            <Badge className={statusStyle[a.status]}>{statusLabel[a.status]}</Badge>
          </div>
          <p className="text-xs text-slate-400">Creada {formatDate(a.createdAt)} · {a.expiresAt ? `Vence ${formatDate(a.expiresAt)}` : "Sin vencimiento"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Restante</p>
          <p className={cn("flex items-center gap-1 font-semibold tabular-nums", a.status === "expirada" || a.status === "revocada" ? "text-red-500" : a.status === "por_vencer" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")} suppressHydrationWarning>
            <Clock className="h-3.5 w-3.5" />{countdown}
          </p>
        </div>
        <div className="flex w-full items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-white/[0.06] sm:w-auto sm:border-0 sm:pt-0">
          <button onClick={() => act(() => renewAccountAction(a.id, 15))} disabled={pending} className="btn-ghost px-2.5 py-1.5 text-xs"><RotateCw className="h-3.5 w-3.5" />+15d</button>
          {a.active ? (
            <button onClick={() => act(() => setAccountActiveAction(a.id, false))} disabled={pending} className="btn-ghost px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400"><Ban className="h-3.5 w-3.5" />Revocar</button>
          ) : (
            <button onClick={() => act(() => setAccountActiveAction(a.id, true))} disabled={pending} className="btn-ghost px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />Activar</button>
          )}
          <button onClick={() => setConfirmDel(true)} disabled={pending} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      {confirmDel && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-red-500/5 px-3 py-2 text-sm ring-1 ring-inset ring-red-500/20">
          <span className="text-red-600 dark:text-red-400">¿Eliminar la cuenta “{a.username}” por completo?</span>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDel(false)} className="btn-ghost px-2.5 py-1 text-xs">Cancelar</button>
            <button onClick={() => act(() => deleteDemoAccountAction(a.id))} disabled={pending} className="btn-primary px-2.5 py-1 text-xs" style={{ background: "#ef4444", color: "#fff" }}>{pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}Eliminar</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
