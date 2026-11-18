import EmptyState from '@/components/ui/EmptyState'
import { formatFechaHora } from '@/lib/format'

// Checklist de tareas de la orden (RF12). editable: permite marcar y quitar
export default function TareasChecklist({ tareas, onToggle, onEliminar, editable = false, deshabilitado = false }) {
  if (!tareas?.length) return <EmptyState mensaje="Sin tareas registradas" compacto />
  const hechas = tareas.filter((t) => t.completada).length
  return (
    <div className="tareas">
      <p className="muted small">
        {hechas} de {tareas.length} tarea(s) completadas
      </p>
      <ul className="tareas__list">
        {tareas.map((t) => (
          <li key={t.id} className={['tareas__item', t.completada && 'tareas__item--done'].filter(Boolean).join(' ')}>
            <label className="tareas__check">
              <input
                type="checkbox"
                checked={t.completada}
                disabled={!editable || deshabilitado}
                onChange={(e) => onToggle?.(t.id, e.target.checked)}
              />
              <span>
                <span className="tareas__desc">{t.descripcion}</span>
                {t.completada && t.completada_en && <span className="muted small"> · {formatFechaHora(t.completada_en)}</span>}
              </span>
            </label>
            {editable && onEliminar && !t.completada && (
              <button type="button" className="icon-btn" aria-label={`Quitar tarea ${t.descripcion}`} disabled={deshabilitado} onClick={() => onEliminar(t)}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
