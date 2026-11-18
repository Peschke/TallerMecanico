import ClienteLayout from '@/layouts/ClienteLayout'
import RequireRole from './guards/RequireRole'
import { ROLES } from '@/lib/constants/roles'
import { lazyPage } from './lazyPage'

export const clienteRoutes = {
  element: <RequireRole roles={[ROLES.CLIENTE]} />,
  children: [
    {
      path: '/cliente',
      element: <ClienteLayout />,
      children: [
        { index: true, element: lazyPage(() => import('@/pages/cliente/ClienteInicioPage')) },
        { path: 'estado', element: lazyPage(() => import('@/pages/cliente/ClienteEstadoPage')) },
        { path: 'ordenes/:ordenId', element: lazyPage(() => import('@/pages/cliente/ClienteOrdenPage')) },
        { path: 'presupuestos', element: lazyPage(() => import('@/pages/cliente/ClientePresupuestosPage')) },
        { path: 'ordenes/:ordenId/presupuesto', element: lazyPage(() => import('@/pages/cliente/ClientePresupuestoPage')) },
        { path: 'historial', element: lazyPage(() => import('@/pages/cliente/ClienteHistorialPage')) },
        { path: 'vehiculos/:vehiculoId/historial', element: lazyPage(() => import('@/pages/cliente/ClienteHistorialPage')) },
        { path: 'vehiculos/:vehiculoId/historial/:codigo', element: lazyPage(() => import('@/pages/cliente/ClienteHistorialDetallePage')) },
        { path: 'notificaciones', element: lazyPage(() => import('@/pages/cliente/ClienteNotificacionesPage')) },
        { path: 'perfil', element: lazyPage(() => import('@/pages/cliente/ClientePerfilPage')) },
      ],
    },
  ],
}
