# Guía de despliegue en Vercel · taller-frontend

Guía paso a paso para desplegar este proyecto en Vercel a partir del `.zip`, desde la instalación hasta tener la app publicada.
Tiempo estimado: 20–30 minutos.

## 0. Qué se despliega y dónde

| Parte | Dónde vive | Quién la despliega |
| --- | --- | --- |
| Frontend (React + Vite, carpeta `src/`) | **Vercel** | Tú, con esta guía |
| Base de datos, Auth y Edge Functions (carpeta `supabase/`) | **Supabase** (proyecto `lxlqnbpdoxtpqyxnjchc`) | Quien administra Supabase (ya están desplegadas) |

Vercel **no** ejecuta nada de la carpeta `supabase/`. El archivo `.vercelignore` excluye `supabase/`, `node_modules/`, `dist/` y los `.env`.
El frontend publicado se conecta a Supabase con dos variables de entorno que **se configuran en el panel de Vercel** (paso 5). Tu `.env.local` solo sirve en tu computador y nunca se sube.

---

## 1. Instalar lo necesario

| Programa | Versión | Cómo instalar (Windows) | Comprobar |
| --- | --- | --- | --- |
| Node.js | 18 o superior (recomendado 22 LTS o 24) | https://nodejs.org o `winget install OpenJS.NodeJS.LTS` | `node --version` |
| npm | viene con Node | — | `npm --version` |
| Cuenta de Vercel con acceso al proyecto | — | https://vercel.com | — |

> Después de instalar Node, **cierra y vuelve a abrir la terminal** para que reconozca los comandos.

No necesitas instalar Deno ni la CLI de Supabase para desplegar en Vercel. Solo hacen falta para trabajar en las Edge Functions (ver `README.md`).

---

## 2. Preparar el proyecto

1. Descomprime el `.zip` en una carpeta **sin acentos**, por ejemplo `C:\proyectos\taller-frontend`.
2. Abre una terminal **dentro de esa carpeta**, donde está `package.json`.
3. Si el zip trae las carpetas `node_modules` o `dist`, bórralas. Se generan de nuevo.
4. Instala las dependencias:
   ```bash
   npm install
   ```
   Al final aparece un aviso sobre "Edge Functions"; para desplegar en Vercel puedes ignorarlo.
   Si aparece un aviso `allow-scripts ... esbuild`, ejecuta:
   ```bash
   npm approve-scripts esbuild
   ```

### Variables de entorno
Crea un archivo `.env.local` copiando `.env.example` y completa estos dos valores. Te los entrega el dueño del proyecto Supabase, o puedes verlos en Supabase → Project Settings → API:

```
VITE_SUPABASE_URL=https://lxlqnbpdoxtpqyxnjchc.supabase.co
VITE_SUPABASE_ANON_KEY=<la clave "anon public">
```

> Usa solo la clave **anon public**. **Nunca** la `service_role`: esa es secreta y no va en el frontend.

---

## 3. Probar en tu computador (antes de publicar)

```bash
npm run build
```
Debe terminar con `✓ built in ...`. El aviso "Some chunks are larger than 500 kB" es normal.

Opcional, para ver la app:
```bash
npm run dev
```
Abre http://localhost:5173 e inicia sesión en `/login`.

---

## 4. Desplegar en Vercel

Elige **una** de las dos opciones.

### Opción A · Con la CLI de Vercel (recomendada si trabajas desde el zip)

1. Inicia sesión (se abre el navegador):
   ```bash
   npx vercel@latest login
   ```
2. Vincula la carpeta con el proyecto que **ya creaste** en Vercel:
   ```bash
   npx vercel@latest link
   ```
   Responde: *Set up?* → `Y`; elige tu cuenta/equipo; *Link to existing project?* → `Y`; escribe el nombre del proyecto.
3. Configura las variables de entorno en Vercel (una vez). Puedes hacerlo en la web (paso 5) o así:
   ```bash
   npx vercel@latest env add VITE_SUPABASE_URL production
   ```
   ```bash
   npx vercel@latest env add VITE_SUPABASE_ANON_KEY production
   ```
   Cada comando te pide pegar el valor. Repite con `preview` si usas despliegues de prueba.
4. Publica en producción:
   ```bash
   npx vercel@latest --prod
   ```
   Al terminar muestra la URL, por ejemplo `https://tu-app.vercel.app`.

### Opción B · Con GitHub (si el proyecto de Vercel está conectado a un repositorio)

1. Sube el contenido del zip al repositorio conectado (sin `node_modules`, `dist` ni `.env`; el `.gitignore` ya los excluye).
2. Haz `git push` a la rama principal: Vercel construye y publica solo.
3. Configura las variables de entorno como en el paso 5 y vuelve a desplegar desde Vercel → Deployments → ⋯ → **Redeploy**.

---

## 5. Configuración en el panel de Vercel

En **Vercel → tu proyecto → Settings**:

- **General → Build & Development Settings.** El archivo `vercel.json` ya define todo; comprueba que quede así:
  - Framework Preset: `Vite`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install` (por defecto)
  - Root Directory: vacío (la raíz del proyecto)
- **Environment Variables**: agrega para *Production* (y *Preview* si lo usas):
  | Nombre | Valor |
  | --- | --- |
  | `VITE_SUPABASE_URL` | `https://lxlqnbpdoxtpqyxnjchc.supabase.co` |
  | `VITE_SUPABASE_ANON_KEY` | la clave anon public |

> Las variables `VITE_*` se incrustan **al construir**. Si las agregas o cambias después de un despliegue, haz **Redeploy** para que tomen efecto.

---

## 6. Avisar al administrador de Supabase (obligatorio)

Cuando tengas la URL final de Vercel, envíasela a quien administra Supabase para que configure lo siguiente (o hazlo tú si tienes acceso):

1. **Supabase → Authentication → URL Configuration**
   - Site URL: `https://TU-APP.vercel.app`
   - Redirect URLs, agregar:
     - `https://TU-APP.vercel.app/auth/callback`
     - `https://TU-APP.vercel.app/actualizar-clave`
2. **Enlace de los correos al cliente:**
   ```bash
   npx supabase@latest secrets set APP_URL=https://TU-APP.vercel.app
   ```

Sin el punto 1, el enlace mágico de clientes y la recuperación de contraseña redirigen a `localhost` y fallan.

---

## 7. Comprobar que todo funciona

- [ ] Abre `https://TU-APP.vercel.app` y carga la página de inicio.
- [ ] Entra a `https://TU-APP.vercel.app/login` y **recarga la página (F5)**: no debe dar 404.
- [ ] Inicia sesión con un usuario administrador.
- [ ] Admin → Usuarios → crear un usuario de prueba. Si falla con "error de Edge Function", la función `crear-usuario` no está desplegada en Supabase y debe hacerlo el administrador de Supabase (ver `README.md`, paso 4).

---

## 8. Problemas comunes

| Síntoma | Causa | Solución |
| --- | --- | --- |
| Página en blanco; en la consola del navegador (F12) aparece `Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY` | Faltan las variables `VITE_*` en Vercel | Agrégalas (paso 5) y haz **Redeploy** |
| 404 al recargar una ruta como `/login` | Falta `vercel.json` | Verifica que `vercel.json` esté en la raíz y vuelve a desplegar |
| El build en Vercel falla en `npm install` | Se subió `node_modules` o un `package-lock.json` corrupto | Borra `node_modules`, ejecuta `npm install` en local y vuelve a desplegar |
| "Error de Edge Function" al crear usuarios | Función no desplegada en Supabase | La despliega el administrador de Supabase: `npx supabase@latest functions deploy crear-usuario` |
| El enlace de recuperación o el enlace mágico lleva a `localhost` | Faltan las Redirect URLs | Paso 6 |
| `npm audit` muestra vulnerabilidades | Dependencias de desarrollo (vite/esbuild) y react-router 6 | No bloquean el despliegue. **No** ejecutes `npm audit fix --force`: rompe la app |
