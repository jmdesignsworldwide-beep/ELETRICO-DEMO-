-- ════════════════════════════════════════════════════════════════
-- JM ELECTRIC — Tanda de corrección: cotizaciones reales + expediente cliente
-- FORT KNOX: RLS + FORCE en la tabla nueva; deny por defecto.
-- ════════════════════════════════════════════════════════════════

-- ── Líneas de cotización (materiales + mano de obra) ────────────
create table if not exists quote_items (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references quotes(id) on delete cascade,
  kind         text not null default 'material',   -- material | mano_obra | transporte | otro
  description  text not null,
  qty          numeric(12,2) not null default 1,
  unit_price   numeric(14,2) not null default 0,
  line_total   numeric(14,2) not null default 0,
  inventory_id uuid references inventory(id) on delete set null,
  sort         integer not null default 0
);
alter table quote_items enable row level security;
alter table quote_items force row level security;
drop policy if exists quote_items_admin_all on quote_items;
create policy quote_items_admin_all on quote_items
  for all using (is_active_admin()) with check (is_active_admin());

-- ── Expediente técnico del cliente (columnas nuevas) ────────────
alter table clients add column if not exists breaker_principal      text;
alter table clients add column if not exists contacto_alterno       text;
alter table clients add column if not exists direccion_referencia   text;
alter table clients add column if not exists problemas_conocidos    text;
alter table clients add column if not exists historial_instalaciones text;

-- Red de seguridad: RLS + FORCE por si el linter global no corrió aún.
alter table quote_items enable row level security;
alter table quote_items force row level security;

-- Cierre: correr el Security Advisor de Supabase antes de mergear.
