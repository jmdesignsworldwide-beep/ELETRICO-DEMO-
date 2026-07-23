-- ════════════════════════════════════════════════════════════════
-- JM ELECTRIC — Tanda 15: Capa de acceso temporal (JM Nexus Designs)
-- CAPA B, independiente de los roles internos (admin/tecnico = Capa A).
-- FORT KNOX: expiración validada en el SERVIDOR (horneada en is_active_admin,
-- por lo que TODA lectura/escritura RLS la respeta), aislamiento por RLS,
-- flag de owner explícito (NO el rol admin genérico).
-- ════════════════════════════════════════════════════════════════

-- Flag de owner explícito (la dueña real, JM Nexus Designs / Marien).
alter table profiles add column if not exists is_owner boolean not null default false;
alter table profiles add column if not exists username text;

-- ¿El usuario actual es el owner? (NO se confunde con admin genérico)
create or replace function is_owner()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and is_owner = true and active = true
  );
$$;
revoke execute on function is_owner() from anon;

-- ── Cuentas de demo con vigencia ────────────────────────────────
create table if not exists demo_accounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade unique,
  username    text not null unique,
  expires_at  timestamptz,               -- null = sin vencimiento
  active      boolean not null default true,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
alter table demo_accounts enable row level security;
alter table demo_accounts force row level security;

-- El OWNER gestiona todo. Las cuentas de cliente NO ven este panel.
drop policy if exists demo_owner_all on demo_accounts;
create policy demo_owner_all on demo_accounts
  for all using (is_owner()) with check (is_owner());

-- Aislamiento: un usuario solo puede LEER su propia cuenta (para el aviso).
drop policy if exists demo_self_select on demo_accounts;
create policy demo_self_select on demo_accounts
  for select using (user_id = auth.uid());

-- ── Expiración horneada en is_active_admin ──────────────────────
-- Un admin solo es "activo" si es owner O su cuenta de demo está activa y
-- no vencida. Así TODA política RLS del sistema niega a las cuentas vencidas,
-- aunque fuercen rutas o la API. now() se evalúa en cada consulta.
create or replace function is_active_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.active = true
      and (
        p.is_owner = true
        or not exists (
          select 1 from demo_accounts d
          where d.user_id = p.id
            and (d.active = false or (d.expires_at is not null and d.expires_at <= now()))
        )
      )
  );
$$;
revoke execute on function is_active_admin() from anon;

-- ════════════════════════════════════════════════════════════════
-- CONFIGURACIÓN DEL OWNER (hacer una sola vez, manualmente):
-- 1. Crear el usuario de Marien en Supabase Auth con email
--    marien@demo.jmelectric.app y una contraseña.
-- 2. Insertar/actualizar su perfil como owner:
--      insert into profiles (id, full_name, role, active, is_owner, username)
--      values ('<uuid-del-auth-user>', 'Marien', 'admin', true, true, 'marien')
--      on conflict (id) do update
--        set is_owner = true, role = 'admin', active = true, username = 'marien';
--    (El owner NO lleva fila en demo_accounts, por eso nunca vence.)
-- ════════════════════════════════════════════════════════════════

-- Cierre: correr el Security Advisor de Supabase antes de mergear.
