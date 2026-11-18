import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { useCatalogos } from '@/hooks/core/useCatalogos'

let seq = 0
const nuevoId = () => `t${Date.now()}-${seq++}`

// Arma la lista de tareas a registrar: desde catálogo o texto libre. value: [{ key, tarea_id, descripcion }]
export default function TareasEditor({ value, onChange, idPrefix = 'tareas', deshabilitado = false }) {
  const { tareas: catalogo } = useCatalogos()
  const [libre, setLibre] = useState('')
  const usados = new Set(value.map((t) => t.tarea_id).filter(Boolean))

  const agregar = (t) => onChange([...value, { key: nuevoId(), ...t }])
  const agregarLibre = () => {
    const d = libre.trim()
    if (!d) return
    agregar({ tarea_id: null, descripcion: d })
    setLibre('')
  }

  return (
    <div className="stack-sm">
      <div className="tareas-editor__row">
        <Select
          id={`${idPrefix}-cat`}
          aria-label="Agregar tarea del catálogo"
          placeholder="Agregar tarea del catálogo…"
          value=""
          disabled={deshabilitado || !catalogo.length}
          options={catalogo.map((c) => ({ value: c.id, label: c.nombre, disabled: usados.has(c.id) }))}
          onChange={(e) => {
            const c = catalogo.find((x) => x.id === e.target.value)
            if (c) agregar({ tarea_id: c.id, descripcion: c.nombre })
          }}
        />
      </div>
      <div className="tareas-editor__row">
        <Input
          id={`${idPrefix}-libre`}
          aria-label="Otra tarea"
          placeholder="Otra tarea (texto libre)"
          value={libre}
          disabled={deshabilitado}
          maxLength={200}
          onChange={(e) => setLibre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              agregarLibre()
            }
          }}
        />
        <Button onClick={agregarLibre} disabled={deshabilitado || !libre.trim()}>
          Agregar
        </Button>
      </div>
      {value.length > 0 && (
        <ol className="tareas-editor__list">
          {value.map((t) => (
            <li key={t.key}>
              <span>{t.descripcion}</span>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Quitar ${t.descripcion}`}
                disabled={deshabilitado}
                onClick={() => onChange(value.filter((x) => x.key !== t.key))}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
