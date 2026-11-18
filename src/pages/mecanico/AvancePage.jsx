import { useState } from 'react'
import { useParams } from 'react-router-dom'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import ProgressBar from '@/components/ui/ProgressBar'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import EtapaStepper from '@/components/domain/ordenes/EtapaStepper'
import AvancesList from '@/components/domain/ordenes/AvancesList'
import TransicionButtons from '@/components/domain/ordenes/TransicionButtons'
import TareasChecklist from '@/components/domain/diagnostico/TareasChecklist'
import OrdenTallerHeader from '@/components/domain/taller/OrdenTallerHeader'
import AvanceForm, { AVANCE_VACIO, validarAvance } from '@/components/domain/taller/AvanceForm'
import FinalizarTrabajoModal from '@/components/domain/taller/FinalizarTrabajoModal'
import { useOrdenTaller } from '@/hooks/taller/useOrdenTaller'
import { useAvances } from '@/hooks/taller/useAvances'
import { useDiagnosticos } from '@/hooks/taller/useDiagnosticos'
import { useTransicionesDisponibles } from '@/hooks/ordenes/useTransicionesDisponibles'
import { useToast } from '@/hooks/core/useToast'
import { etiquetaEstado } from '@/lib/constants/estados'

const MENSAJE_ESTADO = {
  por_diagnosticar: 'Primero registra el diagnóstico de la orden.',
  diagnosticado: 'Esperando que el administrador prepare el presupuesto.',
  esperando_aprobacion: 'Esperando la aprobación del cliente. No inicies la reparación.',
  presupuesto_rechazado: 'El cliente rechazó el presupuesto. No corresponde reparar.',
  presupuesto_aprobado: 'Presupuesto aprobado. Inicia la reparación cuando comiences.',
  esperando_repuesto: 'Orden detenida por repuestos. Retómala cuando lleguen.',
  en_reparacion: 'Reparación en curso.',
  pruebas_ruta: 'Vehículo en pruebas de ruta.',
}

// CU-07 · RF18, RF19: avance de reparación, cambios de estado y término del trabajo
export default function AvancePage() {
  const { ordenId } = useParams()
  const toast = useToast()
  const { orden, loading, error, refetch, esMia, puedeTrabajar } = useOrdenTaller(ordenId)
  const av = useAvances(esMia ? ordenId : null)
  const diag = useDiagnosticos(esMia ? ordenId : null)
  const transiciones = useTransicionesDisponibles(orden?.estado)
  const [form, setForm] = useState(AVANCE_VACIO)
  const [errores, setErrores] = useState({})
  const [finalizar, setFinalizar] = useState(false)

  if (loading && !orden) return <SplashScreen />
  if (error) return <ErrorState mensaje={error} onRetry={refetch} />
  if (!orden) return <EmptyState mensaje="Orden no encontrada" accion={<Button to="/taller/trabajos">Volver</Button>} />

  const puedeFinalizar = puedeTrabajar && transiciones.some((t) => t.destino === 'trabajo_terminado')
  const admiteAvance = puedeTrabajar && ['presupuesto_aprobado', 'en_reparacion', 'pruebas_ruta', 'esperando_repuesto'].includes(orden.estado)
  const pendientes = diag.tareas.filter((t) => !t.completada).length

  const recargar = () => refetch({ silencioso: true })

  const registrar = async () => {
    const err = validarAvance(form)
    setErrores(err)
    if (Object.keys(err).length) return
    const r = await av.registrar(form)
    if (!r.ok) return toast.error(r.error)
    toast.success('Avance registrado')
    setForm(AVANCE_VACIO)
    recargar()
  }

  const toggle = async (id, completada) => {
    const r = await diag.marcarTarea(id, completada)
    if (!r.ok) toast.error(r.error)
  }

  return (
    <>
      <OrdenTallerHeader orden={orden} esMia={esMia} seccion="Avance y estado" />

      <Card titulo="Estado del trabajo" className="section">
        <EtapaStepper estado={orden.estado} />
        <div className="row-wrap section-sm">
          <EstadoBadge estado={orden.estado} />
          <span className="muted">{MENSAJE_ESTADO[orden.estado] ?? etiquetaEstado(orden.estado)}</span>
        </div>
        <div className="section-sm">
          <ProgressBar value={orden.avance_pct} label="Avance de la reparación" />
        </div>
        {puedeTrabajar && (
          <div className="estado-acciones section-sm">
            <TransicionButtons orden={orden} onCambio={recargar} excluir={['trabajo_terminado']} size="lg" />
            {puedeFinalizar && (
              <Button variant="primary" size="lg" onClick={() => setFinalizar(true)}>
                Finalizar trabajo
              </Button>
            )}
          </div>
        )}
        {['trabajo_terminado', 'listo_entrega', 'pagado_cerrado'].includes(orden.estado) && orden.observaciones_finales && (
          <>
            <p className="lbl-sec">Observaciones finales</p>
            <p className="prewrap">{orden.observaciones_finales}</p>
          </>
        )}
      </Card>

      <div className="grid-2 section">
        {admiteAvance && (
          <Card titulo="Registrar avance">
            <AvanceForm value={form} onChange={setForm} errores={errores} avanceActual={orden.avance_pct} deshabilitado={av.pending} />
            <div className="form-actions">
              <Button variant="primary" size="lg" loading={av.pending} onClick={registrar}>
                Guardar avance
              </Button>
            </div>
          </Card>
        )}
        {esMia && (
          <Card titulo="Checklist de tareas" className={admiteAvance ? undefined : 'span-all'}>
            <TareasChecklist tareas={diag.tareas} editable={puedeTrabajar} onToggle={toggle} deshabilitado={diag.pending} />
          </Card>
        )}
      </div>

      {esMia && (
        <Card titulo="Historial de avances">
          {av.error ? <ErrorState mensaje={av.error} onRetry={av.refetch} /> : <AvancesList avances={av.avances} />}
        </Card>
      )}

      <FinalizarTrabajoModal open={finalizar} orden={orden} tareasPendientes={pendientes} onClose={() => setFinalizar(false)} onFinalizado={recargar} />
    </>
  )
}
