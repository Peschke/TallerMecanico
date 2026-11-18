import { useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import EstadoBadge from '@/components/domain/portal/EstadoBadge'
import PresupuestoCard from '@/components/domain/portal/PresupuestoCard'
import { useCredencialesOrden } from '@/hooks/portal/useEstadoVehiculo'
import { usePresupuestoCliente } from '@/hooks/portal/usePresupuestoCliente'

// CU-14 · RF33, RF34, RF35: revisar y aprobar/rechazar el presupuesto vigente
export default function ClientePresupuestoPage() {
  const { ordenId } = useParams()
  const cred = useCredencialesOrden(ordenId)
  const pres = usePresupuestoCliente({ patente: cred.patente, codigo: cred.codigo, ordenId: cred.orden ? ordenId : null })

  if (cred.loading || (pres.loading && !pres.estado)) return <Spinner />
  if (cred.error || pres.error) return <ErrorState mensaje={cred.error || pres.error} onRetry={() => (cred.error ? cred.refetch() : pres.refetch())} />
  if (cred.noEncontrada || !pres.estado) return <EmptyState mensaje="No encontramos esta orden en tu cuenta" accion={<Button to="/cliente">Ir al inicio</Button>} />

  const v = pres.estado.vehiculo ?? {}
  return (
    <>
      <Breadcrumbs items={[{ label: 'Presupuestos', to: '/cliente/presupuestos' }, { label: pres.estado.codigo }]} />
      <PageHeader
        titulo={`Presupuesto · ${v.patente}`}
        subtitulo={`${v.marca} ${v.modelo} · Orden ${pres.estado.codigo}`}
        acciones={<Button variant="ghost" to={`/cliente/ordenes/${ordenId}`}>Ver estado</Button>}
      >
        <EstadoBadge estado={pres.estado.estado} texto={pres.estado.estado_texto} />
      </PageHeader>
      {pres.presupuesto ? (
        <PresupuestoCard pres={pres} />
      ) : (
        <EmptyState
          mensaje="El presupuesto aún no está disponible"
          detalle="Te avisaremos apenas el taller lo prepare después del diagnóstico."
          accion={<Button to={`/cliente/ordenes/${ordenId}`}>Ver estado de la reparación</Button>}
        />
      )}
    </>
  )
}
