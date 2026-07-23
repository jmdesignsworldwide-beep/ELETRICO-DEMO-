"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

export interface QuoteConvertResult {
  ok: boolean;
  error?: string;
  orderId?: string;
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
