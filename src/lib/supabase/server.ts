import "server-only";

// FORT KNOX: la service_role SOLO vive en el servidor.
// Este módulo importa "server-only" — cualquier intento de importarlo
// desde el cliente rompe el build a propósito.

export function getServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

export function getSupabaseServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    configured: Boolean(url && serviceRole),
    url: url ?? "",
    serviceRole: serviceRole ?? "",
  };
}
