import { Navigate, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import EstadoOrdenCliente from '@/components/domain/portal/EstadoOrdenCliente'
import PresupuestoCard from '@/components/domain/portal/PresupuestoCard'
import { usePortal } from '@/hooks/portal/usePortal'
import { usePresupuestoCliente } from '@/hooks/portal/usePresupuestoCliente'
import { PATHS } from '@/routes/paths'

// CU-13 + CU-14 por código de seguimiento (consultar_estado_orden / responder_presupuesto)
export default function SeguimientoEstadoPage() {
  const navigate = useNavigate()
  const portal = usePortal()
  const pres = usePresupuestoCliente({ patente: portal.patente, codigo: portal.codigo })

  if (!portal.tieneCredenciales) return <Navigate to={PATHS.seguimiento} replace />
  if (pres.loading && !pres.estado) return <Spinner />
  if (pres.error || !pres.estado)
    return (
      <div className="narrow">
        <ErrorState mensaje={pres.error ?? 'No encontramos la orden'} onRetry={pres.refetch} />
        <Button block onClick={() => navigate(PATHS.seguimiento)}>
          Consultar otro vehículo
        </Button>
      </div>
    )

  const otro = () => {
    portal.clear()
    navigate(PATHS.seguimiento)
  }

  return (
    <div className="portal-public stack">
      <div className="row-wrap row-between">
        <h1>Estado de tu vehículo</h1>
        <div className="row-wrap">
          <Button variant="ghost" to={PATHS.seguimientoHistorial}>
            Historial del vehículo
          </Button>
          <Button variant="ghost" onClick={otro}>
            Consultar otro
          </Button>
        </div>
      </div>
      <EstadoOrdenCliente estado={pres.estado} codigoSeguimiento={portal.codigo} />
      {pres.presupuesto && <PresupuestoCard pres={pres} />}
    </div>
  )
}
