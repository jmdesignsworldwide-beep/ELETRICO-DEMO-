"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;
const DEMO_DOMAIN = "demo.jmelectric.app";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function daysToExpiry(days: number | null): string | null {
  if (days === null) return null; // sin vencimiento
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Crear cuenta de cliente con vigencia. Solo el owner. */
export async function createDemoAccountAction(
  username: string,
  password: string,
  days: number | null
): Promise<ActionResult> {
  try {
    const owner = await requireOwner();
    await enforceRateLimit(`acct:create:${owner.id}`);

    const u = (username ?? "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(u)) return { ok: false, error: "Usuario inválido (3-30, letras/números/._-)." };
    if (!password || password.length < 6) return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
    if (days !== null && (!Number.isInteger(days) || days < 1 || days > 3650)) return { ok: false, error: "Vigencia inválida." };

    const admin = createAdminSupabase();
    const email = `${u}@${DEMO_DOMAIN}`;

    // Crea el usuario de Auth (email confirmado para permitir login inmediato).
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (cErr || !created.user) {
      if (cErr?.message?.toLowerCase().includes("already")) return { ok: false, error: "Ese usuario ya existe." };
      return { ok: false, error: "No se pudo crear la cuenta." };
    }
    const uid = created.user.id;

    // Perfil (admin del negocio, pero NO owner) + fila de cuenta de demo.
    const { error: pErr } = await admin.from("profiles").upsert({
      id: uid, full_name: u, role: "admin", active: true, is_owner: false, username: u,
    });
    if (pErr) { await admin.auth.admin.deleteUser(uid); return { ok: false, error: "No se pudo crear el perfil." }; }

    const { error: dErr } = await admin.from("demo_accounts").insert({
      user_id: uid, username: u, expires_at: daysToExpiry(days), active: true, created_by: owner.id,
    });
    if (dErr) { await admin.auth.admin.deleteUser(uid); return { ok: false, error: "No se pudo registrar la vigencia." }; }

    revalidatePath("/cuentas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Extender / renovar: suma días a la vigencia (desde hoy si ya venció). */
export async function renewAccountAction(id: string, addDays: number): Promise<ActionResult> {
  try {
    const owner = await requireOwner();
    await enforceRateLimit(`acct:renew:${owner.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    if (!Number.isInteger(addDays) || addDays < 1 || addDays > 3650) return { ok: false, error: "Días inválidos." };

    const supabase = createServerSupabase();
    const { data: acct } = await supabase.from("demo_accounts").select("expires_at").eq("id", id).single();
    if (!acct) return { ok: false, error: "Cuenta no encontrada." };

    const base = acct.expires_at && new Date(acct.expires_at).getTime() > Date.now() ? new Date(acct.expires_at) : new Date();
    base.setDate(base.getDate() + addDays);

    const { error } = await supabase.from("demo_accounts").update({ expires_at: base.toISOString(), active: true }).eq("id", id);
    if (error) return { ok: false, error: "No se pudo renovar." };
    revalidatePath("/cuentas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Activar / desactivar (revocar = desactivar). Bloquea el acceso de inmediato. */
export async function setAccountActiveAction(id: string, active: boolean): Promise<ActionResult> {
  try {
    const owner = await requireOwner();
    await enforceRateLimit(`acct:toggle:${owner.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("demo_accounts").update({ active: Boolean(active) }).eq("id", id);
    if (error) return { ok: false, error: "No se pudo actualizar." };
    revalidatePath("/cuentas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Eliminar cuenta por completo (Auth + perfil + vigencia). */
export async function deleteDemoAccountAction(id: string): Promise<ActionResult> {
  try {
    const owner = await requireOwner();
    await enforceRateLimit(`acct:delete:${owner.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    const admin = createAdminSupabase();
    const { data: acct } = await admin.from("demo_accounts").select("user_id").eq("id", id).single();
    if (!acct) return { ok: false, error: "Cuenta no encontrada." };
    // Borrar el usuario de Auth arrastra (cascade) perfil y demo_accounts.
    const { error } = await admin.auth.admin.deleteUser(acct.user_id);
    if (error) return { ok: false, error: "No se pudo eliminar." };
    revalidatePath("/cuentas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
