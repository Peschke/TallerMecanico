import { useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import VehiculoSelector from '@/components/domain/portal/VehiculoSelector'
import EstadoOrdenConectado from '@/components/domain/portal/EstadoOrdenConectado'
import { usePortalCliente } from '@/hooks/portal/usePortalCliente'

// CU-13: estado del vehículo con selector cuando el cliente tiene varios
export default function ClienteEstadoPage() {
  const [params, setParams] = useSearchParams()
  const p = usePortalCliente()
  const conVisitas = p.vehiculos.filter((v) => v.ultimaOrden)

  if (p.loading && !p.vehiculos.length) return <Spinner />
  if (p.error) return <ErrorState mensaje={p.error} onRetry={p.refetch} />
  if (!conVisitas.length) return <EmptyState mensaje="Aún no tienes vehículos con órdenes en el taller" accion={<Button to="/cliente">Ir al inicio</Button>} />

  const elegido = conVisitas.find((v) => v.id === params.get('vehiculo')) ?? conVisitas.find((v) => v.ordenActual) ?? conVisitas[0]
  const orden = elegido.ordenActual ?? elegido.ultimaOrden

  return (
    <>
      <PageHeader
        titulo="Estado del vehículo"
        subtitulo={elegido.ordenActual ? 'Reparación en curso' : `Última visita: ${orden.codigo}`}
        acciones={
          <Button variant="ghost" to={`/cliente/vehiculos/${elegido.id}/historial`}>
            Ver historial
          </Button>
        }
      />
      <VehiculoSelector vehiculos={conVisitas} value={elegido.id} onChange={(id) => setParams({ vehiculo: id }, { replace: true })} />
      <EstadoOrdenConectado key={orden.id} ordenId={orden.id} />
    </>
  )
}
