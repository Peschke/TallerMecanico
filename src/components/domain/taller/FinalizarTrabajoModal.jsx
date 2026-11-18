import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import TextArea from '@/components/ui/TextArea'
import { useCambiarEstado } from '@/hooks/ordenes/useCambiarEstado'
import { useToast } from '@/hooks/core/useToast'

/**
 * CU-07 · RF19: Trabajo Terminado. cambiar_estado_orden exige y guarda observaciones_finales,
 * fija avance 100 % y fecha_termino, y notifica a recepción.
 */
export default function FinalizarTrabajoModal({ open, orden, tareasPendientes = 0, onClose, onFinalizado }) {
  const toast = useToast()
  const { cambiarEstado, pending } = useCambiarEstado()
  const [obs, setObs] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setObs(orden?.observaciones_finales ?? '')
      setError(null)
    }
  }, [open, orden?.observaciones_finales])

  const confirmar = async () => {
    if (obs.trim().length < 10) return setError('Ingresa las observaciones finales del trabajo (mínimo 10 caracteres).')
    const r = await cambiarEstado(orden.id, 'trabajo_terminado', obs.trim())
    if (!r.ok) {
      setError(r.error)
      return
    }
    toast.success('Trabajo terminado. Recepción fue notificada para avisar al cliente.')
    onFinalizado?.()
    onClose()
  }

  return (
    <Modal
      open={open}
      titulo={`Finalizar trabajo · ${orden?.codigo ?? ''}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Volver</Button>
          <Button variant="primary" loading={pending} onClick={confirmar}>
            Marcar trabajo terminado
          </Button>
        </>
      }
    >
      <div className="stack">
        {tareasPendientes > 0 && (
          <p className="callout callout--warning small">
            Quedan <strong>{tareasPendientes}</strong> tarea(s) sin marcar en el checklist. Revisa antes de finalizar.
          </p>
        )}
        <FormField
          label="Observaciones finales"
          htmlFor="obs-finales"
          required
          error={error}
          hint="Lo que se realizó, recomendaciones y próximos mantenimientos. Las verá recepción y el cliente."
        >
          <TextArea id="obs-finales" rows={5} value={obs} maxLength={2000} onChange={(e) => setObs(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  )
}
