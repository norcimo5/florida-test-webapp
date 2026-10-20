/**
 * InstallScreen.tsx — "Instalar app": how to put the app on the phone's home screen.
 *   Android + Chrome with the install prompt available → one INSTALAR button.
 *   iPhone (Safari) → illustrated steps: Compartir → "Agregar a inicio".
 *   Otherwise → both sets of manual steps.
 * See pwa/install.ts for detection.
 */
import type { ReactNode } from 'react'
import { useInstallMode, promptInstall, isIos } from '../../pwa/install'
import { goBack } from '../router'
import { Icon } from '../icons'
import { AppCard, GradientHeader, TealButton, TextLink } from '../components/core'
import { showSnackbar } from '../components/snackbar'
import './screens.css'

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="install-step t-body-medium">
      <span className="install-step__num" aria-hidden="true">
        {n}
      </span>
      <span>{children}</span>
    </li>
  )
}

function IphoneSteps() {
  return (
    <AppCard stacked>
      <h2 className="card-title t-title-medium">En iPhone</h2>
      <ol style={{ listStyle: 'none', padding: 0, margin: 'var(--space-sm) 0 0' }} className="card-text">
        <Step n={1}>Abre esta página en <strong>Safari</strong>.</Step>
        <Step n={2}>
          Toca el botón <Icon name="iosShare" size={20} className="inline-icon" /> <strong>Compartir</strong> (abajo en
          el centro, o arriba a la derecha en iPad).
        </Step>
        <Step n={3}>
          Desliza hacia abajo y toca <Icon name="addBox" size={20} className="inline-icon" />{' '}
          <strong>Agregar a inicio</strong>.
        </Step>
        <Step n={4}>
          Toca <strong>Agregar</strong>. El ícono aparece en tu pantalla de inicio.
        </Step>
      </ol>
    </AppCard>
  )
}

function AndroidSteps() {
  return (
    <AppCard stacked>
      <h2 className="card-title t-title-medium">En Android</h2>
      <ol style={{ listStyle: 'none', padding: 0, margin: 'var(--space-sm) 0 0' }} className="card-text">
        <Step n={1}>Abre esta página en <strong>Chrome</strong>.</Step>
        <Step n={2}>
          Toca el menú <strong>⋮</strong> (arriba a la derecha).
        </Step>
        <Step n={3}>
          Toca <strong>Instalar app</strong> o <strong>Agregar a la pantalla principal</strong>.
        </Step>
        <Step n={4}>Confirma con <strong>Instalar</strong>.</Step>
      </ol>
    </AppCard>
  )
}

/** Install instructions / button. */
export function InstallScreen() {
  const mode = useInstallMode()
  const install = async () => {
    if (await promptInstall()) showSnackbar('¡Listo! Busca el ícono en tu pantalla de inicio.')
  }
  return (
    <div className="screen-enter">
      <GradientHeader title="Instalar app" subtitle="Úsala como una app, incluso sin internet" />
      <div className="screen-body">
        {mode === 'installed' && (
          <AppCard stacked>
            <p className="card-title t-title-medium">¡La app ya está instalada! ✓</p>
            <p className="card-text t-body-medium">Ábrela desde el ícono en tu pantalla de inicio.</p>
          </AppCard>
        )}
        {mode === 'prompt' && (
          <AppCard stacked>
            <p className="card-text t-body-medium">Instálala en tu teléfono con un toque. Es gratis y ocupa muy poco espacio.</p>
            <div className="spacer-md" />
            <TealButton onClick={install}>INSTALAR</TealButton>
          </AppCard>
        )}
        {mode === 'ios' && <IphoneSteps />}
        {mode === 'manual' && (
          <>
            <AndroidSteps />
            <IphoneSteps />
          </>
        )}
        {mode !== 'installed' && (
          <p className="card-meta t-body-small" style={{ marginTop: 'var(--space-md)' }}>
            {isIos()
              ? 'En iPhone, instala la app para que tu progreso no se borre.'
              : 'Después de instalarla, ábrela desde el ícono: funciona incluso sin internet.'}
          </p>
        )}
        <div className="spacer-sm" />
        <TextLink block color="var(--gray-500)" onClick={goBack}>
          Volver
        </TextLink>
      </div>
    </div>
  )
}
