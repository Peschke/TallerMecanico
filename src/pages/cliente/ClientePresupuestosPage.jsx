import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Spinner from '@/components/ui/Spinner'
import { usePresupuestosCliente } from '@/hooks/portal/usePresupuestoCliente'
import { formatCLP, formatFecha } from '@/lib/format'

const TONO = { publicado: 'warning', aprobado: 'success', rechazado: 'danger' }
const TEXTO = { publicado: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }

function Fila({ p }) {
  const o = p.ordenes_trabajo ?? {}
  const v = o.vehiculos ?? {}
  return (
    <li className="portal-orden">
      <div className="portal-orden__link">
        <div className="portal-orden__top">
          <strong className="patente">{v.patente}</strong>
          <Badge tono={TONO[p.estado]}>{TEXTO[p.estado] ?? p.estado}</Badge>
        </div>
        <span>
          {v.marca} {v.modelo} · <strong>{formatCLP(p.total)}</strong>
        </span>
        <span className="muted small">
          Orden {o.codigo} · {p.estado === 'publicado' ? `enviado ${formatFecha(p.publicado_en)}` : `respondido ${formatFecha(p.respondido_en)}`}
          {p.version > 1 ? ` · versión ${p.version}` : ''}
        </span>
      </div>
      <Button variant={p.estado === 'publicado' ? 'primary' : 'secondary'} to={`/cliente/ordenes/${o.id}/presupuesto`}>
        {p.estado === 'publicado' ? 'Revisar y responder' : 'Ver detalle'}
      </Button>
    </li>
  )
}

// CU-14: presupuestos del cliente
export default function ClientePresupuestosPage() {
  const { pendientes, respondidos, loading, error, refetch, data } = usePresupuestosCliente()
  if (loading && !data?.length) return <Spinner />
  if (error) return <ErrorState mensaje={error} onRetry={refetch} />
  return (
    <>
      <PageHeader titulo="Presupuestos" subtitulo="Revisa, aprueba o rechaza los presupuestos de tus vehículos." />
      <Card titulo={`Pendientes de respuesta (${pendientes.length})`} className={['section', pendientes.length > 0 && 'card--accent'].filter(Boolean).join(' ')}>
        {!pendientes.length ? (
          <EmptyState mensaje="No tienes presupuestos por responder" compacto />
        ) : (
          <ul className="portal-lista">
            {pendientes.map((p) => (
              <Fila key={p.id} p={p} />
            ))}
          </ul>
        )}
      </Card>
      <Card titulo="Respondidos">
        {!respondidos.length ? (
          <EmptyState mensaje="Aún no has respondido presupuestos" compacto />
        ) : (
          <ul className="portal-lista">
            {respondidos.map((p) => (
              <Fila key={p.id} p={p} />
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
