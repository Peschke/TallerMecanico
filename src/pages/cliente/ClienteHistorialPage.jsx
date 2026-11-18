import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import VehiculoSelector from '@/components/domain/portal/VehiculoSelector'
import HistorialTable from '@/components/domain/portal/HistorialTable'
import { usePortalCliente } from '@/hooks/portal/usePortalCliente'
import { useHistorialCliente } from '@/hooks/portal/useHistorialCliente'

// CU-15 · RF36: historial de servicios del vehículo
export default function ClienteHistorialPage() {
  const { vehiculoId } = useParams()
  const navigate = useNavigate()
  const [orden, setOrden] = useState('asc')
  const p = usePortalCliente()
  const conVisitas = p.vehiculos.filter((v) => v.ultimaOrden)
  const elegido = conVisitas.find((v) => v.id === vehiculoId) ?? conVisitas[0]
  const ref = elegido?.ultimaOrden
  const h = useHistorialCliente({ patente: elegido?.patente, codigo: ref?.codigo_seguimiento, orden })

  if (p.loading && !p.vehiculos.length) return <Spinner />
  if (p.error) return <ErrorState mensaje={p.error} onRetry={p.refetch} />
  if (!elegido) return <EmptyState mensaje="Aún no tienes vehículos con servicios en el taller" accion={<Button to="/cliente">Ir al inicio</Button>} />

  return (
    <>
      <PageHeader
        titulo="Historial de servicios"
        subtitulo={`${elegido.patente} · ${elegido.marca} ${elegido.modelo}`}
        acciones={
          <Button variant="ghost" onClick={() => setOrden((o) => (o === 'asc' ? 'desc' : 'asc'))}>
            {orden === 'asc' ? 'Más antiguos primero' : 'Más recientes primero'}
          </Button>
        }
      />
      <VehiculoSelector vehiculos={conVisitas} value={elegido.id} onChange={(id) => navigate(`/cliente/vehiculos/${id}/historial`, { replace: true })} />
      <Card padding={false}>
        <HistorialTable
          servicios={h.servicios}
          loading={h.loading}
          error={h.error}
          onRetry={h.refetch}
          onAbrir={(s) => navigate(`/cliente/vehiculos/${elegido.id}/historial/${encodeURIComponent(s.codigo)}`)}
        />
      </Card>
      {elegido.ordenActual && (
        <p className="muted small section-sm">
          La reparación en curso aparecerá en el historial cuando se entregue el vehículo.{' '}
          <Button size="sm" variant="ghost" to={`/cliente/ordenes/${elegido.ordenActual.id}`}>
            Ver estado actual
          </Button>
        </p>
      )}
    </>
  )
}
