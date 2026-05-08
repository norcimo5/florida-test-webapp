import type { Screen } from '../types'
import './BottomTabBar.css'

interface Tab {
  screen: Screen
  emoji: string
  label: string
  ariaLabel: string
}

const TABS: Tab[] = [
  { screen: 'home',    emoji: '🏠', label: 'Inicio',   ariaLabel: 'Ir a Inicio' },
  { screen: 'temas',  emoji: '📚', label: 'Temas',    ariaLabel: 'Ir a Temas' },
  { screen: 'exam',   emoji: '📝', label: 'Exámenes', ariaLabel: 'Ir a Exámenes' },
  { screen: 'perfil', emoji: '👤', label: 'Perfil',   ariaLabel: 'Ir a Perfil' },
  { screen: 'ajustes',emoji: '⚙',  label: 'Ajustes',  ariaLabel: 'Ir a Ajustes' },
]

interface BottomTabBarProps {
  active: Screen
  onChange: (screen: Screen) => void
}

export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <nav className="bottom-tab-bar" aria-label="Navegación principal">
      {TABS.map(({ screen, emoji, label, ariaLabel }) => {
        const isActive = active === screen
        return (
          <button
            key={screen}
            className={`bottom-tab-bar__tab${isActive ? ' bottom-tab-bar__tab--active' : ''}`}
            onClick={() => onChange(screen)}
            aria-label={ariaLabel}
            aria-current={isActive ? 'page' : undefined}
            type="button"
          >
            <span className="bottom-tab-bar__icon" aria-hidden="true">{emoji}</span>
            <span className="bottom-tab-bar__label">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomTabBar
