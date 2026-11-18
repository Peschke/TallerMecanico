// Selector de vehículos del cliente (patente, marca, modelo). Chips en móvil, se adapta a cualquier ancho.
export default function VehiculoSelector({ vehiculos, value, onChange, label = 'Elige tu vehículo' }) {
  if (!vehiculos?.length || vehiculos.length < 2) return null
  return (
    <div className="veh-selector" role="radiogroup" aria-label={label}>
      {vehiculos.map((v) => {
        const on = v.id === value
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={on}
            className={['veh-selector__opt', on && 'veh-selector__opt--on'].filter(Boolean).join(' ')}
            onClick={() => onChange(v.id)}
          >
            <span className="veh-selector__patente patente">{v.patente}</span>
            <span className="veh-selector__modelo">
              {v.marca} {v.modelo}
            </span>
            {v.ordenActual && <span className="veh-selector__dot" title="En el taller" aria-label="En el taller" />}
          </button>
        )
      })}
    </div>
  )
}
