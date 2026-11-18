import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import { useSolicitarRepuesto } from '@/hooks/taller/useSolicitudesCompra'
import { useToast } from '@/hooks/core/useToast'

const PASAN_A_ESPERA = ['por_diagnosticar', 'diagnosticado', 'presupuesto_aprobado', 'en_reparacion']

/**
 * CU-06 FA · RF17: solicitar repuesto faltante.
 * repuesto: fila del catálogo o null (repuesto no catalogado). sugerido: texto inicial / cantidad sugerida
 */
export default function SolicitudCompraModal({ open, orden, repuesto, sugerido = {}, onClose, onCreada }) {
  const toast = useToast()
  const { solicitar, pending } = useSolicitarRepuesto()
  const [cantidad, setCantidad] = useState('1')
  const [descripcion, setDescripcion] = useState('')
  const [errores, setErrores] = useState({})

  useEffect(() => {
    if (!open) return
    setCantidad(String(sugerido.cantidad ?? 1))
    setDescripcion(sugerido.texto ?? '')
    setErrores({})
  }, [open, sugerido.cantidad, sugerido.texto])

  const enviar = async () => {
    const e = {}
    const n = Number(cantidad)
    if (!Number.isInteger(n) || n < 1) e.cantidad = 'Ingresa una cantidad entera mayor a cero.'
    if (!repuesto && descripcion.trim().length < 3) e.descripcion = 'Describe el repuesto que necesitas (marca, medida, código del fabricante).'
    setErrores(e)
    if (Object.keys(e).length) return
    const r = await solicitar({
      orden_id: orden.id,
      repuesto_id: repuesto?.id,
      descripcion_repuesto: descripcion,
      cantidad: n,
    })
    if (!r.ok) return toast.error(r.error)
    toast.success(
      PASAN_A_ESPERA.includes(orden.estado) ? 'Solicitud enviada. La orden quedó en Esperando Repuesto.' : 'Solicitud enviada al administrador.',
    )
    onCreada?.(r.data)
    onClose()
  }

  return (
    <Modal
      open={open}
      titulo="Solicitar repuesto faltante"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={pending} onClick={enviar}>
            Enviar solicitud
          </Button>
        </>
      }
    >
      <div className="stack">
        {repuesto ? (
          <div className="callout">
            <strong>{repuesto.nombre}</strong>
            <span className="muted small">
              {' '}
              · {repuesto.codigo} · stock actual {repuesto.stock}
            </span>
          </div>
        ) : (
          <p className="muted small">El repuesto no está en el catálogo. El administrador lo cotizará con tu descripción.</p>
        )}
        <FormField label="Cantidad" htmlFor="sol-cant" required error={errores.cantidad}>
          <Input id="sol-cant" type="number" inputMode="numeric" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} invalid={Boolean(errores.cantidad)} />
        </FormField>
        <FormField
          label={repuesto ? 'Detalle (opcional)' : 'Descripción del repuesto'}
          htmlFor="sol-desc"
          required={!repuesto}
          error={errores.descripcion}
        >
          <TextArea id="sol-desc" rows={3} value={descripcion} maxLength={500} onChange={(e) => setDescripcion(e.target.value)} />
        </FormField>
        {PASAN_A_ESPERA.includes(orden?.estado) && (
          <p className="callout callout--warning small">
            Al enviar, la orden <strong>{orden.codigo}</strong> pasará a <strong>Esperando Repuesto</strong> y se avisará al administrador.
          </p>
        )}
      </div>
    </Modal>
  )
}
