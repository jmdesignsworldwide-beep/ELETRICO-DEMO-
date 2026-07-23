"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase/server";

const PROPERTY_TYPES = ["residencial", "comercial", "industrial"] as const;

export interface ClientInput {
  name: string;
  phone: string;
  address?: string;
  propertyType: string;
  panelType?: string;
  voltage?: string;
  notes?: string;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// FORT KNOX: validación por whitelist + tipos + longitudes, en el servidor.
function validate(input: ClientInput): string | null {
  if (!input.name || typeof input.name !== "string" || input.name.trim().length < 2)
    return "El nombre es obligatorio (mínimo 2 caracteres).";
  if (input.name.length > 160) return "El nombre es demasiado largo.";
  if (!input.phone || input.phone.replace(/\D/g, "").length < 7)
    return "El teléfono no es válido.";
  if (!PROPERTY_TYPES.includes(input.propertyType as (typeof PROPERTY_TYPES)[number]))
    return "Tipo de propiedad inválido.";
  if (input.notes && input.notes.length > 2000) return "Las notas son demasiado largas.";
  return null;
}

function sanitize(input: ClientInput) {
  return {
    name: input.name.trim(),
    phone: input.phone.trim(),
    address: input.address?.trim() || null,
    property_type: input.propertyType,
    panel_type: input.panelType?.trim() || null,
    voltage: input.voltage?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export async function createClientAction(input: ClientInput): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`client:create:${user.id}`);
    const err = validate(input);
    if (err) return { ok: false, error: err };

    const supabase = createServerSupabase();
    const { error } = await supabase.from("clients").insert(sanitize(input));
    if (error) return { ok: false, error: "No se pudo crear el cliente." };

    await supabase.from("activity_log").insert({
      actor_id: user.id,
      event_type: "cliente",
      title: "Nuevo cliente registrado",
      detail: input.name.trim(),
    });

    revalidatePath("/clientes");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function updateClientAction(id: string, input: ClientInput): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`client:update:${user.id}`);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "ID inválido." };
    const err = validate(input);
    if (err) return { ok: false, error: err };

    const supabase = createServerSupabase();
    const { error } = await supabase.from("clients").update(sanitize(input)).eq("id", id);
    if (error) return { ok: false, error: "No se pudo actualizar el cliente." };

    revalidatePath("/clientes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function deleteClientAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await enforceRateLimit(`client:delete:${user.id}`);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "ID inválido." };

    const supabase = createServerSupabase();
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return { ok: false, error: "No se pudo eliminar (¿tiene órdenes asociadas?)." };

    revalidatePath("/clientes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
