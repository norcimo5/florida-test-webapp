/**
 * main.tsx — entry point: fonts + theme CSS, install-prompt capture, service worker, render.
 * Order matters: tokens.css defines the variables every other stylesheet uses.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/roboto/latin-400.css'
import '@fontsource/roboto/latin-500.css'
import '@fontsource/roboto/latin-600.css'
import '@fontsource/roboto/latin-700.css'
import './ui/theme/tokens.css'
import './ui/theme/typography.css'
import './ui/theme/base.css'
import App from './App'
import { markRoot } from './ui/router'
import { initInstallCapture } from './pwa/install'
import { registerServiceWorker } from './pwa/registerSW'

initInstallCapture()
markRoot()
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
