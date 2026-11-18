import { supabase } from '@/lib/supabaseClient'

// CU-06 · RF15, RF16. Los triggers de orden_repuestos descuentan/devuelven stock en el kárdex
// y rechazan la operación si no hay stock suficiente o la orden no admite cambios.

const COLS = 'id, orden_id, cantidad, created_at, repuestos(id, codigo, nombre, stock, stock_minimo)'
const COLS_REP = 'id, codigo, nombre, stock, stock_minimo, categorias_repuesto(nombre)'

const limpiar = (t) => String(t ?? '').replace(/[%_,()*]/g, ' ').trim()

// Estados en que el trigger fn_orden_repuesto_before acepta cambios
export const ESTADOS_EDITAN_REPUESTOS = ['por_diagnosticar', 'diagnosticado', 'presupuesto_aprobado', 'esperando_repuesto', 'en_reparacion', 'pruebas_ruta']

export const repuestosOrdenService = {
  listar: (ordenId) => supabase.from('orden_repuestos').select(COLS).eq('orden_id', ordenId).order('created_at'),

  buscarRepuestos: (texto, limite = 12) => {
    let q = supabase.from('repuestos').select(COLS_REP).eq('activo', true)
    const t = limpiar(texto)
    if (t) q = q.or(`nombre.ilike.%${t}%,codigo.ilike.%${t}%`)
    return q.order('nombre').limit(limite)
  },

  // Si el repuesto ya está en la orden se suma la cantidad (unique orden_id + repuesto_id)
  async agregar(ordenId, repuestoId, cantidad) {
    const { data: existente, error: e1 } = await supabase
      .from('orden_repuestos')
      .select('id, cantidad')
      .eq('orden_id', ordenId)
      .eq('repuesto_id', repuestoId)
      .maybeSingle()
    if (e1) return { data: null, error: e1 }
    if (existente) {
      return supabase.from('orden_repuestos').update({ cantidad: existente.cantidad + cantidad }).eq('id', existente.id).select(COLS).single()
    }
    return supabase.from('orden_repuestos').insert({ orden_id: ordenId, repuesto_id: repuestoId, cantidad }).select(COLS).single()
  },

  actualizarCantidad: (id, cantidad) => supabase.from('orden_repuestos').update({ cantidad }).eq('id', id).select(COLS).single(),

  eliminar: (id) => supabase.from('orden_repuestos').delete().eq('id', id),
}
