// Aviso que se muestra al terminar `npm install`.
// Las Edge Functions de supabase/functions corren en Deno (no en Node), así que
// npm no instala lo que necesitan. Ver README → "Requisitos para las Edge Functions".
// Este script solo informa: nunca hace fallar la instalación.
// En Vercel u otro CI no hace falta (allí solo se construye el frontend).
import { execSync } from 'node:child_process'
import { env, exit } from 'node:process'

if (env.VERCEL || env.CI) exit(0)

const tiene = (cmd) => {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

try {
  const deno = tiene('deno')
  const supabase = tiene('supabase')

  const lineas = [
    '',
    '──────────────────────────────────────────────────────────────',
    ' Edge Functions (supabase/functions) — requisitos extra',
    '──────────────────────────────────────────────────────────────',
    ` ${deno ? '✔' : '✘'} Deno ${deno ? 'instalado' : 'NO instalado  →  winget install DenoLand.Deno  (o https://deno.com)'}`,
    ` ${supabase ? '✔' : '•'} Supabase CLI ${supabase ? 'instalada' : 'no instalada (opcional): usa  npx supabase@latest ...  para desplegar'}`,
    ' • VS Code: instala la extensión recomendada "Deno" (denoland.vscode-deno)',
    '   para que no marque errores en supabase/functions/*.ts.',
    ' Detalle en README.md → "Requisitos para las Edge Functions".',
    '──────────────────────────────────────────────────────────────',
    '',
  ]
  console.log(lineas.join('\n'))
} catch {
  /* el aviso nunca debe romper npm install */
}
