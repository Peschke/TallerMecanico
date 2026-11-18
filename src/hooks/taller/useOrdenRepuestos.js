import { useCallback } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { repuestosOrdenService } from '@/services/repuestosOrdenService'

// CU-06 · RF15, RF16: repuestos asignados a la orden
export function useOrdenRepuestos(ordenId) {
  const q = useSupabaseQuery(() => repuestosOrdenService.listar(ordenId), [ordenId], { enabled: Boolean(ordenId), initialData: [] })
  const add = useSupabaseMutation((repuestoId, cantidad) => repuestosOrdenService.agregar(ordenId, repuestoId, cantidad))
  const upd = useSupabaseMutation((id, cantidad) => repuestosOrdenService.actualizarCantidad(id, cantidad))
  const del = useSupabaseMutation((id) => repuestosOrdenService.eliminar(id))
  const { setData } = q

  const agregar = useCallback(
    async (repuestoId, cantidad) => {
      const r = await add.mutate(repuestoId, cantidad)
      if (r.ok) setData((lista) => [...(lista ?? []).filter((x) => x.id !== r.data.id), r.data])
      return r
    },
    [add.mutate, setData],
  )

  const cambiarCantidad = useCallback(
    async (id, cantidad) => {
      const r = await upd.mutate(id, cantidad)
      if (r.ok) setData((lista) => lista.map((x) => (x.id === id ? r.data : x)))
      return r
    },
    [upd.mutate, setData],
  )

  const eliminar = useCallback(
    async (id) => {
      const r = await del.mutate(id)
      if (r.ok) setData((lista) => lista.filter((x) => x.id !== id))
      return r
    },
    [del.mutate, setData],
  )

  return { ...q, repuestos: q.data ?? [], agregar, cambiarCantidad, eliminar, pending: add.pending || upd.pending || del.pending }
}

// Buscador del catálogo de repuestos activos con stock
export function useBuscarRepuestos(texto, { enabled = true } = {}) {
  const q = useSupabaseQuery(() => repuestosOrdenService.buscarRepuestos(texto), [texto], { enabled, initialData: [] })
  return { ...q, resultados: q.data ?? [] }
}
