-- ════════════════════════════════════════════════════════════════
-- JM ELECTRIC — Tanda 14: Portafolio de Trabajos
-- FORT KNOX: RLS + FORCE. Storage privado (fotos por signed URL).
-- ════════════════════════════════════════════════════════════════

create table if not exists portfolio_works (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid references service_orders(id) on delete set null,
  technician_id uuid references technicians(id) on delete set null,
  title         text not null,
  description   text,
  category      text not null,               -- tipo de servicio
  before_path   text,
  after_path    text,
  favorite      boolean not null default false,
  visible       boolean not null default true,
  created_at    timestamptz not null default now()
);
alter table portfolio_works enable row level security;
alter table portfolio_works force row level security;
drop policy if exists portfolio_admin_all on portfolio_works;
create policy portfolio_admin_all on portfolio_works
  for all using (is_active_admin()) with check (is_active_admin());

-- Storage: fotos del portafolio (privado, acceso solo por signed URL).
insert into storage.buckets (id, name, public)
values ('portfolio-photos', 'portfolio-photos', false)
on conflict (id) do nothing;

-- ════════════════════════════════════════════════════════════════
-- SEED — trabajos vinculados a órdenes completadas
-- ════════════════════════════════════════════════════════════════
insert into portfolio_works (order_id, technician_id, title, description, category, favorite, visible)
select o.id, (o.technician_ids)[1], v.title, v.descr, o.service_type, v.fav, true
from (values
  ('OS-2025-0154','Sistema solar 5kW','Instalación de 12 paneles e inversor híbrido en Santiago', true),
  ('OS-2025-0148','Reparación cuartos fríos','Corrección de circuito y breaker principal', false),
  ('OS-2025-0151','Ampliación CCTV 16 canales','Sistema de cámaras para hotel boutique', true)
) as v(order_number, title, descr, fav)
join service_orders o on o.number = v.order_number
on conflict do nothing;

-- Un par de trabajos destacados adicionales (sin orden vinculada).
insert into portfolio_works (title, description, category, favorite, visible)
values
  ('Tablero trifásico 400A','Modernización de tablero para supermercado','breakers', true, true),
  ('Cargador vehículo eléctrico','Instalación NEMA 14-50 en torre residencial','instalacion_nueva', false, true)
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════
-- Cierre: correr el Security Advisor de Supabase antes de mergear.
-- ════════════════════════════════════════════════════════════════
