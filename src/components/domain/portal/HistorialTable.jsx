import DataTable from '@/components/ui/DataTable'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { useIsMobile } from '@/hooks/core/useMediaQuery'
import { formatFecha, formatKm } from '@/lib/format'

const resumen = (lista, n = 3) => (lista?.length ? lista.slice(0, n).join(', ') + (lista.length > n ? ` y ${lista.length - n} más` : '') : '—')
const repuestosTexto = (r) => (r ?? []).map((x) => `${x.nombre}${Number(x.cantidad) > 1 ? ` ×${x.cantidad}` : ''}`)

// CU-15 · RF36: servicios cerrados del vehículo. servicios: items de consultar_historial_vehiculo
export default function HistorialTable({ servicios, loading, error, onRetry, onAbrir }) {
  const movil = useIsMobile()

  if (movil) {
    if (!loading && !error && !servicios.length) return <EmptyState mensaje="Este vehículo aún no tiene servicios cerrados en el taller" />
    return (
      <ol className="hist-cards">
        {servicios.map((s) => (
          <li key={s.codigo} className="hist-card">
            <div className="hist-card__head">
              <strong>{formatFecha(s.fecha_ingreso)}</strong>
              <span className="muted small">{formatKm(s.kilometraje)}</span>
            </div>
            <p className="small muted">
              <code className="code">{s.codigo}</code> · entregado {formatFecha(s.fecha_entrega)}
            </p>
            <p className="small">
              <strong>Motivo:</strong> {s.motivo}
            </p>
            {s.diagnostico && <p className="small hist-card__clamp">{s.diagnostico}</p>}
            <p className="small">
              <strong>Trabajos:</strong> {resumen(s.trabajos)}
            </p>
            <p className="small">
              <strong>Repuestos:</strong> {resumen(repuestosTexto(s.repuestos))}
            </p>
            <Button size="sm" block onClick={() => onAbrir(s)}>
              Ver detalle
            </Button>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <DataTable
      loading={loading}
      error={error}
      onRetry={onRetry}
      rows={servicios}
      rowKey="codigo"
      emptyMessage="Este vehículo aún no tiene servicios cerrados en el taller"
      onRowClick={onAbrir}
      columns={[
        { key: 'ing', header: 'Ingreso', render: (s) => formatFecha(s.fecha_ingreso) },
        { key: 'ent', header: 'Entrega', render: (s) => formatFecha(s.fecha_entrega) },
        { key: 'km', header: 'Kilometraje', align: 'right', render: (s) => formatKm(s.kilometraje) },
        { key: 'diag', header: 'Diagnóstico', render: (s) => <span className="truncate">{s.diagnostico ?? s.motivo}</span> },
        { key: 'trab', header: 'Trabajos realizados', render: (s) => <span className="truncate">{resumen(s.trabajos)}</span> },
        { key: 'rep', header: 'Repuestos', render: (s) => <span className="truncate">{resumen(repuestosTexto(s.repuestos))}</span> },
        { key: 'acc', header: '', align: 'right', render: () => <span className="link-btn">Ver detalle</span> },
      ]}
    />
  )
}
