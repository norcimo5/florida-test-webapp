/**
 * vite-env.d.ts — global type declarations for Vite, the PWA plugin, and build-time constants.
 */
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** App version from package.json, injected by vite.config.ts (`define`). */
declare const __APP_VERSION__: string
