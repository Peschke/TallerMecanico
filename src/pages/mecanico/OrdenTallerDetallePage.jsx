import { useParams } from 'react-router-dom'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import ProgressBar from '@/components/ui/ProgressBar'
import EtapaStepper from '@/components/domain/ordenes/EtapaStepper'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import HistorialEstadosTimeline from '@/components/domain/ordenes/HistorialEstadosTimeline'
import AvancesList from '@/components/domain/ordenes/AvancesList'
import FotoGallery from '@/components/domain/fotos/FotoGallery'
import TareasChecklist from '@/components/domain/diagnostico/TareasChecklist'
import OrdenTallerHeader from '@/components/domain/taller/OrdenTallerHeader'
import { useOrdenTaller } from '@/hooks/taller/useOrdenTaller'
import { useDiagnosticos } from '@/hooks/taller/useDiagnosticos'
import { useOrdenRepuestos } from '@/hooks/taller/useOrdenRepuestos'
import { useAvances } from '@/hooks/taller/useAvances'
import { useHistorialVehiculoTaller } from '@/hooks/taller/useTrabajosMecanico'
import { useFotosOrden } from '@/hooks/ordenes/useFotosOrden'
import { useHistorialEstados } from '@/hooks/ordenes/useHistorialEstados'
import { useNombresPersonal } from '@/hooks/admin/useAuditoria'
import { useToast } from '@/hooks/core/useToast'
import { separarDiagnostico } from '@/services/diagnosticosService'
import { labelDe, NIVELES_COMBUSTIBLE } from '@/lib/constants/enums'
import { formatFecha, formatFechaHora, formatKm } from '@/lib/format'

// Siguiente paso sugerido según el estado de la orden
function siguientePaso(orden) {
  const id = orden.id
  switch (orden.estado) {
    case 'por_diagnosticar':
      return { texto: 'Registra el diagnóstico técnico y las tareas.', to: `/taller/ordenes/${id}/diagnostico`, label: 'Registrar diagnóstico' }
    case 'diagnosticado':
      return { texto: 'Diagnóstico enviado. El administrador está armando el presupuesto.', to: `/taller/ordenes/${id}/repuestos`, label: 'Revisar repuestos' }
    case 'esperando_aprobacion':
      return { texto: 'Presupuesto enviado al cliente. Espera su respuesta antes de reparar.' }
    case 'presupuesto_rechazado':
      return { texto: 'El cliente rechazó el presupuesto. No realices la reparación.' }
    case 'presupuesto_aprobado':
      return { texto: 'Presupuesto aprobado: puedes iniciar la reparación.', to: `/taller/ordenes/${id}/avance`, label: 'Iniciar reparación' }
    case 'esperando_repuesto':
      return { texto: 'Orden detenida hasta que llegue el repuesto solicitado.', to: `/taller/ordenes/${id}/avance`, label: 'Retomar trabajo' }
    case 'en_reparacion':
    case 'pruebas_ruta':
      return { texto: 'Registra avances y finaliza cuando el vehículo esté listo.', to: `/taller/ordenes/${id}/avance`, label: 'Registrar avance' }
    case 'trabajo_terminado':
    case 'listo_entrega':
      return { texto: 'Trabajo terminado. Recepción se encarga de avisar al cliente.' }
    default:
      return null
  }
}

// CU-04 · RF11: detalle de la orden para el mecánico
export default function OrdenTallerDetallePage() {
  const { ordenId } = useParams()
  const toast = useToast()
  const { orden, loading, error, refetch, esMia, puedeTrabajar } = useOrdenTaller(ordenId)
  const diag = useDiagnosticos(esMia ? ordenId : null)
  const reps = useOrdenRepuestos(esMia ? ordenId : null)
  const avances = useAvances(esMia ? ordenId : null)
  const fotos = useFotosOrden(ordenId)
  const historial = useHistorialEstados(ordenId, [orden?.estado])
  const previas = useHistorialVehiculoTaller(orden?.vehiculo_id, ordenId)
  const nombres = useNombresPersonal()

  if (loading && !orden) return <SplashScreen />
  if (error) return <ErrorState mensaje={error} onRetry={refetch} />
  if (!orden) return <EmptyState mensaje="Orden no encontrada o no asignada a ti" accion={<Button to="/taller/trabajos">Volver a mis trabajos</Button>} />

  const paso = esMia ? siguientePaso(orden) : null
  const v = orden.vehiculos ?? {}

  const toggleTarea = async (id, completada) => {
    const r = await diag.marcarTarea(id, completada)
    if (!r.ok) toast.error(r.error)
  }

  return (
    <>
      <OrdenTallerHeader orden={orden} esMia={esMia} badges={{ diagnostico: diag.diagnosticos.length, repuestos: reps.repuestos.length }} />

      {paso && (
        <div className="next-step section">
          <p>{paso.texto}</p>
          {paso.to && (
            <Button variant="primary" size="lg" to={paso.to}>
              {paso.label}
            </Button>
          )}
        </div>
      )}

      <Card className="section">
        <EtapaStepper estado={orden.estado} />
        <div className="section-sm">
          <ProgressBar value={orden.avance_pct} label="Avance de la reparación" />
        </div>
      </Card>

      <div className="grid-2 section">
        <Card titulo="Vehículo">
          <dl className="dl">
            <dt>Patente</dt>
            <dd className="patente">{v.patente}</dd>
            <dt>Vehículo</dt>
            <dd>
              {v.marca} {v.modelo} {v.anio}
            </dd>
            {v.color && (
              <>
                <dt>Color</dt>
                <dd>{v.color}</dd>
              </>
            )}
            {v.vin && (
              <>
                <dt>VIN</dt>
                <dd className="input--mono">{v.vin}</dd>
              </>
            )}
            <dt>Cliente</dt>
            <dd>{orden.clientes?.nombre}</dd>
          </dl>
        </Card>
        <Card titulo="Ingreso">
          <dl className="dl">
            <dt>Fecha</dt>
            <dd>{formatFechaHora(orden.fecha_ingreso)}</dd>
            <dt>Kilometraje</dt>
            <dd>{formatKm(orden.kilometraje)}</dd>
            <dt>Combustible</dt>
            <dd>{labelDe(NIVELES_COMBUSTIBLE, orden.nivel_combustible)}</dd>
            <dt>Recibido por</dt>
            <dd>{orden.recepcionista?.nombre_completo ?? '—'}</dd>
          </dl>
          <p className="lbl-sec">Motivo de ingreso</p>
          <p className="prewrap">{orden.motivo_ingreso}</p>
          {orden.observaciones_ingreso && (
            <>
              <p className="lbl-sec">Observaciones de recepción</p>
              <p className="prewrap">{orden.observaciones_ingreso}</p>
            </>
          )}
        </Card>
      </div>

      {esMia && (
        <div className="grid-2 section">
          <Card
            titulo="Diagnóstico y tareas"
            acciones={
              <Button size="sm" to={`/taller/ordenes/${orden.id}/diagnostico`}>
                {diag.diagnosticos.length ? 'Ver / agregar' : 'Registrar'}
              </Button>
            }
          >
            {!diag.diagnosticos.length ? (
              <EmptyState mensaje="Sin diagnóstico registrado" compacto />
            ) : (
              diag.diagnosticos.map((d) => {
                const p = separarDiagnostico(d.descripcion)
                return (
                  <div key={d.id} className="stack-sm">
                    <p className="prewrap">{p.descripcion}</p>
                    {p.observaciones && <p className="muted small prewrap">Observaciones: {p.observaciones}</p>}
                    <p className="muted small">{formatFechaHora(d.created_at)}</p>
                  </div>
                )
              })
            )}
            <TareasChecklist tareas={diag.tareas} editable={puedeTrabajar} onToggle={toggleTarea} />
          </Card>
          <Card
            titulo="Repuestos"
            acciones={
              <Button size="sm" to={`/taller/ordenes/${orden.id}/repuestos`}>
                Gestionar
              </Button>
            }
          >
            {!reps.repuestos.length ? (
              <EmptyState mensaje="Sin repuestos asignados" compacto />
            ) : (
              <ul className="list">
                {reps.repuestos.map((r) => (
                  <li key={r.id} className="list__item">
                    <div className="list__main">
                      <span className="list__title">{r.repuestos?.nombre}</span>
                      <span className="muted small">{r.repuestos?.codigo}</span>
                    </div>
                    <strong>× {r.cantidad}</strong>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <Card titulo="Fotografías" className="section">
        <FotoGallery fotos={fotos.data} loading={fotos.loading} />
      </Card>

      {esMia && (
        <Card
          titulo="Avances registrados"
          className="section"
          acciones={
            puedeTrabajar && (
              <Button size="sm" to={`/taller/ordenes/${orden.id}/avance`}>
                Registrar avance
              </Button>
            )
          }
        >
          <AvancesList avances={avances.avances} />
          {orden.observaciones_finales && (
            <>
              <p className="lbl-sec">Observaciones finales</p>
              <p className="prewrap">{orden.observaciones_finales}</p>
            </>
          )}
        </Card>
      )}

      <div className="grid-2">
        <Card titulo="Visitas anteriores del vehículo">
          {previas.loading && !previas.data?.length ? (
            <p className="muted">Cargando…</p>
          ) : !previas.data?.length ? (
            <EmptyState mensaje="Sin visitas anteriores registradas a tu nombre" compacto />
          ) : (
            <ul className="list">
              {previas.data.map((p) => (
                <li key={p.id} className="list__item list__item--block">
                  <div className="row-wrap">
                    <strong>{formatFecha(p.fecha_ingreso)}</strong>
                    <code className="code">{p.codigo}</code>
                    <span className="muted small">{formatKm(p.kilometraje)}</span>
                    <EstadoBadge estado={p.estado} />
                  </div>
                  <p className="small">
                    <strong>Motivo:</strong> {p.motivo_ingreso}
                  </p>
                  {p.diagnosticos?.map((d) => (
                    <p key={d.id} className="small prewrap">
                      <strong>Diagnóstico:</strong> {separarDiagnostico(d.descripcion).descripcion}
                    </p>
                  ))}
                  {p.orden_tareas?.length > 0 && (
                    <p className="small muted">Tareas: {p.orden_tareas.map((t) => t.descripcion).join(', ')}</p>
                  )}
                  {p.observaciones_finales && (
                    <p className="small">
                      <strong>Cierre:</strong> {p.observaciones_finales}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card titulo="Cambios de estado de esta orden">
          <HistorialEstadosTimeline historial={historial.data} nombres={nombres} />
        </Card>
      </div>
    </>
  )
}
