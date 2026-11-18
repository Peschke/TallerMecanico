import { Link } from 'react-router-dom'
import EmptyState from '@/components/ui/EmptyState'
import { formatRelativo, formatFechaHora } from '@/lib/format'

const ICONO = {
  presupuesto_publicado: '📝',
  presupuesto_aprobado: '✅',
  presupuesto_rechazado: '✖',
  trabajo_terminado: '🔧',
  vehiculo_listo: '🚗',
}

// Lista de avisos del cliente. avisos: useNotificacionesCliente().avisos
export default function NotificacionesCliente({ avisos, onAbrir, compacto = false, vacio = 'No tienes avisos' }) {
  if (!avisos?.length) return <EmptyState mensaje={vacio} compacto={compacto} />
  return (
    <ul className="avisos">
      {avisos.map((a) => (
        <li key={a.id} className={['avisos__item', !a.leida && 'avisos__item--nuevo'].filter(Boolean).join(' ')}>
          <span className="avisos__icono" aria-hidden="true">
            {ICONO[a.tipo] ?? '🔔'}
          </span>
          <div className="avisos__body">
            {a.ordenId ? (
              <Link to={`/cliente/ordenes/${a.ordenId}`} className="avisos__msg" onClick={() => onAbrir?.(a)}>
                {a.mensaje}
              </Link>
            ) : (
              <span className="avisos__msg">{a.mensaje}</span>
            )}
            {a.detalle && <span className="muted small">{a.detalle}</span>}
            <span className="muted small" title={formatFechaHora(a.fecha)}>
              {a.patente ? `${a.patente} · ` : ''}
              {formatRelativo(a.fecha)}
            </span>
          </div>
          {!a.leida && <span className="avisos__punto" aria-label="No leído" />}
        </li>
      ))}
    </ul>
  )
}
