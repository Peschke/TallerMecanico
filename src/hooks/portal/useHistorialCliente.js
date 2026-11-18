import { useMemo } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { historialService } from '@/services/historialService'

// CU-15 · RF36: historial de servicios cerrados del vehículo. orden: 'asc' (cronológico) | 'desc'
export function useHistorialCliente({ patente, codigo, orden = 'asc' } = {}) {
  const q = useSupabaseQuery(() => historialService.vehiculo(patente, codigo), [patente, codigo], {
    enabled: Boolean(patente && codigo),
    initialData: [],
    keepPrevious: false,
  })
  const servicios = useMemo(() => {
    const lista = [...(q.data ?? [])]
    lista.sort((a, b) => (new Date(a.fecha_ingreso) - new Date(b.fecha_ingreso)) * (orden === 'asc' ? 1 : -1))
    return lista
  }, [q.data, orden])
  return { ...q, servicios }
}

// Detalle de una orden histórica (cliente autenticado; RLS)
export function useDetalleHistorico(codigo, { enabled = true } = {}) {
  return useSupabaseQuery(() => historialService.detalle(codigo), [codigo], { enabled: Boolean(codigo) && enabled })
}
