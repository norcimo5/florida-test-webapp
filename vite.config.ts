/**
 * vite.config.ts — build, PWA (installable + offline), and test configuration.
 *
 * - `base` must stay '/florida-test-webapp/' — the app is served from that GitHub Pages sub-path.
 * - VitePWA generates the web app manifest + a service worker that precaches the whole app
 *   (including the question bank) so it opens offline. `registerType: 'prompt'` lets
 *   src/pwa/registerSW.ts switch to a new deploy at a safe moment (never mid-exam) —
 *   docs/DEPLOY.md → "How updates reach phones".
 * - `__APP_VERSION__` (shown in Ajustes) comes from package.json "version".
 */
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

const BASE = '/florida-test-webapp/'

export default defineConfig({
  base: BASE,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // we apply updates ourselves, see src/pwa/registerSW.ts
      injectRegister: false, // registered in src/pwa/registerSW.ts
      manifest: {
        id: BASE,
        name: 'Examen de Manejo Florida',
        short_name: 'Examen FL',
        description: 'Practica en inglés para el examen de manejo de Florida, con guía en español.',
        lang: 'es',
        dir: 'ltr',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1e3a8a',
        theme_color: '#1e3a8a',
        categories: ['education'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        navigateFallback: `${BASE}index.html`,
        // The privacy policy is a separate real page, not part of the single-page app.
        navigateFallbackDenylist: [/privacy-policy\.html$/],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
