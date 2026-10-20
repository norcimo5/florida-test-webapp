# CLAUDE.md — start here (AI agents and developers)

**Examen de Manejo Florida** is an installable web app (PWA) that helps Spanish-speaking people
pass the **English-only** Florida Class E driver-license knowledge exam. It teaches recognition of
the English exam keywords, with all app chrome in Spanish. It installs on Android and iPhone
**without any app store**, works offline, and sells Premium through **emailed unlock codes**.

- Live: https://norcimo5.github.io/florida-test-webapp/ (GitHub Pages, branch `gh-pages`)
- Owner: Bit Ensemble Solutions (public contact `bitensemble.solutions@gmail.com`)
- Visual source of truth: the native Android app in `../florida-test-android-app`
  (Kotlin/Compose). This web app is a 1:1 port of its look and behaviour.

## Commands

```bash
npm install            # once
npm run dev            # dev server → http://localhost:5173/florida-test-webapp/
npm test               # Vitest: domain, unlock codes, store, UI journeys (must stay green)
npm run lint           # ESLint
npm run typecheck      # tsc for app + tools
npm run build          # typecheck + production build → dist/ (includes service worker)
npm run deploy         # build + publish dist/ to the gh-pages branch (goes live)
npm run code -- --email buyer@x.com --plan lifetime|monthly   # make an unlock code (owner)
npm run code -- --list                                         # issued codes / renewals due
npm run preview        # serve dist/ on :4173
npm run shots          # phone screenshots of every screen → /dev/shm/fldmv-shots (needs preview running)
npm run offline-check  # proves the built app works with no network (needs preview running)
```

Node 23.6+ is required (the `tools/*.ts` scripts run with Node's built-in TypeScript support).

## HARD rules (never break these)

1. **Spanish chrome, English questions.** Every label, button, message and heading is Spanish with
   correct accents. English appears only inside exam question/answer content. No language toggle.
   A test (`tests/ui/app.test.tsx` → "Spanish chrome rule") guards common English words.
2. **Look matches the Android app.** Use the tokens in `src/ui/theme/tokens.css` and the type
   classes in `typography.css`; never hard-code colors, font sizes, spacing or radii. Check changes
   with `npm run shots` against `../florida-test-android-app/docs/play/screenshots/`.
3. **The unlock private key never enters this repo** (`~/keystores/fldmv-unlock-ed25519.key`).
   Only the public key lives here (`src/config/unlockPublicKey.ts`). `tools/issued-codes.csv`
   (buyer emails) is git-ignored — keep it that way.
4. **Public email only**: user-facing surfaces use `bitensemble.solutions@gmail.com`
   (`src/config/app.ts`). Never put the owner's private address in the app or docs.
5. **Never claim affiliation** with the FLHSMV or "real exam questions"; keep the disclaimer
   ("Herramienta de práctica. No afiliada al FLHSMV.").
6. **Docs travel with code.** Any behaviour change updates the affected doc(s) below **and**
   `CHANGELOG.md` in the same commit. Every source file starts with a header comment saying what
   it is and who uses it; every exported function/type has a JSDoc line.
7. **Bump `version` in `package.json`** (shown in Ajustes) for every deploy that changes behaviour,
   and add a CHANGELOG entry.

## Where things live

```
src/
  main.tsx                 entry: fonts, theme CSS, install capture, service worker, render
  App.tsx                  shell: onboarding gate, route → screen, bottom nav, snackbar
  config/                  EDIT-ME settings: app.ts (prices, email, URLs), payment.ts (Zelle/Cash App/PayPal
                           handles), unlockPublicKey.ts (written by `npm run code -- --init`)
  domain/                  pure logic, no React: gating.ts (free limits), metrics.ts (mastery, pass %),
                           macroTopic.ts (4 topics), dates.ts (day keys), types.ts (question shape)
  data/                    questions.json (120 Q, identical to Android) + questions.ts (load/shuffle/sample)
  billing/                 unlockCode.ts (code format, sign/verify), entitlement.ts (Premium status, expiry/grace)
  store/                   appStore.ts (localStorage state + actions), useEntitlement.ts (hooks)
  pwa/                     install.ts (Android prompt / iOS detection), registerSW.ts (service worker)
  ui/
    theme/                 tokens.css, typography.css, base.css  ← design system
    components/            core.tsx (header, cards, buttons…), overlays.tsx (nav, dialog, snackbar),
                           TrendChart.tsx, snackbar.ts, components.css
    screens/               one file per screen (+ examActions, highlight, paymentEmail, activationMessages)
    router.ts              hash router + Android-like back stack
    icons.tsx              inlined Material icons
tools/
  make-unlock-code.ts      owner CLI for unlock codes (npm run code)
  screenshots.ts           visual-check screenshots (npm run shots)
  offline-check.ts         service-worker/offline verification (npm run offline-check)
tests/                     Vitest: domain/, billing/, store/, ui/
public/                    icons, favicon, privacy-policy.html (copied to the site root)
docs/                      the documents below (+ archive/ = pre-2026 notes, historical only)
```

## Documentation map

| Doc | Read it when you need to… |
|---|---|
| [README.md](README.md) | the owner's plain-language guide (run, publish, sell Premium) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | understand data flow, state, routing, storage keys, offline |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | change the look; Android → CSS token map; screen parity table |
| [docs/UNLOCK-CODES.md](docs/UNLOCK-CODES.md) | give someone Premium, renew, rotate keys, code format |
| [docs/DEPLOY.md](docs/DEPLOY.md) | publish, how updates reach phones, roll back |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | a user reports a problem (symptom → cause → fix) |
| [docs/UPGRADING.md](docs/UPGRADING.md) | add questions, change prices/limits, add a screen, bump deps, future paths |
| [docs/DECISIONS.md](docs/DECISIONS.md) | why it's built this way (and what was rejected) |
| [CHANGELOG.md](CHANGELOG.md) | what changed in each version |

## Quick answers

- **Give someone Premium:** `npm run code -- --email them@x.com --plan lifetime` → paste the printed
  email text into a reply to them. Details: docs/UNLOCK-CODES.md.
- **Change the free limit:** `FREE_PER_DAY` in `src/domain/gating.ts` (+ README table, CHANGELOG, tests).
  Note: "5 preguntas" on Inicio/Exámenes is the Daily Quiz length (`DAILY_QUIZ_LENGTH`), not this limit.
- **Change prices:** `PRICES` in `src/config/app.ts`.
- **Set payment handles:** `src/config/payment.ts`.
- **"App shows an old version":** service worker cache; see docs/TROUBLESHOOTING.md.
- **Task tracking:** beads (`bd`) lives in `../florida-test-android-app` (epic "PWA revamp").
