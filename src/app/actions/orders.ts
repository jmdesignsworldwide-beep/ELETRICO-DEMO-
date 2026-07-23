"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser, requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase/server";

const SERVICE_TYPES = [
  "instalacion_nueva", "reparacion", "mantenimiento", "paneles_solares",
  "aire_acondicionado", "camaras", "alarmas", "tomacorrientes", "breakers",
  "diagnostico", "certificacion", "emergencia", "otro",
] as const;

const STATUSES = [
  "recibida", "asignada", "en_proceso", "esperando_materiales",
  "esperando_aprobacion", "completada", "facturada", "pagada", "cancelada",
] as const;

const PRIORITIES = ["normal", "urgente", "emergencia"] as const;

export interface OrderInput {
  clientId: string;
  serviceType: string;
  priority: string;
  scheduledDate: string;
  estimatedEndDate: string;
  description?: string;
  address?: string;
  total?: number;
  technicianIds?: string[];
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const UUID = /^[0-9a-f-]{36}$/i;

async function nextOrderNumber(supabase: ReturnType<typeof createServerSupabase>): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("service_orders")
    .select("*", { count: "exact", head: true });
  const seq = String((count ?? 0) + 148).padStart(4, "0");
  return `OS-${year}-${seq}`;
}

export async function createOrderAction(input: OrderInput): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`order:create:${user.id}`);

    if (!UUID.test(input.clientId)) return { ok: false, error: "Cliente inválido." };
    if (!SERVICE_TYPES.includes(input.serviceType as (typeof SERVICE_TYPES)[number]))
      return { ok: false, error: "Tipo de servicio inválido." };
    if (!PRIORITIES.includes(input.priority as (typeof PRIORITIES)[number]))
      return { ok: false, error: "Prioridad inválida." };
    if (isNaN(Date.parse(input.scheduledDate)) || isNaN(Date.parse(input.estimatedEndDate)))
      return { ok: false, error: "Fechas inválidas." };
    const total = Number(input.total ?? 0);
    if (isNaN(total) || total < 0 || total > 100_000_000)
      return { ok: false, error: "Monto inválido." };
    const techIds = (input.technicianIds ?? []).filter((t) => UUID.test(t));

    const supabase = createServerSupabase();
    const number = await nextOrderNumber(supabase);
    const { error } = await supabase.from("service_orders").insert({
      number,
      client_id: input.clientId,
      service_type: input.serviceType,
      status: techIds.length ? "asignada" : "recibida",
      priority: input.priority,
      technician_ids: techIds,
      scheduled_date: input.scheduledDate,
      estimated_end_date: input.estimatedEndDate,
      description: (input.description ?? "").slice(0, 2000),
      address: (input.address ?? "").slice(0, 300),
      total,
    });
    if (error) return { ok: false, error: "No se pudo crear la orden." };

    await supabase.from("activity_log").insert({
      actor_id: user.id,
      event_type: "orden",
      title: "Nueva orden de servicio",
      detail: `${number} creada`,
    });

    revalidatePath("/ordenes");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** El técnico puede actualizar el estado de sus órdenes; el admin, cualquiera.
 *  RLS aplica el filtro real; aquí validamos el estado por whitelist. */
export async function updateOrderStatusAction(id: string, status: string): Promise<ActionResult> {
  try {
    const user = await requireActiveUser();
    enforceRateLimit(`order:status:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    if (!STATUSES.includes(status as (typeof STATUSES)[number]))
      return { ok: false, error: "Estado inválido." };

    const supabase = createServerSupabase();
    const { error } = await supabase.from("service_orders").update({ status }).eq("id", id);
    if (error) return { ok: false, error: "No se pudo actualizar el estado." };

    revalidatePath("/ordenes");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
