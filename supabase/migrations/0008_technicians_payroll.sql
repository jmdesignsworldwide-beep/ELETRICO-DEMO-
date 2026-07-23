-- ════════════════════════════════════════════════════════════════
-- JM ELECTRIC — Tanda 11: Técnicos y Nómina
-- FORT KNOX: RLS + FORCE. Bitácora de horas solo INSERT/SELECT.
-- Storage privado para fotos. Certificaciones con vencimiento.
-- ════════════════════════════════════════════════════════════════

-- ── Ampliar perfil del técnico ──────────────────────────────────
alter table technicians add column if not exists cedula      text;
alter table technicians add column if not exists address     text;
alter table technicians add column if not exists photo_path  text;
alter table technicians add column if not exists hourly_rate numeric(10,2) not null default 500;
alter table technicians add column if not exists active      boolean not null default true;

-- ── Certificaciones con vencimiento ─────────────────────────────
create table if not exists technician_certifications (
  id            uuid primary key default gen_random_uuid(),
  technician_id uuid not null references technicians(id) on delete cascade,
  name          text not null,
  expires_at    date,
  created_at    timestamptz not null default now()
);
alter table technician_certifications enable row level security;
alter table technician_certifications force row level security;
drop policy if exists tech_cert_admin_all on technician_certifications;
create policy tech_cert_admin_all on technician_certifications
  for all using (is_active_admin()) with check (is_active_admin());

-- ── Bitácora de horas trabajadas — solo INSERT/SELECT ───────────
create table if not exists technician_worklog (
  id            uuid primary key default gen_random_uuid(),
  technician_id uuid not null references technicians(id) on delete cascade,
  order_id      uuid references service_orders(id) on delete set null,
  hours         numeric(6,2) not null,
  note          text,
  actor_id      uuid references auth.users(id),
  created_at    timestamptz not null default now()
);
alter table technician_worklog enable row level security;
alter table technician_worklog force row level security;
-- Admin lee todo; el técnico lee solo lo suyo.
drop policy if exists worklog_select on technician_worklog;
create policy worklog_select on technician_worklog
  for select using (is_active_admin() or technician_id = auth.uid());
drop policy if exists worklog_insert on technician_worklog;
create policy worklog_insert on technician_worklog
  for insert with check (is_active_admin());

-- ── Storage: fotos de técnicos (privado) ────────────────────────
insert into storage.buckets (id, name, public)
values ('technician-photos', 'technician-photos', false)
on conflict (id) do nothing;

-- ════════════════════════════════════════════════════════════════
-- SEED — completar perfiles + certificaciones + horas del período
-- ════════════════════════════════════════════════════════════════
update technicians set hourly_rate = 750, cedula = '001-1234567-8', active = true where name = 'Ramón Peralta';
update technicians set hourly_rate = 750, cedula = '001-2345678-9', active = true where name = 'Wander Batista';
update technicians set hourly_rate = 700, cedula = '031-0987654-3', active = true where name = 'Franklin Ureña';
update technicians set hourly_rate = 700, cedula = '402-1122334-5', active = true where name = 'Yohan Mercedes';

insert into technician_certifications (technician_id, name, expires_at)
select t.id, v.cert, v.exp::date
from (values
  ('Ramón Peralta','Electricista certificado CNE', to_char(now() + interval '200 days','YYYY-MM-DD')),
  ('Ramón Peralta','Instalador solar Nivel II',    to_char(now() + interval '20 days','YYYY-MM-DD')),
  ('Wander Batista','Electricista certificado CNE', to_char(now() + interval '400 days','YYYY-MM-DD')),
  ('Franklin Ureña','Técnico en CCTV',             to_char(now() + interval '15 days','YYYY-MM-DD')),
  ('Yohan Mercedes','Técnico HVAC',                to_char(now() - interval '5 days','YYYY-MM-DD'))
) as v(tech, cert, exp)
join technicians t on t.name = v.tech
on conflict do nothing;

insert into technician_worklog (technician_id, hours, note, created_at)
select t.id, v.hrs, v.note, now() - (v.days || ' days')::interval
from (values
  ('Ramón Peralta', 8,  'Instalación solar', 2),
  ('Ramón Peralta', 6,  'Cargador VE',       5),
  ('Ramón Peralta', 7,  'Mantenimiento',     9),
  ('Wander Batista',8,  'Reparación cuartos fríos', 1),
  ('Wander Batista',7,  'Diagnóstico planta', 3),
  ('Franklin Ureña',6,  'Ampliación CCTV',   1),
  ('Yohan Mercedes',5,  'Instalación A/A',   4)
) as v(tech, hrs, note, days)
join technicians t on t.name = v.tech
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════
-- Cierre: correr el Security Advisor de Supabase antes de mergear.
-- ════════════════════════════════════════════════════════════════
