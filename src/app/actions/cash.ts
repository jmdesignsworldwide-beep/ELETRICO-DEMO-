"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

export const EXPENSE_CATEGORIES = [
  "combustible", "transporte", "herramientas", "materiales_menores",
  "nomina", "alquiler", "servicios", "mantenimiento_vehiculo", "otros",
] as const;

export const PAYMENT_METHODS = ["efectivo", "transferencia", "debito", "credito"] as const;

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Abrir caja del día. Solo una abierta a la vez (validado en servidor + BD). */
export async function openRegisterAction(openingAmount: number): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`cash:open:${user.id}`);
    const amount = Number(openingAmount);
    if (!Number.isFinite(amount) || amount < 0 || amount > 100_000_000)
      return { ok: false, error: "Monto de apertura inválido." };

    const supabase = createServerSupabase();
    const { data: existing } = await supabase
      .from("cash_registers").select("id").eq("status", "abierta").maybeSingle();
    if (existing) return { ok: false, error: "Ya hay una caja abierta. Ciérrala primero." };

    const { error } = await supabase.from("cash_registers").insert({
      opened_by: user.id, opener_name: user.fullName, opening_amount: amount, status: "abierta",
    });
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Ya hay una caja abierta." };
      return { ok: false, error: "No se pudo abrir la caja." };
    }
    revalidatePath("/caja");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Registrar gasto (con comprobante opcional en Storage privado). */
export async function addExpenseAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`cash:expense:${user.id}`);

    const category = String(formData.get("category") ?? "");
    const description = String(formData.get("description") ?? "").trim();
    const amount = Number(formData.get("amount"));
    const method = String(formData.get("paymentMethod") ?? "");
    const file = formData.get("receipt");

    if (!EXPENSE_CATEGORIES.includes(category as (typeof EXPENSE_CATEGORIES)[number]))
      return { ok: false, error: "Categoría inválida." };
    if (!PAYMENT_METHODS.includes(method as (typeof PAYMENT_METHODS)[number]))
      return { ok: false, error: "Método de pago inválido." };
    if (description.length < 3) return { ok: false, error: "Describe el gasto." };
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000)
      return { ok: false, error: "Monto inválido." };

    const supabase = createServerSupabase();
    const { data: reg } = await supabase
      .from("cash_registers").select("id").eq("status", "abierta").maybeSingle();
    if (!reg) return { ok: false, error: "No hay caja abierta. Abre la caja primero." };

    let receiptPath: string | null = null;
    if (file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) return { ok: false, error: "El comprobante supera 5 MB." };
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        return { ok: false, error: "Formato no permitido (JPG, PNG o WebP)." };
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${reg.id}/${randomUUID()}.${ext}`;
      const admin = createAdminSupabase();
      const { error: upErr } = await admin.storage
        .from("expense-receipts").upload(path, file, { contentType: file.type });
      if (upErr) return { ok: false, error: "No se pudo subir el comprobante." };
      receiptPath = path;
    }

    const { error } = await supabase.from("expenses").insert({
      register_id: reg.id, category, description: description.slice(0, 300),
      amount, payment_method: method, receipt_path: receiptPath, actor_id: user.id,
    });
    if (error) return { ok: false, error: "No se pudo registrar el gasto." };

    revalidatePath("/caja");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Cierre del día: el esperado se RECALCULA en el servidor. Nota si no cuadra. */
export async function closeRegisterAction(countedCash: number, notes: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`cash:close:${user.id}`);
    const counted = Number(countedCash);
    if (!Number.isFinite(counted) || counted < 0) return { ok: false, error: "Monto contado inválido." };

    const supabase = createServerSupabase();
    const { data: reg } = await supabase
      .from("cash_registers").select("*").eq("status", "abierta").maybeSingle();
    if (!reg) return { ok: false, error: "No hay caja abierta." };

    // Recalcular esperado en el servidor.
    const [{ data: pays }, { data: exps }] = await Promise.all([
      supabase.from("payments").select("method, amount").gte("created_at", reg.opened_at),
      supabase.from("expenses").select("payment_method, amount").eq("register_id", reg.id),
    ]);
    const cashIncome = (pays ?? []).filter((p) => p.method === "efectivo").reduce((s, p) => s + Number(p.amount), 0);
    const cashExpense = (exps ?? []).filter((e) => e.payment_method === "efectivo").reduce((s, e) => s + Number(e.amount), 0);
    const expected = Number(reg.opening_amount) + cashIncome - cashExpense;
    const difference = Math.round((counted - expected) * 100) / 100;

    if (difference !== 0 && (notes ?? "").trim().length < 4)
      return { ok: false, error: "La caja no cuadra: la nota es obligatoria." };

    const { error } = await supabase.from("cash_registers").update({
      status: "cerrada", closed_at: new Date().toISOString(),
      expected_cash: expected, counted_cash: counted, difference,
      closing_notes: (notes ?? "").trim().slice(0, 500) || null,
    }).eq("id", reg.id);
    if (error) return { ok: false, error: "No se pudo cerrar la caja." };

    await supabase.from("activity_log").insert({
      actor_id: user.id, event_type: "pago", title: "Cierre de caja",
      detail: difference === 0 ? "Cuadre exacto" : `Diferencia registrada`,
    });

    revalidatePath("/caja");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

// ── Gastos recurrentes ──────────────────────────────────────────
export async function createRecurringAction(input: {
  category: string; description: string; amount: number; paymentMethod: string;
}): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`cash:recur:${user.id}`);
    if (!EXPENSE_CATEGORIES.includes(input.category as (typeof EXPENSE_CATEGORIES)[number]))
      return { ok: false, error: "Categoría inválida." };
    if (!PAYMENT_METHODS.includes(input.paymentMethod as (typeof PAYMENT_METHODS)[number]))
      return { ok: false, error: "Método inválido." };
    if ((input.description ?? "").trim().length < 3) return { ok: false, error: "Describe el gasto." };
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Monto inválido." };

    const supabase = createServerSupabase();
    const { error } = await supabase.from("recurring_expenses").insert({
      category: input.category, description: input.description.trim().slice(0, 300),
      amount, payment_method: input.paymentMethod,
    });
    if (error) return { ok: false, error: "No se pudo crear el gasto recurrente." };
    revalidatePath("/caja");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Generar los gastos recurrentes activos en la caja abierta. */
export async function generateRecurringAction(): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`cash:gen:${user.id}`);
    const supabase = createServerSupabase();
    const { data: reg } = await supabase.from("cash_registers").select("id").eq("status", "abierta").maybeSingle();
    if (!reg) return { ok: false, error: "No hay caja abierta." };
    const { data: templates } = await supabase.from("recurring_expenses").select("*").eq("active", true);
    if (!templates || templates.length === 0) return { ok: false, error: "No hay gastos recurrentes activos." };

    const rows = templates.map((t) => ({
      register_id: reg.id, category: t.category, description: `${t.description} (recurrente)`,
      amount: t.amount, payment_method: t.payment_method, actor_id: user.id,
    }));
    const { error } = await supabase.from("expenses").insert(rows);
    if (error) return { ok: false, error: "No se pudieron generar los gastos." };
    revalidatePath("/caja");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
