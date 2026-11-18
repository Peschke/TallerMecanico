import { ETAPAS, etapaEstado } from '@/lib/constants/estados'
import { formatFechaHora } from '@/lib/format'

const DESCRIPCION = {
  Ingresado: 'Recibimos tu vehículo en el taller.',
  Diagnóstico: 'Un mecánico revisa el vehículo y preparamos el presupuesto.',
  'Esperando repuesto': 'Esperamos repuestos para continuar.',
  'En reparación': 'Estamos trabajando en tu vehículo.',
  Listo: 'Tu vehículo está listo para retirar.',
  Entregado: 'Vehículo entregado.',
}

/**
 * Línea de progreso de las 6 etapas de RNF03.
 * historial: [{ estado_nuevo, created_at }] (opcional) para mostrar cuándo se alcanzó cada etapa.
 */
export default function EstadoTimeline({ estado, fechaIngreso, historial = [] }) {
  if (estado === 'cancelada') return <p className="callout callout--warning">Esta orden fue cancelada. Contacta al taller para más información.</p>

  const actual = ETAPAS.indexOf(etapaEstado(estado))
  const fechas = {}
  if (fechaIngreso) fechas.Ingresado = fechaIngreso
  for (const h of historial) {
    const et = etapaEstado(h.estado_nuevo)
    if (!fechas[et]) fechas[et] = h.created_at
  }
  const iRep = ETAPAS.indexOf('Esperando repuesto')
  const pasoPorRepuesto = estado === 'esperando_repuesto' || historial.some((h) => h.estado_nuevo === 'esperando_repuesto')

  return (
    <ol className="timeline-etapas" aria-label="Progreso de la reparación">
      {ETAPAS.map((e, i) => {
        const omitida = i === iRep && !pasoPorRepuesto && actual > iRep
        const st = omitida ? 'skip' : i < actual ? 'done' : i === actual ? 'current' : 'todo'
        return (
          <li key={e} className={`timeline-etapas__item timeline-etapas__item--${st}`} aria-current={st === 'current' ? 'step' : undefined}>
            <span className="timeline-etapas__dot" aria-hidden="true">
              {st === 'done' ? '✓' : i + 1}
            </span>
            <div className="timeline-etapas__body">
              <span className="timeline-etapas__label">{e}</span>
              {st === 'current' && <span className="timeline-etapas__desc">{DESCRIPCION[e]}</span>}
              {omitida && <span className="timeline-etapas__desc">No fue necesario</span>}
              {fechas[e] && st !== 'todo' && !omitida && <span className="timeline-etapas__fecha">{formatFechaHora(fechas[e])}</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
