import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import DataTable from '@/components/ui/DataTable'
import FormField from '@/components/ui/FormField'
import Select from '@/components/ui/Select'
import { useMisSolicitudes } from '@/hooks/taller/useSolicitudesCompra'
import { ESTADOS_SOLICITUD } from '@/lib/constants/enums'
import { formatFechaHora } from '@/lib/format'

const TONO = { pendiente: 'warning', aprobada: 'info', comprada: 'info', recibida: 'success', cancelada: 'neutral' }

// RF17: seguimiento de mis solicitudes de compra de repuestos
export default function MisSolicitudesPage() {
  const [estado, setEstado] = useState('')
  const { solicitudes, loading, error, refetch } = useMisSolicitudes({ estado: estado || undefined })

  return (
    <>
      <PageHeader titulo="Mis solicitudes de repuestos" subtitulo="Repuestos faltantes que pediste al administrador." />
      <Card className="filters">
        <FormField label="Estado" htmlFor="sol-estado">
          <Select
            id="sol-estado"
            value={estado}
            placeholder="Todas"
            options={Object.entries(ESTADOS_SOLICITUD).map(([value, label]) => ({ value, label }))}
            onChange={(e) => setEstado(e.target.value)}
          />
        </FormField>
      </Card>
      <Card padding={false}>
        <DataTable
          loading={loading}
          error={error}
          onRetry={refetch}
          rows={solicitudes}
          emptyMessage="No tienes solicitudes"
          columns={[
            { key: 'fecha', header: 'Fecha', render: (s) => formatFechaHora(s.created_at) },
            {
              key: 'rep',
              header: 'Repuesto',
              render: (s) => (
                <div className="cell-stack">
                  <strong>{s.repuestos?.nombre ?? s.descripcion_repuesto}</strong>
                  {s.repuestos && <span className="muted small">{s.repuestos.codigo}</span>}
                  {s.repuestos && s.descripcion_repuesto && <span className="muted small">{s.descripcion_repuesto}</span>}
                </div>
              ),
            },
            { key: 'cantidad', header: 'Cant.', align: 'right' },
            {
              key: 'orden',
              header: 'Orden',
              render: (s) =>
                s.ordenes_trabajo ? (
                  <Link to={`/taller/ordenes/${s.ordenes_trabajo.id}/repuestos`} className="code">
                    {s.ordenes_trabajo.codigo}
                  </Link>
                ) : (
                  '—'
                ),
            },
            { key: 'estado', header: 'Estado', render: (s) => <Badge tono={TONO[s.estado]}>{ESTADOS_SOLICITUD[s.estado]}</Badge> },
          ]}
        />
      </Card>
    </>
  )
}
