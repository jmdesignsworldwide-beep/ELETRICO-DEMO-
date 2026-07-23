-- ════════════════════════════════════════════════════════════════
-- JM ELECTRIC — Tanda 9: Facturación y Pagos
-- FORT KNOX: RLS + FORCE. payments es un ledger: solo INSERT/SELECT.
-- El monto NUNCA se confía del cliente — se recalcula en el servidor.
-- ════════════════════════════════════════════════════════════════

-- ── Columnas de cobro / anulación en invoices ───────────────────
alter table invoices add column if not exists paid_at     timestamptz;
alter table invoices add column if not exists void_reason text;
alter table invoices add column if not exists voided_at   timestamptz;

-- ── Líneas de factura (detalle servicios + materiales) ──────────
create table if not exists invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references invoices(id) on delete cascade,
  description text not null,
  qty         numeric(12,2) not null default 1,
  unit_price  numeric(14,2) not null default 0,
  line_total  numeric(14,2) not null default 0,
  sort        integer not null default 0
);
alter table invoice_items enable row level security;
alter table invoice_items force row level security;

drop policy if exists invoice_items_admin_all on invoice_items;
create policy invoice_items_admin_all on invoice_items
  for all using (is_active_admin()) with check (is_active_admin());

-- ── Pagos — LEDGER inmutable: solo INSERT y SELECT ──────────────
create table if not exists payments (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoices(id) on delete cascade,
  method       text not null,               -- efectivo, transferencia, debito, credito
  amount       numeric(14,2) not null,
  voucher      text,                         -- número de voucher (transferencia)
  received     numeric(14,2),                -- efectivo entregado
  change_given numeric(14,2),                -- devuelta calculada
  actor_id     uuid references auth.users(id),
  created_at   timestamptz not null default now()
);
alter table payments enable row level security;
alter table payments force row level security;

drop policy if exists payments_admin_select on payments;
create policy payments_admin_select on payments
  for select using (is_active_admin());

drop policy if exists payments_insert_auth on payments;
create policy payments_insert_auth on payments
  for insert with check (auth.uid() is not null);
-- Sin políticas de UPDATE/DELETE → operaciones denegadas a nivel de BD.

-- Chequeo de duplicados de voucher a nivel de base de datos.
create unique index if not exists payments_voucher_unique
  on payments (voucher) where voucher is not null;

-- ════════════════════════════════════════════════════════════════
-- SEED — una línea de servicio por cada factura existente
-- ════════════════════════════════════════════════════════════════
insert into invoice_items (invoice_id, description, qty, unit_price, line_total, sort)
select id, 'Servicios eléctricos y materiales', 1, subtotal, subtotal, 0
from invoices
where not exists (select 1 from invoice_items ii where ii.invoice_id = invoices.id);

-- Marca los pagos de las facturas ya pagadas en el seed (ledger histórico).
insert into payments (invoice_id, method, amount, created_at)
select id, coalesce(lower(payment_method), 'efectivo'), total, created_at
from invoices
where status = 'pagada'
  and not exists (select 1 from payments p where p.invoice_id = invoices.id);

update invoices set paid_at = created_at where status = 'pagada' and paid_at is null;

-- ════════════════════════════════════════════════════════════════
-- Cierre: correr el Security Advisor de Supabase antes de mergear.
-- ════════════════════════════════════════════════════════════════
