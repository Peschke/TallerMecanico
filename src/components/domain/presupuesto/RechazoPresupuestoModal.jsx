import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import TextArea from '@/components/ui/TextArea'

const MOTIVOS = ['El precio es muy alto', 'Lo repararé en otro lugar', 'Solo quería el diagnóstico', 'Prefiero hacerlo más adelante']

// RF35: el rechazo exige motivo
export default function RechazoPresupuestoModal({ open, onClose, onConfirmar, pending }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setMotivo('')
      setError(null)
    }
  }, [open])

  const confirmar = async () => {
    if (motivo.trim().length < 5) return setError('Cuéntanos el motivo del rechazo (mínimo 5 caracteres).')
    const r = await onConfirmar(motivo.trim())
    if (r && !r.ok) setError(r.error)
  }

  return (
    <Modal
      open={open}
      titulo="Rechazar presupuesto"
      onClose={onClose}
      sheet
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            Volver
          </Button>
          <Button variant="danger" loading={pending} onClick={confirmar}>
            Rechazar presupuesto
          </Button>
        </>
      }
    >
      <div className="stack">
        <p className="muted">El taller no realizará la reparación. Te contactaremos para coordinar el retiro del vehículo.</p>
        <div className="row-wrap" role="group" aria-label="Motivos frecuentes">
          {MOTIVOS.map((m) => (
            <button key={m} type="button" className={['chip', motivo === m && 'chip--on'].filter(Boolean).join(' ')} onClick={() => setMotivo(m)}>
              {m}
            </button>
          ))}
        </div>
        <FormField label="Motivo del rechazo" htmlFor="motivo-rechazo" required error={error}>
          <TextArea id="motivo-rechazo" rows={3} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  )
}
