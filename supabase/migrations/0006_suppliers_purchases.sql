-- ════════════════════════════════════════════════════════════════
-- JM ELECTRIC — Tanda 8: Suplidores + Órdenes de Compra
-- FORT KNOX: RLS + FORCE, denegar por defecto. Historial de precios y
-- movimientos de inventario: solo INSERT/SELECT.
-- ════════════════════════════════════════════════════════════════

-- ── Suplidores ──────────────────────────────────────────────────
create table if not exists suppliers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  rnc           text,
  contact       text,
  phone         text,
  email         text,
  address       text,
  payment_terms text,
  created_at    timestamptz not null default now()
);
alter table suppliers enable row level security;
alter table suppliers force row level security;
drop policy if exists suppliers_admin_all on suppliers;
create policy suppliers_admin_all on suppliers
  for all using (is_active_admin()) with check (is_active_admin());

-- ── Catálogo de precios por suplidor (precio vigente) ───────────
create table if not exists supplier_prices (
  id           uuid primary key default gen_random_uuid(),
  supplier_id  uuid not null references suppliers(id) on delete cascade,
  inventory_id uuid not null references inventory(id) on delete cascade,
  price        numeric(12,2) not null default 0,
  updated_at   timestamptz not null default now(),
  unique (supplier_id, inventory_id)
);
alter table supplier_prices enable row level security;
alter table supplier_prices force row level security;
drop policy if exists supplier_prices_admin_all on supplier_prices;
create policy supplier_prices_admin_all on supplier_prices
  for all using (is_active_admin()) with check (is_active_admin());

-- ── Historial de cambios de precio — solo INSERT/SELECT ─────────
create table if not exists supplier_price_history (
  id           uuid primary key default gen_random_uuid(),
  supplier_id  uuid not null references suppliers(id) on delete cascade,
  inventory_id uuid not null references inventory(id) on delete cascade,
  price        numeric(12,2) not null,
  actor_id     uuid references auth.users(id),
  created_at   timestamptz not null default now()
);
alter table supplier_price_history enable row level security;
alter table supplier_price_history force row level security;
drop policy if exists sph_admin_select on supplier_price_history;
create policy sph_admin_select on supplier_price_history
  for select using (is_active_admin());
drop policy if exists sph_insert_auth on supplier_price_history;
create policy sph_insert_auth on supplier_price_history
  for insert with check (auth.uid() is not null);

-- ── Órdenes de compra ───────────────────────────────────────────
create table if not exists purchase_orders (
  id          uuid primary key default gen_random_uuid(),
  number      text not null unique,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  status      text not null default 'borrador',   -- borrador, enviada, recibida_parcial, recibida, cancelada
  notes       text,
  received_at timestamptz,
  created_at  timestamptz not null default now()
);
alter table purchase_orders enable row level security;
alter table purchase_orders force row level security;
drop policy if exists po_admin_all on purchase_orders;
create policy po_admin_all on purchase_orders
  for all using (is_active_admin()) with check (is_active_admin());

create table if not exists purchase_order_items (
  id           uuid primary key default gen_random_uuid(),
  po_id        uuid not null references purchase_orders(id) on delete cascade,
  inventory_id uuid not null references inventory(id) on delete restrict,
  name         text not null,
  qty_ordered  integer not null default 0,
  qty_received integer not null default 0,
  unit_price   numeric(12,2) not null default 0,
  discrepancy_note text,
  created_at   timestamptz not null default now()
);
alter table purchase_order_items enable row level security;
alter table purchase_order_items force row level security;
drop policy if exists poi_admin_all on purchase_order_items;
create policy poi_admin_all on purchase_order_items
  for all using (is_active_admin()) with check (is_active_admin());

-- ════════════════════════════════════════════════════════════════
-- SEED — suplidores dominicanos + catálogo de precios + OC
-- ════════════════════════════════════════════════════════════════
insert into suppliers (id, name, rnc, contact, phone, email, address, payment_terms) values
  ('33333333-3333-3333-3333-333333333301','Eléctricos del Caribe SRL','1-30-12345-6','Ventas — Pedro Jiménez','809-567-8800','ventas@electricaribe.do','Av. San Martín 88, Santo Domingo','Crédito 30 días'),
  ('33333333-3333-3333-3333-333333333302','Distribuidora Solar RD','1-31-98765-4','Ing. Laura Cruz','829-604-1122','info@solarrd.do','Av. 27 de Febrero 210, Santo Domingo','Contado'),
  ('33333333-3333-3333-3333-333333333303','Ferretería Industrial Duarte','1-30-55443-2','Mostrador','809-333-4455','duarteind@gmail.com','Av. Duarte 340, Santiago','Crédito 15 días'),
  ('33333333-3333-3333-3333-333333333304','CCTV Import Dominicana','1-32-11223-8','Soporte — Miguel Reyes','849-210-9988','ventas@cctvimport.do','Plaza Central, Local 12, Santo Domingo','Contado')
on conflict (id) do nothing;

-- Catálogo de precios (mismo material en varios suplidores → comparación)
insert into supplier_prices (supplier_id, inventory_id, price)
select s.id, i.id, v.price
from (values
  ('33333333-3333-3333-3333-333333333301','CBL-12-100', 4300),
  ('33333333-3333-3333-3333-333333333303','CBL-12-100', 4150),
  ('33333333-3333-3333-3333-333333333301','BRK-20-1P',   360),
  ('33333333-3333-3333-3333-333333333303','BRK-20-1P',   395),
  ('33333333-3333-3333-3333-333333333302','SOL-450',    8200),
  ('33333333-3333-3333-3333-333333333301','SOL-450',    8600),
  ('33333333-3333-3333-3333-333333333302','SOL-INV-5K',33500),
  ('33333333-3333-3333-3333-333333333304','CAM-4MP-D',  1950),
  ('33333333-3333-3333-3333-333333333301','CAM-4MP-D',  2200)
) as v(supplier_code, sku, price)
join suppliers s on s.id = v.supplier_code::uuid
join inventory i on i.sku = v.sku
on conflict (supplier_id, inventory_id) do nothing;

-- Órdenes de compra seed
insert into purchase_orders (id, number, supplier_id, status, created_at, received_at) values
  ('44444444-4444-4444-4444-444444444401','OC-2025-0044','33333333-3333-3333-3333-333333333302','recibida', now() - interval '5 days', now() - interval '4 days'),
  ('44444444-4444-4444-4444-444444444402','OC-2025-0045','33333333-3333-3333-3333-333333333301','enviada', now() - interval '2 days', null)
on conflict (id) do nothing;

insert into purchase_order_items (po_id, inventory_id, name, qty_ordered, qty_received, unit_price)
select v.po::uuid, i.id, i.name, v.ord, v.rec, v.price
from (values
  ('44444444-4444-4444-4444-444444444401','SOL-450',    10, 10, 8200),
  ('44444444-4444-4444-4444-444444444401','SOL-INV-5K',  2,  2,33500),
  ('44444444-4444-4444-4444-444444444402','CBL-12-100',  8,  0, 4300),
  ('44444444-4444-4444-4444-444444444402','BRK-20-1P',  20,  0,  360)
) as v(po, sku, ord, rec, price)
join inventory i on i.sku = v.sku
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════
-- Cierre: correr el Security Advisor de Supabase antes de mergear.
-- ════════════════════════════════════════════════════════════════
