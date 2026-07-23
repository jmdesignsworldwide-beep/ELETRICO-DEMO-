-- ════════════════════════════════════════════════════════════════
-- JM ELECTRIC — Tanda 7: Inventario CRUD real + movimientos + foto
-- FORT KNOX: RLS + FORCE, bitácora de movimientos solo INSERT/SELECT,
-- Storage privado (bucket no público, acceso solo por signed URL).
-- ════════════════════════════════════════════════════════════════

-- ── Foto del material (path en Storage privado) ─────────────────
alter table inventory add column if not exists photo_path text;

-- ── Storage: bucket privado para fotos de materiales ────────────
insert into storage.buckets (id, name, public)
values ('inventory-photos', 'inventory-photos', false)
on conflict (id) do nothing;
-- Sin políticas públicas: el acceso es solo por service_role del servidor
-- (upload) y createSignedUrl de expiración corta (lectura). Denegado a anon.

-- ── Movimientos de inventario ───────────────────────────────────
-- La tabla inventory_movements ya existe (migración 0003) como bitácora
-- INSERT/SELECT. Aquí solo sembramos el histórico de altas iniciales.
insert into inventory_movements (inventory_id, change, reason, created_at)
select id, stock, 'Alta inicial de inventario', now() - interval '30 days'
from inventory
where not exists (
  select 1 from inventory_movements m where m.inventory_id = inventory.id
);

-- ════════════════════════════════════════════════════════════════
-- Cierre: correr el Security Advisor de Supabase antes de mergear.
-- ════════════════════════════════════════════════════════════════
