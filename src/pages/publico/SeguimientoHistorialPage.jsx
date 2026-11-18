import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import HistorialTable from '@/components/domain/portal/HistorialTable'
import DetalleOrdenHistorica from '@/components/domain/portal/DetalleOrdenHistorica'
import { usePortal } from '@/hooks/portal/usePortal'
import { useHistorialCliente } from '@/hooks/portal/useHistorialCliente'
import { formatFecha } from '@/lib/format'
import { PATHS } from '@/routes/paths'

// CU-15 por código de seguimiento (consultar_historial_vehiculo)
export default function SeguimientoHistorialPage() {
  const portal = usePortal()
  const [orden, setOrden] = useState('asc')
  const [abierto, setAbierto] = useState(null)
  const h = useHistorialCliente({ patente: portal.patente, codigo: portal.codigo, orden })

  if (!portal.tieneCredenciales) return <Navigate to={PATHS.seguimiento} replace />

  return (
    <div className="portal-public stack">
      <div className="row-wrap row-between">
        <div>
          <h1>Historial del vehículo</h1>
          <p className="muted patente">{portal.patente}</p>
        </div>
        <div className="row-wrap">
          <Button variant="ghost" onClick={() => setOrden((o) => (o === 'asc' ? 'desc' : 'asc'))}>
            {orden === 'asc' ? 'Más antiguos primero' : 'Más recientes primero'}
          </Button>
          <Button to={PATHS.seguimientoEstado}>Estado actual</Button>
        </div>
      </div>
      <Card padding={false}>
        <HistorialTable servicios={h.servicios} loading={h.loading} error={h.error} onRetry={h.refetch} onAbrir={setAbierto} />
      </Card>
      <Modal open={Boolean(abierto)} titulo={abierto ? `Servicio del ${formatFecha(abierto.fecha_ingreso)}` : ''} onClose={() => setAbierto(null)} size="lg" sheet>
        {abierto && <DetalleOrdenHistorica servicio={abierto} />}
      </Modal>
    </div>
  )
}
