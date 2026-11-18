import { useCallback } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { diagnosticosService } from '@/services/diagnosticosService'

// CU-05 · RF12, RF13: diagnósticos y checklist de tareas de una orden
export function useDiagnosticos(ordenId) {
  const q = useSupabaseQuery(
    async () => {
      const [d, t] = await Promise.all([diagnosticosService.listar(ordenId), diagnosticosService.tareas(ordenId)])
      const err = d.error || t.error
      if (err) throw err
      return { diagnosticos: d.data, tareas: t.data }
    },
    [ordenId],
    { enabled: Boolean(ordenId), initialData: { diagnosticos: [], tareas: [] } },
  )
  const { setData } = q

  const reg = useSupabaseMutation((datos) => diagnosticosService.registrar({ ordenId, ...datos }))
  const upd = useSupabaseMutation((id, datos) => diagnosticosService.actualizar(id, datos))
  const add = useSupabaseMutation((diagnosticoId, tareas) => diagnosticosService.agregarTareas(ordenId, diagnosticoId, tareas))
  const mark = useSupabaseMutation((id, completada) => diagnosticosService.marcarTarea(id, completada))
  const del = useSupabaseMutation((id) => diagnosticosService.eliminarTarea(id))

  const registrar = useCallback(
    async (datos) => {
      const r = await reg.mutate(datos)
      if (r.ok) await q.refetch({ silencioso: true })
      return r
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reg.mutate, q.refetch],
  )

  const actualizar = useCallback(
    async (id, datos) => {
      const r = await upd.mutate(id, datos)
      if (r.ok) setData((d) => ({ ...d, diagnosticos: d.diagnosticos.map((x) => (x.id === id ? r.data : x)) }))
      return r
    },
    [upd.mutate, setData],
  )

  const agregarTareas = useCallback(
    async (diagnosticoId, tareas) => {
      const r = await add.mutate(diagnosticoId, tareas)
      if (r.ok) setData((d) => ({ ...d, tareas: [...d.tareas, ...(r.data ?? [])] }))
      return r
    },
    [add.mutate, setData],
  )

  // Optimista: marca en pantalla y revierte si falla
  const marcarTarea = useCallback(
    async (id, completada) => {
      setData((d) => ({ ...d, tareas: d.tareas.map((t) => (t.id === id ? { ...t, completada } : t)) }))
      const r = await mark.mutate(id, completada)
      setData((d) => ({ ...d, tareas: d.tareas.map((t) => (t.id === id ? (r.ok ? r.data : { ...t, completada: !completada }) : t)) }))
      return r
    },
    [mark.mutate, setData],
  )

  const eliminarTarea = useCallback(
    async (id) => {
      const r = await del.mutate(id)
      if (r.ok) setData((d) => ({ ...d, tareas: d.tareas.filter((t) => t.id !== id) }))
      return r
    },
    [del.mutate, setData],
  )

  return {
    ...q,
    diagnosticos: q.data?.diagnosticos ?? [],
    tareas: q.data?.tareas ?? [],
    registrar,
    actualizar,
    agregarTareas,
    marcarTarea,
    eliminarTarea,
    pending: reg.pending || upd.pending || add.pending || del.pending,
  }
}
