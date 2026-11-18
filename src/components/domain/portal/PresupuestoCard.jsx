import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PresupuestoClienteView from '@/components/domain/presupuesto/PresupuestoClienteView'
import RechazoPresupuestoModal from '@/components/domain/presupuesto/RechazoPresupuestoModal'
import { useConfirm } from '@/hooks/core/useConfirm'
import { useToast } from '@/hooks/core/useToast'
import { formatCLP, formatFechaHora } from '@/lib/format'

const TONO = { publicado: 'warning', aprobado: 'success', rechazado: 'danger' }
const TEXTO = { publicado: 'Pendiente de tu respuesta', aprobado: 'Aprobado', rechazado: 'Rechazado' }

/**
 * CU-14 · RF33-RF35: presupuesto vigente con diagnóstico, detalle, totales y respuesta.
 * pres: hook usePresupuestoCliente
 */
export default function PresupuestoCard({ pres, onRespondido }) {
  const toast = useToast()
  const { confirm, dialogProps } = useConfirm()
  const [rechazo, setRechazo] = useState(false)
  const p = pres.presupuesto
  const e = pres.estado
  if (!p) return null

  const aprobar = async () => {
    const ok = await confirm({
      titulo: 'Aprobar presupuesto',
      mensaje: `Autorizas la reparación por un total de ${formatCLP(p.total)}. El taller comenzará el trabajo y te avisaremos del avance.`,
      confirmarTexto: 'Aprobar presupuesto',
    })
    if (!ok) return
    const r = await pres.aprobar()
    if (!r.ok) return toast.error(r.error)
    toast.success('¡Gracias! Presupuesto aprobado. Comenzaremos la reparación.')
    onRespondido?.('aprobado')
  }

  const rechazar = async (motivo) => {
    const r = await pres.rechazar(motivo)
    if (!r.ok) return r
    toast.info('Presupuesto rechazado. El taller fue notificado.')
    setRechazo(false)
    onRespondido?.('rechazado')
    return r
  }

  return (
    <Card
      titulo={`Presupuesto${p.version > 1 ? ` (versión ${p.version})` : ''}`}
      acciones={<Badge tono={TONO[p.estado]}>{TEXTO[p.estado] ?? p.estado}</Badge>}
      className="pres-card"
    >
      {p.publicado_en && <p className="muted small">Enviado el {formatFechaHora(p.publicado_en)}</p>}
      {e?.diagnostico && (
        <>
          <h3 className="lbl-sec">Diagnóstico del mecánico</h3>
          <p className="prewrap">{e.diagnostico}</p>
        </>
      )}
      <PresupuestoClienteView p={p} />
      {p.estado === 'rechazado' && p.motivo_rechazo && (
        <p className="callout callout--warning small">
          <strong>Motivo del rechazo:</strong> {p.motivo_rechazo}
        </p>
      )}
      {pres.puedeResponder && (
        <div className="pres-card__acciones">
          <Button variant="primary" size="xl" block loading={pres.pending} onClick={aprobar}>
            Aprobar presupuesto
          </Button>
          <Button variant="secondary" size="lg" block disabled={pres.pending} onClick={() => setRechazo(true)}>
            Rechazar presupuesto
          </Button>
        </div>
      )}
      <RechazoPresupuestoModal open={rechazo} onClose={() => setRechazo(false)} onConfirmar={rechazar} pending={pres.pending} />
      <ConfirmDialog {...dialogProps} />
    </Card>
  )
}
