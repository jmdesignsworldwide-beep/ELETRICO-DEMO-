"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase/server";

import { calcITBIS } from "@/lib/utils";

const UUID = /^[0-9a-f-]{36}$/i;
const QUOTE_STATUSES = ["borrador", "enviada", "aprobada", "rechazada", "vencida"] as const;

export interface QuoteConvertResult {
  ok: boolean;
  error?: string;
  orderId?: string;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface QuoteItemInput {
  kind: string;
  description: string;
  qty: number;
  unitPrice: number;
  inventoryId?: string;
}

/** Crear cotización real: líneas (materiales + mano de obra), descuento, ITBIS 18%.
 *  Los totales se calculan en el SERVIDOR, nunca se confían del cliente. */
export async function createQuoteAction(
  clientId: string,
  items: QuoteItemInput[],
  discount: number
): Promise<QuoteConvertResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`quote:create:${user.id}`);
    if (!UUID.test(clientId)) return { ok: false, error: "Cliente inválido." };

    const clean = (items ?? []).filter(
      (i) => i && typeof i.description === "string" && i.description.trim().length > 0 && Number(i.qty) > 0
    );
    if (clean.length === 0) return { ok: false, error: "Agrega al menos una línea." };

    // Recalcular montos en el servidor.
    const subtotal = clean.reduce((s, i) => s + Number(i.qty) * Math.max(0, Number(i.unitPrice) || 0), 0);
    const disc = Math.min(Math.max(0, Number(discount) || 0), subtotal);
    const base = subtotal - disc;
    const itbis = calcITBIS(base);
    const total = base + itbis;
    if (subtotal <= 0 || subtotal > 100_000_000) return { ok: false, error: "Monto inválido." };

    const supabase = createServerSupabase();
    const year = new Date().getFullYear();
    const { count } = await supabase.from("quotes").select("*", { count: "exact", head: true });
    const number = `COT-${year}-${String((count ?? 0) + 92).padStart(4, "0")}`;
    const validUntil = new Date(Date.now() + 15 * 86_400_000).toISOString();

    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({
        number, client_id: clientId, status: "borrador",
        subtotal, discount: disc, itbis, total, valid_until: validUntil,
      })
      .select("id").single();
    if (error || !quote) return { ok: false, error: "No se pudo crear la cotización." };

    const rows = clean.map((i, idx) => ({
      quote_id: quote.id,
      kind: ["material", "mano_obra", "transporte", "otro"].includes(i.kind) ? i.kind : "otro",
      description: i.description.trim().slice(0, 300),
      qty: Number(i.qty),
      unit_price: Math.max(0, Number(i.unitPrice) || 0),
      line_total: Number(i.qty) * Math.max(0, Number(i.unitPrice) || 0),
      inventory_id: i.inventoryId && UUID.test(i.inventoryId) ? i.inventoryId : null,
      sort: idx,
    }));
    const { error: itErr } = await supabase.from("quote_items").insert(rows);
    if (itErr) {
      await supabase.from("quotes").delete().eq("id", quote.id);
      return { ok: false, error: "No se pudieron guardar las líneas." };
    }

    await supabase.from("activity_log").insert({
      actor_id: user.id, event_type: "cotizacion", title: "Nueva cotización", detail: `${number} creada`,
    });

    revalidatePath("/cotizaciones");
    revalidatePath("/dashboard");
    return { ok: true, orderId: quote.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function updateQuoteStatusAction(id: string, status: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`quote:status:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    if (!QUOTE_STATUSES.includes(status as (typeof QUOTE_STATUSES)[number]))
      return { ok: false, error: "Estado inválido." };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
    if (error) return { ok: false, error: "No se pudo actualizar el estado." };
    revalidatePath("/cotizaciones");
    revalidatePath(`/cotizaciones/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Convierte una cotización aprobada en orden de servicio (un clic). */
export async function convertQuoteToOrderAction(quoteId: string): Promise<QuoteConvertResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`quote:convert:${user.id}`);
    if (!UUID.test(quoteId)) return { ok: false, error: "ID inválido." };

    const supabase = createServerSupabase();
    const { data: quote } = await supabase
      .from("quotes")
      .select("id, number, client_id, status, total, converted_order_id")
      .eq("id", quoteId)
      .single();
    if (!quote) return { ok: false, error: "Cotización no encontrada." };
    if (quote.status !== "aprobada")
      return { ok: false, error: "Solo se convierte una cotización aprobada." };
    if (quote.converted_order_id)
      return { ok: false, error: "Esta cotización ya fue convertida en orden." };

    const now = new Date();
    const end = new Date(now.getTime() + 3 * 86_400_000);
    const year = now.getFullYear();
    const { count } = await supabase.from("service_orders").select("*", { count: "exact", head: true });
    const number = `OS-${year}-${String((count ?? 0) + 148).padStart(4, "0")}`;

    const { data: order, error } = await supabase
      .from("service_orders")
      .insert({
        number,
        client_id: quote.client_id,
        service_type: "instalacion_nueva",
        status: "recibida",
        priority: "normal",
        technician_ids: [],
        scheduled_date: now.toISOString(),
        estimated_end_date: end.toISOString(),
        description: `Generada desde la cotización ${quote.number}`,
        address: "",
        total: Number(quote.total ?? 0),
        quote_id: quote.id,
      })
      .select("id")
      .single();
    if (error || !order) return { ok: false, error: "No se pudo crear la orden." };

    await supabase.from("quotes").update({ converted_order_id: order.id }).eq("id", quote.id);
    await supabase.from("activity_log").insert({
      actor_id: user.id,
      event_type: "orden",
      title: "Cotización convertida en orden",
      detail: `${quote.number} → ${number}`,
    });

    revalidatePath("/cotizaciones");
    revalidatePath("/ordenes");
    revalidatePath("/dashboard");
    return { ok: true, orderId: order.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
