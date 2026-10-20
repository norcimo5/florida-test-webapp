# Decisions (lightweight ADR log)

Newest first. Each entry: context → decision → consequences. Add an entry when you make a choice
a future reader would otherwise question.

---

## 2026-10-20 · D6 — Self-host fonts and icons
**Context:** offline use and "no third-party services" in the privacy policy.
**Decision:** Roboto via `@fontsource/roboto` (Latin subset only), Material icons inlined as SVG
paths (`src/ui/icons.tsx`).
**Consequences:** ~90 KB of fonts in the offline cache; no Google Fonts requests.

## 2026-10-20 · D5 — Hash routing
**Context:** GitHub Pages can't rewrite deep links; the service worker serves one page offline.
**Decision:** tiny custom hash router (`#/study/REGLAS`) with Android-like back-stack helpers.
**Rejected:** react-router (more weight; path routing needs a 404.html hack on Pages).

## 2026-10-20 · D4 — Keep GitHub Pages at the current address
**Context:** the privacy policy already lives there; free; owner chose "as-is".
**Decision:** host at `norcimo5.github.io/florida-test-webapp/`.
**Consequences:** moving later resets installs and on-device progress for users (origin change).
A custom domain was recommended; revisit before wide promotion.

## 2026-10-20 · D3 — Match the Android app's look exactly
**Context:** the owner's explicit requirement; the Android UI was already polished and approved.
**Decision:** port Compose tokens 1:1 to CSS variables; rebuild each screen from the Compose source;
verify with side-by-side screenshots (`npm run shots`).
**Rejected:** keeping the old web UI (different look).

## 2026-10-20 · D2 — Premium via emailed, signed unlock codes (no payment processor)
**Context:** the owner wants payment by Zelle / Cash App / PayPal and "an email we send them to
unlock with a special hash", with no server.
**Decision:** Ed25519-signed codes bound to a hash of the buyer's email, created by an owner CLI
with a private key kept outside the repo; the app verifies offline with the public key. Monthly =
30-day expiry + 3 grace days + 3-day reminder; renewals stack.
**Rejected:** a plain hash/HMAC (the secret would ship inside the app, so anyone could mint codes);
Lemon Squeezy/Stripe (owner declined a processor for now — see UPGRADING.md "Future paths");
two separate free/paid sites (shareable link, lost progress on upgrade, double install).
**Consequences:** fully manual fulfilment; clock-rollback or patched JavaScript can bypass
(accepted for this price point).

## 2026-10-20 · D1 — Installable web app (PWA) instead of app stores
**Context:** Google Play publishing stalled (closed test with 12 testers for 14 days, billing
setup), and the App Store would be harder. The owner needs Android **and** iPhone with one codebase
and no store.
**Decision:** a PWA (React + Vite + vite-plugin-pwa) on the existing web codebase.
**Rejected:** Capacitor/Flutter/React Native (iPhone still requires the App Store); sideloaded
APK (Android only, scary warnings).
**Consequences:** iPhone install is manual (Share → "Agregar a inicio"); iOS may purge storage of
non-installed sites, so the app nudges installation. The Android project is frozen
(`android-final` tag) and can be revived or replaced by a Capacitor wrapper later.

---

Earlier history (pre-2026-10 web app, Android port planning): `docs/archive/`, and the Android
repo's `BRAINSTORM.md`.
