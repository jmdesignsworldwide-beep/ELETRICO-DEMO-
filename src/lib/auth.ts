import "server-only";

import { createServerSupabase } from "./supabase/server";

export interface ActiveUser {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "tecnico";
  isOwner: boolean;
}

export class AccessExpiredError extends Error {
  constructor() {
    super("Tu acceso de demostración ha expirado.");
    this.name = "AccessExpiredError";
  }
}

/**
 * FORT KNOX: toda server action arranca por aquí.
 * Exige usuario autenticado, activo y (si es cuenta de demo) con vigencia.
 * El owner nunca vence.
 */
export async function requireActiveUser(): Promise<ActiveUser> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado: sesión requerida.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role, active, is_owner")
    .eq("id", user.id)
    .single();
  if (error || !profile || !profile.active) {
    throw new Error("No autorizado: usuario inactivo o sin perfil.");
  }

  // Capa B: vigencia de la cuenta de demo (el owner queda exento).
  if (!profile.is_owner) {
    const { data: demo } = await supabase
      .from("demo_accounts")
      .select("active, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (demo) {
      const expired =
        demo.active === false ||
        (demo.expires_at !== null && new Date(demo.expires_at).getTime() <= Date.now());
      if (expired) throw new AccessExpiredError();
    }
  }

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    role: profile.role,
    isOwner: Boolean(profile.is_owner),
  };
}

export async function requireAdmin(): Promise<ActiveUser> {
  const user = await requireActiveUser();
  if (user.role !== "admin") {
    throw new Error("No autorizado: se requiere rol de administrador.");
  }
  return user;
}

/** FORT KNOX: solo el owner real (JM Nexus Designs). NO el admin genérico. */
export async function requireOwner(): Promise<ActiveUser> {
  const user = await requireActiveUser();
  if (!user.isOwner) {
    throw new Error("No autorizado: acceso exclusivo del propietario.");
  }
  return user;
}
