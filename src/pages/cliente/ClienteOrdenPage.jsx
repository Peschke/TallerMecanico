import { useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import Button from '@/components/ui/Button'
import EstadoOrdenConectado from '@/components/domain/portal/EstadoOrdenConectado'
import { useCredencialesOrden } from '@/hooks/portal/useEstadoVehiculo'

// CU-13: estado de una orden concreta
export default function ClienteOrdenPage() {
  const { ordenId } = useParams()
  const { orden } = useCredencialesOrden(ordenId)
  return (
    <>
      <Breadcrumbs items={[{ label: 'Inicio', to: '/cliente' }, { label: orden?.codigo ?? 'Orden' }]} />
      <PageHeader
        titulo="Estado de la reparación"
        acciones={
          orden?.vehiculo_id && (
            <Button variant="ghost" to={`/cliente/vehiculos/${orden.vehiculo_id}/historial`}>
              Historial del vehículo
            </Button>
          )
        }
      />
      <EstadoOrdenConectado ordenId={ordenId} />
    </>
  )
}
