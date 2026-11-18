import { Link } from 'react-router-dom'
import EstadoBadge from './EstadoBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import { formatFecha, formatKm } from '@/lib/format'

// Tarjeta de orden para listas táctiles (RNF01). orden: fila de v_panel_ordenes
export default function OrdenCard({ orden: o, to, mostrarAvance = true }) {
  return (
    <Link to={to} className="orden-card">
      <div className="orden-card__top">
        <strong className="orden-card__patente patente">{o.patente}</strong>
        <EstadoBadge estado={o.estado} texto={o.estado_texto} />
      </div>
      <div className="orden-card__veh">
        {o.marca} {o.modelo} {o.anio ?? ''}
      </div>
      <div className="orden-card__meta muted small">
        <code className="code">{o.codigo}</code> · {o.cliente} · {formatFecha(o.fecha_ingreso)}
        {o.kilometraje != null && ` · ${formatKm(o.kilometraje)}`}
      </div>
      {o.motivo_ingreso && <p className="orden-card__motivo">{o.motivo_ingreso}</p>}
      {mostrarAvance && o.avance_pct > 0 && <ProgressBar value={o.avance_pct} label={`Avance ${o.codigo}`} />}
    </Link>
  )
}
