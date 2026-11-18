import { formatFecha, formatFechaHora, formatKm } from '@/lib/format'

/**
 * Detalle de un servicio cerrado.
 * servicio: item de consultar_historial_vehiculo. detalle (opcional, cliente autenticado): orden con diagnósticos y tareas.
 */
export default function DetalleOrdenHistorica({ servicio: s, detalle }) {
  const diagnosticos = detalle?.diagnosticos?.length
    ? detalle.diagnosticos.map((d) => ({ texto: d.descripcion, fecha: d.created_at }))
    : (s.diagnostico ?? '').split(' | ').filter(Boolean).map((texto) => ({ texto }))
  const tareas = detalle?.orden_tareas?.length ? detalle.orden_tareas.filter((t) => t.completada).map((t) => t.descripcion) : (s.trabajos ?? [])

  return (
    <div className="detalle-hist stack">
      <dl className="dl dl--compact">
        <dt>Orden</dt>
        <dd>
          <code className="code">{s.codigo}</code>
        </dd>
        <dt>Ingreso</dt>
        <dd>{formatFecha(s.fecha_ingreso)}</dd>
        <dt>Entrega</dt>
        <dd>{formatFecha(s.fecha_entrega)}</dd>
        <dt>Kilometraje</dt>
        <dd>{formatKm(s.kilometraje)}</dd>
      </dl>

      <section>
        <h3 className="lbl-sec">Motivo de ingreso</h3>
        <p className="prewrap">{s.motivo}</p>
      </section>

      <section>
        <h3 className="lbl-sec">Diagnóstico</h3>
        {!diagnosticos.length ? (
          <p className="muted">Sin diagnóstico registrado</p>
        ) : (
          diagnosticos.map((d, i) => (
            <div key={i} className="detalle-hist__diag">
              <p className="prewrap">{d.texto}</p>
              {d.fecha && <p className="muted small">{formatFechaHora(d.fecha)}</p>}
            </div>
          ))
        )}
      </section>

      <section>
        <h3 className="lbl-sec">Trabajos realizados</h3>
        {!tareas.length ? (
          <p className="muted">Sin tareas registradas</p>
        ) : (
          <ul className="checklist">
            {tareas.map((t, i) => (
              <li key={i} className="checklist__done">
                <span aria-hidden="true">✓</span> {t}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="lbl-sec">Repuestos utilizados</h3>
        {!s.repuestos?.length ? (
          <p className="muted">No se utilizaron repuestos</p>
        ) : (
          <ul className="list">
            {s.repuestos.map((r, i) => (
              <li key={i} className="list__item">
                <span className="list__title">{r.nombre}</span>
                <strong>× {r.cantidad}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="lbl-sec">Observaciones finales</h3>
        <p className="prewrap">{s.observaciones_finales || <span className="muted">Sin observaciones</span>}</p>
      </section>
    </div>
  )
}
