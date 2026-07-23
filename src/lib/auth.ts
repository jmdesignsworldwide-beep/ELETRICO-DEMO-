import "server-only";

import { createServerSupabase } from "./supabase/server";

export interface ActiveUser {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "tecnico";
}

/**
 * FORT KNOX: toda server action arranca por aquí.
 * Exige un usuario autenticado y activo. Lanza si no lo hay.
 */
export async function requireActiveUser(): Promise<ActiveUser> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autorizado: sesión requerida.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role, active")
    .eq("id", user.id)
    .single();

  if (error || !profile || !profile.active) {
    throw new Error("No autorizado: usuario inactivo o sin perfil.");
  }

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    role: profile.role,
  };
}

/** Exige rol admin. Usar donde solo el dueño/super admin puede operar. */
export async function requireAdmin(): Promise<ActiveUser> {
  const user = await requireActiveUser();
  if (user.role !== "admin") {
    throw new Error("No autorizado: se requiere rol de administrador.");
  }
  return user;
}
