import FormField from '@/components/ui/FormField'
import TextArea from '@/components/ui/TextArea'
import TareasEditor from './TareasEditor'

export const DIAGNOSTICO_VACIO = { descripcion: '', observaciones: '', tareas: [] }

export function validarDiagnostico(d, { exigirTareas = false } = {}) {
  const e = {}
  if (!d.descripcion.trim()) e.descripcion = 'Describe la falla detectada. Es obligatorio.'
  else if (d.descripcion.trim().length < 10) e.descripcion = 'La descripción técnica es muy breve (mínimo 10 caracteres).'
  if (exigirTareas && !d.tareas.length) e.tareas = 'Agrega al menos una tarea a realizar.'
  return e
}

// CU-05 · RF12: descripción técnica, checklist de tareas y observaciones
export default function DiagnosticoForm({ value, onChange, errores = {}, deshabilitado = false, conTareas = true, idPrefix = 'diag' }) {
  const set = (k) => (v) => onChange({ ...value, [k]: v?.target ? v.target.value : v })
  return (
    <div className="stack">
      <FormField label="Descripción técnica" htmlFor={`${idPrefix}-desc`} required error={errores.descripcion} hint="Falla encontrada, causa probable y pruebas realizadas.">
        <TextArea id={`${idPrefix}-desc`} rows={5} value={value.descripcion} onChange={set('descripcion')} disabled={deshabilitado} maxLength={4000} />
      </FormField>
      {conTareas && (
        <FormField label="Tareas a realizar" htmlFor={`${idPrefix}-tareas-cat`} required error={errores.tareas}>
          <TareasEditor value={value.tareas} onChange={set('tareas')} idPrefix={`${idPrefix}-tareas`} deshabilitado={deshabilitado} />
        </FormField>
      )}
      <FormField label="Observaciones" htmlFor={`${idPrefix}-obs`} hint="Opcional: recomendaciones, riesgos o trabajos sugeridos a futuro.">
        <TextArea id={`${idPrefix}-obs`} rows={3} value={value.observaciones} onChange={set('observaciones')} disabled={deshabilitado} maxLength={2000} />
      </FormField>
    </div>
  )
}
