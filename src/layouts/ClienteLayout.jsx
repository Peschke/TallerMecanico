import AppShell from './AppShell'
import { clienteNav } from './nav/clienteNav'
import { usePresupuestosCliente } from '@/hooks/portal/usePresupuestoCliente'
import { useNotificacionesCliente } from '@/hooks/portal/useNotificacionesCliente'

// Portal del cliente: menú lateral en escritorio/tablet y menú desplegable en celular (RNF01)
export default function ClienteLayout() {
  const { pendientes } = usePresupuestosCliente()
  const { noLeidas } = useNotificacionesCliente()
  return (
    <AppShell
      variant="sidebar"
      nav={clienteNav}
      badges={{ presupuestos: pendientes.length, notificaciones: noLeidas }}
      homeTo="/cliente"
      bell={false}
      theme="cliente"
    />
  )
}
