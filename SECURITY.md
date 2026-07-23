# Auditoría de seguridad — JM Electric (Fort Knox)

Cierre de la Tanda 18. Este documento es la lista de verificación de seguridad
del sistema, con los resultados de la auditoría del repositorio y las consultas
para cerrar en Supabase.

> **Paso final obligatorio antes de producción:** correr el **Security Advisor**
> de Supabase (Database → Advisors) y cerrar **todas** las advertencias.

---

## 1. RLS + FORCE en todas las tablas

- Todas las tablas nacen con `enable row level security` **+** `force row level security`.
- **Denegar por defecto**: sin políticas abiertas. No existe ningún `USING(true)`.
- La migración `0011_security_hardening.sql` re-aplica RLS+FORCE a **toda** tabla
  de `public` como red final (idempotente).

Verificación (debe devolver 0 filas):
```sql
select tablename from pg_tables t where schemaname='public'
  and not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname=t.tablename and c.relrowsecurity);
select polname, tablename from pg_policies
  where schemaname='public' and (qual='true' or with_check='true');
```

## 2. Bitácoras — solo INSERT/SELECT (sin UPDATE/DELETE)

Bloqueado a nivel de base de datos (no hay políticas de UPDATE/DELETE):
`activity_log`, `inventory_movements`, `supplier_price_history`,
`technician_worklog`, `expenses`, `payments`.

## 3. Llaves

- `service_role` **solo** en `src/lib/supabase/server.ts`, con `import "server-only"`. ✅
- **Cero** `NEXT_PUBLIC_` en llaves sensibles (solo la URL y la anon key son públicas). ✅
- `.env` en `.gitignore`; solo `.env.example` con placeholders. ✅
- **Cero** secretos, PAT (`sbp_…`) o connection strings en el repo o el historial. ✅

## 4. Endpoints y RPCs

- Funciones `is_active_admin()` y `is_owner()`: **`SECURITY DEFINER`** con
  **`set search_path = public`** fijo y **`EXECUTE` revocado a `anon`**. ✅
- La migración `0011` revoca `EXECUTE` a `anon` y `public` en **todas** las
  funciones de `public` (las de RLS siguen operando por ser DEFINER).
- Toda server action arranca con `requireActiveUser()` / `requireAdmin()` /
  `requireOwner()` antes de cualquier lógica.

## 5. Roles (validado en el servidor, no solo en la UI)

- **Técnico**: solo lee sus órdenes/horas asignadas — RLS (`auth.uid() = any(technician_ids)`),
  no puede acceder a las de otros ni forzando URL/API.
- **Cuenta de demo vencida**: la expiración está horneada en `is_active_admin()`,
  por lo que **toda** política RLS la niega; además el middleware la redirige a
  `/expirado`. No basta ocultar en la UI.
- **Owner (JM Nexus)**: distinguido por flag explícito `is_owner`, **no** por el
  rol admin genérico. Panel `/cuentas` inaccesible al resto (`notFound` + RLS).
- **Aislamiento**: cada cuenta solo lee su propia fila de `demo_accounts`.

## 6. Headers de seguridad (`next.config.mjs`)

`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`,
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. ✅

## 7. Storage

- Buckets **privados** (`public = false`): `inventory-photos`, `expense-receipts`,
  `technician-photos`, `portfolio-photos`. ✅
- Lectura **siempre** con `createSignedUrl` de expiración corta (600 s).
  **Cero** `getPublicUrl` sobre archivos privados. ✅

Verificación (0 filas):
```sql
select id from storage.buckets where public = true;
```

## 8. Rate limiting

- Activo **por usuario** en todas las server actions (`enforceRateLimit`).

## 9. Dependencias (`npm audit`)

- Los CVE **críticos/altos** de Next.js (cache poisoning, bypass de autorización)
  se cerraron subiendo a **Next.js 14.2.35**.
- Quedan 2 advisories clase **DoS** que solo se corrigen en Next 15 (upgrade mayor,
  diferido). **No aplican** a esta app: no usa `next/image` con `remotePatterns`,
  ni `rewrites`, ni el caché de `next/image`.

## 10. PAT temporal

- **Cero** PAT o connection string permanente en el repo, variables de entorno o
  cualquier archivo. Protocolo: generar PAT temporal → usar una vez → revocar.
  (Las migraciones se aplican por el SQL Editor, que no requiere PAT.)

---

Diseñado por **JM Nexus Designs** ·
[Correo](mailto:jm.nexus.designs@gmail.com) ·
[WhatsApp](https://wa.me/18494421919) ·
[Instagram](https://instagram.com/jm.nexus.designs)
