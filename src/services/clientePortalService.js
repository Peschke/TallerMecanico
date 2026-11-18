import { supabase } from '@/lib/supabaseClient'
import { ESTADOS_CERRADOS } from '@/lib/constants/estados'

// Portal del cliente autenticado. RLS (RNF11) limita cada consulta a sus propios vehículos, órdenes y avisos.

const COLS_ORDEN =
  'id, codigo, codigo_seguimiento, estado, avance_pct, kilometraje, fecha_ingreso, fecha_termino, fecha_entrega, updated_at, vehiculo_id'

// Avisos derivados del historial de estados que interesan al cliente
export const ESTADOS_AVISO_CLIENTE = ['presupuesto_aprobado', 'presupuesto_rechazado', 'esperando_aprobacion', 'trabajo_terminado', 'listo_entrega', 'pagado_cerrado']

export const clientePortalService = {
  // Vehículos del cliente con sus órdenes (más reciente primero)
  vehiculos: (clienteId) =>
    supabase
      .from('vehiculos')
      .select(`id, patente, marca, modelo, anio, color, ordenes_trabajo(${COLS_ORDEN})`)
      .eq('cliente_id', clienteId)
      .order('patente')
      .order('fecha_ingreso', { referencedTable: 'ordenes_trabajo', ascending: false }),

  // Órdenes del cliente (incluye vehículos que ya no son suyos pero con órdenes a su nombre)
  ordenes: (clienteId, { abiertas = false } = {}) => {
    let q = supabase
      .from('ordenes_trabajo')
      .select(`${COLS_ORDEN}, vehiculos(id, patente, marca, modelo, anio)`)
      .eq('cliente_id', clienteId)
      .order('fecha_ingreso', { ascending: false })
    if (abiertas) q = q.not('estado', 'in', `(${ESTADOS_CERRADOS.join(',')})`)
    return q
  },

  // Datos complementarios de una orden (observaciones y vehículo)
  orden: (ordenId) =>
    supabase
      .from('ordenes_trabajo')
      .select(`${COLS_ORDEN}, motivo_ingreso, observaciones_ingreso, observaciones_finales, nivel_combustible, vehiculos(id, patente, marca, modelo, anio, color)`)
      .eq('id', ordenId)
      .maybeSingle(),

  // CU-13 · RF32: estado oficial mediante la RPC del portal
  estado: (patente, codigoSeguimiento) => supabase.rpc('consultar_estado_orden', { p_patente: patente, p_codigo: codigoSeguimiento }),

  historialEstados: (ordenId) =>
    supabase.from('historial_estados').select('id, estado_anterior, estado_nuevo, created_at').eq('orden_id', ordenId).order('created_at'),

  perfil: (clienteId) => supabase.from('clientes').select('id, rut, nombre, telefono, correo, created_at').eq('id', clienteId).maybeSingle(),

  actualizarContacto: ({ correo, telefono }) => supabase.rpc('actualizar_contacto_cliente', { p_correo: correo, p_telefono: telefono }),

  notificaciones: (clienteId, limite = 50) =>
    supabase
      .from('notificaciones')
      .select('id, orden_id, tipo, canal, mensaje, estado, enviada_en, leida_en, created_at, ordenes_trabajo(id, codigo, vehiculos(patente))')
      .eq('destinatario_cliente_id', clienteId)
      .order('created_at', { ascending: false })
      .limit(limite),

  marcarNotificaciones: (ids) => supabase.rpc('marcar_notificaciones_cliente', { p_ids: ids?.length ? ids : null }),

  // Cambios de estado relevantes de las órdenes del cliente (últimos 90 días)
  eventos: (clienteId) =>
    supabase
      .from('historial_estados')
      .select('id, orden_id, estado_nuevo, nota, created_at, ordenes_trabajo!inner(id, codigo, cliente_id, vehiculos(patente))')
      .eq('ordenes_trabajo.cliente_id', clienteId)
      .in('estado_nuevo', ESTADOS_AVISO_CLIENTE)
      .gte('created_at', new Date(Date.now() - 90 * 864e5).toISOString())
      .order('created_at', { ascending: false })
      .limit(50),
}
