import { useState } from 'react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import StockBadge from '@/components/domain/inventario/StockBadge'
import { formatFechaHora } from '@/lib/format'

// Repuestos de la orden con cantidad editable (CU-06 · RF16). Cada cambio mueve el kárdex vía trigger.
export default function RepuestosOrdenList({ repuestos, editable, onCambiarCantidad, onEliminar, onSolicitar, deshabilitado }) {
  const [ocupado, setOcupado] = useState(null)
  if (!repuestos?.length) return <EmptyState mensaje="Aún no hay repuestos asignados a esta orden" compacto />

  const cambiar = async (r, n) => {
    if (n < 1) return
    setOcupado(r.id)
    await onCambiarCantidad(r, n)
    setOcupado(null)
  }

  return (
    <ul className="rep-orden">
      {repuestos.map((r) => {
        const rep = r.repuestos ?? {}
        const busy = deshabilitado || ocupado === r.id
        return (
          <li key={r.id} className="rep-orden__item">
            <div className="rep-orden__info">
              <span className="rep-orden__nombre">{rep.nombre}</span>
              <span className="muted small">
                <code className="code">{rep.codigo}</code> · agregado {formatFechaHora(r.created_at)}
              </span>
              <span className="small">
                Bodega: <StockBadge stock={rep.stock} minimo={rep.stock_minimo} />
              </span>
            </div>
            {editable ? (
              <div className="rep-orden__acciones">
                <div className="stepper-qty" role="group" aria-label={`Cantidad de ${rep.nombre}`}>
                  <button type="button" className="stepper-qty__btn" aria-label="Restar uno" disabled={busy || r.cantidad <= 1} onClick={() => cambiar(r, r.cantidad - 1)}>
                    −
                  </button>
                  <output className="stepper-qty__val" aria-live="polite">
                    {r.cantidad}
                  </output>
                  <button type="button" className="stepper-qty__btn" aria-label="Sumar uno" disabled={busy || Number(rep.stock) === 0} onClick={() => cambiar(r, r.cantidad + 1)}>
                    +
                  </button>
                </div>
                {Number(rep.stock) === 0 && onSolicitar && (
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSolicitar(rep)}>
                    Solicitar más
                  </Button>
                )}
                <Button size="sm" variant="danger" disabled={busy} onClick={() => onEliminar(r)}>
                  Quitar
                </Button>
              </div>
            ) : (
              <strong className="rep-orden__cant">× {r.cantidad}</strong>
            )}
          </li>
        )
      })}
    </ul>
  )
}
