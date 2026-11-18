import { useState } from 'react'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import { normalizarPatente, patenteValida } from '@/lib/patente'

// Seguimiento sin cuenta: patente + código de seguimiento entregado en el comprobante de ingreso
export default function TrackingForm({ inicial = {}, onSubmit, pending, error }) {
  const [patente, setPatente] = useState(inicial.patente ?? '')
  const [codigo, setCodigo] = useState(inicial.codigo ?? '')
  const [errores, setErrores] = useState({})

  const enviar = (e) => {
    e.preventDefault()
    const err = {}
    if (!patenteValida(patente)) err.patente = 'Ingresa la patente sin guiones, por ejemplo ABCD12.'
    if (codigo.trim().length < 4) err.codigo = 'Ingresa el código de seguimiento de tu comprobante.'
    setErrores(err)
    if (Object.keys(err).length) return
    onSubmit(normalizarPatente(patente), codigo.trim().toUpperCase())
  }

  return (
    <form className="stack" onSubmit={enviar} noValidate>
      <FormField label="Patente" htmlFor="trk-patente" required error={errores.patente}>
        <Input
          id="trk-patente"
          className="input--patente"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={8}
          value={patente}
          onChange={(e) => setPatente(normalizarPatente(e.target.value))}
          invalid={Boolean(errores.patente)}
        />
      </FormField>
      <FormField label="Código de seguimiento" htmlFor="trk-codigo" required error={errores.codigo || error} hint="Aparece en el comprobante que te entregamos al dejar el vehículo.">
        <Input
          id="trk-codigo"
          className="input--mono"
          autoCapitalize="characters"
          autoComplete="off"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          invalid={Boolean(errores.codigo || error)}
        />
      </FormField>
      <Button type="submit" variant="primary" size="lg" block loading={pending}>
        Consultar estado
      </Button>
    </form>
  )
}
