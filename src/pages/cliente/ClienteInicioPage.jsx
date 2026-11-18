import { Link } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Skeleton from '@/components/ui/Skeleton'
import ProgressBar from '@/components/ui/ProgressBar'
import EstadoBadge from '@/components/domain/portal/EstadoBadge'
import NotificacionesCliente from '@/components/domain/portal/NotificacionesCliente'
import { usePortalCliente } from '@/hooks/portal/usePortalCliente'
import { useNotificacionesCliente } from '@/hooks/portal/useNotificacionesCliente'
import { useAuth } from '@/hooks/core/useAuth'
import { formatCLP, formatFecha } from '@/lib/format'

function Kpi({ titulo, valor, href, tono }) {
  return (
    <a href={href} className={['card kpi kpi--link', tono && `kpi--${tono}`].filter(Boolean).join(' ')}>
      <div className="kpi__label">{titulo}</div>
      <div className="kpi__value">{valor}</div>
    </a>
  )
}

function OrdenFila({ o, accion }) {
  const v = o.vehiculos ?? {}
  return (
    <li className="portal-orden">
      <Link to={`/cliente/ordenes/${o.id}`} className="portal-orden__link">
        <div className="portal-orden__top">
          <strong className="patente">{v.patente}</strong>
          <EstadoBadge estado={o.estado} />
        </div>
        <span className="muted small">
          {v.marca} {v.modelo} · ingreso {formatFecha(o.fecha_ingreso)}
        </span>
        {o.avance_pct > 0 && <ProgressBar value={o.avance_pct} label={`Avance ${v.patente}`} />}
      </Link>
      {accion}
    </li>
  )
}

// Inicio del portal del cliente (RNF11: solo sus vehículos), en vivo
export default function ClienteInicioPage() {
  const { cliente } = useAuth()
  const p = usePortalCliente()
  const n = useNotificacionesCliente({ limite: 5 })
  const cargando = p.loading && !p.vehiculos.length

  if (p.error) return <ErrorState mensaje={p.error} onRetry={p.refetch} />

  return (
    <>
      <PageHeader titulo={`Hola, ${cliente?.nombre?.split(' ')[0] ?? ''}`} subtitulo="Sigue tus vehículos en el taller.">
        {p.realtimeStatus === 'SUBSCRIBED' && <Badge tono="success">En vivo</Badge>}
      </PageHeader>

      <div className="grid-kpi section">
        <Kpi titulo="Vehículos en el taller" valor={cargando ? '…' : p.vehiculosActivos.length} href="#en-curso" />
        <Kpi titulo="Reparaciones en curso" valor={cargando ? '…' : p.enCurso.length} href="#en-curso" />
        <Kpi titulo="Presupuestos pendientes" valor={cargando ? '…' : p.presupuestosPendientes.length} href="#presupuestos" tono={p.presupuestosPendientes.length ? 'warning' : undefined} />
        <Kpi titulo="Listos para retirar" valor={cargando ? '…' : p.listos.length} href="#listos" tono={p.listos.length ? 'accent' : undefined} />
      </div>

      {cargando ? (
        <Card>
          <div className="stack-sm">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={64} />
            ))}
          </div>
        </Card>
      ) : !p.vehiculos.length ? (
        <EmptyState mensaje="Aún no tienes vehículos registrados" detalle="Cuando dejes tu vehículo en el taller aparecerá aquí con su estado en tiempo real." />
      ) : (
        <>
          {p.presupuestosPendientes.length > 0 && (
            <Card id="presupuestos" titulo="Presupuestos por responder" className="section card--accent">
              <ul className="portal-lista">
                {p.presupuestosPendientes.map((pr) => (
                  <li key={pr.id} className="portal-orden">
                    <div className="portal-orden__link">
                      <div className="portal-orden__top">
                        <strong className="patente">{pr.ordenes_trabajo?.vehiculos?.patente}</strong>
                        <strong>{formatCLP(pr.total)}</strong>
                      </div>
                      <span className="muted small">
                        {pr.ordenes_trabajo?.vehiculos?.marca} {pr.ordenes_trabajo?.vehiculos?.modelo} · enviado {formatFecha(pr.publicado_en)}
                      </span>
                    </div>
                    <Button variant="primary" to={`/cliente/ordenes/${pr.ordenes_trabajo?.id}/presupuesto`}>
                      Revisar y responder
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {p.listos.length > 0 && (
            <Card id="listos" titulo="Listos para retirar" className="section">
              <ul className="portal-lista">
                {p.listos.map((o) => (
                  <OrdenFila key={o.id} o={o} />
                ))}
              </ul>
            </Card>
          )}

          <div className="grid-2 section">
            <Card id="en-curso" titulo="Reparaciones en curso">
              {!p.enCurso.length ? (
                <EmptyState mensaje="No tienes reparaciones en curso" compacto />
              ) : (
                <ul className="portal-lista">
                  {p.enCurso.map((o) => (
                    <OrdenFila key={o.id} o={o} />
                  ))}
                </ul>
              )}
            </Card>
            <Card titulo="Últimos avisos" acciones={<Button size="sm" variant="ghost" to="/cliente/notificaciones">Ver todos</Button>}>
              <NotificacionesCliente avisos={n.avisos} compacto vacio="Sin avisos recientes" />
            </Card>
          </div>

          <Card titulo="Mis vehículos">
            <ul className="veh-lista">
              {p.vehiculos.map((v) => (
                <li key={v.id} className="veh-lista__item">
                  <div className="veh-lista__info">
                    <strong className="patente">{v.patente}</strong>
                    <span>
                      {v.marca} {v.modelo} {v.anio ?? ''}
                    </span>
                    <span className="muted small">
                      {v.ordenActual ? <EstadoBadge estado={v.ordenActual.estado} modo="etapa" /> : v.ultimaOrden ? `Última visita ${formatFecha(v.ultimaOrden.fecha_ingreso)}` : 'Sin visitas'}
                    </span>
                  </div>
                  <div className="veh-lista__acciones">
                    {v.ultimaOrden && (
                      <Button size="sm" to={`/cliente/estado?vehiculo=${v.id}`}>
                        Estado
                      </Button>
                    )}
                    {v.ultimaOrden && (
                      <Button size="sm" variant="ghost" to={`/cliente/vehiculos/${v.id}/historial`}>
                        Historial
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </>
  )
}
