import { useMemo, useRef } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useRealtimeTable } from '@/hooks/core/useRealtimeTable'
import { useAuth } from '@/hooks/core/useAuth'
import { mecanicoService } from '@/services/mecanicoService'

// Refresca (debounce 500 ms) ante cualquier cambio en ordenes_trabajo visible para el mecánico (RNF02)
function useRefrescoEnVivo(refetch, { filter, enabled = true } = {}) {
  const timer = useRef(null)
  return useRealtimeTable({
    table: 'ordenes_trabajo',
    filter,
    enabled,
    onChange: () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => refetch({ silencioso: true }), 500)
    },
  })
}

// CU-04 · RF10: listado filtrado de mis trabajos
export function useTrabajosMecanico({ estados, patente, cliente, page = 0, pageSize = 20 } = {}) {
  const { perfil } = useAuth()
  const uid = perfil?.id
  const rango = [page * pageSize, page * pageSize + pageSize - 1]
  const key = JSON.stringify({ estados, patente, cliente, page, pageSize })
  const q = useSupabaseQuery(() => mecanicoService.trabajos({ mecanicoId: uid, estados, patente, cliente, rango, conteo: true }), [uid, key], {
    enabled: Boolean(uid),
    initialData: [],
  })
  const realtimeStatus = useRefrescoEnVivo(q.refetch, { filter: uid ? `mecanico_id=eq.${uid}` : undefined, enabled: Boolean(uid) })
  return { ...q, trabajos: q.data ?? [], total: q.count, realtimeStatus }
}

// Dashboard del mecánico agrupado por etapa de trabajo
export function useResumenMecanico() {
  const { perfil } = useAuth()
  const uid = perfil?.id
  const q = useSupabaseQuery(() => mecanicoService.resumen(uid), [uid], { enabled: Boolean(uid), initialData: { activas: [], terminadas: [] } })
  // Sin filtro: también captura la orden que se le asigna (UPDATE de mecanico_id)
  const realtimeStatus = useRefrescoEnVivo(q.refetch, { enabled: Boolean(uid) })

  const grupos = useMemo(() => {
    const activas = q.data?.activas ?? []
    const de = (...estados) => activas.filter((o) => estados.includes(o.estado))
    return {
      asignados: activas,
      porDiagnosticar: de('por_diagnosticar'),
      paraIniciar: de('presupuesto_aprobado'),
      enReparacion: de('en_reparacion', 'pruebas_ruta'),
      esperandoRepuesto: de('esperando_repuesto'),
      enEspera: de('diagnosticado', 'esperando_aprobacion', 'presupuesto_rechazado'),
      terminadas: q.data?.terminadas ?? [],
    }
  }, [q.data])

  return { ...q, ...grupos, realtimeStatus }
}

// Órdenes del taller aún sin mecánico (solo lectura)
export function useOrdenesDisponibles() {
  const q = useSupabaseQuery(() => mecanicoService.disponibles(), [], { initialData: [] })
  const realtimeStatus = useRefrescoEnVivo(q.refetch)
  return { ...q, ordenes: q.data ?? [], realtimeStatus }
}

// Historial relevante del vehículo de la orden
export function useHistorialVehiculoTaller(vehiculoId, ordenId) {
  return useSupabaseQuery(() => mecanicoService.historialVehiculo(vehiculoId, ordenId), [vehiculoId, ordenId], {
    enabled: Boolean(vehiculoId),
    initialData: [],
  })
}
