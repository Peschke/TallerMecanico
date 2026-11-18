import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRealtimeTable } from '@/hooks/core/useRealtimeTable'
import { useAuth } from '@/hooks/core/useAuth'
import { ROLES } from '@/lib/constants/roles'

const contar = async (tabla, col, valor) => {
  const { count } = await supabase.from(tabla).select('id', { count: 'exact', head: true }).eq(col, valor)
  return count ?? 0
}

// Contadores del menú. Se refrescan con cada cambio en ordenes_trabajo y cada 60 s.
export function useNavBadges(rol) {
  const [badges, setBadges] = useState({})
  const timer = useRef(null)
  const { perfil } = useAuth()
  const uid = perfil?.id

  const cargar = useCallback(async () => {
    if (rol === ROLES.ADMIN) {
      const [presupuestos, compras, porNotificar] = await Promise.all([
        contar('v_panel_ordenes', 'estado', 'diagnosticado'),
        contar('solicitudes_compra', 'estado', 'pendiente'),
        contar('v_panel_ordenes', 'estado', 'trabajo_terminado'),
      ])
      setBadges({ presupuestos, compras, porNotificar })
    } else if (rol === ROLES.RECEPCIONISTA) {
      setBadges({ porNotificar: await contar('v_panel_ordenes', 'estado', 'trabajo_terminado') })
    } else if (rol === ROLES.MECANICO && uid) {
      // Trabajo que requiere acción del mecánico: diagnosticar o iniciar reparación aprobada
      const [pend, sols] = await Promise.all([
        supabase
          .from('ordenes_trabajo')
          .select('id', { count: 'exact', head: true })
          .eq('mecanico_id', uid)
          .in('estado', ['por_diagnosticar', 'presupuesto_aprobado']),
        supabase.from('solicitudes_compra').select('id', { count: 'exact', head: true }).eq('solicitado_por', uid).eq('estado', 'recibida'),
      ])
      setBadges({ pendientes: pend.count ?? 0, solicitudes: sols.count ?? 0 })
    }
  }, [rol, uid])

  useEffect(() => {
    cargar()
    const id = setInterval(cargar, 60_000)
    return () => clearInterval(id)
  }, [cargar])

  useRealtimeTable({
    table: 'ordenes_trabajo',
    enabled: rol === ROLES.ADMIN || rol === ROLES.RECEPCIONISTA || (rol === ROLES.MECANICO && Boolean(uid)),
    onChange: () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(cargar, 800)
    },
  })

  return badges
}
