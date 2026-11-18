import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import FormField from '@/components/ui/FormField'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { useAuth } from '@/hooks/core/useAuth'
import { useToast } from '@/hooks/core/useToast'
import { clientePortalService } from '@/services/clientePortalService'
import { correoValido, telefonoValido } from '@/lib/validaciones'
import { formatearRut } from '@/lib/rut'
import { formatFecha } from '@/lib/format'

// Perfil del cliente: correo y teléfono editables; RUT y nombre no (los corrige el taller)
export default function ClientePerfilPage() {
  const { cliente, user, refreshCuenta } = useAuth()
  const toast = useToast()
  const q = useSupabaseQuery(() => clientePortalService.perfil(cliente?.id), [cliente?.id], { enabled: Boolean(cliente?.id) })
  const m = useSupabaseMutation((datos) => clientePortalService.actualizarContacto(datos))
  const [form, setForm] = useState({ correo: '', telefono: '' })
  const [errores, setErrores] = useState({})

  useEffect(() => {
    if (q.data) setForm({ correo: q.data.correo ?? '', telefono: q.data.telefono ?? '' })
  }, [q.data])

  if (q.loading && !q.data) return <Spinner />
  if (q.error) return <ErrorState mensaje={q.error} onRetry={q.refetch} />
  const c = q.data
  const cambiado = c && (form.correo.trim().toLowerCase() !== (c.correo ?? '') || form.telefono.trim() !== c.telefono)

  const guardar = async (e) => {
    e.preventDefault()
    const err = {}
    if (form.correo.trim() && !correoValido(form.correo)) err.correo = 'Ingresa un correo válido, por ejemplo nombre@correo.cl.'
    if (!telefonoValido(form.telefono)) err.telefono = 'Ingresa un teléfono de 8 a 12 dígitos.'
    setErrores(err)
    if (Object.keys(err).length) return
    const r = await m.mutate({ correo: form.correo.trim(), telefono: form.telefono.trim() })
    if (!r.ok) return toast.error(r.error)
    toast.success('Datos de contacto actualizados')
    q.setData((d) => ({ ...d, ...r.data }))
    refreshCuenta()
  }

  return (
    <>
      <PageHeader titulo="Mi perfil" subtitulo={`Cliente desde ${formatFecha(c?.created_at)}`} />
      <div className="grid-2">
        <Card titulo="Datos personales">
          <dl className="dl">
            <dt>Nombre</dt>
            <dd>{c?.nombre}</dd>
            <dt>RUT</dt>
            <dd>{formatearRut(c?.rut)}</dd>
            <dt>Correo</dt>
            <dd>{c?.correo ?? <span className="muted">Sin correo</span>}</dd>
            <dt>Teléfono</dt>
            <dd>{c?.telefono}</dd>
          </dl>
          <p className="muted small">Para corregir tu nombre o RUT, acércate a recepción del taller.</p>
        </Card>
        <Card titulo="Actualizar contacto">
          <form className="stack" onSubmit={guardar} noValidate>
            <FormField label="Correo" htmlFor="perfil-correo" error={errores.correo} hint={`Inicias sesión con ${user?.email ?? 'tu correo de acceso'}; este cambio actualiza el correo donde te avisamos.`}>
              <Input id="perfil-correo" type="email" autoComplete="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} invalid={Boolean(errores.correo)} />
            </FormField>
            <FormField label="Teléfono" htmlFor="perfil-tel" required error={errores.telefono}>
              <Input id="perfil-tel" type="tel" inputMode="tel" autoComplete="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} invalid={Boolean(errores.telefono)} />
            </FormField>
            <Button type="submit" variant="primary" size="lg" block loading={m.pending} disabled={!cambiado}>
              Guardar cambios
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}
