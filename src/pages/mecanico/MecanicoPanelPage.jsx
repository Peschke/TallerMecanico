import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Skeleton from '@/components/ui/Skeleton'
import OrdenCard from '@/components/domain/ordenes/OrdenCard'
import { useResumenMecanico } from '@/hooks/taller/useTrabajosMecanico'
import { useAuth } from '@/hooks/core/useAuth'

function Kpi({ titulo, valor, href, tono }) {
  return (
    <a href={href} className={['card kpi kpi--link', tono && `kpi--${tono}`].filter(Boolean).join(' ')}>
      <div className="kpi__label">{titulo}</div>
      <div className="kpi__value">{valor}</div>
    </a>
  )
}

function Seccion({ id, titulo, ordenes, vacio, destacado }) {
  return (
    <Card id={id} titulo={`${titulo} (${ordenes.length})`} className={['section', destacado && ordenes.length > 0 && 'card--accent'].filter(Boolean).join(' ')}>
      {!ordenes.length ? (
        <EmptyState mensaje={vacio} compacto />
      ) : (
        <div className="orden-grid">
          {ordenes.map((o) => (
            <OrdenCard key={o.id} orden={o} to={`/taller/ordenes/${o.id}`} />
          ))}
        </div>
      )}
    </Card>
  )
}

// CU-04 · RF10, RF11: panel del mecánico en tiempo real
export default function MecanicoPanelPage() {
  const { perfil } = useAuth()
  const r = useResumenMecanico()
  const cargando = r.loading && !r.asignados.length && !r.terminadas.length
  const nombre = perfil?.nombre_completo?.split(' ')[0]

  return (
    <>
      <PageHeader
        titulo={nombre ? `Hola, ${nombre}` : 'Mi panel'}
        subtitulo={r.realtimeStatus === 'SUBSCRIBED' ? 'Panel en vivo' : 'Conectando…'}
        acciones={<Button to="/taller/trabajos">Ver todos mis trabajos</Button>}
      >
        {r.realtimeStatus === 'SUBSCRIBED' && <Badge tono="success">En vivo</Badge>}
      </PageHeader>

      {r.error ? (
        <ErrorState mensaje={r.error} onRetry={r.refetch} />
      ) : (
        <>
          <div className="grid-kpi section">
            <Kpi titulo="Trabajos asignados" valor={cargando ? '…' : r.asignados.length} href="#asignados" />
            <Kpi titulo="Por diagnosticar" valor={cargando ? '…' : r.porDiagnosticar.length} href="#por-diagnosticar" tono={r.porDiagnosticar.length ? 'warning' : undefined} />
            <Kpi titulo="En reparación" valor={cargando ? '…' : r.enReparacion.length + r.paraIniciar.length} href="#en-reparacion" tono={r.paraIniciar.length ? 'accent' : undefined} />
            <Kpi titulo="Esperando repuesto" valor={cargando ? '…' : r.esperandoRepuesto.length} href="#esperando-repuesto" />
            <Kpi titulo="Terminadas (30 días)" valor={cargando ? '…' : r.terminadas.length} href="#terminadas" />
          </div>

          {cargando ? (
            <Card>
              <div className="stack-sm">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} height={72} />
                ))}
              </div>
            </Card>
          ) : (
            <>
              <Seccion id="por-diagnosticar" titulo="Por diagnosticar" ordenes={r.porDiagnosticar} vacio="No tienes vehículos esperando diagnóstico" destacado />
              <Seccion id="en-reparacion" titulo="Listas para reparar" ordenes={r.paraIniciar} vacio="Ningún presupuesto aprobado pendiente de iniciar" destacado />
              <Seccion titulo="En reparación y pruebas de ruta" ordenes={r.enReparacion} vacio="Sin vehículos en reparación" />
              <Seccion id="esperando-repuesto" titulo="Esperando repuesto" ordenes={r.esperandoRepuesto} vacio="Ninguna orden detenida por repuestos" />
              <Seccion id="asignados" titulo="Esperando presupuesto o respuesta del cliente" ordenes={r.enEspera} vacio="Nada en espera" />
              <Seccion id="terminadas" titulo="Terminadas en los últimos 30 días" ordenes={r.terminadas} vacio="Aún no terminas trabajos este mes" />
            </>
          )}
        </>
      )}
    </>
  )
}
