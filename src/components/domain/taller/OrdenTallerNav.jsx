import { NavLink } from 'react-router-dom'

// Navegación entre las secciones de trabajo de una orden (pantalla táctil)
export default function OrdenTallerNav({ ordenId, badges = {} }) {
  const base = `/taller/ordenes/${ordenId}`
  const items = [
    { to: base, label: 'Orden', end: true },
    { to: `${base}/diagnostico`, label: 'Diagnóstico', badge: badges.diagnostico },
    { to: `${base}/repuestos`, label: 'Repuestos', badge: badges.repuestos },
    { to: `${base}/avance`, label: 'Avance y estado' },
  ]
  return (
    <nav className="orden-nav" aria-label="Secciones de la orden">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => ['orden-nav__item', isActive && 'orden-nav__item--active'].filter(Boolean).join(' ')}>
          {it.label}
          {it.badge > 0 && <span className="tabs__badge">{it.badge}</span>}
        </NavLink>
      ))}
    </nav>
  )
}
