import { supabase } from '@/lib/supabaseClient'

// CU-07 · RF18. El trigger fn_avance_after_insert copia el porcentaje a ordenes_trabajo.avance_pct.
export const avancesService = {
  listar: (ordenId) =>
    supabase.from('avances_orden').select('id, porcentaje, nota, created_at, perfiles(nombre_completo)').eq('orden_id', ordenId).order('created_at', { ascending: false }),

  registrar: ({ ordenId, porcentaje, nota, observaciones }) => {
    const texto = observaciones?.trim() ? `${nota.trim()}\nObservaciones: ${observaciones.trim()}` : nota.trim()
    return supabase
      .from('avances_orden')
      .insert({ orden_id: ordenId, porcentaje: porcentaje === '' || porcentaje == null ? null : Number(porcentaje), nota: texto })
      .select('id, porcentaje, nota, created_at')
      .single()
  },
}
