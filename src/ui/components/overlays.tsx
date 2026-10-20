/**
 * overlays.tsx — things that float above a screen:
 *   BottomNav  Material 3 navigation bar with the 5 tabs (ui/nav/AppNav.kt)
 *   Dialog     confirm dialog (Material AlertDialog, used by "Reiniciar progreso")
 *   Snackbar   shows the message set by showSnackbar() (./snackbar.ts), like an Android Toast
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { Icon, type IconName } from '../icons'
import { navigateTab, TAB_ROUTES } from '../router'
import { useSnackbarMessage } from './snackbar'
import './components.css'

const TABS: { route: (typeof TAB_ROUTES)[number]; label: string; icon: IconName }[] = [
  { route: '/home', label: 'Inicio', icon: 'home' },
  { route: '/topics', label: 'Temas', icon: 'layers' },
  { route: '/exams', label: 'Exámenes', icon: 'barChart' },
  { route: '/profile', label: 'Perfil', icon: 'person' },
  { route: '/settings', label: 'Ajustes', icon: 'settings' },
]

/** Bottom navigation bar. `current` is the active route path. */
export function BottomNav({ current }: { current: string }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {TABS.map((t) => {
        const selected = current === t.route
        return (
          <button
            key={t.route}
            type="button"
            className={`bottom-nav__item${selected ? ' bottom-nav__item--selected' : ''}`}
            aria-current={selected ? 'page' : undefined}
            onClick={() => navigateTab(t.route)}
          >
            <span className="bottom-nav__indicator">
              <Icon name={t.icon} size={24} />
            </span>
            <span className="bottom-nav__label">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

/** Props for Dialog. */
export interface DialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  /** Red confirm button for destructive actions. */
  danger?: boolean
}

/** Modal confirm dialog. Escape or tapping the scrim cancels; focus starts on Cancel (safe). */
export function Dialog({ title, children, confirmLabel, cancelLabel, onConfirm, onCancel, danger }: DialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])
  return (
    <div className="dialog-scrim" onClick={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-text"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialog-title" className="dialog__title t-headline-small">
          {title}
        </h2>
        <p id="dialog-text" className="dialog__text t-body-medium">
          {children}
        </p>
        <div className="dialog__actions">
          <button ref={cancelRef} type="button" className="dialog__action t-label-large" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`dialog__action t-label-large${danger ? ' dialog__action--danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Renders the current snackbar message (mounted once in App). */
export function Snackbar() {
  const text = useSnackbarMessage()
  if (!text) return null
  return (
    <div className="snackbar t-body-medium" role="status" aria-live="polite">
      {text}
    </div>
  )
}
