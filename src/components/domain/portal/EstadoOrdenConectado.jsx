import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import EstadoOrdenCliente from './EstadoOrdenCliente'
import { useCredencialesOrden, useEstadoVehiculo } from '@/hooks/portal/useEstadoVehiculo'

// Estado en vivo de una orden del cliente autenticado (consultar_estado_orden + observaciones + historial)
export default function EstadoOrdenConectado({ ordenId }) {
  const cred = useCredencialesOrden(ordenId)
  const e = useEstadoVehiculo({ patente: cred.patente, codigo: cred.codigo, ordenId: cred.orden ? ordenId : null })

  if (cred.loading || (e.loading && !e.estado)) return <Spinner />
  if (cred.error || e.error) return <ErrorState mensaje={cred.error || e.error} onRetry={() => (cred.error ? cred.refetch() : e.refetch())} />
  if (cred.noEncontrada || !e.estado) return <EmptyState mensaje="No encontramos esta orden en tu cuenta" accion={<Button to="/cliente">Ir al inicio</Button>} />

  return (
    <EstadoOrdenCliente
      estado={e.estado}
      orden={e.orden ?? cred.orden}
      historial={e.historialEstados}
      enVivo={e.realtimeStatus === 'SUBSCRIBED'}
      presupuestoTo={`/cliente/ordenes/${ordenId}/presupuesto`}
    />
  )
}
