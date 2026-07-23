# Auditoría de seguridad + pentest — JM Electric

Tanda 18. Auditoría estática total del repositorio + historial, análisis a nivel de
código de cada vector de ataque, y correcciones aplicadas.

**Alcance honesto:** lo verificable desde el código y el repo se auditó y corrigió
aquí. Lo que requiere tu dashboard de Supabase o una sesión autenticada en vivo
(Security Advisor, ataques HTTP reales, rotación de credenciales) queda como pasos
manuales al final, con guion incluido.

---

## 1. Tabla de hallazgos

| Sev. | Hallazgo | Estado |
|---|---|---|
| **Alto** | Rate limiting en memoria — inservible en serverless (el contador se reinicia por instancia de Vercel). | **Corregido**: limitador durable en BD (`rl_check` + `rate_limit_hits`), por usuario, namespaced por `auth.uid()` para que nadie consuma el presupuesto de otro. Migración `0012`. |
| **Medio** | Rutas admin (Finanzas, Caja, Suplidores, Compras, Técnicos) renderizaban para no-admins. Sin fuga (RLS negaba la data), pero sin bloqueo de ruta. | **Corregido**: `guardAdminRoute()` server-side redirige a técnicos. |
| **Medio** | CSP con `'unsafe-inline'`/`'unsafe-eval'` en `script-src` (debilita defensa XSS). | **Documentado/aceptado**: requerido por los scripts inline de Next.js (tema anti-FOUC + hidratación). Recomendación futura: CSP con `nonce`. React ya escapa toda la data de usuario, así que no hay superficie XSS activa. |
| **Bajo** | Rol Técnico (Capa A) no vinculado a Auth: `technician_ids` referencia `technicians.id`, no `auth.users.id`, por lo que sus políticas RLS **nunca conceden** acceso. | **Documentado**: falla **cerrado** (seguro). El self-service del técnico es funcionalmente incompleto pero no expone nada. Requiere vincular técnicos a usuarios de Auth para habilitarlo. |
| **Bajo** | La data del negocio es compartida entre cuentas de demo. | **Intencional**: es una instancia única de demo. El aislamiento aplica a la **gestión de cuentas** (`demo_accounts`), no a la data del negocio. |
| Info | 2 CVE clase DoS de Next.js solo se corrigen en Next 15. | **No aplican** a esta config (sin `next/image` remotePatterns, sin `rewrites`). Documentado en `SECURITY.md`. |

Sin secretos en el código ni en el historial de commits. `.env` nunca commiteado.

---

## 2. Resultado del pentest (Parte 3) — veredicto a nivel de código

> Verificado leyendo RLS y server actions. La confirmación en vivo (HTTP real) la
> corres tú con el guion de la sección 4; no tengo sesión autenticada desde aquí.

| Ataque | Mecanismo de bloqueo | Veredicto |
|---|---|---|
| **3.1 Técnico curioso** (órdenes ajenas, Finanzas/Nómina/Caja/Suplidores, server actions admin, tarifa propia) | RLS (`tech_select` solo asignadas) + `guardAdminRoute()` + `requireAdmin()` en las actions | **Bloqueado server-side** |
| **3.2 Cuenta demo vs capa dueña** (ver panel, crear/renovar/revocar, extender su vigencia, cambiar clave de dueña, ver otra cuenta) | `notFound` si no-owner + `requireOwner()` + RLS `demo_self_select` (solo su fila) + admin API solo-servidor | **Aislamiento hermético** |
| **3.3 Vigencia vencida** (entrar, forzar rutas/API, sesión ya abierta) | Expiración horneada en `is_active_admin()` (evalúa `now()` en cada consulta) → RLS niega + middleware redirige + `requireActiveUser` lanza | **Negado en cada petición** |
| **3.4 Manipulación de montos** (pago, total factura, descuento cotización, cantidad inventario) | El servidor **recalcula** contra la BD; el pago exige suma exacta; montos derivados server-side | **El servidor nunca confía del cliente** |
| **3.5 Login** (fuerza bruta, enumeración) | Rate limit **durable por usuario** (corregido) + error genérico anti-enumeración | **Mejorado**; fuerza bruta distribuida a nivel de red requiere WAF/Cloudflare (fuera de la app) |
| **3.6 Inyección** (SQL en búsquedas, XSS en texto libre) | Queries parametrizadas (Supabase); búsquedas son client-side sobre data ya cargada (sin superficie SQL); React escapa todo | **Sin superficie** |

---

## 3. Verificaciones de base de datos y config

- RLS **+ FORCE** en todas las tablas · cero `USING(true)` · deny por defecto. (`0011` lo re-fuerza en toda tabla de `public`.)
- Bitácoras **solo INSERT/SELECT** (movimientos de inventario, worklog de técnicos, caja/cierres, anulaciones vía `activity_log`, historial de precios de suplidores, pagos). Sin políticas de UPDATE/DELETE → bloqueado en la BD.
- Funciones `SECURITY DEFINER` con `search_path` fijo y `EXECUTE` revocado a `anon`.
- Storage: 4 buckets **privados**, lectura solo por `createSignedUrl` (600 s), cero `getPublicUrl`.
- Headers CSP/HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy presentes.
- Salvaguarda ESLint `no-console` para prevenir fugas por logs a futuro.

---

## 4. Pasos manuales que te tocan a ti (por interfaz web)

1. **Aplicar migraciones** `0011_security_hardening.sql` y `0012_durable_rate_limit.sql` (SQL Editor).
2. **Security Advisor** (Database → Advisors): correr, y cerrar **todas** las advertencias. *(No puedo correrlo desde aquí; es el sello final.)*
3. **Rotar credenciales**:
   - Authentication → Users → usuario de Marien → *Reset password* → poner una contraseña privada nueva.
   - Eliminar cualquier cuenta de prueba creada en desarrollo (en *Users* y su fila en `demo_accounts`).
4. **PAT**: Account → Access Tokens → revocar cualquier token temporal. Confirmar que no hay connection string permanente en Vercel.
5. **Env vars** (Vercel): confirmar `SUPABASE_SERVICE_ROLE_KEY` marcada **Sensitive**.
6. **Pentest en vivo** (opcional pero recomendado): con una cuenta de demo admin y otra **expirada**, confirmar 3.1–3.6. Atajo del 3.3: revoca una cuenta desde `/cuentas` mientras esa sesión está abierta y confirma que la próxima carga cae en `/expirado` y no devuelve data.

---

## 5. Veredicto final (sin maquillar)

A nivel de código, **la autorización se valida en el servidor** en todos los vectores
auditados: RLS + FORCE con deny por defecto, expiración horneada en RLS (se re-evalúa
en cada consulta), montos recalculados en el servidor, aislamiento hermético de la capa
de dueña, y sin superficie de inyección. **No encontré vías de fuga de datos ni de
escalada de privilegios.** El único hallazgo **Alto** (rate limiting inefectivo en
serverless) **quedó corregido**.

**No puedo dar el sello final yo solo:** falta la corrida del **Security Advisor en
vivo** y la **rotación de credenciales**, que dependen de tu dashboard.

**Conclusión:** el sistema está **listo para entregarse a un cliente real** *una vez
completados los pasos 1–5 de la sección 4* (con el Security Advisor limpio y las
credenciales rotadas). Hasta ese momento, el veredicto es **"listo a nivel de código,
pendiente del cierre operativo en Supabase"** — no "entregado".

---

Diseñado por **JM Nexus Designs**
