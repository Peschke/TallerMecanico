import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import TrackingForm from '@/components/domain/portal/TrackingForm'
import { usePortal } from '@/hooks/portal/usePortal'
import { clientePortalService } from '@/services/clientePortalService'
import { traducirError } from '@/lib/errors'
import { PATHS } from '@/routes/paths'

// CU-13 sin cuenta: patente + código de seguimiento
export default function SeguimientoPage() {
  const navigate = useNavigate()
  const portal = usePortal()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const consultar = async (patente, codigo) => {
    setPending(true)
    setError(null)
    const { error: err } = await clientePortalService.estado(patente, codigo)
    setPending(false)
    if (err) return setError(traducirError(err))
    portal.setCredenciales(patente, codigo)
    navigate(PATHS.seguimientoEstado)
  }

  return (
    <div className="narrow stack">
      <div>
        <h1>Sigue tu vehículo</h1>
        <p className="muted">Revisa el estado de la reparación y responde tu presupuesto sin crear una cuenta.</p>
      </div>
      <Card>
        <TrackingForm inicial={{ patente: portal.patente, codigo: portal.codigo }} onSubmit={consultar} pending={pending} error={error} />
      </Card>
      <p className="muted small">
        ¿Tienes cuenta? <Link to={PATHS.accesoCliente}>Entra con tu correo</Link> para ver todos tus vehículos.
      </p>
    </div>
  )
}
