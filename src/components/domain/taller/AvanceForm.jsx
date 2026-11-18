import FormField from '@/components/ui/FormField'
import TextArea from '@/components/ui/TextArea'

export const AVANCE_VACIO = { porcentaje: '', nota: '', observaciones: '' }

export function validarAvance(a) {
  const e = {}
  if (a.porcentaje !== '' && (Number(a.porcentaje) < 0 || Number(a.porcentaje) > 100)) e.porcentaje = 'El porcentaje debe estar entre 0 y 100.'
  if (!a.nota.trim()) e.nota = 'Describe qué avanzaste. Es obligatorio.'
  return e
}

// CU-07 · RF18: porcentaje, nota y observaciones del avance
export default function AvanceForm({ value, onChange, errores = {}, avanceActual = 0, deshabilitado = false }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value })
  const pct = value.porcentaje === '' ? Number(avanceActual) : Number(value.porcentaje)
  return (
    <div className="stack">
      <FormField label={`Porcentaje de avance: ${pct}%`} htmlFor="av-pct" error={errores.porcentaje} hint={`Avance actual registrado: ${avanceActual}%`}>
        <div className="avance-slider">
          <input
            id="av-pct"
            type="range"
            min={0}
            max={100}
            step={5}
            value={pct}
            disabled={deshabilitado}
            onChange={set('porcentaje')}
            aria-valuetext={`${pct}%`}
          />
          <div className="avance-slider__presets" role="group" aria-label="Porcentajes rápidos">
            {[25, 50, 75, 90].map((n) => (
              <button
                key={n}
                type="button"
                className={['chip', pct === n && 'chip--on'].filter(Boolean).join(' ')}
                disabled={deshabilitado}
                onClick={() => onChange({ ...value, porcentaje: String(n) })}
              >
                {n}%
              </button>
            ))}
          </div>
        </div>
      </FormField>
      <FormField label="Nota de avance" htmlFor="av-nota" required error={errores.nota}>
        <TextArea id="av-nota" rows={3} value={value.nota} onChange={set('nota')} disabled={deshabilitado} maxLength={1000} placeholder="Ej.: Cambiadas pastillas delanteras, falta purgar frenos." />
      </FormField>
      <FormField label="Observaciones" htmlFor="av-obs" hint="Opcional">
        <TextArea id="av-obs" rows={2} value={value.observaciones} onChange={set('observaciones')} disabled={deshabilitado} maxLength={1000} />
      </FormField>
    </div>
  )
}
