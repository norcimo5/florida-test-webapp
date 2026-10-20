# Design system

The web app must **look like the Android app** (`../florida-test-android-app`, Kotlin/Compose,
Material 3). Every visual value is ported 1:1 from the Compose theme. Android `dp`/`sp` = CSS `px`.

Files: `src/ui/theme/tokens.css` (variables), `typography.css` (type classes),
`base.css` (page frame), `src/ui/components/components.css`, `src/ui/screens/screens.css`.

**Rule:** no hard-coded colors, font sizes, spacing or radii in components — use the variables and
`.t-*` classes. Change the variable, and the whole app follows.

## Colors (`Theme.kt` → `tokens.css`)

| Android (`Brand.*`) | CSS variable | Value | Used for |
|---|---|---|---|
| BlueDeep | `--brand-blue-deep` | #1E3A8A | gradient start, nav selected icon |
| Blue | `--brand-blue` | #1D4ED8 | gradient end, links, selected answer border |
| Teal | `--brand-teal` | #10B981 | primary buttons, bars, check marks |
| TealDark | `--brand-teal-dark` | #059669 | percentages, keywords, "¿POR QUÉ?" |
| Amber | `--brand-amber` | #F59E0B | lock icon, 80% goal line, warnings |
| Gray50…Gray900 | `--gray-50` … `--gray-900` | Tailwind grays | backgrounds, text levels |
| Success / Error | `--success` / `--error` | #16A34A / #DC2626 | right/wrong, pass/fail |
| CorrectContainer | `--correct-container` | #DCFCE7 | correct answer background |
| IncorrectContainer | `--incorrect-container` | #FEE2E2 | wrong answer background |
| SelectedContainer | `--selected-container` | #DBEAFE | selected exam answer / plan, nav pill |
| HeaderGradient | `--header-gradient` | BlueDeep → Blue, top-left → bottom-right | headers, onboarding, splash |
| M3 surfaceContainer (default) | `--color-surface-container` | #F3EDF7 | bottom nav background |
| Topic chips (`TopicVisuals.kt`) | `--topic-*-tint/-bg` | see file | Inicio/Temas icon chips |

Translucent whites on the gradient: `--on-header-80` (subtitles, Compose `0xCCFFFFFF`),
`--on-header-87`, `--on-header-67`, `--on-header-60`, `--on-header-40`, `--on-header-20` (meter track).

## Type (`Type.kt` → `typography.css`)

Font: **Roboto** (Android's default), self-hosted via `@fontsource/roboto` (Latin subset, weights
400/500/600/700), so it works offline and makes no third-party requests.

| Class | Size / line | Weight | Role |
|---|---|---|---|
| `.t-display-medium` | 44/48 | 700 | result %, onboarding "FL DMV" |
| `.t-headline-medium` | 24/30 | 700 | screen title in header |
| `.t-headline-small` | 20/26 | 700 | stat values, plan prices, dialog title |
| `.t-title-large` | 28/34 | 700 | pass-meter % |
| `.t-title-medium` | 16/22 | 700 | card titles |
| `.t-body-large` | 18/26 | 600 | question text, text fields |
| `.t-body-medium` | 15/22 | 400 | answers, body copy |
| `.t-body-small` | 13/18 | 400 | metadata |
| `.t-label-large` | 15/20, +0.3 | 700 | buttons |
| `.t-label-medium` | 13/16, +0.5 | 700 | section titles |
| `.t-label-small` | 11/14 | 500 | disclaimers |

Bottom-nav labels are 14px/600 (the Android reference renders labelSmall at the device font scale).

## Spacing & shapes (`Dimens.kt`)

`--space-xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32` · `--screen-padding 16` · `--card-gap 6` ·
`--card-padding 16` · radii: card 16, button 14, small 10 (answers), chip 12, dialog 28, pill 999 ·
button min height 54 · touch target ≥ 48 · icon chip 44 · nav height 80 · card shadow ≈ elevation 3.

## Components (Compose → React)

| Android (`ui/common/…`) | Web (`src/ui/components/…`) |
|---|---|
| `GradientHeader` | `core.tsx GradientHeader` (paints behind the status bar via `safe-area-inset-top`) |
| `PassMeter` | `core.tsx PassMeter` (animated fill, 800 ms) |
| `AppCard` | `core.tsx AppCard` (`onClick` makes it a button; `stacked` adds the 6px list gap) |
| `TealButton` | `core.tsx TealButton` |
| `TextLink` | `core.tsx TextLink` |
| `ProgressRow` | `core.tsx ProgressRow` (+ `MiniBar` for the Inicio grid) |
| `TopicIconChip` | `core.tsx TopicIconChip` |
| `TrendChart` (Canvas) | `TrendChart.tsx` (SVG line + HTML dots, draw-in animation) |
| `NavigationBar` (AppNav) | `overlays.tsx BottomNav` |
| `AlertDialog` | `overlays.tsx Dialog` |
| `Toast` | `overlays.tsx Snackbar` + `snackbar.ts showSnackbar()` |
| `ic_hero_shield.xml` | `core.tsx HeroShield` |
| `Icons.Filled.*` | `icons.tsx Icon` (inlined Material paths) |

Motion: screen enter = fade + slide 1/8 width, 220 ms (AppNav transitions). All motion is disabled
when the phone has "reduce motion" on.

## Screen parity

| Screen | Android source | Reference screenshot | Web |
|---|---|---|---|
| Onboarding | `ui/onboarding/OnboardingScreen.kt` | `01-onboarding.png` | `OnboardingScreen.tsx` |
| Inicio | `ui/home/HomeScreen.kt` | `02-inicio.png` | `HomeScreen.tsx` |
| Temas | `ui/screens/TemasScreen.kt` | `03-temas.png` | `TabScreens.tsx TemasScreen` |
| Estudiar | `ui/study/StudyScreen.kt` | `04-estudiar.png`, `05-porque.png` | `StudyScreen.tsx` |
| Paywall | `ui/paywall/PaywallScreen.kt` | `06-paywall.png` | `PaywallScreen.tsx` (manual-payment steps replace store buttons) |
| Examen | `ui/exam/ExamScreen.kt` | `07-examen.png` | `ExamScreens.tsx ExamScreen` |
| Perfil | `ui/screens/PerfilScreen.kt` | `08-perfil.png` | `TabScreens.tsx PerfilScreen` (+ Premium email/expiry) |
| Resultados | `ui/exam/ResultsScreen.kt` | — | `ExamScreens.tsx ResultsScreen` |
| Exámenes | `ExamHub` in `ui/nav/AppNav.kt` | — | `TabScreens.tsx ExamsScreen` |
| Ajustes | `ui/screens/AjustesScreen.kt` | — | `AjustesScreen.tsx` (+ Activar Premium, Instalar app) |
| Activar Premium | — (web-only) | — | `ActivateScreen.tsx` |
| Instalar app | — (web-only) | — | `InstallScreen.tsx` |

Known, intentional differences: no Android status bar in browser screenshots; the paywall shows
"Cómo pagar" steps and "ENVIAR COMPROBANTE" instead of store purchase/restore buttons; Inicio may
show an install card or a renewal notice above the topic grid.

## Checking parity

```bash
npm run build && npm run preview &     # serves dist on :4173
npm run shots                          # → /dev/shm/fldmv-shots/01-onboarding.png …
```

`tools/screenshots.ts` uses the Android screenshots' size (412×823 at 2.625× = 1081×2160) and
names files like the Android set, so you can put them side by side, e.g.
`magick android.png web.png +append compare.png`.
