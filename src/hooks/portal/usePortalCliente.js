import { useMemo, useRef } from 'react'
import { useSupabaseQuery } from '@/hooks/core/useSupabaseQuery'
import { useRealtimeTable } from '@/hooks/core/useRealtimeTable'
import { useAuth } from '@/hooks/core/useAuth'
import { clientePortalService } from '@/services/clientePortalService'
import { presupuestoClienteService } from '@/services/presupuestoClienteService'
import { estaAbierta } from '@/lib/constants/estados'

const LISTOS = ['trabajo_terminado', 'listo_entrega']

// Dashboard del cliente: vehículos, reparaciones en curso, presupuestos pendientes y listos (RNF11, en vivo)
export function usePortalCliente() {
  const { cliente } = useAuth()
  const id = cliente?.id
  const q = useSupabaseQuery(
    async () => {
      const [v, o, p] = await Promise.all([
        clientePortalService.vehiculos(id),
        clientePortalService.ordenes(id),
        presupuestoClienteService.listar(id, { soloPendientes: true }),
      ])
      const err = v.error || o.error || p.error
      if (err) throw err
      return { vehiculos: v.data, ordenes: o.data, pendientes: p.data }
    },
    [id],
    { enabled: Boolean(id), initialData: { vehiculos: [], ordenes: [], pendientes: [] } },
  )

  const timer = useRef(null)
  const realtimeStatus = useRealtimeTable({
    table: 'ordenes_trabajo',
    filter: id ? `cliente_id=eq.${id}` : undefined,
    enabled: Boolean(id),
    onChange: () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => q.refetch({ silencioso: true }), 400)
    },
  })

  const derivado = useMemo(() => {
    const { vehiculos = [], ordenes = [], pendientes = [] } = q.data ?? {}
    // Vehículos propios + vehículos con órdenes a nombre del cliente
    const mapa = new Map(vehiculos.map((v) => [v.id, { ...v, ordenes: v.ordenes_trabajo ?? [] }]))
    for (const o of ordenes) {
      if (o.vehiculos && !mapa.has(o.vehiculos.id)) mapa.set(o.vehiculos.id, { ...o.vehiculos, ordenes: [] })
      const v = mapa.get(o.vehiculos?.id)
      if (v && !v.ordenes.some((x) => x.id === o.id)) v.ordenes.push(o)
    }
    const lista = [...mapa.values()].map((v) => {
      const ords = [...v.ordenes].sort((a, b) => new Date(b.fecha_ingreso) - new Date(a.fecha_ingreso))
      return { ...v, ordenes: ords, ordenActual: ords.find((o) => estaAbierta(o.estado)) ?? null, ultimaOrden: ords[0] ?? null }
    })
    const abiertas = ordenes.filter((o) => estaAbierta(o.estado))
    return {
      vehiculos: lista,
      vehiculosActivos: lista.filter((v) => v.ordenActual),
      ordenes,
      enCurso: abiertas.filter((o) => !LISTOS.includes(o.estado)),
      listos: abiertas.filter((o) => LISTOS.includes(o.estado)),
      presupuestosPendientes: pendientes,
    }
  }, [q.data])

  return { ...q, ...derivado, realtimeStatus }
}
