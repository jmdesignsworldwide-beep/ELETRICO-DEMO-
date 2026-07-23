-- ════════════════════════════════════════════════════════════════
-- JM ELECTRIC — Schema completo + seed (Tanda 3)
-- FORT KNOX: RLS + FORCE en todas las tablas, denegar por defecto.
-- La data de demo vive AQUÍ, jamás en código. Nombres dominicanos,
-- montos en RD$ realistas. Idempotente donde es posible.
-- ════════════════════════════════════════════════════════════════

-- ── Ampliar clients (columnas de resumen para el CRM) ───────────
alter table clients add column if not exists total_spent  numeric(14,2) not null default 0;
alter table clients add column if not exists service_count integer       not null default 0;

-- ── Técnicos ────────────────────────────────────────────────────
create table if not exists technicians (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  phone          text not null,
  specialties    text[] not null default '{}',
  certifications text[] not null default '{}',
  active_orders  integer not null default 0,
  hours_period   integer not null default 0,
  payroll_period numeric(12,2) not null default 0,
  created_at     timestamptz not null default now()
);
alter table technicians enable row level security;
alter table technicians force row level security;

-- ── Órdenes de servicio ─────────────────────────────────────────
create table if not exists service_orders (
  id                 uuid primary key default gen_random_uuid(),
  number             text not null unique,
  client_id          uuid not null references clients(id) on delete restrict,
  service_type       text not null,
  status             text not null default 'recibida',
  priority           text not null default 'normal',
  technician_ids     uuid[] not null default '{}',
  scheduled_date     timestamptz not null,
  estimated_end_date timestamptz not null,
  description        text not null default '',
  address            text not null default '',
  total              numeric(14,2) not null default 0,
  created_at         timestamptz not null default now()
);
alter table service_orders enable row level security;
alter table service_orders force row level security;

-- ── Inventario ──────────────────────────────────────────────────
create table if not exists inventory (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null,
  sku         text not null unique,
  cost_price  numeric(12,2) not null default 0,
  sale_price  numeric(12,2) not null default 0,
  stock       integer not null default 0,
  min_stock   integer not null default 0,
  unit        text not null default 'unidad',
  created_at  timestamptz not null default now()
);
alter table inventory enable row level security;
alter table inventory force row level security;

-- ── Cotizaciones ────────────────────────────────────────────────
create table if not exists quotes (
  id          uuid primary key default gen_random_uuid(),
  number      text not null unique,
  client_id   uuid not null references clients(id) on delete restrict,
  status      text not null default 'borrador',
  subtotal    numeric(14,2) not null default 0,
  discount    numeric(14,2) not null default 0,
  itbis       numeric(14,2) not null default 0,
  total       numeric(14,2) not null default 0,
  created_at  timestamptz not null default now(),
  valid_until timestamptz not null
);
alter table quotes enable row level security;
alter table quotes force row level security;

-- ── Facturas ────────────────────────────────────────────────────
create table if not exists invoices (
  id             uuid primary key default gen_random_uuid(),
  number         text not null unique,
  ncf            text not null,
  client_id      uuid not null references clients(id) on delete restrict,
  status         text not null default 'pendiente',
  subtotal       numeric(14,2) not null default 0,
  itbis          numeric(14,2) not null default 0,
  total          numeric(14,2) not null default 0,
  payment_method text,
  created_at     timestamptz not null default now()
);
alter table invoices enable row level security;
alter table invoices force row level security;

-- ── Estadísticas mensuales (finanzas) ───────────────────────────
create table if not exists monthly_stats (
  id        uuid primary key default gen_random_uuid(),
  ord       integer not null,
  month     text not null,
  ingresos  numeric(14,2) not null default 0,
  gastos    numeric(14,2) not null default 0
);
alter table monthly_stats enable row level security;
alter table monthly_stats force row level security;

-- ── Políticas: solo admin activo opera; anon denegado ───────────
do $$
declare t text;
begin
  foreach t in array array[
    'technicians','service_orders','inventory','quotes','invoices','monthly_stats'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_admin_all', t);
    execute format(
      'create policy %I on %I for all using (is_active_admin()) with check (is_active_admin())',
      t || '_admin_all', t
    );
  end loop;
end $$;

-- El técnico puede LEER solo las órdenes donde está asignado.
drop policy if exists service_orders_tech_select on service_orders;
create policy service_orders_tech_select on service_orders
  for select using (auth.uid() = any(technician_ids));

-- ════════════════════════════════════════════════════════════════
-- SEED — data dominicana realista (RD$). Fechas relativas a now().
-- ════════════════════════════════════════════════════════════════

-- Clientes (UUIDs fijos para referencias)
insert into clients (id, name, phone, address, property_type, panel_type, voltage, notes, total_spent, service_count, created_at) values
  ('11111111-1111-1111-1111-111111111101','Residencial Los Cacicazgos','809-482-1120','Av. Anacaona 45, Los Cacicazgos, Santo Domingo','residencial','Panel Square D 200A','120/240V monofásico','Panel principal en garaje. Cliente prefiere visitas AM.',486500,7, now() - interval '320 days'),
  ('11111111-1111-1111-1111-111111111102','Supermercado La Cadena — Suc. Naco','809-565-4400','Calle Fantino Falco 12, Naco, Santo Domingo','comercial','Tablero trifásico 400A','208/120V trifásico','Cuartos fríos con circuito dedicado. Coordinar fuera de horario pico.',1284000,14, now() - interval '410 days'),
  ('11111111-1111-1111-1111-111111111103','Ferretería El Tornillo Feliz','829-771-3388','Av. Duarte 210, Villa Consuelo, Santo Domingo','comercial','Panel 100A','120/240V monofásico','Solicitó cotización de planta eléctrica de respaldo.',218900,4, now() - interval '180 days'),
  ('11111111-1111-1111-1111-111111111104','Industrias Metálicas del Caribe','809-333-9021','Zona Franca Industrial, Km 22 Autopista Duarte','industrial','Subestación 500 KVA','480V trifásico','Contrato de mantenimiento trimestral. Acceso con carné.',2940000,21, now() - interval '520 days'),
  ('11111111-1111-1111-1111-111111111105','Dra. Mariela Fernández','809-604-7712','Torre Piantini, Apto 8B, Piantini, Santo Domingo','residencial','Panel 150A','120/240V monofásico','Instalación de cargador para vehículo eléctrico pendiente.',96400,2, now() - interval '95 days'),
  ('11111111-1111-1111-1111-111111111106','Colmadón El Buen Precio','849-210-5567','Calle Respaldo 8, Los Mina, Santo Domingo Este','comercial','Panel 100A','120/240V monofásico','Nevera y congeladores en un solo circuito — recomendar separar.',54200,3, now() - interval '60 days'),
  ('11111111-1111-1111-1111-111111111107','Hotel Boutique Villa Serena','809-712-8890','Calle El Conde 102, Zona Colonial, Santo Domingo','comercial','Tablero trifásico 300A','208/120V trifásico','Sistema de cámaras de 16 canales instalado por JM.',672300,9, now() - interval '240 days'),
  ('11111111-1111-1111-1111-111111111108','Sr. Amparo Guzmán','829-448-1234','Res. Villa Olga, Calle 3 #17, Santiago','residencial','Panel 125A','120/240V monofásico','Instalación de paneles solares de 5kW completada.',412800,5, now() - interval '150 days')
on conflict (id) do nothing;

-- Técnicos
insert into technicians (id, name, phone, specialties, certifications, active_orders, hours_period, payroll_period) values
  ('22222222-2222-2222-2222-222222222201','Ramón Peralta','809-555-0142', array['Instalaciones residenciales','Paneles solares'], array['Electricista certificado CNE','Instalador solar Nivel II'],4,82,61500),
  ('22222222-2222-2222-2222-222222222202','Wander Batista','829-555-0177', array['Sistemas comerciales','Breakers y tableros'], array['Electricista certificado CNE'],3,76,57000),
  ('22222222-2222-2222-2222-222222222203','Franklin Ureña','849-555-0198', array['Cámaras y alarmas','Cableado estructurado'], array['Técnico en CCTV','Redes de baja tensión'],2,68,47600),
  ('22222222-2222-2222-2222-222222222204','Yohan Mercedes','809-555-0231', array['Aire acondicionado','Mantenimiento preventivo'], array['Técnico HVAC','Electricista certificado CNE'],3,71,49700)
on conflict (id) do nothing;

-- Órdenes de servicio
insert into service_orders (number, client_id, service_type, status, priority, technician_ids, scheduled_date, estimated_end_date, description, address, total, created_at) values
  ('OS-2025-0148','11111111-1111-1111-1111-111111111102','reparacion','en_proceso','urgente', array['22222222-2222-2222-2222-222222222202']::uuid[], now() - interval '1 day', now(), 'Falla en circuito de cuartos fríos. Breaker principal disparando.','Calle Fantino Falco 12, Naco',38500, now() - interval '2 days'),
  ('OS-2025-0149','11111111-1111-1111-1111-111111111104','mantenimiento','asignada','normal', array['22222222-2222-2222-2222-222222222201','22222222-2222-2222-2222-222222222202']::uuid[], now() - interval '3 days', now() - interval '1 day', 'Mantenimiento trimestral de subestación 500 KVA.','Zona Franca Industrial, Km 22',145000, now() - interval '6 days'),
  ('OS-2025-0150','11111111-1111-1111-1111-111111111105','instalacion_nueva','esperando_materiales','normal', array['22222222-2222-2222-2222-222222222201']::uuid[], now(), now() + interval '1 day', 'Instalación de cargador para vehículo eléctrico (NEMA 14-50).','Torre Piantini, Apto 8B, Piantini',62400, now() - interval '4 days'),
  ('OS-2025-0151','11111111-1111-1111-1111-111111111107','camaras','en_proceso','normal', array['22222222-2222-2222-2222-222222222203']::uuid[], now(), now() + interval '2 days', 'Ampliación a 16 canales de CCTV y grabador NVR.','Calle El Conde 102, Zona Colonial',118900, now() - interval '5 days'),
  ('OS-2025-0152','11111111-1111-1111-1111-111111111106','emergencia','recibida','emergencia', '{}'::uuid[], now(), now(), 'Sin energía en toda la nevera. Pérdida de mercancía en riesgo.','Calle Respaldo 8, Los Mina',0, now()),
  ('OS-2025-0153','11111111-1111-1111-1111-111111111101','aire_acondicionado','asignada','normal', array['22222222-2222-2222-2222-222222222204']::uuid[], now() + interval '1 day', now() + interval '1 day', 'Instalación de 2 unidades split de 24,000 BTU.','Av. Anacaona 45, Los Cacicazgos',84000, now() - interval '1 day'),
  ('OS-2025-0154','11111111-1111-1111-1111-111111111108','paneles_solares','completada','normal', array['22222222-2222-2222-2222-222222222201']::uuid[], now() - interval '8 days', now() - interval '5 days', 'Sistema solar de 5kW con 12 paneles e inversor híbrido.','Res. Villa Olga, Santiago',412800, now() - interval '14 days'),
  ('OS-2025-0155','11111111-1111-1111-1111-111111111103','diagnostico','en_proceso','normal', array['22222222-2222-2222-2222-222222222202']::uuid[], now() + interval '2 days', now() + interval '2 days', 'Inspección para cotizar planta eléctrica de respaldo 20 KW.','Av. Duarte 210, Villa Consuelo',6500, now() - interval '1 day')
on conflict (number) do nothing;

-- Inventario
insert into inventory (name, category, sku, cost_price, sale_price, stock, min_stock, unit) values
  ('Cable THHN #12 AWG (rollo 100m)','Cables / conductores','CBL-12-100',3200,4500,42,15,'rollo'),
  ('Cable THHN #10 AWG (rollo 100m)','Cables / conductores','CBL-10-100',4900,6800,8,12,'rollo'),
  ('Breaker 20A 1 polo Square D','Breakers','BRK-20-1P',380,650,64,20,'unidad'),
  ('Breaker 2x30A Square D','Breakers','BRK-30-2P',720,1150,31,15,'unidad'),
  ('Panel 12 espacios con main 100A','Paneles / tableros','PNL-12-100',4100,6200,6,4,'unidad'),
  ('Tomacorriente doble 15A grado hospital','Tomacorrientes / interruptores','TOM-15-DBL',145,275,120,40,'unidad'),
  ('Interruptor sencillo blanco','Tomacorrientes / interruptores','INT-1P-W',65,135,95,30,'unidad'),
  ('Panel solar 450W monocristalino','Materiales solares','SOL-450',8400,11900,18,8,'unidad'),
  ('Inversor híbrido 5kW 48V','Materiales solares','SOL-INV-5K',34000,46500,3,2,'unidad'),
  ('Cámara IP domo 4MP','Materiales de cámaras y alarmas','CAM-4MP-D',2100,3400,24,10,'unidad'),
  ('Tubo EMT 1/2" (tramo 3m)','Tuberías / conduit','EMT-12-3M',210,360,140,50,'tramo'),
  ('Caja octagonal metálica','Cajas eléctricas','CAJ-OCT',48,95,7,25,'unidad')
on conflict (sku) do nothing;

-- Cotizaciones
insert into quotes (number, client_id, status, subtotal, discount, itbis, total, created_at, valid_until) values
  ('COT-2025-0091','11111111-1111-1111-1111-111111111103','enviada',285000,10000,49500,324500, now() - interval '3 days', now() + interval '12 days'),
  ('COT-2025-0090','11111111-1111-1111-1111-111111111105','aprobada',52881,0,9519,62400, now() - interval '6 days', now() + interval '9 days'),
  ('COT-2025-0089','11111111-1111-1111-1111-111111111101','aprobada',71186,0,12814,84000, now() - interval '4 days', now() + interval '11 days'),
  ('COT-2025-0088','11111111-1111-1111-1111-111111111106','borrador',18600,0,3348,21948, now() - interval '1 day', now() + interval '14 days'),
  ('COT-2025-0087','11111111-1111-1111-1111-111111111107','rechazada',210000,0,37800,247800, now() - interval '20 days', now() - interval '5 days')
on conflict (number) do nothing;

-- Facturas
insert into invoices (number, ncf, client_id, status, subtotal, itbis, total, payment_method, created_at) values
  ('FAC-2025-0203','B0100000203','11111111-1111-1111-1111-111111111108','pendiente',349831,62969,412800,null, now() - interval '5 days'),
  ('FAC-2025-0202','B0100000202','11111111-1111-1111-1111-111111111104','pagada',122881,22119,145000,'Transferencia', now() - interval '9 days'),
  ('FAC-2025-0201','B0100000201','11111111-1111-1111-1111-111111111102','pendiente',32627,5873,38500,null, now() - interval '2 days'),
  ('FAC-2025-0200','B0100000200','11111111-1111-1111-1111-111111111107','pagada',100763,18137,118900,'Efectivo', now() - interval '12 days')
on conflict (number) do nothing;

-- Estadísticas mensuales
insert into monthly_stats (ord, month, ingresos, gastos) values
  (1,'Feb',620000,410000),(2,'Mar',785000,452000),(3,'Abr',910000,498000),
  (4,'May',848000,471000),(5,'Jun',1120000,560000),(6,'Jul',1284000,602000)
on conflict do nothing;

-- Bitácora de actividad (INSERT permitido; seed inicial)
insert into activity_log (event_type, title, detail, created_at) values
  ('orden','Nueva orden de emergencia','OS-2025-0152 · Colmadón El Buen Precio · sin energía en nevera', now()),
  ('pago','Pago recibido','FAC-2025-0202 · RD$ 145,000.00 · Transferencia', now()),
  ('cotizacion','Cotización aprobada','COT-2025-0090 · Dra. Mariela Fernández', now() - interval '1 day'),
  ('inventario','Stock bajo detectado','Inversor híbrido 5kW — quedan 3 unidades', now() - interval '1 day'),
  ('orden','Orden completada','OS-2025-0154 · Sistema solar 5kW · Sr. Amparo Guzmán', now() - interval '2 days'),
  ('cliente','Nuevo cliente registrado','Colmadón El Buen Precio · Los Mina', now() - interval '3 days');

-- ════════════════════════════════════════════════════════════════
-- Cierre: correr el Security Advisor de Supabase y cerrar TODAS las
-- advertencias antes de mergear.
-- ════════════════════════════════════════════════════════════════
