import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Spinner from '@/components/ui/Spinner'
import OrdenCard from '@/components/domain/ordenes/OrdenCard'
import { useOrdenesDisponibles } from '@/hooks/taller/useTrabajosMecanico'

// Vehículos ingresados que aún esperan mecánico (la asignación la hace recepción o administración)
export default function OrdenesDisponiblesPage() {
  const { ordenes, loading, error, refetch, realtimeStatus } = useOrdenesDisponibles()
  return (
    <>
      <PageHeader titulo="Por asignar" subtitulo="Vehículos en el taller que aún no tienen mecánico. Pide a recepción que te los asigne.">
        {realtimeStatus === 'SUBSCRIBED' && <Badge tono="success">En vivo</Badge>}
      </PageHeader>
      {error ? (
        <ErrorState mensaje={error} onRetry={refetch} />
      ) : loading && !ordenes.length ? (
        <Spinner />
      ) : !ordenes.length ? (
        <EmptyState mensaje="No hay vehículos esperando asignación" />
      ) : (
        <Card>
          <div className="orden-grid">
            {ordenes.map((o) => (
              <OrdenCard key={o.id} orden={o} to={`/taller/ordenes/${o.id}`} mostrarAvance={false} />
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
