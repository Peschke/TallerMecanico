# Taller · Frontend (React + Vite + Supabase)

## Requisitos para las Edge Functions

`npm install` solo instala el frontend (React + Vite). Las funciones de `supabase/functions/`
(`crear-usuario`, `notificar-cliente`) corren en **Deno**, no en Node, y necesitan además:

| Requisito | Para qué | Cómo instalar |
| --- | --- | --- |
| Deno | Tipos y pruebas locales de las funciones | `winget install DenoLand.Deno` (Windows) o https://deno.com |
| Supabase CLI | Desplegar y probar funciones (`functions deploy/serve`) | No hace falta instalarla: usa `npx supabase@latest ...`. No se agrega al `package.json` para no cargar el build de Vercel |
| Extensión "Deno" de VS Code (`denoland.vscode-deno`) | Que el editor no marque errores como `Cannot find name 'Deno'` o `Cannot find module 'npm:@supabase/supabase-js@2'` | VS Code la sugiere al abrir el proyecto (`.vscode/extensions.json`) |

Configuración incluida en el repo:
- `supabase/functions/deno.json` · raíz del *workspace* de Deno (opciones de TypeScript).
- `supabase/functions/<función>/deno.json` · imports de cada función (`@supabase/supabase-js`); la CLI de Supabase los usa al desplegar.
- `supabase/functions/deno.lock` · versiones exactas de las dependencias de las funciones (súbelo al repo).
- `.vscode/settings.json` · activa Deno **solo** en `supabase/functions` (el resto del proyecto sigue con Node/ESLint).

Al terminar `npm install` se muestra un aviso (`scripts/postinstall.js`) indicando si falta Deno o la CLI
(en Vercel/CI el aviso se omite).
Si `npm install` muestra `allow-scripts ... esbuild` y luego `npm run dev` falla, ejecuta `npm approve-scripts esbuild`.

> **Si la app dice "error de Edge Function" al crear usuarios**, lo más probable es que la función no esté desplegada.
> Compruébalo: `curl -X POST https://TU-PROYECTO.supabase.co/functions/v1/crear-usuario` → `404 NOT_FOUND` = no desplegada;
> `401 Sesión no válida` = desplegada. Ver paso 4 de "Puesta en marcha".
Si tras instalar la extensión siguen los errores: `Ctrl+Shift+P` → "Deno: Restart Language Server".

## Puesta en marcha

1. **Base de datos.** En Supabase → SQL Editor, ejecuta `supabase/migrations/0001_taller_schema.sql` completo.
2. **Ajustes de Auth.** Authentication → Providers → Email: activa "Confirm email"; desactiva "Allow new users to sign up" con contraseña si tu plan lo permite (el enlace mágico de clientes sigue funcionando).
   Authentication → URL Configuration: agrega `http://localhost:5173/auth/callback` y `http://localhost:5173/actualizar-clave` a "Redirect URLs".
3. **Primer administrador.** Crea el usuario en Authentication → Users y ejecuta `supabase/seed/primer_admin.sql` con su correo.
4. **Edge Function de usuarios (CU-08).** Con la CLI de Supabase (vía `npx`, sin instalar):
   ```bash
   npx supabase@latest login
   npx supabase@latest link --project-ref TU_PROJECT_REF
   npx supabase@latest functions deploy crear-usuario
   ```
   Sin este paso, crear usuarios falla con error de Edge Function (la función responde 404).
   Usa las variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` que Supabase ya inyecta.
5. **Variables de entorno.**
   ```bash
   cp .env.example .env.local   # completa URL y anon key
   ```
6. **Ejecutar.**
   ```bash
   npm install
   npm run dev
   ```
   Abre http://localhost:5173 e ingresa en `/login` con el administrador.

## Estado por módulo

| Módulo | Estado |
| --- | --- |
| 1 · Estructura | Listo |
| 2 · Configuración de Supabase | Listo |
| 3 · Autenticación (personal, enlace mágico, recuperación) | Listo |
| 4 · Protección por roles | Listo |
| 5 · Layouts | Listo |
| 6 · Dashboard Administrador: panel, órdenes, presupuestos (CU-09), caja y cobro (CU-11), inventario y compras (CU-10), reportes (CU-12), usuarios (CU-08), catálogos, auditoría | Listo |
| 7 · Dashboard Recepcionista: panel, registro de cliente y vehículo (CU-01), orden de trabajo con fotos (CU-02), clientes, vehículos, fichas, por notificar y aviso al cliente (CU-03), buscador global | Listo |
| 8 · Dashboard Mecánico: panel en vivo, mis trabajos (CU-04), diagnóstico y tareas (CU-05), repuestos y solicitudes de compra (CU-06), avance, cambios de estado y término del trabajo (CU-07) | Listo |
| 9 · Portal Cliente: inicio en vivo, estado del vehículo (CU-13), presupuestos con aprobación/rechazo (CU-14), historial y detalle de servicios (CU-15), notificaciones, perfil y seguimiento público por código | Listo |
| 10–15 · Inventario, presupuesto y cobro, usuarios, reportes | Pendiente |

Las pantallas pendientes muestran "Pantalla en construcción" con el módulo que las implementa.

## Migración del portal cliente (Módulo 9)

Ejecuta `supabase/migrations/0002_portal_cliente.sql` después de `0001` (`supabase db push` o el editor SQL).
Agrega dos RPC acotadas al cliente autenticado: `actualizar_contacto_cliente` (correo y teléfono; el RUT no se modifica)
y `marcar_notificaciones_cliente`. No cambia tablas ni políticas RLS.

## Aviso por correo (CU-03 · RF08)

El correo al cliente lo envía la Edge Function `notificar-cliente` usando Resend.

```bash
npx supabase@latest functions deploy notificar-cliente
npx supabase@latest secrets set RESEND_API_KEY=re_xxx NOTIFICACIONES_FROM="Taller <avisos@tudominio.cl>" APP_URL=https://tu-app.cl
```

Sin estos secretos la función responde 503 y la pantalla ofrece registrar el aviso por llamada.
WhatsApp (RF09) abre `wa.me` con el mensaje listo; al confirmar el envío se registra la notificación y la orden pasa a **Listo para entrega**.

## Despliegue en Vercel

> Guía completa paso a paso (instalación → publicación → verificación): **[DESPLIEGUE-VERCEL.md](DESPLIEGUE-VERCEL.md)**.

Vercel publica **solo el frontend**. Las Edge Functions se despliegan en Supabase (ver arriba) y el frontend las llama igual desde Vercel.

Incluido en el repo:
- `vercel.json` · build de Vite (`dist/`) y *rewrite* a `index.html` para que recargar rutas como `/login` o `/admin/usuarios` no dé 404.
- `.vercelignore` · excluye `supabase/`, `node_modules/`, `dist/` y los `.env` del despliegue (las variables se configuran en Vercel).

Configurar a mano:
1. **Vercel → Settings → Environment Variables:** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (el `.env` no se sube). Tras cambiarlas, vuelve a desplegar.
2. **Supabase → Authentication → URL Configuration:** Site URL = `https://TU-APP.vercel.app`; en Redirect URLs agrega
   `https://TU-APP.vercel.app/auth/callback` y `https://TU-APP.vercel.app/actualizar-clave`.
3. **Secret de correo:** `npx supabase@latest secrets set APP_URL=https://TU-APP.vercel.app` para que el enlace del aviso apunte a Vercel.

## Scripts

- `npm run dev` · servidor de desarrollo
- `npm run build` · build de producción en `dist/`
- `npm run preview` · sirve el build
- `npm run lint` · ESLint
