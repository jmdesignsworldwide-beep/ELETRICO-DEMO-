import "server-only";

// Rate limiting del lado del servidor, por usuario.
// Implementación en memoria (suficiente para el demo). En producción con
// múltiples instancias: respaldar con Supabase/Redis.

const buckets = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  /** Máximo de operaciones dentro de la ventana. */
  limit?: number;
  /** Ventana en milisegundos. */
  windowMs?: number;
}

/**
 * Lanza si el usuario excede el límite. Llamar dentro de server actions
 * después de requireActiveUser().
 */
export function enforceRateLimit(
  key: string,
  { limit = 20, windowMs = 60_000 }: RateLimitOptions = {}
): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.count >= limit) {
    throw new Error("Demasiadas solicitudes. Intenta de nuevo en un momento.");
  }

  bucket.count += 1;
}
