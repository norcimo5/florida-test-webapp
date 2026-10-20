/**
 * AjustesScreen.tsx — "Ajustes". Port of ui/screens/AjustesScreen.kt (reset, version, support,
 * privacy) plus the web-only rows: Activar Premium, Instalar app, Quitar Premium de este dispositivo.
 */
import { useState } from 'react'
import { APP_VERSION, CONTACT_EMAIL, PRIVACY_URL } from '../../config/app'
import { clearUnlock, resetProgress } from '../../store/appStore'
import { useEntitlement } from '../../store/useEntitlement'
import { useInstallMode } from '../../pwa/install'
import { navigate } from '../router'
import { AppCard, Disclaimer, GradientHeader } from '../components/core'
import { Dialog } from '../components/overlays'
import { showSnackbar } from '../components/snackbar'
import './screens.css'

function SettingRow({ label, color, onClick }: { label: string; color: string; onClick?: () => void }) {
  const text = (
    <span className="t-body-medium w-medium" style={{ color }}>
      {label}
    </span>
  )
  return onClick ? (
    <AppCard stacked onClick={onClick} className="setting-row">
      {text}
    </AppCard>
  ) : (
    <AppCard stacked className="setting-row">
      {text}
    </AppCard>
  )
}

/** Settings tab. */
export function AjustesScreen() {
  const [confirm, setConfirm] = useState<'reset' | 'unlock' | null>(null)
  const { entitlement } = useEntitlement()
  const installMode = useInstallMode()
  const hasCode = entitlement.status !== 'free'

  return (
    <div className="screen-enter">
      <GradientHeader title="Ajustes" />
      <div className="screen-body">
        <SettingRow
          label={hasCode ? 'Premium: ingresar código nuevo' : 'Activar Premium'}
          color="var(--brand-teal-dark)"
          onClick={() => navigate('/activate')}
        />
        {installMode !== 'installed' && (
          <SettingRow label="Instalar app" color="var(--brand-blue)" onClick={() => navigate('/install')} />
        )}
        <SettingRow label="Reiniciar progreso" color="var(--error)" onClick={() => setConfirm('reset')} />
        <SettingRow label={`Versión ${APP_VERSION}`} color="var(--gray-500)" />
        <SettingRow
          label="Soporte"
          color="var(--brand-blue)"
          onClick={() => (window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('FL DMV Prep')}`)}
        />
        <SettingRow
          label="Política de privacidad"
          color="var(--brand-blue)"
          onClick={() => window.open(PRIVACY_URL, '_blank', 'noopener')}
        />
        {hasCode && (
          <SettingRow
            label="Quitar Premium de este dispositivo"
            color="var(--gray-500)"
            onClick={() => setConfirm('unlock')}
          />
        )}
        <div className="spacer-lg" />
        <Disclaimer />
      </div>

      {confirm === 'reset' && (
        <Dialog
          title="¿Reiniciar progreso?"
          confirmLabel="Borrar"
          cancelLabel="Cancelar"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            resetProgress()
            setConfirm(null)
            showSnackbar('Progreso reiniciado.')
          }}
        >
          Se borrará todo tu avance. Esta acción no se puede deshacer.
        </Dialog>
      )}
      {confirm === 'unlock' && (
        <Dialog
          title="¿Quitar Premium?"
          confirmLabel="Quitar"
          cancelLabel="Cancelar"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            clearUnlock()
            setConfirm(null)
            showSnackbar('Premium quitado de este dispositivo.')
          }}
        >
          Premium dejará de funcionar en este teléfono. Puedes volver a activarlo con tu código cuando quieras.
        </Dialog>
      )}
    </div>
  )
}
