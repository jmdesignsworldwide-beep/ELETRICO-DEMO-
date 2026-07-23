import "server-only";

import { createServerSupabase, isSupabaseConfigured } from "./supabase/server";

interface RateLimitOptions {
  /** Máximo de operaciones dentro de la ventana. */
  limit?: number;
  /** Ventana en milisegundos. */
  windowMs?: number;
}

/**
 * Rate limiting DURABLE, por usuario, validado en la base de datos.
 * (Un limitador en memoria no sirve en serverless — se reinicia por instancia.)
 * La RPC rl_check namespacea el bucket por auth.uid(), así un usuario no puede
 * consumir el presupuesto de otro. Lanza si se excede.
 *
 * Fail-open ante error de infraestructura: un fallo del limitador no debe
 * tumbar la app, pero en operación normal el límite se aplica.
 */
export async function enforceRateLimit(
  key: string,
  { limit = 20, windowMs = 60_000 }: RateLimitOptions = {}
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.rpc("rl_check", {
      p_key: key,
      p_limit: limit,
      p_window: Math.ceil(windowMs / 1000),
    });
    if (error) return; // fail-open ante error de infraestructura
    if (data === false) {
      throw new Error("Demasiadas solicitudes. Intenta de nuevo en un momento.");
    }
  } catch (e) {
    // Re-lanzar solo el error de límite; tragar fallos de infraestructura.
    if (e instanceof Error && e.message.startsWith("Demasiadas solicitudes")) throw e;
  }
}
