"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;
const CATEGORIES = [
  "instalacion_nueva", "reparacion", "mantenimiento", "paneles_solares",
  "aire_acondicionado", "camaras", "alarmas", "tomacorrientes", "breakers",
  "diagnostico", "certificacion", "emergencia", "otro",
] as const;

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface WorkInput {
  title: string;
  description?: string;
  category: string;
}

export async function createWorkAction(input: WorkInput): Promise<ActionResult & { id?: string }> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`work:create:${user.id}`);
    if (!input.title || input.title.trim().length < 2) return { ok: false, error: "El título es obligatorio." };
    if (!CATEGORIES.includes(input.category as (typeof CATEGORIES)[number])) return { ok: false, error: "Categoría inválida." };

    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("portfolio_works").insert({
      title: input.title.trim().slice(0, 160),
      description: (input.description ?? "").trim().slice(0, 500) || null,
      category: input.category, favorite: false, visible: true,
    }).select("id").single();
    if (error || !data) return { ok: false, error: "No se pudo crear el trabajo." };
    revalidatePath("/portafolio");
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function updateWorkAction(id: string, input: WorkInput): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`work:update:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    if (!input.title || input.title.trim().length < 2) return { ok: false, error: "El título es obligatorio." };
    if (!CATEGORIES.includes(input.category as (typeof CATEGORIES)[number])) return { ok: false, error: "Categoría inválida." };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("portfolio_works").update({
      title: input.title.trim().slice(0, 160),
      description: (input.description ?? "").trim().slice(0, 500) || null,
      category: input.category,
    }).eq("id", id);
    if (error) return { ok: false, error: "No se pudo actualizar." };
    revalidatePath("/portafolio");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function toggleWorkFlagAction(id: string, flag: "favorite" | "visible", value: boolean): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`work:flag:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("portfolio_works").update({ [flag]: Boolean(value) }).eq("id", id);
    if (error) return { ok: false, error: "No se pudo actualizar." };
    revalidatePath("/portafolio");
    revalidatePath("/presentacion");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function deleteWorkAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`work:delete:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("portfolio_works").delete().eq("id", id);
    if (error) return { ok: false, error: "No se pudo eliminar." };
    revalidatePath("/portafolio");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function uploadWorkPhotoAction(id: string, kind: "before" | "after", formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`work:photo:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    if (kind !== "before" && kind !== "after") return { ok: false, error: "Tipo inválido." };
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "Archivo inválido." };
    if (file.size > 5 * 1024 * 1024) return { ok: false, error: "La imagen supera 5 MB." };
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { ok: false, error: "Formato no permitido (JPG, PNG o WebP)." };
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${id}/${kind}.${ext}`;
    const admin = createAdminSupabase();
    const { error: upErr } = await admin.storage.from("portfolio-photos").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) return { ok: false, error: "No se pudo subir la imagen." };
    const supabase = createServerSupabase();
    await supabase.from("portfolio_works").update({ [`${kind}_path`]: path }).eq("id", id);
    revalidatePath("/portafolio");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
