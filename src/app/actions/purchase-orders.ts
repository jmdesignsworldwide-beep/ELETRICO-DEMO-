"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;
const EDIT_STATUSES = ["borrador", "enviada", "cancelada"] as const;

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface POItemInput {
  inventoryId: string;
  qty: number;
  unitPrice: number;
}

export interface ReceiptInput {
  itemId: string;
  qtyReceived: number;
  note?: string;
}

export async function createPurchaseOrderAction(
  supplierId: string,
  items: POItemInput[]
): Promise<ActionResult & { poId?: string }> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`po:create:${user.id}`);
    if (!UUID.test(supplierId)) return { ok: false, error: "Suplidor inválido." };
    const clean = (items ?? []).filter((i) => UUID.test(i.inventoryId) && Number(i.qty) > 0);
    if (clean.length === 0) return { ok: false, error: "Agrega al menos un material." };

    const supabase = createServerSupabase();
    // Snapshot de nombres desde inventario.
    const ids = clean.map((i) => i.inventoryId);
    const { data: inv } = await supabase.from("inventory").select("id, name").in("id", ids);
    const nameById = new Map((inv ?? []).map((x) => [x.id, x.name]));
    if (nameById.size !== new Set(ids).size)
      return { ok: false, error: "Algún material no existe." };

    const year = new Date().getFullYear();
    const { count } = await supabase.from("purchase_orders").select("*", { count: "exact", head: true });
    const number = `OC-${year}-${String((count ?? 0) + 44).padStart(4, "0")}`;

    const { data: po, error } = await supabase
      .from("purchase_orders")
      .insert({ number, supplier_id: supplierId, status: "borrador" })
      .select("id").single();
    if (error || !po) return { ok: false, error: "No se pudo crear la orden de compra." };

    const rows = clean.map((i) => ({
      po_id: po.id, inventory_id: i.inventoryId, name: nameById.get(i.inventoryId)!,
      qty_ordered: Math.floor(Number(i.qty)), qty_received: 0,
      unit_price: Math.max(0, Number(i.unitPrice) || 0),
    }));
    await supabase.from("purchase_order_items").insert(rows);

    revalidatePath("/compras");
    revalidatePath("/suplidores");
    return { ok: true, poId: po.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function updatePurchaseOrderStatusAction(id: string, status: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`po:status:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };
    if (!EDIT_STATUSES.includes(status as (typeof EDIT_STATUSES)[number]))
      return { ok: false, error: "Estado inválido." };
    const supabase = createServerSupabase();
    const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
    if (error) return { ok: false, error: "No se pudo actualizar el estado." };
    revalidatePath("/compras");
    revalidatePath(`/compras/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/**
 * Recibir la orden de compra. Actualiza el inventario y genera los movimientos
 * de entrada. Registra discrepancias (pedido vs recibido) con nota obligatoria.
 */
export async function receivePurchaseOrderAction(
  id: string,
  receipts: ReceiptInput[]
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    enforceRateLimit(`po:receive:${user.id}`);
    if (!UUID.test(id)) return { ok: false, error: "ID inválido." };

    const supabase = createServerSupabase();
    const { data: po } = await supabase.from("purchase_orders").select("id, number, status").eq("id", id).single();
    if (!po) return { ok: false, error: "Orden no encontrada." };
    if (po.status === "recibida" || po.status === "cancelada")
      return { ok: false, error: "Esta orden ya está cerrada." };

    const { data: items } = await supabase.from("purchase_order_items").select("*").eq("po_id", id);
    if (!items || items.length === 0) return { ok: false, error: "La orden no tiene materiales." };

    const receiptById = new Map(receipts.map((r) => [r.itemId, r]));
    let fullyReceived = true;

    for (const it of items) {
      const r = receiptById.get(it.id);
      const received = r ? Math.max(0, Math.floor(Number(r.qtyReceived))) : (it.qty_received ?? 0);
      const ordered = it.qty_ordered ?? 0;
      if (received > ordered + 1_000_000) return { ok: false, error: "Cantidad recibida fuera de rango." };

      // Discrepancia exige nota.
      const hasDiscrepancy = received !== ordered;
      const note = (r?.note ?? "").trim();
      if (hasDiscrepancy && !note)
        return { ok: false, error: `Discrepancia en ${it.name}: la nota es obligatoria.` };

      // Solo suma al inventario lo que NO se había recibido antes.
      const delta = received - (it.qty_received ?? 0);
      if (delta > 0) {
        const { data: invItem } = await supabase.from("inventory").select("stock").eq("id", it.inventory_id).single();
        if (invItem) {
          await supabase.from("inventory").update({ stock: (invItem.stock ?? 0) + delta }).eq("id", it.inventory_id);
          await supabase.from("inventory_movements").insert({
            inventory_id: it.inventory_id, change: delta,
            reason: `Recepción ${po.number}`, actor_id: user.id,
          });
        }
      }

      await supabase.from("purchase_order_items").update({
        qty_received: received,
        discrepancy_note: hasDiscrepancy ? note.slice(0, 300) : null,
      }).eq("id", it.id);

      if (received < ordered) fullyReceived = false;
    }

    const newStatus = fullyReceived ? "recibida" : "recibida_parcial";
    await supabase.from("purchase_orders").update({
      status: newStatus,
      received_at: fullyReceived ? new Date().toISOString() : null,
    }).eq("id", id);

    await supabase.from("activity_log").insert({
      actor_id: user.id, event_type: "inventario",
      title: fullyReceived ? "Orden de compra recibida" : "Recepción parcial",
      detail: `${po.number} · inventario actualizado`,
    });

    revalidatePath(`/compras/${id}`);
    revalidatePath("/compras");
    revalidatePath("/inventario");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
