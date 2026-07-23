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

## Nota sobre los datos de demo

Esta demo renderiza con un dataset realista dominicano (`src/lib/demo-data.ts`)
para funcionar de inmediato en Vercel sin requerir credenciales. El scaffolding
de Supabase y las migraciones RLS-first ya están listos para conectar la base
real: al configurar las variables de entorno, la capa de datos apunta a Supabase.

---

Diseñado por **JM Nexus Designs** ·
[Correo](mailto:jm.nexus.designs@gmail.com) ·
[WhatsApp](https://wa.me/18494421919) ·
[Instagram](https://instagram.com/jm.nexus.designs)
