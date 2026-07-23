-- ════════════════════════════════════════════════════════════════
-- JM ELECTRIC — Tanda 18: Cierre Fort Knox (red de seguridad)
-- Idempotente. Endurece por si algo quedó suelto: RLS + FORCE en toda
-- tabla del esquema public, y EXECUTE revocado a anon en toda función.
-- ════════════════════════════════════════════════════════════════

-- 1) RLS + FORCE en TODAS las tablas de public (red final).
do $$
declare r record;
begin
  for r in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', r.tablename);
    execute format('alter table public.%I force row level security', r.tablename);
  end loop;
end $$;

-- 2) EXECUTE revocado a anon en TODAS las funciones de public.
--    Importante: NO se revoca a authenticated/public, porque las funciones
--    de RLS (is_active_admin, is_owner) deben poder evaluarse en las consultas
--    del usuario autenticado. Se re-garantizan explícitamente por seguridad.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('revoke execute on function %s from anon', r.sig);
  end loop;
end $$;

grant execute on function is_active_admin() to authenticated;
grant execute on function is_owner() to authenticated;

-- 3) Buckets de Storage: asegurar que ninguno es público.
update storage.buckets set public = false
where id in ('inventory-photos','expense-receipts','technician-photos','portfolio-photos');

-- ════════════════════════════════════════════════════════════════
-- VERIFICACIÓN (correr y revisar que devuelvan CERO filas):
--
-- a) Tablas sin RLS:
--    select tablename from pg_tables t where schemaname='public'
--      and not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
--        where n.nspname='public' and c.relname=t.tablename and c.relrowsecurity);
--
-- b) Políticas peligrosas USING(true):
--    select polname, tablename from pg_policies
--      where schemaname='public' and (qual='true' or with_check='true');
--
-- c) Buckets públicos:
--    select id from storage.buckets where public = true;
--
-- PASO FINAL OBLIGATORIO: correr el Security Advisor de Supabase y cerrar
-- TODAS las advertencias antes de mergear a producción.
-- ════════════════════════════════════════════════════════════════
