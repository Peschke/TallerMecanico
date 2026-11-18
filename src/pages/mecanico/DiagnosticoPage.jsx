import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SplashScreen from '@/components/layout/SplashScreen'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import FormField from '@/components/ui/FormField'
import OrdenTallerHeader from '@/components/domain/taller/OrdenTallerHeader'
import DiagnosticoForm, { DIAGNOSTICO_VACIO, validarDiagnostico } from '@/components/domain/diagnostico/DiagnosticoForm'
import TareasChecklist from '@/components/domain/diagnostico/TareasChecklist'
import TareasEditor from '@/components/domain/diagnostico/TareasEditor'
import { useOrdenTaller } from '@/hooks/taller/useOrdenTaller'
import { useDiagnosticos } from '@/hooks/taller/useDiagnosticos'
import { useConfirm } from '@/hooks/core/useConfirm'
import { useToast } from '@/hooks/core/useToast'
import { separarDiagnostico } from '@/services/diagnosticosService'
import { formatFechaHora } from '@/lib/format'

// CU-05 · RF12, RF13, RF14: diagnóstico técnico, tareas y observaciones
export default function DiagnosticoPage() {
  const { ordenId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { confirm, dialogProps } = useConfirm()
  const { orden, loading, error, refetch, esMia, puedeTrabajar } = useOrdenTaller(ordenId)
  const d = useDiagnosticos(ordenId)
  const [form, setForm] = useState(DIAGNOSTICO_VACIO)
  const [errores, setErrores] = useState({})
  const [complementario, setComplementario] = useState(false)
  const [nuevasTareas, setNuevasTareas] = useState([])
  const [editando, setEditando] = useState(null)
  const [errEdit, setErrEdit] = useState({})

  if ((loading && !orden) || (d.loading && !d.diagnosticos.length && !d.error)) return <SplashScreen />
  if (error || d.error) return <ErrorState mensaje={error || d.error} onRetry={() => {
          refetch()
          d.refetch()
        }} />
  if (!orden) return <EmptyState mensaje="Orden no encontrada" accion={<Button to="/taller/trabajos">Volver</Button>} />

  const primero = d.diagnosticos.length === 0
  const mostrarForm = puedeTrabajar && (primero || complementario)

  const registrar = async () => {
    const err = validarDiagnostico(form, { exigirTareas: primero })
    setErrores(err)
    if (Object.keys(err).length) return
    if (primero) {
      const ok = await confirm({
        titulo: 'Registrar diagnóstico',
        mensaje:
          orden.estado === 'por_diagnosticar'
            ? 'La orden pasará a "Diagnosticado / Esperando Presupuesto" y se notificará al administrador para preparar el presupuesto.'
            : 'Se registrará el diagnóstico en la orden.',
        confirmarTexto: 'Registrar',
      })
      if (!ok) return
    }
    const estadoAntes = orden.estado
    const r = await d.registrar({ descripcion: form.descripcion, observaciones: form.observaciones, tareas: form.tareas })
    if (!r.ok) return toast.error(r.error)
    if (r.data.errorTareas) toast.error('El diagnóstico se guardó, pero no las tareas. Agrégalas nuevamente abajo.')
    else
      toast.success(
        estadoAntes === 'por_diagnosticar' ? 'Diagnóstico registrado. Se notificó al administrador para el presupuesto.' : 'Diagnóstico complementario registrado',
      )
    setForm(DIAGNOSTICO_VACIO)
    setComplementario(false)
    refetch({ silencioso: true })
    if (estadoAntes === 'por_diagnosticar' && !r.data.errorTareas) navigate(`/taller/ordenes/${orden.id}/repuestos`)
  }

  const guardarTareas = async () => {
    if (!nuevasTareas.length) return
    const r = await d.agregarTareas(d.diagnosticos.at(-1)?.id, nuevasTareas)
    if (!r.ok) return toast.error(r.error)
    toast.success('Tareas agregadas')
    setNuevasTareas([])
  }

  const toggle = async (id, completada) => {
    const r = await d.marcarTarea(id, completada)
    if (!r.ok) toast.error(r.error)
  }

  const quitar = async (t) => {
    const ok = await confirm({ titulo: 'Quitar tarea', mensaje: `¿Quitar "${t.descripcion}" del checklist?`, confirmarTexto: 'Quitar', peligro: true })
    if (!ok) return
    const r = await d.eliminarTarea(t.id)
    if (!r.ok) toast.error(r.error)
  }

  const guardarEdicion = async () => {
    const err = validarDiagnostico({ ...editando, tareas: [] })
    setErrEdit(err)
    if (Object.keys(err).length) return
    const r = await d.actualizar(editando.id, editando)
    if (!r.ok) return toast.error(r.error)
    toast.success('Diagnóstico actualizado')
    setEditando(null)
  }

  return (
    <>
      <OrdenTallerHeader orden={orden} esMia={esMia} seccion="Diagnóstico" badges={{ diagnostico: d.diagnosticos.length }} />

      {orden.motivo_ingreso && (
        <p className="callout section-sm">
          <strong>Motivo de ingreso:</strong> {orden.motivo_ingreso}
        </p>
      )}

      {mostrarForm && (
        <Card titulo={primero ? 'Registrar diagnóstico técnico' : 'Diagnóstico complementario'} className="section">
          <DiagnosticoForm value={form} onChange={setForm} errores={errores} deshabilitado={d.pending} />
          <div className="form-actions">
            {!primero && (
              <Button onClick={() => setComplementario(false)} disabled={d.pending}>
                Cancelar
              </Button>
            )}
            <Button variant="primary" size="lg" loading={d.pending} onClick={registrar}>
              {primero ? 'Registrar diagnóstico' : 'Guardar diagnóstico complementario'}
            </Button>
          </div>
        </Card>
      )}

      {!primero && (
        <Card
          titulo="Diagnósticos registrados"
          className="section"
          acciones={
            puedeTrabajar &&
            !complementario && (
              <Button size="sm" onClick={() => setComplementario(true)}>
                Agregar complementario
              </Button>
            )
          }
        >
          <ul className="list">
            {d.diagnosticos.map((x) => {
              const p = separarDiagnostico(x.descripcion)
              return (
                <li key={x.id} className="list__item list__item--block">
                  <div className="row-wrap">
                    <strong>{formatFechaHora(x.created_at)}</strong>
                    <span className="muted small">{x.perfiles?.nombre_completo}</span>
                    {puedeTrabajar && (
                      <Button size="sm" variant="ghost" onClick={() => {
                          setErrEdit({})
                          setEditando({ id: x.id, ...p })
                        }}>
                        Editar
                      </Button>
                    )}
                  </div>
                  <p className="prewrap">{p.descripcion}</p>
                  {p.observaciones && <p className="muted prewrap">Observaciones: {p.observaciones}</p>}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {!primero && (
        <Card titulo="Checklist de tareas">
          <TareasChecklist tareas={d.tareas} editable={puedeTrabajar} onToggle={toggle} onEliminar={quitar} deshabilitado={d.pending} />
          {puedeTrabajar && (
            <div className="section-sm">
              <FormField label="Agregar tareas" htmlFor="extra-tareas-cat">
                <TareasEditor value={nuevasTareas} onChange={setNuevasTareas} idPrefix="extra-tareas" deshabilitado={d.pending} />
              </FormField>
              {nuevasTareas.length > 0 && (
                <div className="form-actions">
                  <Button variant="primary" loading={d.pending} onClick={guardarTareas}>
                    Guardar {nuevasTareas.length} tarea(s)
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {primero && !puedeTrabajar && <EmptyState mensaje="Esta orden aún no tiene diagnóstico" />}

      <Modal
        open={Boolean(editando)}
        titulo="Editar diagnóstico"
        onClose={() => setEditando(null)}
        footer={
          <>
            <Button onClick={() => setEditando(null)}>Cancelar</Button>
            <Button variant="primary" loading={d.pending} onClick={guardarEdicion}>
              Guardar
            </Button>
          </>
        }
      >
        {editando && <DiagnosticoForm value={{ ...editando, tareas: [] }} onChange={(v) => setEditando({ ...editando, ...v })} errores={errEdit} conTareas={false} idPrefix="edit-diag" />}
      </Modal>
      <ConfirmDialog {...dialogProps} />
    </>
  )
}
