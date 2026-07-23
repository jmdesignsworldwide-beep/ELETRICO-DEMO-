"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser, requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { calcITBIS } from "@/lib/utils";

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
    revalidatePath(`/ordenes/${id}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Registrar material usado en una orden → descuenta inventario y deja bitácora. */
export async function registerMaterialAction(
  orderId: string,
  inventoryId: string,
  qtyUsed: number
): Promise<ActionResult> {
  try {
    const user = await requireActiveUser();
    enforceRateLimit(`order:material:${user.id}`);
    if (!UUID.test(orderId) || !UUID.test(inventoryId))
      return { ok: false, error: "ID inválido." };
    const qty = Math.floor(Number(qtyUsed));
    if (!Number.isFinite(qty) || qty < 1 || qty > 100_000)
      return { ok: false, error: "Cantidad inválida." };

    // Verifica acceso: RLS deja ver la orden solo a admin o técnico asignado.
    const supabase = createServerSupabase();
    const { data: order } = await supabase
      .from("service_orders")
      .select("id")
      .eq("id", orderId)
      .single();
    if (!order) return { ok: false, error: "Orden no encontrada o sin acceso." };

    // Operaciones sensibles con cliente admin (ya autorizado arriba).
    const admin = createAdminSupabase();
    const { data: item } = await admin
      .from("inventory")
      .select("name, sale_price, stock")
      .eq("id", inventoryId)
      .single();
    if (!item) return { ok: false, error: "Material no encontrado." };

    await admin.from("order_materials").insert({
      order_id: orderId,
      inventory_id: inventoryId,
      name: item.name,
      qty_estimated: 0,
      qty_used: qty,
      unit_price: item.sale_price,
    });
    await admin
      .from("inventory")
      .update({ stock: Math.max((item.stock ?? 0) - qty, 0) })
      .eq("id", inventoryId);
    await admin.from("inventory_movements").insert({
      inventory_id: inventoryId,
      order_id: orderId,
      change: -qty,
      reason: "Uso en orden de servicio",
      actor_id: user.id,
    });

    revalidatePath(`/ordenes/${orderId}`);
    revalidatePath("/inventario");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Cierre de orden: descripción final, recomendaciones → estado completada. */
export async function closeOrderAction(
  orderId: string,
  finalNotes: string,
  recommendations: string
): Promise<ActionResult> {
  try {
    const user = await requireActiveUser();
    enforceRateLimit(`order:close:${user.id}`);
    if (!UUID.test(orderId)) return { ok: false, error: "ID inválido." };
    if (!finalNotes || finalNotes.trim().length < 4)
      return { ok: false, error: "La descripción final es obligatoria." };

    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("service_orders")
      .update({
        status: "completada",
        final_notes: finalNotes.trim().slice(0, 4000),
        recommendations: (recommendations ?? "").trim().slice(0, 4000),
        closed_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    if (error) return { ok: false, error: "No se pudo cerrar la orden." };

    await supabase.from("activity_log").insert({
      actor_id: user.id,
      event_type: "orden",
      title: "Orden completada",
      detail: `Orden cerrada por ${user.fullName}`,
    });

    revalidatePath(`/ordenes/${orderId}`);
    revalidatePath("/ordenes");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Convierte una orden completada en factura (NCF simulado, ITBIS 18%). */
export async function convertOrderToInvoiceAction(
  orderId: string
): Promise<ActionResult & { invoiceId?: string }> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`order:invoice:${user.id}`);
    if (!UUID.test(orderId)) return { ok: false, error: "ID inválido." };

    const supabase = createServerSupabase();
    const { data: order } = await supabase
      .from("service_orders")
      .select("id, number, client_id, status, total, invoice_id")
      .eq("id", orderId)
      .single();
    if (!order) return { ok: false, error: "Orden no encontrada." };
    if (order.invoice_id) return { ok: false, error: "Esta orden ya fue facturada." };
    if (!["completada"].includes(order.status))
      return { ok: false, error: "Solo se factura una orden completada." };

    const subtotal = Number(order.total ?? 0);
    const itbis = calcITBIS(subtotal);
    const total = subtotal + itbis;

    const year = new Date().getFullYear();
    const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true });
    const seq = (count ?? 0) + 200;
    const number = `FAC-${year}-${String(seq).padStart(4, "0")}`;
    const ncf = `B01${String(seq).padStart(8, "0")}`;

    const { data: inv, error } = await supabase
      .from("invoices")
      .insert({
        number, ncf, client_id: order.client_id, status: "pendiente",
        subtotal, itbis, total, order_id: orderId,
      })
      .select("id")
      .single();
    if (error || !inv) return { ok: false, error: "No se pudo generar la factura." };

    await supabase
      .from("service_orders")
      .update({ status: "facturada", invoice_id: inv.id })
      .eq("id", orderId);

    await supabase.from("activity_log").insert({
      actor_id: user.id,
      event_type: "factura",
      title: "Factura generada",
      detail: `${number} desde ${order.number}`,
    });

    revalidatePath(`/ordenes/${orderId}`);
    revalidatePath("/facturacion");
    revalidatePath("/dashboard");
    return { ok: true, invoiceId: inv.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
