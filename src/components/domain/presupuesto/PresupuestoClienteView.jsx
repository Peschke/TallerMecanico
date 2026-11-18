import { formatCLP } from '@/lib/format'

const GRUPOS = [
  { tipo: 'repuesto', titulo: 'Repuestos' },
  { tipo: 'mano_obra', titulo: 'Mano de obra' },
  { tipo: 'otro', titulo: 'Otros cobros' },
]

// Detalle del presupuesto para el cliente (sin costos internos). p: presupuesto de consultar_estado_orden
export default function PresupuestoClienteView({ p }) {
  const items = p.items ?? []
  const subtotal = Number(p.total_repuestos) + Number(p.total_mano_obra) + Number(p.total_otros)
  return (
    <div className="pres-cliente">
      {GRUPOS.map((g) => {
        const lista = items.filter((i) => i.tipo === g.tipo)
        if (!lista.length) return null
        return (
          <section key={g.tipo} className="pres-cliente__grupo">
            <h3 className="lbl-sec">{g.titulo}</h3>
            <ul className="pres-cliente__items">
              {lista.map((i, k) => (
                <li key={`${g.tipo}-${k}`} className="pres-cliente__item">
                  <span className="pres-cliente__desc">
                    {i.descripcion}
                    {Number(i.cantidad) !== 1 && (
                      <span className="muted small">
                        {' '}
                        · {Number(i.cantidad)} × {formatCLP(i.precio_unitario)}
                      </span>
                    )}
                  </span>
                  <span className="pres-cliente__monto">{formatCLP(i.subtotal)}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      <dl className="totales">
        <dt>Repuestos</dt>
        <dd>{formatCLP(p.total_repuestos)}</dd>
        <dt>Mano de obra</dt>
        <dd>{formatCLP(p.total_mano_obra)}</dd>
        <dt>Otros cobros</dt>
        <dd>{formatCLP(p.total_otros)}</dd>
        <dt>Subtotal</dt>
        <dd>{formatCLP(subtotal)}</dd>
        <dt>Descuentos</dt>
        <dd>{Number(p.descuento) > 0 ? `− ${formatCLP(p.descuento)}` : formatCLP(0)}</dd>
        <dt className="totales__total">Total</dt>
        <dd className="totales__total">{formatCLP(p.total)}</dd>
      </dl>
    </div>
  )
}
