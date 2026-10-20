# Changelog

Every user-visible or behaviour change, newest first. The version is `"version"` in
`package.json` and is shown in Ajustes.

## 2.0.0 — 2026-10-20 · Installable app, Android look, Premium codes

- **New look:** rebuilt every screen to match the Android app (gradient headers, pass meter,
  2-column topic grid, Material bottom navigation, cards, answer feedback, trend chart).
- **Installable on Android and iPhone** without app stores; works offline (service worker).
  New "Instalar app" screen and an install card on Inicio.
- **Onboarding:** asks for the user's name (optional) on first launch.
- **Free tier:** 5 study questions per day + 1 Daily Quiz per day; the 50-question Full Mock is
  Premium.
- **Premium:** US$34.99/month (30 days) or US$99.99 lifetime, paid by Zelle / Cash App / PayPal;
  the buyer sends proof from the app and receives an unlock code by email
  (Ajustes → Activar Premium). Monthly plans remind 3 days before ending and have 3 grace days.
- **Perfil:** score trend chart, Premium status, expiry date and email.
- **Privacy policy** rewritten for the new payment and code flow (no RevenueCat/Google Play).
- Progress from the previous web app (answers, mock history) is imported automatically.
- Owner tools: `npm run code` (make/list unlock codes), `npm run shots` (screenshots).
- Full documentation set (CLAUDE.md, README, docs/*).
- Hardening (review): exams are gated even when opened by URL; app updates apply at a safe moment
  (never mid-exam); two open copies of the app no longer overwrite each other's data; setting the
  phone's date back no longer extends plans or resets free counters; "today" refreshes at midnight;
  entering an older code can't downgrade Premium.
