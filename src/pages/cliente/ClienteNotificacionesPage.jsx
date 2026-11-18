import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import NotificacionesCliente from '@/components/domain/portal/NotificacionesCliente'
import { useNotificacionesCliente } from '@/hooks/portal/useNotificacionesCliente'
import { useToast } from '@/hooks/core/useToast'

// Avisos del cliente: presupuestos, vehículo listo y otros (notificaciones + cambios de estado)
export default function ClienteNotificacionesPage() {
  const toast = useToast()
  const { avisos, noLeidas, marcarLeidas, loading, error, refetch } = useNotificacionesCliente()

  const marcarTodas = async () => {
    const r = await marcarLeidas()
    if (!r.ok) toast.error('No pudimos marcar los avisos. Intenta nuevamente.')
  }

  if (loading && !avisos.length) return <Spinner />
  if (error) return <ErrorState mensaje={error} onRetry={refetch} />

  return (
    <>
      <PageHeader
        titulo="Notificaciones"
        subtitulo={noLeidas ? `${noLeidas} sin leer` : 'Estás al día'}
        acciones={
          noLeidas > 0 && (
            <Button onClick={marcarTodas} variant="secondary">
              Marcar todas como leídas
            </Button>
          )
        }
      />
      <Card padding={false}>
        <NotificacionesCliente avisos={avisos} onAbrir={(a) => marcarLeidas([a])} vacio="Aún no tienes avisos del taller" />
      </Card>
    </>
  )
}
