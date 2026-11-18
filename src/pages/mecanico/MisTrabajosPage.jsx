import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import Pagination from '@/components/ui/Pagination'
import FormField from '@/components/ui/FormField'
import Select from '@/components/ui/Select'
import SearchInput from '@/components/ui/SearchInput'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import OrdenCard from '@/components/domain/ordenes/OrdenCard'
import { useTrabajosMecanico } from '@/hooks/taller/useTrabajosMecanico'
import { useIsMobile } from '@/hooks/core/useMediaQuery'
import { ESTADOS_ACTIVOS_MECANICO, ESTADOS_TERMINADOS_MECANICO } from '@/services/mecanicoService'
import { etiquetaEstado } from '@/lib/constants/estados'
import { formatFecha } from '@/lib/format'

const PAGE = 20

const FILTROS_ESTADO = [
  { value: 'activos', label: 'Trabajos en curso' },
  { value: 'terminados', label: 'Terminados y entregados' },
  { value: 'todos', label: 'Todos' },
  ...[...ESTADOS_ACTIVOS_MECANICO, ...ESTADOS_TERMINADOS_MECANICO, 'cancelada'].map((e) => ({ value: e, label: etiquetaEstado(e) })),
]

const estadosDe = (f) => {
  if (f === 'activos') return ESTADOS_ACTIVOS_MECANICO
  if (f === 'terminados') return ESTADOS_TERMINADOS_MECANICO
  if (f === 'todos') return undefined
  return [f]
}

// CU-04 · RF10: mis trabajos filtrados por estado, patente y cliente
export default function MisTrabajosPage() {
  const navigate = useNavigate()
  const movil = useIsMobile()
  const [estado, setEstado] = useState('activos')
  const [patente, setPatente] = useState('')
  const [cliente, setCliente] = useState('')
  const [page, setPage] = useState(0)
  const { trabajos, total, loading, error, refetch, realtimeStatus } = useTrabajosMecanico({ estados: estadosDe(estado), patente, cliente, page, pageSize: PAGE })

  const reset = (fn) => (v) => {
    fn(v)
    setPage(0)
  }
  const filtrado = patente || cliente

  return (
    <>
      <PageHeader titulo="Mis trabajos" subtitulo={total != null ? `${total} orden(es)` : undefined}>
        {realtimeStatus === 'SUBSCRIBED' && <Badge tono="success">En vivo</Badge>}
      </PageHeader>
      <Card className="filters">
        <div className="filters__grid">
          <FormField label="Estado" htmlFor="f-estado">
            <Select id="f-estado" value={estado} options={FILTROS_ESTADO} onChange={(e) => reset(setEstado)(e.target.value)} />
          </FormField>
          <FormField label="Patente" htmlFor="f-patente">
            <SearchInput id="f-patente" label="Filtrar por patente" placeholder="ABCD12" onSearch={reset(setPatente)} autoCapitalize="characters" />
          </FormField>
          <FormField label="Cliente" htmlFor="f-cliente">
            <SearchInput id="f-cliente" label="Filtrar por cliente" placeholder="Nombre del cliente" onSearch={reset(setCliente)} />
          </FormField>
        </div>
      </Card>

      {movil ? (
        <div className="stack-sm">
          {error && <ErrorState mensaje={error} onRetry={refetch} />}
          {loading && !trabajos.length && <Spinner />}
          {!loading && !error && !trabajos.length && (
            <EmptyState mensaje={filtrado ? 'Sin trabajos que coincidan con el filtro' : 'No tienes trabajos en este estado'} />
          )}
          {trabajos.map((o) => (
            <OrdenCard key={o.id} orden={o} to={`/taller/ordenes/${o.id}`} />
          ))}
          <Pagination page={page} pageSize={PAGE} total={total} onChange={setPage} />
        </div>
      ) : (
        <Card padding={false}>
          <DataTable
            loading={loading}
            error={error}
            onRetry={refetch}
            rows={trabajos}
            emptyMessage={filtrado ? 'Sin trabajos que coincidan con el filtro' : 'No tienes trabajos en este estado'}
            onRowClick={(o) => navigate(`/taller/ordenes/${o.id}`)}
            columns={[
              { key: 'codigo', header: 'Código OT', render: (o) => <code className="code">{o.codigo}</code> },
              {
                key: 'vehiculo',
                header: 'Vehículo',
                render: (o) => (
                  <div className="cell-stack">
                    <strong className="patente">{o.patente}</strong>
                    <span className="muted small">
                      {o.marca} {o.modelo} {o.anio ?? ''}
                    </span>
                  </div>
                ),
              },
              { key: 'cliente', header: 'Cliente' },
              { key: 'estado', header: 'Estado', render: (o) => <EstadoBadge estado={o.estado} texto={o.estado_texto} /> },
              { key: 'avance', header: 'Avance', render: (o) => <ProgressBar value={o.avance_pct} label={`Avance ${o.codigo}`} /> },
              { key: 'fecha', header: 'Fecha ingreso', render: (o) => formatFecha(o.fecha_ingreso) },
            ]}
          />
          <Pagination page={page} pageSize={PAGE} total={total} onChange={setPage} />
        </Card>
      )}
    </>
  )
}
