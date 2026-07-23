-- ════════════════════════════════════════════════════════════════
-- JM ELECTRIC — Tanda 18: Rate limiting DURABLE (por usuario)
-- El limitador en memoria no sirve en serverless (cada invocación puede
-- ser otra instancia). Este es persistente en la base y namespaced por
-- auth.uid(), así un usuario no puede consumir el presupuesto de otro.
-- ════════════════════════════════════════════════════════════════

create table if not exists rate_limit_hits (
  bucket    text primary key,
  count     integer not null,
  reset_at  timestamptz not null
);
alter table rate_limit_hits enable row level security;
alter table rate_limit_hits force row level security;
-- Sin políticas: solo se accede vía la RPC SECURITY DEFINER de abajo.

create or replace function rl_check(p_key text, p_limit integer, p_window integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  k text := coalesce(auth.uid()::text, 'anon') || ':' || p_key;  -- namespaced por usuario
  cur record;
begin
  select * into cur from rate_limit_hits where bucket = k for update;
  if cur is null or now() > cur.reset_at then
    insert into rate_limit_hits (bucket, count, reset_at)
      values (k, 1, now() + make_interval(secs => p_window))
    on conflict (bucket) do update set count = 1, reset_at = now() + make_interval(secs => p_window);
    return true;
  end if;
  if cur.count >= p_limit then
    return false;
  end if;
  update rate_limit_hits set count = count + 1 where bucket = k;
  return true;
end;
$$;

revoke execute on function rl_check(text, integer, integer) from anon;
revoke execute on function rl_check(text, integer, integer) from public;
grant execute on function rl_check(text, integer, integer) to authenticated;

-- Limpieza opcional de buckets viejos (correr manualmente o por cron):
--   delete from rate_limit_hits where reset_at < now() - interval '1 day';

-- Cierre: correr el Security Advisor de Supabase antes de mergear.
