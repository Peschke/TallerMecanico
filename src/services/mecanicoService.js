import { supabase } from '@/lib/supabaseClient'

// CU-04 · RF10, RF11. v_panel_ordenes es security_invoker: el mecánico solo ve sus órdenes y las "por asignar".
const COLS_PANEL =
  'id, codigo, estado, estado_texto, etapa, patente, marca, modelo, anio, cliente, mecanico_id, avance_pct, kilometraje, motivo_ingreso, fecha_ingreso, updated_at, horas_en_taller'

const limpiar = (t) => String(t ?? '').replace(/[%_,()*]/g, ' ').trim()

// Estados en los que el mecánico tiene trabajo por hacer
export const ESTADOS_ACTIVOS_MECANICO = [
  'por_diagnosticar',
  'diagnosticado',
  'esperando_aprobacion',
  'presupuesto_aprobado',
  'presupuesto_rechazado',
  'esperando_repuesto',
  'en_reparacion',
  'pruebas_ruta',
]
export const ESTADOS_TERMINADOS_MECANICO = ['trabajo_terminado', 'listo_entrega', 'pagado_cerrado']

export const mecanicoService = {
  // Mis trabajos con filtros por estado, patente y cliente
  trabajos({ mecanicoId, estados, patente, cliente, rango, conteo = false } = {}) {
    let q = supabase.from('v_panel_ordenes').select(COLS_PANEL, conteo ? { count: 'exact' } : undefined).eq('mecanico_id', mecanicoId)
    if (estados?.length) q = q.in('estado', estados)
    if (patente) q = q.ilike('patente', `%${limpiar(patente).toUpperCase().replace(/[^A-Z0-9]/g, '')}%`)
    if (cliente) q = q.ilike('cliente', `%${limpiar(cliente)}%`)
    q = q.order('fecha_ingreso', { ascending: false })
    if (rango) q = q.range(rango[0], rango[1])
    return q
  },

  // Dashboard: órdenes activas + terminadas en los últimos 30 días
  async resumen(mecanicoId) {
    const hace30 = new Date(Date.now() - 30 * 864e5).toISOString()
    const [activas, terminadas] = await Promise.all([
      supabase.from('v_panel_ordenes').select(COLS_PANEL).eq('mecanico_id', mecanicoId).in('estado', ESTADOS_ACTIVOS_MECANICO).order('fecha_ingreso'),
      supabase
        .from('v_panel_ordenes')
        .select(COLS_PANEL)
        .eq('mecanico_id', mecanicoId)
        .in('estado', ESTADOS_TERMINADOS_MECANICO)
        .gte('updated_at', hace30)
        .order('updated_at', { ascending: false })
        .limit(20),
    ])
    const error = activas.error || terminadas.error
    if (error) return { data: null, error }
    return { data: { activas: activas.data, terminadas: terminadas.data }, error: null }
  },

  // Cola del taller sin mecánico (solo lectura para el mecánico)
  disponibles: () => supabase.from('v_panel_ordenes').select(COLS_PANEL).eq('estado', 'por_asignar').order('fecha_ingreso'),

  // Historial relevante del vehículo: visitas anteriores con diagnóstico y repuestos (según RLS)
  historialVehiculo: (vehiculoId, excluirOrdenId) => {
    let q = supabase
      .from('ordenes_trabajo')
      .select(
        'id, codigo, estado, kilometraje, motivo_ingreso, observaciones_finales, fecha_ingreso, fecha_termino, diagnosticos(id, descripcion, created_at), orden_tareas(id, descripcion, completada)',
      )
      .eq('vehiculo_id', vehiculoId)
      .order('fecha_ingreso', { ascending: false })
      .limit(10)
    if (excluirOrdenId) q = q.neq('id', excluirOrdenId)
    return q
  },
}
