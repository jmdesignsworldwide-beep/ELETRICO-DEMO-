-- ════════════════════════════════════════════════════════════════
-- JM ELECTRIC — Cierre de órdenes + flujo Cotización → Orden → Factura
-- FORT KNOX: RLS + FORCE, denegar por defecto. Bitácoras solo INSERT/SELECT.
-- ════════════════════════════════════════════════════════════════

-- ── Columnas de cierre y enlaces del flujo ──────────────────────
alter table service_orders add column if not exists final_notes     text;
alter table service_orders add column if not exists recommendations text;
alter table service_orders add column if not exists closed_at       timestamptz;
alter table service_orders add column if not exists quote_id        uuid references quotes(id) on delete set null;
alter table service_orders add column if not exists invoice_id      uuid references invoices(id) on delete set null;

alter table quotes   add column if not exists converted_order_id uuid references service_orders(id) on delete set null;
alter table invoices add column if not exists order_id           uuid references service_orders(id) on delete set null;

-- El técnico asignado puede ACTUALIZAR sus órdenes (estado, cierre, notas).
drop policy if exists service_orders_tech_update on service_orders;
create policy service_orders_tech_update on service_orders
  for update using (auth.uid() = any(technician_ids))
  with check (auth.uid() = any(technician_ids));

-- ── Materiales por orden (estimado vs usado) ────────────────────
create table if not exists order_materials (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references service_orders(id) on delete cascade,
  inventory_id  uuid not null references inventory(id) on delete restrict,
  name          text not null,
  qty_estimated integer not null default 0,
  qty_used      integer not null default 0,
  unit_price    numeric(12,2) not null default 0,
  created_at    timestamptz not null default now()
);
alter table order_materials enable row level security;
alter table order_materials force row level security;

-- Admin: todo. Técnico: leer/insertar en sus órdenes asignadas.
drop policy if exists order_materials_admin_all on order_materials;
create policy order_materials_admin_all on order_materials
  for all using (is_active_admin()) with check (is_active_admin());

drop policy if exists order_materials_tech_select on order_materials;
create policy order_materials_tech_select on order_materials
  for select using (
    exists (select 1 from service_orders o
            where o.id = order_id and auth.uid() = any(o.technician_ids))
  );

drop policy if exists order_materials_tech_insert on order_materials;
create policy order_materials_tech_insert on order_materials
  for insert with check (
    exists (select 1 from service_orders o
            where o.id = order_id and auth.uid() = any(o.technician_ids))
  );

-- ── Bitácora de movimientos de inventario — solo INSERT/SELECT ──
create table if not exists inventory_movements (
  id            uuid primary key default gen_random_uuid(),
  inventory_id  uuid not null references inventory(id) on delete restrict,
  order_id      uuid references service_orders(id) on delete set null,
  change        integer not null,          -- negativo = salida
  reason        text not null,
  actor_id      uuid references auth.users(id),
  created_at    timestamptz not null default now()
);
alter table inventory_movements enable row level security;
alter table inventory_movements force row level security;

drop policy if exists inv_mov_admin_select on inventory_movements;
create policy inv_mov_admin_select on inventory_movements
  for select using (is_active_admin());

drop policy if exists inv_mov_insert_auth on inventory_movements;
create policy inv_mov_insert_auth on inventory_movements
  for insert with check (auth.uid() is not null);
-- Sin políticas de UPDATE/DELETE → esas operaciones quedan denegadas.

-- ════════════════════════════════════════════════════════════════
-- SEED — materiales de la orden solar completada (estimado vs usado)
-- ════════════════════════════════════════════════════════════════
insert into order_materials (order_id, inventory_id, name, qty_estimated, qty_used, unit_price)
select o.id, i.id, i.name, v.est, v.used, i.sale_price
from (values
  ('OS-2025-0154','SOL-450',   12, 12),
  ('OS-2025-0154','SOL-INV-5K', 1,  1),
  ('OS-2025-0154','CBL-10-100', 2,  3)
) as v(order_number, sku, est, used)
join service_orders o on o.number = v.order_number
join inventory i on i.sku = v.sku
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════
-- Cierre: correr el Security Advisor de Supabase antes de mergear.
-- ════════════════════════════════════════════════════════════════
