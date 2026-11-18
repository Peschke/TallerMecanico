import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useRealtimeTable } from '@/hooks/core/useRealtimeTable'
import { useAuth } from '@/hooks/core/useAuth'
import { clientePortalService } from '@/services/clientePortalService'

const EVT = 'portal:notificaciones'
const claveVistos = (id) => `taller.portal.avisos.${id}`

// Los avisos derivados del historial de estados no son filas de notificaciones: su lectura se recuerda en este navegador
function leerVistos(id) {
  try {
    return new Set(JSON.parse(localStorage.getItem(claveVistos(id))) ?? [])
  } catch {
    return new Set()
  }
}
function guardarVistos(id, set) {
  try {
    localStorage.setItem(claveVistos(id), JSON.stringify([...set].slice(-300)))
  } catch {
    /* almacenamiento no disponible */
  }
}

const TEXTO_EVENTO = {
  esperando_aprobacion: (c) => `Tu presupuesto de la orden ${c} está listo para revisar`,
  presupuesto_aprobado: (c) => `Presupuesto de la orden ${c} aprobado: comenzamos la reparación`,
  presupuesto_rechazado: (c) => `Presupuesto de la orden ${c} rechazado`,
  trabajo_terminado: (c) => `Terminamos el trabajo de la orden ${c}`,
  listo_entrega: (c) => `Tu vehículo (orden ${c}) está listo para retirar`,
  pagado_cerrado: (c) => `Orden ${c} entregada y cerrada. ¡Gracias por preferirnos!`,
}
const TIPO_EVENTO = {
  esperando_aprobacion: 'presupuesto_publicado',
  presupuesto_aprobado: 'presupuesto_aprobado',
  presupuesto_rechazado: 'presupuesto_rechazado',
  trabajo_terminado: 'trabajo_terminado',
  listo_entrega: 'vehiculo_listo',
  pagado_cerrado: 'otro',
}

/**
 * Avisos del cliente: notificaciones dirigidas a él (tabla notificaciones) + cambios de estado relevantes
 * de sus órdenes (presupuesto aprobado/rechazado, listo para entrega…). En vivo.
 */
export function useNotificacionesCliente({ limite } = {}) {
  const { cliente } = useAuth()
  const id = cliente?.id
  const [vistos, setVistos] = useState(() => (id ? leerVistos(id) : new Set()))
  const q = useSupabaseQuery(
    async () => {
      const [n, e] = await Promise.all([clientePortalService.notificaciones(id), clientePortalService.eventos(id)])
      if (n.error || e.error) throw n.error || e.error
      return { notificaciones: n.data, eventos: e.data }
    },
    [id],
    { enabled: Boolean(id), initialData: { notificaciones: [], eventos: [] } },
  )
  const { refetch } = q

  useEffect(() => {
    if (id) setVistos(leerVistos(id))
  }, [id])

  // Sincroniza las distintas instancias (menú, inicio, pantalla de avisos)
  useEffect(() => {
    const on = () => {
      if (id) setVistos(leerVistos(id))
      refetch({ silencioso: true })
    }
    window.addEventListener(EVT, on)
    return () => window.removeEventListener(EVT, on)
  }, [id, refetch])

  useRealtimeTable({
    table: 'notificaciones',
    event: 'INSERT',
    filter: id ? `destinatario_cliente_id=eq.${id}` : undefined,
    enabled: Boolean(id),
    onChange: () => refetch({ silencioso: true }),
  })
  useRealtimeTable({
    table: 'ordenes_trabajo',
    event: 'UPDATE',
    filter: id ? `cliente_id=eq.${id}` : undefined,
    enabled: Boolean(id),
    onChange: () => setTimeout(() => refetch({ silencioso: true }), 600),
  })

  const avisos = useMemo(() => {
    const { notificaciones = [], eventos = [] } = q.data ?? {}
    const a = notificaciones.map((n) => ({
      id: `n-${n.id}`,
      dbId: n.id,
      origen: 'notificacion',
      tipo: n.tipo,
      mensaje: n.mensaje,
      fecha: n.enviada_en ?? n.created_at,
      leida: Boolean(n.leida_en),
      ordenId: n.orden_id,
      codigo: n.ordenes_trabajo?.codigo,
      patente: n.ordenes_trabajo?.vehiculos?.patente,
    }))
    const b = eventos.map((e) => ({
      id: `e-${e.id}`,
      origen: 'estado',
      tipo: TIPO_EVENTO[e.estado_nuevo] ?? 'otro',
      mensaje: TEXTO_EVENTO[e.estado_nuevo]?.(e.ordenes_trabajo?.codigo) ?? e.nota,
      detalle: e.estado_nuevo === 'presupuesto_rechazado' ? e.nota : null,
      fecha: e.created_at,
      leida: vistos.has(`e-${e.id}`),
      ordenId: e.orden_id,
      codigo: e.ordenes_trabajo?.codigo,
      patente: e.ordenes_trabajo?.vehiculos?.patente,
    }))
    const todos = [...a, ...b].sort((x, y) => new Date(y.fecha) - new Date(x.fecha))
    return limite ? todos.slice(0, limite) : todos
  }, [q.data, vistos, limite])

  const marcarLeidas = useCallback(
    async (lista) => {
      const objetivo = (lista ?? avisos).filter((x) => !x.leida)
      if (!objetivo.length) return { ok: true }
      const nuevos = new Set(leerVistos(id))
      objetivo.filter((x) => x.origen === 'estado').forEach((x) => nuevos.add(x.id))
      guardarVistos(id, nuevos)
      setVistos(nuevos)
      const dbIds = objetivo.filter((x) => x.origen === 'notificacion').map((x) => x.dbId)
      let error = null
      if (dbIds.length) {
        const r = await clientePortalService.marcarNotificaciones(dbIds)
        error = r.error
      }
      window.dispatchEvent(new Event(EVT))
      return { ok: !error, error }
    },
    [avisos, id],
  )

  const noLeidas = avisos.filter((x) => !x.leida).length
  return { ...q, avisos, noLeidas, marcarLeidas }
}
