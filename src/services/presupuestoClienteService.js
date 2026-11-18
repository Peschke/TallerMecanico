import { supabase } from '@/lib/supabaseClient'

// CU-14 · RF33, RF34, RF35. La respuesta siempre va por la RPC responder_presupuesto (patente + código de seguimiento):
// valida que el presupuesto esté publicado, exige motivo al rechazar, cambia el estado de la orden y notifica al taller.

export const presupuestoClienteService = {
  // Presupuestos visibles al cliente (RLS: nunca borradores)
  listar: (clienteId, { soloPendientes = false } = {}) => {
    let q = supabase
      .from('presupuestos')
      .select(
        'id, version, estado, total, publicado_en, respondido_en, motivo_rechazo, ordenes_trabajo!inner(id, codigo, codigo_seguimiento, estado, cliente_id, vehiculos(id, patente, marca, modelo))',
      )
      .eq('ordenes_trabajo.cliente_id', clienteId)
      .neq('estado', 'anulado')
      .order('publicado_en', { ascending: false, nullsFirst: false })
    if (soloPendientes) q = q.eq('estado', 'publicado')
    return q
  },

  responder: ({ patente, codigo, aprobar, motivo }) =>
    supabase.rpc('responder_presupuesto', { p_patente: patente, p_codigo: codigo, p_aprobar: aprobar, p_motivo: aprobar ? null : motivo?.trim() || null }),
}
