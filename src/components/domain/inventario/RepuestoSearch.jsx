import { useState } from 'react'
import SearchInput from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import StockBadge from './StockBadge'
import { useBuscarRepuestos } from '@/hooks/taller/useOrdenRepuestos'

// Buscador de repuestos (CU-06 · RF15). Con stock: agregar; sin stock: solicitar (RF17)
export default function RepuestoSearch({ onAgregar, onSolicitar, deshabilitado = false, idPrefix = 'rep' }) {
  const [texto, setTexto] = useState('')
  const [cantidades, setCantidades] = useState({})
  const { resultados, loading, error } = useBuscarRepuestos(texto)

  const cantidadDe = (r) => cantidades[r.id] ?? '1'
  const valida = (r) => {
    const n = Number(cantidadDe(r))
    return Number.isInteger(n) && n > 0 && n <= r.stock
  }

  return (
    <div className="stack-sm">
      <SearchInput id={`${idPrefix}-buscar`} label="Buscar repuesto" placeholder="Nombre o código del repuesto" onSearch={setTexto} />
      {loading && !resultados.length && <Spinner />}
      {error && <p className="text-danger small">{error}</p>}
      {!loading && !error && !resultados.length && (
        <EmptyState
          compacto
          mensaje={texto ? `No hay repuestos que coincidan con “${texto}”` : 'Sin repuestos en el catálogo'}
          accion={
            onSolicitar && (
              <Button size="sm" onClick={() => onSolicitar(null, texto)} disabled={deshabilitado}>
                Solicitar repuesto no catalogado
              </Button>
            )
          }
        />
      )}
      <ul className="rep-results">
        {resultados.map((r) => {
          const sinStock = Number(r.stock) === 0
          const n = Number(cantidadDe(r))
          return (
            <li key={r.id} className="rep-results__item">
              <div className="rep-results__info">
                <span className="rep-results__nombre">{r.nombre}</span>
                <span className="muted small">
                  <code className="code">{r.codigo}</code>
                  {r.categorias_repuesto?.nombre ? ` · ${r.categorias_repuesto.nombre}` : ''}
                </span>
              </div>
              <StockBadge stock={r.stock} minimo={r.stock_minimo} />
              {sinStock ? (
                <Button size="sm" variant="secondary" disabled={deshabilitado} onClick={() => onSolicitar?.(r)}>
                  Solicitar repuesto faltante
                </Button>
              ) : (
                <span className="rep-results__add">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={r.stock}
                    className="input--qty"
                    aria-label={`Cantidad de ${r.nombre}`}
                    value={cantidadDe(r)}
                    invalid={!valida(r)}
                    disabled={deshabilitado}
                    onChange={(e) => setCantidades((c) => ({ ...c, [r.id]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={deshabilitado || !valida(r)}
                    title={n > r.stock ? `Solo hay ${r.stock} en stock` : undefined}
                    onClick={async () => {
                      const ok = await onAgregar?.(r, n)
                      if (ok) setCantidades((c) => ({ ...c, [r.id]: '1' }))
                    }}
                  >
                    Agregar
                  </Button>
                </span>
              )}
              {!sinStock && n > r.stock && (
                <span className="rep-results__aviso small text-danger">
                  Solo hay {r.stock} en stock.{' '}
                  <button type="button" className="link-btn" onClick={() => onSolicitar?.(r, '', n - r.stock)}>
                    Solicitar el faltante
                  </button>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
