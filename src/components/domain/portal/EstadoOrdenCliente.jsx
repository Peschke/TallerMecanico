import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import EstadoBadge from './EstadoBadge'
import EstadoTimeline from './EstadoTimeline'
import { formatCLP, formatFechaHora, formatKm, formatRelativo } from '@/lib/format'

const MENSAJE = {
  por_asignar: 'Tu vehículo fue recibido y pronto será asignado a un mecánico.',
  por_diagnosticar: 'Un mecánico está revisando tu vehículo.',
  diagnosticado: 'El diagnóstico está listo. Estamos preparando tu presupuesto.',
  esperando_aprobacion: 'Tu presupuesto está listo. Revísalo y apruébalo para que comencemos.',
  presupuesto_aprobado: 'Gracias por aprobar. La reparación comenzará en breve.',
  presupuesto_rechazado: 'Rechazaste el presupuesto. Te contactaremos para coordinar el retiro.',
  esperando_repuesto: 'Estamos esperando repuestos para continuar con tu vehículo.',
  en_reparacion: 'Estamos reparando tu vehículo.',
  pruebas_ruta: 'Estamos probando tu vehículo en ruta.',
  trabajo_terminado: 'Terminamos el trabajo. Te avisaremos cuando esté listo para retirar.',
  listo_entrega: '¡Tu vehículo está listo para retirar!',
  pagado_cerrado: 'Vehículo entregado. ¡Gracias por preferirnos!',
  cancelada: 'Esta orden fue cancelada.',
}

/**
 * CU-13 · RF32: estado de la reparación.
 * estado: resultado de consultar_estado_orden. orden (opcional): observaciones y código de seguimiento.
 */
export default function EstadoOrdenCliente({ estado: e, orden, codigoSeguimiento, historial, presupuestoTo, enVivo }) {
  const v = e.vehiculo ?? {}
  const observaciones = orden?.observaciones_finales || orden?.observaciones_ingreso
  return (
    <div className="stack">
      <Card className="estado-hero">
        <div className="estado-hero__top">
          <div>
            <p className="estado-hero__patente patente">{v.patente}</p>
            <p className="estado-hero__veh">
              {v.marca} {v.modelo} {v.anio ?? ''}
            </p>
          </div>
          <div className="estado-hero__badges">
            <EstadoBadge estado={e.estado} texto={e.estado_texto} />
            {enVivo && <span className="muted small">● En vivo</span>}
          </div>
        </div>
        <p className="estado-hero__msg">{MENSAJE[e.estado] ?? e.estado_texto}</p>
        {e.estado !== 'cancelada' && <ProgressBar value={e.avance_pct} label="Avance de la reparación" />}
        {e.estado === 'esperando_aprobacion' && presupuestoTo && (
          <Button variant="primary" size="lg" block to={presupuestoTo}>
            Revisar presupuesto
          </Button>
        )}
        {e.estado === 'listo_entrega' && Number(e.saldo) > 0 && (
          <p className="callout small">
            Saldo a pagar al retirar: <strong>{formatCLP(e.saldo)}</strong>
          </p>
        )}
      </Card>

      <div className="grid-2">
        <Card titulo="Progreso">
          <EstadoTimeline estado={e.estado} fechaIngreso={e.fecha_ingreso} historial={historial} />
        </Card>
        <Card titulo="Datos de la orden">
          <dl className="dl dl--compact">
            <dt>Código OT</dt>
            <dd>
              <code className="code">{e.codigo}</code>
            </dd>
            {(codigoSeguimiento || orden?.codigo_seguimiento) && (
              <>
                <dt>Código de seguimiento</dt>
                <dd>
                  <code className="code">{codigoSeguimiento || orden.codigo_seguimiento}</code>
                </dd>
              </>
            )}
            <dt>Vehículo</dt>
            <dd>
              {v.marca} {v.modelo} {v.anio ?? ''}
            </dd>
            <dt>Patente</dt>
            <dd className="patente">{v.patente}</dd>
            <dt>Ingreso</dt>
            <dd>{formatFechaHora(e.fecha_ingreso)}</dd>
            <dt>Kilometraje</dt>
            <dd>{formatKm(e.kilometraje)}</dd>
            <dt>Estado actual</dt>
            <dd>{e.estado_texto}</dd>
            <dt>Etapa</dt>
            <dd>{e.etapa}</dd>
            <dt>Avance</dt>
            <dd>{e.avance_pct}%</dd>
            <dt>Actualizado</dt>
            <dd title={formatFechaHora(e.actualizado)}>{formatRelativo(e.actualizado)}</dd>
          </dl>
        </Card>
      </div>

      <div className="grid-2">
        <Card titulo="Diagnóstico">
          {e.diagnostico ? <p className="prewrap">{e.diagnostico}</p> : <p className="muted">El diagnóstico aún no está disponible.</p>}
        </Card>
        <Card titulo="Observaciones">
          {orden?.motivo_ingreso && (
            <p className="small">
              <strong>Motivo de ingreso:</strong> {orden.motivo_ingreso}
            </p>
          )}
          {observaciones ? <p className="prewrap">{observaciones}</p> : !orden?.motivo_ingreso && <p className="muted">Sin observaciones.</p>}
        </Card>
      </div>
    </div>
  )
}
