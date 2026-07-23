// Cliente de navegador — solo anon key + URL (públicas).
// Nunca expone service_role. Se instancia perezosamente para no romper
// el build cuando las variables aún no están configuradas (modo demo).

export function getSupabaseBrowserConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return {
    configured: Boolean(url && anonKey),
    url: url ?? "",
    anonKey: anonKey ?? "",
  };
}
