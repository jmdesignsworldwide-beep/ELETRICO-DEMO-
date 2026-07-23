-- ════════════════════════════════════════════════════════════════
-- JM ELECTRIC — Tanda 10: Caja y Gastos
-- FORT KNOX: RLS + FORCE. Cajas cerradas y gastos son INMUTABLES
-- (sin UPDATE/DELETE salvo el cierre de la propia caja abierta).
-- Storage privado para comprobantes. Una sola caja abierta a la vez.
-- ════════════════════════════════════════════════════════════════

-- ── Cajas diarias ───────────────────────────────────────────────
create table if not exists cash_registers (
  id             uuid primary key default gen_random_uuid(),
  opened_by      uuid references auth.users(id),
  opener_name    text,
  opening_amount numeric(14,2) not null default 0,
  opened_at      timestamptz not null default now(),
  status         text not null default 'abierta',   -- abierta, cerrada
  closed_at      timestamptz,
  expected_cash  numeric(14,2),
  counted_cash   numeric(14,2),
  difference     numeric(14,2),
  closing_notes  text
);
alter table cash_registers enable row level security;
alter table cash_registers force row level security;

-- Solo admin activo. Insert/Select/Update (para cerrar). Sin DELETE.
drop policy if exists cash_reg_select on cash_registers;
create policy cash_reg_select on cash_registers for select using (is_active_admin());
drop policy if exists cash_reg_insert on cash_registers;
create policy cash_reg_insert on cash_registers for insert with check (is_active_admin());
drop policy if exists cash_reg_update on cash_registers;
create policy cash_reg_update on cash_registers for update using (is_active_admin()) with check (is_active_admin());

-- Una sola caja abierta a la vez (garantía a nivel de base de datos).
create unique index if not exists one_open_register
  on cash_registers (status) where status = 'abierta';

-- ── Gastos — LEDGER: solo INSERT/SELECT ─────────────────────────
create table if not exists expenses (
  id             uuid primary key default gen_random_uuid(),
  register_id    uuid references cash_registers(id) on delete set null,
  category       text not null,
  description    text not null,
  amount         numeric(14,2) not null,
  payment_method text not null default 'efectivo',
  receipt_path   text,
  actor_id       uuid references auth.users(id),
  created_at     timestamptz not null default now()
);
alter table expenses enable row level security;
alter table expenses force row level security;
drop policy if exists expenses_select on expenses;
create policy expenses_select on expenses for select using (is_active_admin());
drop policy if exists expenses_insert on expenses;
create policy expenses_insert on expenses for insert with check (is_active_admin());
-- Sin UPDATE/DELETE → gasto registrado es permanente.

-- ── Gastos recurrentes (plantillas) ─────────────────────────────
create table if not exists recurring_expenses (
  id             uuid primary key default gen_random_uuid(),
  category       text not null,
  description    text not null,
  amount         numeric(14,2) not null,
  payment_method text not null default 'efectivo',
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);
alter table recurring_expenses enable row level security;
alter table recurring_expenses force row level security;
drop policy if exists recurring_admin_all on recurring_expenses;
create policy recurring_admin_all on recurring_expenses
  for all using (is_active_admin()) with check (is_active_admin());

-- ── Storage: comprobantes privados ──────────────────────────────
insert into storage.buckets (id, name, public)
values ('expense-receipts', 'expense-receipts', false)
on conflict (id) do nothing;

-- ════════════════════════════════════════════════════════════════
-- SEED — una caja cerrada de ayer + gastos recurrentes de ejemplo
-- ════════════════════════════════════════════════════════════════
insert into cash_registers (id, opener_name, opening_amount, opened_at, status, closed_at, expected_cash, counted_cash, difference, closing_notes)
values ('55555555-5555-5555-5555-555555555501','Marien',15000, now() - interval '1 day' - interval '8 hours','cerrada', now() - interval '1 day', 133900, 133900, 0, 'Cuadre exacto.')
on conflict (id) do nothing;

insert into expenses (register_id, category, description, amount, payment_method, created_at)
values
  ('55555555-5555-5555-5555-555555555501','combustible','Combustible camioneta',3200,'efectivo', now() - interval '1 day' - interval '4 hours'),
  ('55555555-5555-5555-5555-555555555501','materiales_menores','Consumibles de instalación',1850,'efectivo', now() - interval '1 day' - interval '3 hours')
on conflict do nothing;

insert into recurring_expenses (category, description, amount, payment_method) values
  ('alquiler','Alquiler del local', 25000, 'transferencia'),
  ('servicios','Factura de energía (EDE)', 8500, 'transferencia')
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════
-- Cierre: correr el Security Advisor de Supabase antes de mergear.
-- ════════════════════════════════════════════════════════════════
