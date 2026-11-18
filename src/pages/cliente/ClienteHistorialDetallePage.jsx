import { useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import DetalleOrdenHistorica from '@/components/domain/portal/DetalleOrdenHistorica'
import { usePortalCliente } from '@/hooks/portal/usePortalCliente'
import { useHistorialCliente, useDetalleHistorico } from '@/hooks/portal/useHistorialCliente'
import { formatFecha } from '@/lib/format'
import { imprimirPDF } from '@/lib/exportar'

// Detalle de un servicio antiguo: diagnóstico completo, repuestos, tareas y observaciones finales
export default function ClienteHistorialDetallePage() {
  const { vehiculoId, codigo } = useParams()
  const p = usePortalCliente()
  const v = p.vehiculos.find((x) => x.id === vehiculoId)
  const h = useHistorialCliente({ patente: v?.patente, codigo: v?.ultimaOrden?.codigo_seguimiento })
  const servicio = h.servicios.find((s) => s.codigo === codigo)
  const det = useDetalleHistorico(codigo, { enabled: Boolean(servicio) })

  if ((p.loading && !p.vehiculos.length) || (h.loading && !servicio)) return <Spinner />
  if (p.error || h.error) return <ErrorState mensaje={p.error || h.error} onRetry={() => (p.error ? p.refetch() : h.refetch())} />
  if (!v || !servicio) return <EmptyState mensaje="No encontramos este servicio en tu historial" accion={<Button to="/cliente/historial">Volver al historial</Button>} />

  return (
    <>
      <Breadcrumbs items={[{ label: 'Historial', to: `/cliente/vehiculos/${v.id}/historial` }, { label: codigo }]} />
      <PageHeader
        titulo={`Servicio del ${formatFecha(servicio.fecha_ingreso)}`}
        subtitulo={`${v.patente} · ${v.marca} ${v.modelo}`}
        acciones={
          <Button className="no-print" onClick={() => imprimirPDF(`Servicio ${codigo}`)}>
            Imprimir
          </Button>
        }
      />
      <Card>
        <DetalleOrdenHistorica servicio={servicio} detalle={det.data} />
      </Card>
    </>
  )
}
