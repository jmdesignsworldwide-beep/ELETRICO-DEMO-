"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase/server";
import { calcITBIS } from "@/lib/utils";

const UUID = /^[0-9a-f-]{36}$/i;
const METHODS = ["efectivo", "transferencia", "debito", "credito"] as const;

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface PaymentInput {
  method: string;
  amount: number;
  voucher?: string;
  received?: number;
}

// Redondeo a centavos para comparaciones de dinero exactas.
const cents = (n: number) => Math.round(n * 100);

/** Crear factura manual (cliente + concepto + subtotal). ITBIS 18% auto. */
export async function createInvoiceAction(input: {
  clientId: string;
  description: string;
  subtotal: number;
}): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`invoice:create:${user.id}`);
    if (!UUID.test(input.clientId)) return { ok: false, error: "Cliente inválido." };
    const desc = (input.description ?? "").trim();
    if (desc.length < 3) return { ok: false, error: "Describe el concepto de la factura." };
    const subtotal = Number(input.subtotal);
    if (!Number.isFinite(subtotal) || subtotal <= 0 || subtotal > 100_000_000)
      return { ok: false, error: "Monto inválido." };

    const itbis = calcITBIS(subtotal);
    const total = subtotal + itbis;
    const year = new Date().getFullYear();
    const supabase = createServerSupabase();
    const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true });
    const seq = (count ?? 0) + 200;
    const number = `FAC-${year}-${String(seq).padStart(4, "0")}`;
    const ncf = `B01${String(seq).padStart(8, "0")}`;

    const { data: inv, error } = await supabase
      .from("invoices")
      .insert({ number, ncf, client_id: input.clientId, status: "pendiente", subtotal, itbis, total })
      .select("id")
      .single();
    if (error || !inv) return { ok: false, error: "No se pudo crear la factura." };

    await supabase.from("invoice_items").insert({
      invoice_id: inv.id,
      description: desc.slice(0, 300),
      qty: 1,
      unit_price: subtotal,
      line_total: subtotal,
      sort: 0,
    });

    revalidatePath("/facturacion");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/**
 * Registrar el cobro. FORT KNOX: el monto se recalcula contra la factura en
 * el servidor. La suma de los pagos debe cuadrar EXACTAMENTE con el total.
 * Rechaza vouchers de transferencia duplicados.
 */
export async function registerPaymentAction(
  invoiceId: string,
  payments: PaymentInput[]
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`invoice:pay:${user.id}`);
    if (!UUID.test(invoiceId)) return { ok: false, error: "Factura inválida." };
    if (!Array.isArray(payments) || payments.length === 0)
      return { ok: false, error: "Agrega al menos un método de pago." };

    const supabase = createServerSupabase();
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, total, status, order_id")
      .eq("id", invoiceId)
      .single();
    if (!invoice) return { ok: false, error: "Factura no encontrada." };
    if (invoice.status !== "pendiente")
      return { ok: false, error: "Solo se cobra una factura pendiente." };

    // Validación por whitelist + tipos.
    let applied = 0;
    const rows: Record<string, unknown>[] = [];
    for (const p of payments) {
      if (!METHODS.includes(p.method as (typeof METHODS)[number]))
        return { ok: false, error: "Método de pago inválido." };
      const amount = Number(p.amount);
      if (!Number.isFinite(amount) || amount <= 0)
        return { ok: false, error: "Monto de pago inválido." };
      applied += amount;

      let received: number | null = null;
      let change: number | null = null;
      if (p.method === "efectivo" && p.received != null) {
        received = Number(p.received);
        if (!Number.isFinite(received) || received < amount)
          return { ok: false, error: "El efectivo recibido no cubre el monto." };
        change = received - amount;
      }

      let voucher: string | null = null;
      if (p.method === "transferencia") {
        voucher = (p.voucher ?? "").trim();
        if (!voucher) return { ok: false, error: "La transferencia requiere número de voucher." };
        if (voucher.length > 60) return { ok: false, error: "Voucher demasiado largo." };
      }

      rows.push({
        invoice_id: invoiceId,
        method: p.method,
        amount,
        voucher,
        received,
        change_given: change,
        actor_id: user.id,
      });
    }

    // La suma debe cuadrar EXACTAMENTE con el total recalculado del servidor.
    if (cents(applied) !== cents(Number(invoice.total)))
      return {
        ok: false,
        error: "La suma de los pagos no cuadra con el total de la factura.",
      };

    // Chequeo de vouchers duplicados (además del índice único en la BD).
    const vouchers = rows.map((r) => r.voucher).filter(Boolean) as string[];
    if (vouchers.length) {
      const { data: dups } = await supabase
        .from("payments")
        .select("voucher")
        .in("voucher", vouchers);
      if (dups && dups.length)
        return { ok: false, error: `Voucher ya registrado: ${dups[0].voucher}.` };
    }

    const { error: payErr } = await supabase.from("payments").insert(rows);
    if (payErr) {
      if (payErr.code === "23505")
        return { ok: false, error: "Voucher de transferencia duplicado." };
      return { ok: false, error: "No se pudo registrar el pago." };
    }

    const summary =
      payments.length > 1
        ? "Pago mixto"
        : payments[0].method.charAt(0).toUpperCase() + payments[0].method.slice(1);

    await supabase
      .from("invoices")
      .update({ status: "pagada", paid_at: new Date().toISOString(), payment_method: summary })
      .eq("id", invoiceId);

    // La orden vinculada pasa a Pagada.
    if (invoice.order_id) {
      await supabase.from("service_orders").update({ status: "pagada" }).eq("id", invoice.order_id);
    }

    await supabase.from("activity_log").insert({
      actor_id: user.id,
      event_type: "pago",
      title: "Pago recibido",
      detail: `Factura cobrada · ${summary}`,
    });

    revalidatePath(`/facturacion/${invoiceId}`);
    revalidatePath("/facturacion");
    revalidatePath("/dashboard");
    revalidatePath("/caja");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Anular factura — motivo obligatorio, queda en bitácora permanente. */
export async function voidInvoiceAction(invoiceId: string, motivo: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`invoice:void:${user.id}`);
    if (!UUID.test(invoiceId)) return { ok: false, error: "Factura inválida." };
    const reason = (motivo ?? "").trim();
    if (reason.length < 5) return { ok: false, error: "El motivo de anulación es obligatorio." };

    const supabase = createServerSupabase();
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, number, status")
      .eq("id", invoiceId)
      .single();
    if (!invoice) return { ok: false, error: "Factura no encontrada." };
    if (invoice.status === "anulada")
      return { ok: false, error: "La factura ya está anulada." };

    const { error } = await supabase
      .from("invoices")
      .update({ status: "anulada", void_reason: reason.slice(0, 500), voided_at: new Date().toISOString() })
      .eq("id", invoiceId);
    if (error) return { ok: false, error: "No se pudo anular la factura." };

    // Bitácora permanente (INSERT/SELECT).
    await supabase.from("activity_log").insert({
      actor_id: user.id,
      event_type: "factura",
      title: "Factura anulada",
      detail: `${invoice.number} · Motivo: ${reason.slice(0, 200)}`,
    });

    revalidatePath(`/facturacion/${invoiceId}`);
    revalidatePath("/facturacion");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
