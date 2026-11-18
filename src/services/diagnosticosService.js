import { supabase } from '@/lib/supabaseClient'

// CU-05 · RF12, RF13, RF14
// Al insertar un diagnóstico con la orden en "Por diagnosticar", el trigger fn_diagnostico_after_insert
// la pasa a "Diagnosticado / Esperando Presupuesto" y notifica al administrador.

const COLS_DIAG = 'id, descripcion, mecanico_id, created_at, updated_at, perfiles(nombre_completo)'
const COLS_TAREA = 'id, descripcion, completada, completada_en, tarea_id, diagnostico_id, created_at'

export const SEPARADOR_OBS = '\n\nObservaciones: '

// Une descripción técnica y observaciones en el único campo de texto de diagnosticos
export const componerDiagnostico = (descripcion, observaciones) =>
  observaciones?.trim() ? `${descripcion.trim()}${SEPARADOR_OBS}${observaciones.trim()}` : descripcion.trim()

export const separarDiagnostico = (texto = '') => {
  const i = texto.indexOf(SEPARADOR_OBS)
  return i < 0 ? { descripcion: texto, observaciones: '' } : { descripcion: texto.slice(0, i), observaciones: texto.slice(i + SEPARADOR_OBS.length) }
}

const filasTareas = (ordenId, diagnosticoId, tareas) =>
  tareas
    .filter((t) => t.descripcion?.trim())
    .map((t) => ({ orden_id: ordenId, diagnostico_id: diagnosticoId ?? null, tarea_id: t.tarea_id || null, descripcion: t.descripcion.trim() }))

export const diagnosticosService = {
  listar: (ordenId) => supabase.from('diagnosticos').select(COLS_DIAG).eq('orden_id', ordenId).order('created_at'),

  tareas: (ordenId) => supabase.from('orden_tareas').select(COLS_TAREA).eq('orden_id', ordenId).order('created_at'),

  // Inserta el diagnóstico y luego sus tareas. Si las tareas fallan, el diagnóstico queda registrado y se informa.
  async registrar({ ordenId, descripcion, observaciones, tareas = [] }) {
    const { data: diag, error } = await supabase
      .from('diagnosticos')
      .insert({ orden_id: ordenId, descripcion: componerDiagnostico(descripcion, observaciones) })
      .select(COLS_DIAG)
      .single()
    if (error) return { data: null, error }
    const filas = filasTareas(ordenId, diag.id, tareas)
    if (!filas.length) return { data: { diagnostico: diag, tareas: [], errorTareas: null }, error: null }
    const t = await supabase.from('orden_tareas').insert(filas).select(COLS_TAREA)
    return { data: { diagnostico: diag, tareas: t.data ?? [], errorTareas: t.error ?? null }, error: null }
  },

  actualizar: (id, { descripcion, observaciones }) =>
    supabase.from('diagnosticos').update({ descripcion: componerDiagnostico(descripcion, observaciones) }).eq('id', id).select(COLS_DIAG).single(),

  agregarTareas: (ordenId, diagnosticoId, tareas) => supabase.from('orden_tareas').insert(filasTareas(ordenId, diagnosticoId, tareas)).select(COLS_TAREA),

  marcarTarea: (id, completada) =>
    supabase
      .from('orden_tareas')
      .update({ completada, completada_en: completada ? new Date().toISOString() : null })
      .eq('id', id)
      .select(COLS_TAREA)
      .single(),

  eliminarTarea: (id) => supabase.from('orden_tareas').delete().eq('id', id),
}
