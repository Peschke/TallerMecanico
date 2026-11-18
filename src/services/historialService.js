import { supabase } from '@/lib/supabaseClient'

// CU-15 · RF36: servicios cerrados del vehículo (consultar_historial_vehiculo)

export const historialService = {
  vehiculo: (patente, codigoSeguimiento) => supabase.rpc('consultar_historial_vehiculo', { p_patente: patente, p_codigo: codigoSeguimiento }),

  // Detalle de una orden histórica del cliente autenticado (RLS): diagnósticos completos y tareas
  detalle: (codigo) =>
    supabase
      .from('ordenes_trabajo')
      .select(
        'id, codigo, kilometraje, motivo_ingreso, observaciones_finales, fecha_ingreso, fecha_entrega, vehiculos(patente, marca, modelo, anio), diagnosticos(id, descripcion, created_at), orden_tareas(id, descripcion, completada, completada_en)',
      )
      .eq('codigo', codigo)
      .order('created_at', { referencedTable: 'diagnosticos' })
      .maybeSingle(),
}
