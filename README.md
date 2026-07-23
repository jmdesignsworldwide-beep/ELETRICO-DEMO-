# JM Electric — Sistema de Gestión

Sistema integral de gestión para empresas de servicios eléctricos. Demo
premium construido con estándar **monster · premium · flawless**.

Interfaz 100% en español dominicano · RD$ · ITBIS 18% · fechas DD/MM/AAAA.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — sistema de diseño amarillo eléctrico / negro profundo / blanco
- **Framer Motion** — animaciones, count-up, cascadas escalonadas
- **Recharts** — gráficas financieras
- **lucide-react** — iconografía
- **Supabase** (PostgreSQL + Auth + Storage) — capa de datos (scaffolding listo)

## Arranque local

```bash
npm install
cp .env.example .env.local   # completar con credenciales de Supabase
npm run dev
```

Abrir http://localhost:3000 — el login trae credenciales de demo precargadas.

## Módulos incluidos

Dashboard · Clientes (CRM) · Órdenes de servicio · Cotizaciones ·
Cotizador rápido (calculadora en vivo) · Inventario · Suplidores ·
Órdenes de compra · Facturación (NCF simulado) · Caja y gastos ·
Técnicos y nómina · Finanzas y estadísticas (ERP) · Calendario ·
Portafolio de trabajos.

Cada enlace del menú lleva a una pantalla real con datos — cero clics muertos.

## Seguridad — Fort Knox (desde la línea uno)

- **Headers de seguridad** en `next.config.mjs`: CSP, HSTS, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- **`service_role` solo en servidor** (`src/lib/supabase/server.ts` con
  `import "server-only"`) — jamás con prefijo `NEXT_PUBLIC_`.
- **Migraciones nacen cerradas** (`supabase/migrations/0001_init.sql`):
  RLS + FORCE en todas las tablas, denegar por defecto, sin `USING(true)`.
- **Bitácora de actividad** solo permite INSERT y SELECT — jamás UPDATE/DELETE.
- **Secretos fuera del repo**: `.env` en `.gitignore`, solo `.env.example`
  con placeholders.
- Paso de cierre obligatorio antes de cada merge: correr el **Security Advisor**
  de Supabase y cerrar todas las advertencias.

## Datos — cero data en código

Toda la data vive en Supabase, jamás en el código. La capa de acceso
(`src/lib/data.ts`, `server-only`) es la única fuente de verdad y lee siempre
desde la base. La data de demo (nombres dominicanos, montos RD$ reales) se
siembra por migración: `supabase/migrations/0002_schema_seed.sql`.

### Poner en marcha con datos reales

1. **Aplicar migraciones** en tu proyecto Supabase (SQL Editor):
   pega y corre `0001_init.sql` y luego `0002_schema_seed.sql`.
2. **Variables de entorno** (local en `.env.local`, y en Vercel):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (marcar **Sensitive** en Vercel)
3. Las páginas son `dynamic` y leen en el servidor respetando RLS. Sin las
   variables, renderizan un estado vacío elegante (nunca crashean).

### Server actions (Clientes / Órdenes)

`src/app/actions/*` — cada acción arranca con `requireActiveUser()` /
`requireAdmin()`, aplica rate limiting por usuario y valida por whitelist
(tipos, montos, fechas, UUID) antes de tocar la base.

---

Diseñado por **JM Nexus Designs** ·
[Correo](mailto:jm.nexus.designs@gmail.com) ·
[WhatsApp](https://wa.me/18494421919) ·
[Instagram](https://instagram.com/jm.nexus.designs)
