import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import EstadoBadge from '@/components/domain/ordenes/EstadoBadge'
import OrdenTallerNav from './OrdenTallerNav'

// Encabezado común de las pantallas de una orden en el taller
export default function OrdenTallerHeader({ orden, esMia, seccion, acciones, badges }) {
  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Mis trabajos', to: '/taller/trabajos' }, ...(seccion ? [{ label: orden.codigo, to: `/taller/ordenes/${orden.id}` }, { label: seccion }] : [{ label: orden.codigo }])]}
      />
      <PageHeader titulo={`${orden.vehiculos?.patente} · ${orden.vehiculos?.marca} ${orden.vehiculos?.modelo}`} subtitulo={orden.codigo} acciones={acciones}>
        <EstadoBadge estado={orden.estado} />
      </PageHeader>
      {!esMia && (
        <p className="callout callout--warning section-sm">
          {orden.estado === 'por_asignar'
            ? 'Esta orden aún no tiene mecánico. Recepción o administración debe asignarla para que puedas trabajar en ella.'
            : 'Esta orden no está asignada a ti: solo puedes consultarla.'}
        </p>
      )}
      {esMia && <OrdenTallerNav ordenId={orden.id} badges={badges} />}
    </>
  )
}
