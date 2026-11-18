import { useCallback } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { useRealtimeTable } from '@/hooks/core/useRealtimeTable'
import { avancesService } from '@/services/avancesService'

// CU-07 · RF18: avances de reparación de una orden, en vivo
export function useAvances(ordenId) {
  const q = useSupabaseQuery(() => avancesService.listar(ordenId), [ordenId], { enabled: Boolean(ordenId), initialData: [] })
  useRealtimeTable({
    table: 'avances_orden',
    event: 'INSERT',
    filter: ordenId ? `orden_id=eq.${ordenId}` : undefined,
    enabled: Boolean(ordenId),
    onChange: () => q.refetch({ silencioso: true }),
  })
  const m = useSupabaseMutation((datos) => avancesService.registrar({ ordenId, ...datos }))
  const registrar = useCallback(
    async (datos) => {
      const r = await m.mutate(datos)
      if (r.ok) await q.refetch({ silencioso: true })
      return r
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [m.mutate, q.refetch],
  )
  return { ...q, avances: q.data ?? [], registrar, pending: m.pending }
}
