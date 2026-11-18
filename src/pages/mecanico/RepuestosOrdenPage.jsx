import { useState } from 'react'
import { useParams } from 'react-router-dom'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import OrdenTallerHeader from '@/components/domain/taller/OrdenTallerHeader'
import RepuestosOrdenList from '@/components/domain/taller/RepuestosOrdenList'
import RepuestoSearch from '@/components/domain/inventario/RepuestoSearch'
import SolicitudCompraModal from '@/components/domain/inventario/SolicitudCompraModal'
import { useOrdenTaller } from '@/hooks/taller/useOrdenTaller'
import { useOrdenRepuestos } from '@/hooks/taller/useOrdenRepuestos'
import { useSolicitudesOrden } from '@/hooks/taller/useSolicitudesCompra'
import { useConfirm } from '@/hooks/core/useConfirm'
import { useToast } from '@/hooks/core/useToast'
import { ESTADOS_EDITAN_REPUESTOS } from '@/services/repuestosOrdenService'
import { ESTADOS_SOLICITUD } from '@/lib/constants/enums'
import { formatFechaHora } from '@/lib/format'
import { etiquetaEstado } from '@/lib/constants/estados'

const TONO_SOL = { pendiente: 'warning', aprobada: 'info', comprada: 'info', recibida: 'success', cancelada: 'neutral' }

// CU-06 · RF15, RF16, RF17: repuestos utilizados o requeridos
export default function RepuestosOrdenPage() {
  const { ordenId } = useParams()
  const toast = useToast()
  const { confirm, dialogProps } = useConfirm()
  const { orden, loading, error, refetch, esMia, puedeTrabajar } = useOrdenTaller(ordenId)
  const reps = useOrdenRepuestos(esMia ? ordenId : null)
  const sols = useSolicitudesOrden(esMia ? ordenId : null)
  const [solicitud, setSolicitud] = useState(null) // { repuesto, sugerido }

  if (loading && !orden) return <SplashScreen />
  if (error) return <ErrorState mensaje={error} onRetry={refetch} />
  if (!orden) return <EmptyState mensaje="Orden no encontrada" accion={<Button to="/taller/trabajos">Volver</Button>} />

  const editable = puedeTrabajar && ESTADOS_EDITAN_REPUESTOS.includes(orden.estado)
  const puedeSolicitar = puedeTrabajar

  const abrirSolicitud = (repuesto, texto = '', cantidad = 1) => setSolicitud({ repuesto, sugerido: { texto, cantidad } })

  const agregar = async (repuesto, cantidad) => {
    const r = await reps.agregar(repuesto.id, cantidad)
    if (!r.ok) {
      toast.error(r.error)
      if (/stock insuficiente/i.test(r.error)) abrirSolicitud(repuesto)
      return false
    }
    toast.success(`${repuesto.nombre} × ${cantidad} agregado a la orden`)
    return true
  }

  const cambiarCantidad = async (fila, cantidad) => {
    const r = await reps.cambiarCantidad(fila.id, cantidad)
    if (!r.ok) {
      toast.error(r.error)
      if (/stock insuficiente/i.test(r.error)) abrirSolicitud(fila.repuestos)
      reps.refetch({ silencioso: true })
    }
  }

  const eliminar = async (fila) => {
    const ok = await confirm({
      titulo: 'Quitar repuesto',
      mensaje: `¿Quitar ${fila.repuestos?.nombre} × ${fila.cantidad} de la orden? Las unidades vuelven a bodega.`,
      confirmarTexto: 'Quitar',
      peligro: true,
    })
    if (!ok) return
    const r = await reps.eliminar(fila.id)
    if (r.ok) toast.success('Repuesto devuelto a bodega')
    else toast.error(r.error)
  }

  const solicitudCreada = () => {
    sols.refetch({ silencioso: true })
    refetch({ silencioso: true })
  }

  return (
    <>
      <OrdenTallerHeader orden={orden} esMia={esMia} seccion="Repuestos" badges={{ repuestos: reps.repuestos.length }} />

      {esMia && !editable && (
        <p className="callout section-sm">
          {orden.estado === 'esperando_aprobacion'
            ? 'El presupuesto está en manos del cliente: los repuestos no se pueden modificar hasta su respuesta.'
            : `Con la orden en estado "${etiquetaEstado(orden.estado)}" los repuestos son solo de consulta.`}
        </p>
      )}

      <div className="grid-2 section">
        {editable && (
          <Card titulo="Buscar en bodega">
            <RepuestoSearch onAgregar={agregar} onSolicitar={puedeSolicitar ? abrirSolicitud : undefined} deshabilitado={reps.pending} />
          </Card>
        )}
        <Card
          titulo={`Repuestos de la orden (${reps.repuestos.length})`}
          className={editable ? undefined : 'span-all'}
          acciones={
            puedeSolicitar && (
              <Button size="sm" onClick={() => abrirSolicitud(null)}>
                Solicitar repuesto no catalogado
              </Button>
            )
          }
        >
          {reps.error ? (
            <ErrorState mensaje={reps.error} onRetry={reps.refetch} />
          ) : (
            <RepuestosOrdenList
              repuestos={reps.repuestos}
              editable={editable}
              deshabilitado={reps.pending}
              onCambiarCantidad={cambiarCantidad}
              onEliminar={eliminar}
              onSolicitar={puedeSolicitar ? (rep) => abrirSolicitud(rep) : undefined}
            />
          )}
        </Card>
      </div>

      {esMia && (
        <Card titulo="Solicitudes de compra de esta orden">
          {!sols.solicitudes.length ? (
            <EmptyState mensaje="No has solicitado repuestos para esta orden" compacto />
          ) : (
            <ul className="list">
              {sols.solicitudes.map((s) => (
                <li key={s.id} className="list__item">
                  <div className="list__main">
                    <span className="list__title">
                      {s.repuestos?.nombre ?? s.descripcion_repuesto} × {s.cantidad}
                    </span>
                    <span className="muted small">
                      {formatFechaHora(s.created_at)}
                      {s.repuestos && s.descripcion_repuesto ? ` · ${s.descripcion_repuesto}` : ''}
                    </span>
                  </div>
                  <Badge tono={TONO_SOL[s.estado]}>{ESTADOS_SOLICITUD[s.estado] ?? s.estado}</Badge>
                </li>
              ))}
            </ul>
          )}
          {orden.estado === 'esperando_repuesto' && (
            <p className="muted small section-sm">
              Cuando el repuesto llegue a bodega, agrégalo a la orden y retoma el trabajo desde “Avance y estado”.
            </p>
          )}
        </Card>
      )}

      {solicitud && (
        <SolicitudCompraModal
          open
          orden={orden}
          repuesto={solicitud.repuesto}
          sugerido={solicitud.sugerido}
          onClose={() => setSolicitud(null)}
          onCreada={solicitudCreada}
        />
      )}
      <ConfirmDialog {...dialogProps} />
    </>
  )
}
