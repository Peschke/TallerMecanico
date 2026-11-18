import { useAuth } from '@/hooks/core/useAuth'
import { useOrden } from '@/hooks/ordenes/useOrden'
import { estaAbierta } from '@/lib/constants/estados'

// Orden vista por el mecánico: indica si le pertenece y si aún admite trabajo
export function useOrdenTaller(ordenId) {
  const { perfil } = useAuth()
  const q = useOrden(ordenId)
  const orden = q.orden
  const esMia = Boolean(orden && perfil && orden.mecanico_id === perfil.id)
  const enCurso = Boolean(orden && estaAbierta(orden.estado) && !['trabajo_terminado', 'listo_entrega'].includes(orden.estado))
  return { ...q, orden, esMia, puedeTrabajar: esMia && enCurso }
}
