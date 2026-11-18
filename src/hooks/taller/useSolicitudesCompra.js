import { useCallback } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { useAuth } from '@/hooks/core/useAuth'
import { solicitudesService } from '@/services/solicitudesService'

// Administración: todas las solicitudes con filtros
export function useSolicitudesCompra(filtros = {}) {
  const key = JSON.stringify(filtros)
  const q = useSupabaseQuery(() => solicitudesService.listar(filtros), [key], { initialData: [] })
  return { ...q, solicitudes: q.data ?? [] }
}

// Mecánico: solicitudes creadas por mí
export function useMisSolicitudes({ estado } = {}) {
  const { perfil } = useAuth()
  const q = useSupabaseQuery(() => solicitudesService.propias(perfil.id, { estado }), [perfil?.id, estado], {
    enabled: Boolean(perfil?.id),
    initialData: [],
  })
  return { ...q, solicitudes: q.data ?? [] }
}

// Solicitudes asociadas a una orden
export function useSolicitudesOrden(ordenId) {
  const q = useSupabaseQuery(() => solicitudesService.porOrden(ordenId), [ordenId], { enabled: Boolean(ordenId), initialData: [] })
  return { ...q, solicitudes: q.data ?? [] }
}

// CU-06 FA · RF17: solicitar repuesto faltante (la orden pasa a Esperando Repuesto por trigger)
export function useSolicitarRepuesto() {
  const m = useSupabaseMutation((datos) => solicitudesService.crear(datos))
  const solicitar = useCallback((datos) => m.mutate(datos), [m.mutate])
  return { solicitar, pending: m.pending }
}
