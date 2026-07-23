"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface SupplierInput {
  name: string;
  rnc?: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
}

function validate(i: SupplierInput): string | null {
  if (!i.name || i.name.trim().length < 2) return "El nombre es obligatorio.";
  if (i.name.length > 160) return "El nombre es demasiado largo.";
  if (i.email && i.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.email))
    return "Correo inválido.";
  return null;
}

function sanitize(i: SupplierInput) {
  return {
    name: i.name.trim(),
    rnc: i.rnc?.trim() || null,
    contact: i.contact?.trim() || null,
    phone: i.phone?.trim() || null,
    email: i.email?.trim() || null,
    address: i.address?.trim() || null,
    payment_terms: i.paymentTerms?.trim() || null,
  };
}

export async function createSupplierAction(input: SupplierInput): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`sup:create:${user.id}`);
    const err = validate(input);
    if (err) return { ok: false, error: err };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("suppliers").insert(sanitize(input));
    if (error) return { ok: false, error: "No se pudo crear el suplidor." };
    revalidatePath("/suplidores");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function updateSupplierAction(id: string, input: SupplierInput): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`sup:update:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    const err = validate(input);
    if (err) return { ok: false, error: err };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("suppliers").update(sanitize(input)).eq("id", id);
    if (error) return { ok: false, error: "No se pudo actualizar." };
    revalidatePath("/suplidores");
    revalidatePath(`/suplidores/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function deleteSupplierAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`sup:delete:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) return { ok: false, error: "No se pudo eliminar (¿tiene órdenes de compra?)." };
    revalidatePath("/suplidores");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Fijar/actualizar el precio de un material para un suplidor + historial. */
export async function setSupplierPriceAction(
  supplierId: string,
  inventoryId: string,
  price: number
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`sup:price:${user.id}`);
    if (!UUID.test(supplierId) || !UUID.test(inventoryId))
      return { ok: false, error: "ID inválido." };
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0 || p > 100_000_000)
      return { ok: false, error: "Precio inválido." };

    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("supplier_prices")
      .upsert(
        { supplier_id: supplierId, inventory_id: inventoryId, price: p, updated_at: new Date().toISOString() },
        { onConflict: "supplier_id,inventory_id" }
      );
    if (error) return { ok: false, error: "No se pudo guardar el precio." };

    // Historial (INSERT/SELECT).
    await supabase.from("supplier_price_history").insert({
      supplier_id: supplierId, inventory_id: inventoryId, price: p, actor_id: user.id,
    });

    revalidatePath(`/suplidores/${supplierId}`);
    revalidatePath("/suplidores/comparar");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
