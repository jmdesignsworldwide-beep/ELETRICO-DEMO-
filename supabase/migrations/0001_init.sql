-- ════════════════════════════════════════════════════════════════
-- JM ELECTRIC — Migración inicial
-- FORT KNOX: las migraciones nacen CERRADAS. Denegar por defecto.
-- RLS + FORCE en todas las tablas. Nada de USING(true).
-- ════════════════════════════════════════════════════════════════

-- ── Perfiles y roles ────────────────────────────────────────────
create type user_role as enum ('admin', 'tecnico');

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        user_role not null default 'tecnico',
  phone       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;
alter table profiles force row level security;

-- Helper: ¿el usuario actual es admin activo?
create or replace function is_active_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;
revoke execute on function is_active_admin() from anon;

-- Cada quien lee su propio perfil; el admin lee todos.
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_active_admin());

create policy "profiles_update_admin_only" on profiles
  for update using (is_active_admin()) with check (is_active_admin());

-- ── Clientes ────────────────────────────────────────────────────
create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text not null,
  address       text,
  property_type text not null default 'residencial',
  panel_type    text,
  voltage       text,
  notes         text,
  created_at    timestamptz not null default now()
);

alter table clients enable row level security;
alter table clients force row level security;

-- Solo usuarios activos autenticados. Denegado por defecto para anon.
create policy "clients_admin_all" on clients
  for all using (is_active_admin()) with check (is_active_admin());

-- ── Bitácora de actividad — SOLO INSERT y SELECT ────────────────
-- Jamás DELETE ni UPDATE. Bloqueado a nivel de base de datos.
create table if not exists activity_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id),
  event_type  text not null,
  title       text not null,
  detail      text,
  created_at  timestamptz not null default now()
);

alter table activity_log enable row level security;
alter table activity_log force row level security;

create policy "activity_insert_authenticated" on activity_log
  for insert with check (auth.uid() is not null);

create policy "activity_select_admin" on activity_log
  for select using (is_active_admin());

-- Sin políticas de UPDATE/DELETE → esas operaciones quedan denegadas.

-- ════════════════════════════════════════════════════════════════
-- NOTA: correr el Security Advisor de Supabase antes de cada merge.
-- Cerrar TODAS las advertencias — cero excepciones.
-- ════════════════════════════════════════════════════════════════
