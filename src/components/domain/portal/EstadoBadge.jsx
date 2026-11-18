import Badge from '@/components/ui/Badge'
import { etapaEstado, etiquetaEstado, tonoEstado } from '@/lib/constants/estados'

// Estado de la orden para el cliente: etapa RNF03 (simple) o estado exacto
export default function EstadoBadge({ estado, texto, modo = 'estado' }) {
  const label = modo === 'etapa' ? etapaEstado(estado) : (texto ?? etiquetaEstado(estado))
  return <Badge tono={tonoEstado(estado)}>{label}</Badge>
}
