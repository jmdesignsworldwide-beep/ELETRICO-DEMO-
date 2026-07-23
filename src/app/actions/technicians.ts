"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

export const SPECIALTIES = [
  "Instalación", "Reparación", "Paneles solares", "Aire acondicionado",
  "Cámaras", "Alarmas", "Certificación", "Mantenimiento preventivo",
] as const;

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface TechnicianInput {
  name: string;
  cedula?: string;
  phone: string;
  address?: string;
  specialties: string[];
  hourlyRate: number;
}

function validate(i: TechnicianInput): string | null {
  if (!i.name || i.name.trim().length < 2) return "El nombre es obligatorio.";
  if (i.name.length > 160) return "El nombre es demasiado largo.";
  if (!i.phone || i.phone.replace(/\D/g, "").length < 7) return "Teléfono inválido.";
  if (!Array.isArray(i.specialties) || i.specialties.length > 12) return "Especialidades inválidas.";
  if (i.specialties.some((s) => typeof s !== "string" || s.length > 60)) return "Especialidad inválida.";
  const rate = Number(i.hourlyRate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1_000_000) return "Tarifa inválida.";
  return null;
}

function sanitize(i: TechnicianInput) {
  return {
    name: i.name.trim(),
    cedula: i.cedula?.trim() || null,
    phone: i.phone.trim(),
    address: i.address?.trim() || null,
    specialties: i.specialties.map((s) => s.trim()).filter(Boolean),
    hourly_rate: Number(i.hourlyRate),
  };
}

export async function createTechnicianAction(input: TechnicianInput): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`tech:create:${user.id}`);
    const err = validate(input);
    if (err) return { ok: false, error: err };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("technicians").insert({ ...sanitize(input), active: true });
    if (error) return { ok: false, error: "No se pudo crear el técnico." };
    revalidatePath("/tecnicos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function updateTechnicianAction(id: string, input: TechnicianInput): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`tech:update:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    const err = validate(input);
    if (err) return { ok: false, error: err };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("technicians").update(sanitize(input)).eq("id", id);
    if (error) return { ok: false, error: "No se pudo actualizar." };
    revalidatePath("/tecnicos");
    revalidatePath(`/tecnicos/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function toggleTechnicianActiveAction(id: string, active: boolean): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`tech:toggle:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("technicians").update({ active: Boolean(active) }).eq("id", id);
    if (error) return { ok: false, error: "No se pudo cambiar el estado." };
    revalidatePath("/tecnicos");
    revalidatePath(`/tecnicos/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function deleteTechnicianAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`tech:delete:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("technicians").delete().eq("id", id);
    if (error) return { ok: false, error: "No se pudo eliminar (¿tiene órdenes u horas registradas?)." };
    revalidatePath("/tecnicos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function addCertificationAction(technicianId: string, name: string, expiresAt: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`tech:cert:${user.id}`);
    if (!UUID.test(technicianId)) return { ok: false, error: "ID inválido." };
    if (!name || name.trim().length < 2) return { ok: false, error: "Nombre de certificación requerido." };
    const exp = expiresAt ? new Date(expiresAt) : null;
    if (expiresAt && isNaN(exp!.getTime())) return { ok: false, error: "Fecha inválida." };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("technician_certifications").insert({
      technician_id: technicianId, name: name.trim().slice(0, 160), expires_at: expiresAt || null,
    });
    if (error) return { ok: false, error: "No se pudo agregar la certificación." };
    revalidatePath(`/tecnicos/${technicianId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function deleteCertificationAction(id: string, technicianId: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`tech:certdel:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("technician_certifications").delete().eq("id", id);
    if (error) return { ok: false, error: "No se pudo eliminar." };
    revalidatePath(`/tecnicos/${technicianId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function registerWorklogAction(technicianId: string, hours: number, note: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`tech:worklog:${user.id}`);
    if (!UUID.test(technicianId)) return { ok: false, error: "ID inválido." };
    const h = Number(hours);
    if (!Number.isFinite(h) || h <= 0 || h > 24 * 31) return { ok: false, error: "Horas inválidas." };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("technician_worklog").insert({
      technician_id: technicianId, hours: h, note: (note ?? "").trim().slice(0, 200) || null, actor_id: user.id,
    });
    if (error) return { ok: false, error: "No se pudieron registrar las horas." };
    revalidatePath(`/tecnicos/${technicianId}`);
    revalidatePath("/tecnicos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function uploadTechnicianPhotoAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`tech:photo:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "Archivo inválido." };
    if (file.size > 5 * 1024 * 1024) return { ok: false, error: "La imagen supera 5 MB." };
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return { ok: false, error: "Formato no permitido (JPG, PNG o WebP)." };
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${id}/foto.${ext}`;
    const admin = createAdminSupabase();
    const { error: upErr } = await admin.storage.from("technician-photos").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) return { ok: false, error: "No se pudo subir la imagen." };
    const supabase = createServerSupabase();
    await supabase.from("technicians").update({ photo_path: path }).eq("id", id);
    revalidatePath(`/tecnicos/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
