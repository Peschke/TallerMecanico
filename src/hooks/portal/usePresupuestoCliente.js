import { useCallback, useRef } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useSupabaseMutation } from '@/hooks/core/useSupabaseMutation'
import { useAuth } from '@/hooks/core/useAuth'
import { useRealtimeTable } from '@/hooks/core/useRealtimeTable'
import { presupuestoClienteService } from '@/services/presupuestoClienteService'
import { useEstadoVehiculo } from './useEstadoVehiculo'

/**
 * CU-14: presupuesto vigente de la orden (desde consultar_estado_orden) y respuesta del cliente.
 * aprobar() → orden "Presupuesto Aprobado" y aviso al taller y al mecánico (RF34).
 * rechazar(motivo) → motivo obligatorio (RF35), orden "Presupuesto Rechazado" y aviso al taller.
 */
export function usePresupuestoCliente({ patente, codigo, ordenId } = {}) {
  const e = useEstadoVehiculo({ patente, codigo, ordenId })
  const { setData } = e
  const m = useSupabaseMutation((aprobar, motivo) => presupuestoClienteService.responder({ patente, codigo, aprobar, motivo }))

  const responder = useCallback(
    async (aprobar, motivo) => {
      if (!aprobar && !motivo?.trim()) return { ok: false, error: 'Indica el motivo del rechazo.' }
      const r = await m.mutate(aprobar, motivo)
      if (r.ok && r.data) setData(r.data)
      return r
    },
    [m.mutate, setData],
  )

  const presupuesto = e.estado?.presupuesto ?? null
  return {
    ...e,
    presupuesto,
    puedeResponder: presupuesto?.estado === 'publicado' && e.estado?.estado === 'esperando_aprobacion',
    aprobar: () => responder(true),
    rechazar: (motivo) => responder(false, motivo),
    pending: m.pending,
  }
}

// Lista de presupuestos del cliente (pendientes primero)
export function usePresupuestosCliente() {
  const { cliente } = useAuth()
  const q = useSupabaseQuery(() => presupuestoClienteService.listar(cliente?.id), [cliente?.id], { enabled: Boolean(cliente?.id), initialData: [] })
  const timer = useRef(null)
  // Publicar o responder un presupuesto cambia el estado de la orden: se usa como señal en vivo
  useRealtimeTable({
    table: 'ordenes_trabajo',
    event: 'UPDATE',
    filter: cliente?.id ? `cliente_id=eq.${cliente.id}` : undefined,
    enabled: Boolean(cliente?.id),
    onChange: () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => q.refetch({ silencioso: true }), 500)
    },
  })
  const lista = q.data ?? []
  return { ...q, pendientes: lista.filter((p) => p.estado === 'publicado'), respondidos: lista.filter((p) => p.estado !== 'publicado') }
}
