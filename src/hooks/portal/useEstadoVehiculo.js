import { useEffect } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useRealtimeTable } from '@/hooks/core/useRealtimeTable'
import { clientePortalService } from '@/services/clientePortalService'

/**
 * CU-13 · RF32: estado de una orden mediante consultar_estado_orden(patente, código de seguimiento).
 * ordenId (cliente autenticado): escucha cambios en vivo y trae observaciones e historial de estados.
 * Sin ordenId (seguimiento público): se refresca cada 60 s.
 */
export function useEstadoVehiculo({ patente, codigo, ordenId } = {}) {
  const habilitado = Boolean(patente && codigo)
  const q = useSupabaseQuery(() => clientePortalService.estado(patente, codigo), [patente, codigo], { enabled: habilitado, keepPrevious: false })
  const extra = useSupabaseQuery(
    async () => {
      const [o, h] = await Promise.all([clientePortalService.orden(ordenId), clientePortalService.historialEstados(ordenId)])
      if (o.error || h.error) throw o.error || h.error
      return { orden: o.data, historial: h.data }
    },
    [ordenId],
    { enabled: Boolean(ordenId), initialData: { orden: null, historial: [] } },
  )

  const realtimeStatus = useRealtimeTable({
    table: 'ordenes_trabajo',
    event: 'UPDATE',
    filter: ordenId ? `id=eq.${ordenId}` : undefined,
    enabled: Boolean(ordenId),
    onChange: () => {
      q.refetch({ silencioso: true })
      extra.refetch({ silencioso: true })
    },
  })

  useEffect(() => {
    if (!habilitado || ordenId) return undefined
    const t = setInterval(() => q.refetch({ silencioso: true }), 60_000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habilitado, ordenId])

  return {
    ...q,
    estado: q.data,
    orden: extra.data?.orden,
    historialEstados: extra.data?.historial ?? [],
    refetch: (o) => {
      q.refetch(o)
      if (ordenId) extra.refetch(o)
    },
    realtimeStatus,
  }
}

// Cliente autenticado: resuelve patente y código de seguimiento de su orden (RLS) para usar las RPC del portal
export function useCredencialesOrden(ordenId) {
  const q = useSupabaseQuery(() => clientePortalService.orden(ordenId), [ordenId], { enabled: Boolean(ordenId), keepPrevious: false })
  return {
    loading: q.loading,
    error: q.error,
    refetch: q.refetch,
    orden: q.data,
    noEncontrada: !q.loading && !q.error && Boolean(ordenId) && !q.data,
    patente: q.data?.vehiculos?.patente,
    codigo: q.data?.codigo_seguimiento,
  }
}
