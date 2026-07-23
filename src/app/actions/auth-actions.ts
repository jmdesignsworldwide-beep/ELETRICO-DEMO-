"use server";

import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";

export interface AuthResult {
  ok: boolean;
  error?: string;
  expired?: boolean;
}

const DEMO_DOMAIN = "demo.jmelectric.app";

/** Mapea usuario → email interno (el cliente nunca ve el email). */
function usernameToEmail(username: string): string {
  const u = username.trim().toLowerCase();
  return u.includes("@") ? u : `${u}@${DEMO_DOMAIN}`;
}

export async function signInAction(username: string, password: string): Promise<AuthResult> {
  try {
    if (!isSupabaseConfigured()) return { ok: false, error: "Autenticación no configurada." };
    if (!username || !password) return { ok: false, error: "Usuario y contraseña requeridos." };
    await enforceRateLimit(`login:${username.trim().toLowerCase()}`, { limit: 8, windowMs: 60_000 });

    const supabase = createServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    if (error || !data.user) return { ok: false, error: "Usuario o contraseña incorrectos." };

    // Vigencia: si la cuenta de demo ya venció, no dejamos entrar.
    const { data: profile } = await supabase.from("profiles").select("is_owner").eq("id", data.user.id).maybeSingle();
    if (!profile?.is_owner) {
      const { data: demo } = await supabase.from("demo_accounts").select("active, expires_at").eq("user_id", data.user.id).maybeSingle();
      if (demo && (demo.active === false || (demo.expires_at && new Date(demo.expires_at).getTime() <= Date.now()))) {
        await supabase.auth.signOut();
        return { ok: false, expired: true, error: "Tu acceso de demostración ha expirado." };
      }
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function signOutAction(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createServerSupabase();
  await supabase.auth.signOut();
}
