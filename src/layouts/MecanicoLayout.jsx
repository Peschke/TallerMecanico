import AppShell from './AppShell'
import { mecanicoNav } from './nav/mecanicoNav'
import { useNavBadges } from './nav/useNavBadges'
import { ROLES } from '@/lib/constants/roles'

// Celular primero (RNF01): barra inferior, sin sidebar
export default function MecanicoLayout() {
  const badges = useNavBadges(ROLES.MECANICO)
  return <AppShell variant="bottom" nav={mecanicoNav} badges={badges} homeTo="/taller" theme="mecanico" />
}
