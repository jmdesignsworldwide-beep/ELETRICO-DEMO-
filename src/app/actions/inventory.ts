"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

export const CATEGORIES = [
  "Cables / conductores", "Breakers", "Paneles / tableros",
  "Tomacorrientes / interruptores", "Lámparas / bombillos", "Tuberías / conduit",
  "Cajas eléctricas", "Conectores / terminales", "Herramientas",
  "Equipos de medición", "Materiales solares", "Materiales de cámaras y alarmas",
  "Consumibles", "Otros",
] as const;

export const UNITS = ["unidad", "metro", "rollo", "caja", "pie", "tramo"] as const;

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface MaterialInput {
  name: string;
  category: string;
  sku: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
}

function validate(input: MaterialInput): string | null {
  if (!input.name || input.name.trim().length < 2) return "El nombre es obligatorio.";
  if (input.name.length > 160) return "El nombre es demasiado largo.";
  if (!CATEGORIES.includes(input.category as (typeof CATEGORIES)[number]))
    return "Categoría inválida.";
  if (!UNITS.includes(input.unit as (typeof UNITS)[number])) return "Unidad inválida.";
  if (!input.sku || input.sku.trim().length < 2) return "El SKU es obligatorio.";
  const nums = [input.costPrice, input.salePrice, input.stock, input.minStock];
  if (nums.some((n) => !Number.isFinite(Number(n)) || Number(n) < 0))
    return "Los valores numéricos deben ser positivos.";
  if (Number(input.costPrice) > 100_000_000 || Number(input.salePrice) > 100_000_000)
    return "Monto fuera de rango.";
  return null;
}

function sanitize(input: MaterialInput) {
  return {
    name: input.name.trim(),
    category: input.category,
    sku: input.sku.trim().toUpperCase(),
    cost_price: Number(input.costPrice),
    sale_price: Number(input.salePrice),
    stock: Math.floor(Number(input.stock)),
    min_stock: Math.floor(Number(input.minStock)),
    unit: input.unit,
  };
}

export async function createMaterialAction(input: MaterialInput): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`mat:create:${user.id}`);
    const err = validate(input);
    if (err) return { ok: false, error: err };

    const supabase = createServerSupabase();
    const clean = sanitize(input);
    const { data: mat, error } = await supabase.from("inventory").insert(clean).select("id").single();
    if (error || !mat) {
      if (error?.code === "23505") return { ok: false, error: "Ese SKU ya existe." };
      return { ok: false, error: "No se pudo crear el material." };
    }
    if (clean.stock > 0) {
      await supabase.from("inventory_movements").insert({
        inventory_id: mat.id, change: clean.stock, reason: "Alta inicial de inventario", actor_id: user.id,
      });
    }
    revalidatePath("/inventario");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function updateMaterialAction(id: string, input: MaterialInput): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`mat:update:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    const err = validate(input);
    if (err) return { ok: false, error: err };

    // El stock NO se edita aquí — se ajusta por movimientos (trazabilidad).
    const { stock, ...clean } = sanitize(input);
    void stock;
    const supabase = createServerSupabase();
    const { error } = await supabase.from("inventory").update(clean).eq("id", id);
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Ese SKU ya existe." };
      return { ok: false, error: "No se pudo actualizar." };
    }
    revalidatePath("/inventario");
    revalidatePath(`/inventario/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function deleteMaterialAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`mat:delete:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };

    const supabase = createServerSupabase();
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (error) return { ok: false, error: "No se pudo eliminar (¿tiene movimientos u órdenes?)." };
    revalidatePath("/inventario");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Ajuste de stock: entrada (+) o salida (−) con motivo, deja bitácora. */
export async function adjustStockAction(
  id: string,
  delta: number,
  reason: string
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`mat:adjust:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    const d = Math.trunc(Number(delta));
    if (!Number.isFinite(d) || d === 0) return { ok: false, error: "La cantidad no puede ser cero." };
    if (Math.abs(d) > 1_000_000) return { ok: false, error: "Cantidad fuera de rango." };
    const motivo = (reason ?? "").trim();
    if (motivo.length < 3) return { ok: false, error: "Indica el motivo del ajuste." };

    const supabase = createServerSupabase();
    const { data: item } = await supabase.from("inventory").select("stock").eq("id", id).single();
    if (!item) return { ok: false, error: "Material no encontrado." };
    const newStock = Math.max((item.stock ?? 0) + d, 0);

    await supabase.from("inventory").update({ stock: newStock }).eq("id", id);
    await supabase.from("inventory_movements").insert({
      inventory_id: id, change: d, reason: motivo.slice(0, 200), actor_id: user.id,
    });

    revalidatePath("/inventario");
    revalidatePath(`/inventario/${id}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Subir foto del material a Storage privado. */
export async function uploadMaterialPhotoAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`mat:photo:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };

    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "Archivo inválido." };
    if (file.size > 5 * 1024 * 1024) return { ok: false, error: "La imagen supera 5 MB." };
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return { ok: false, error: "Formato no permitido (usa JPG, PNG o WebP)." };

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${id}/foto.${ext}`;
    const admin = createAdminSupabase();
    const { error: upErr } = await admin.storage
      .from("inventory-photos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) return { ok: false, error: "No se pudo subir la imagen." };

    const supabase = createServerSupabase();
    await supabase.from("inventory").update({ photo_path: path }).eq("id", id);

    revalidatePath(`/inventario/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
