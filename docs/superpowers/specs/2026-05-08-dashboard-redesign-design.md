# Florida Driver Prep — Dashboard Redesign Spec

**Date:** 2026-05-08
**Status:** Approved (pending implementation)
**Reference mock:** `storyboard/mock-main-screen-1.png`
**Project memory:** `project_dashboard_redesign.md`

---

## 1. SYSTEM INTENT

### Problem statement

The current Florida Driver Prep webapp is a functional but minimal quiz tool: Home → Study/Exam → Results. It does not feel like a polished product, does not personalize, does not gamify, does not surface progress meaningfully, and — most critically — its UI chrome is largely English, which is unusable for the target Spanish-primary audience.

This redesign transforms the home screen into a **Spanish-locked dashboard** modeled on a Duolingo / Apple-Fitness aesthetic, introduces topic-based learning IA, adds a real Pass-Probability Meter, vocabulary streak tracking, daily quick-quiz habit loop, recent-scores history, and a performance trend chart with a goal line. The same aesthetic carries into Study, Exam, and Results so the entire app feels like one product.

### Target users

**Primary:** Spanish-primary Florida residents who need to pass the English-only Class E Knowledge Exam. Reading literacy is Spanish; English exposure is limited to the exam-content keywords they are training to recognize.

**Validation user:** the project owner's cousin, a real Spanish-primary FL resident who will test the deployed prototype before any further investment.

### Success criteria (quantified)

| Metric | Target |
|---|---|
| % of UI strings in Spanish (excluding question content) | 100% |
| Time to first interactive on Home (mobile, 4G) | < 2.5s |
| Lighthouse Mobile score (Performance / Accessibility / Best Practices) | ≥ 90 / ≥ 95 / ≥ 95 |
| WCAG contrast ratio for body text | ≥ 4.5:1 |
| Touch target minimum | 44 × 44 px |
| Test suite | 100% passing, ≥ 50 specs |
| Tasks in `validator` subagent verdict | All PASS |
| Cousin completes a full mock exam end-to-end without confusion | Yes (qualitative) |

### Non-goals (explicit)

- Real authentication (placeholder `TESTUSER` only)
- Backend/server (everything client-side, localStorage)
- IAP / paywall (deferred to Capacitor phase)
- Multi-language support beyond Spanish chrome (no EN toggle)
- iOS / Android native build (deferred to next phase)
- Real-time multiplayer / social features
- Push notifications
- Adaptive ML-based difficulty (simple weighted random suffices)

---

## 2. USER STORIES (EARS FORMAT)

### US-1 — Personalized greeting on app open
**WHEN** a user opens the app
**THE SYSTEM SHALL** display a personalized Spanish greeting using `TESTUSER` as the placeholder name
**WITH** the format `¡Hola, {name}!`

### US-2 — Pass Probability Meter
**WHEN** the home screen loads
**THE SYSTEM SHALL** compute and display the user's pass probability as the arithmetic mean of mastery percentages across the four macro topics
**WITH** the value rendered both as a horizontal progress bar and as a percentage figure, labeled `Probabilidad de Aprobar`

### US-3 — Vocabulary streak chip
**WHEN** the home screen loads
**THE SYSTEM SHALL** display the count of mastered EN→ES keyword pairs as `🔥 N palabras dominadas`
**WITH** "mastered" defined as: a keyword pair that has appeared in ≥ 3 questions the user answered correctly without the Spanish chip visible

### US-4 — Topic mastery cards
**WHEN** the home screen loads
**THE SYSTEM SHALL** display four topic cards (Señales de Tráfico, Reglas del Camino, Seguridad y Leyes, Conducción Especial) each with a per-topic mastery progress bar and percentage
**WITH** each card tappable, navigating to the Temas screen filtered to that macro topic

### US-5 — Full Mock Exam launch
**WHEN** the user taps the `EMPEZAR EXAMEN COMPLETO` card
**THE SYSTEM SHALL** start a 50-question English-only exam with no Spanish hints and no explanations during the exam
**WITH** a visible duration label of `10–20 MIN` on the launch card, and a pass threshold of 40 / 50 (80%)

### US-6 — Daily Quick Quiz with streak
**WHEN** the user taps the `Quiz Diario Rápido` card
**THE SYSTEM SHALL** start a 5-question mixed-topic quiz
**WITH** the user's current streak displayed on Home (e.g. `Racha: 3 días`); streak increments on completion, resets if a calendar day is skipped (using `America/New_York` timezone)

### US-7 — Recent scores list
**WHEN** the home screen loads
**THE SYSTEM SHALL** display the last 2 completed full-mock-exam scores under the heading `Puntajes Recientes`
**WITH** the format `Test {n}: {pct}%`, newest first; if fewer than 2 mocks exist, show only what exists

### US-8 — Performance chart with goal line
**WHEN** the home screen loads
**THE SYSTEM SHALL** render a line chart of the user's daily readiness % over the last 7 days, with dots overlaid for any full-mock-exam scores, and a dashed horizontal line at 80%
**WITH** a celebratory chip `Listo/a para el examen real 🎯` rendered when readiness has been ≥ 80% for 3 consecutive days

### US-9 — Bottom tab navigation
**WHEN** the user taps any tab in the bottom tab bar
**THE SYSTEM SHALL** navigate to the corresponding top-level screen (Inicio / Temas / Exámenes / Perfil / Ajustes)
**WITH** the active tab visually highlighted and `aria-current="page"`

### US-10 — Spanish-only chrome guarantee
**WHEN** any screen renders any text outside of `Question.en` content
**THE SYSTEM SHALL** render that text in Spanish
**WITH** zero English strings in JSX, CSS `content:`, ARIA labels, placeholders, or any user-facing surface

### US-11 — Aesthetic carry-over
**WHEN** any of Home, Study, Exam, or Results renders
**THE SYSTEM SHALL** use the same color tokens, gradient header style, primary CTA color, card style, and bottom tab bar component
**WITH** visual consistency confirmed by the `uiexpert` subagent

### US-12 — Temas (topics) screen
**WHEN** the user taps the Temas tab
**THE SYSTEM SHALL** display the four macro topic tiles with mastery bars
**WITH** tapping a tile entering Study Mode pre-filtered to that topic

### US-13 — Perfil (profile) screen
**WHEN** the user taps the Perfil tab
**THE SYSTEM SHALL** display: TESTUSER name placeholder, total questions answered, current daily-quiz streak, pass-probability %, palabras dominadas count, and a "Ver ajustes →" link to the Ajustes screen
**WITH** no destructive actions on this screen (reset lives on Ajustes only)

### US-14 — Ajustes (settings) screen
**WHEN** the user taps the Ajustes tab
**THE SYSTEM SHALL** display three rows only: `Reiniciar progreso` (with confirmation modal), `Versión X.X.X` (read-only), and `Soporte` (mailto link)
**WITH** the reset confirming via Spanish-language modal before wiping localStorage

### US-15 — Edge case: no progress yet
**WHEN** a user opens the app for the first time (no localStorage data)
**THE SYSTEM SHALL** display the Home dashboard with all metrics at 0% / empty
**WITH** a warm onboarding microcopy `Empieza tu primer estudio para ver tu progreso.`

### US-16 — Failure scenario: localStorage unavailable
**WHEN** localStorage is blocked (private browsing, quota, etc.)
**THE SYSTEM SHALL** fall back to in-memory state
**WITH** a one-time toast `Tu progreso no se guardará en este navegador. Cambia a modo normal para guardar tu avance.`

### US-17 — Security consideration: input safety
**WHEN** any user-controlled string is rendered (TESTUSER name, future auth)
**THE SYSTEM SHALL** render via React's default JSX escaping
**WITH** no `dangerouslySetInnerHTML` except for the keyword-highlight markup, which already escapes via the existing `escapeHtml` function before injecting `<mark>` tags

---

## 3. FUNCTIONAL REQUIREMENTS

| ID | Requirement | Atomic / Testable / Deterministic |
|---|---|---|
| FR-1 | All UI chrome strings are Spanish | ✅ via grep + i18n-checker |
| FR-2 | Pass Probability = mean of 4 topic mastery percentages, rounded to nearest integer | ✅ deterministic |
| FR-3 | Topic mastery % = (correct study answers in topic / total questions in topic) × 100, rounded | ✅ |
| FR-4 | Mastered keyword count = unique EN keywords appearing in ≥ 1 correctly-answered question where Spanish chip was hidden at answer time. (Threshold lowered from 3 because most keywords appear in only 1–2 questions across the 120-bank; threshold of 3 would keep the count at near-zero forever.) | ✅ |
| FR-5 | Daily Quick Quiz = 5 random questions, weighted toward weakest macro topic but at least 1 from each | ✅ |
| FR-6 | Streak resets if no quiz completed on previous calendar day (America/New_York TZ) | ✅ |
| FR-7 | Performance chart plots `dailyReadiness[]` (last 7 entries) as line, `mockScores[]` (timestamped) as dots | ✅ |
| FR-8 | Goal line drawn at y = 80% on chart, dashed | ✅ |
| FR-9 | "Listo para el examen real" chip shown iff dailyReadiness has been ≥ 80% for last 3 entries | ✅ |
| FR-10 | Full mock = exactly 50 questions sampled across categories proportional to bank distribution | ✅ |
| FR-11 | Pass threshold for full mock = 40 / 50 (80%) | ✅ |
| FR-12 | Bottom tab bar shows 5 tabs: Inicio, Temas, Exámenes, Perfil, Ajustes | ✅ |
| FR-13 | Active tab has `aria-current="page"` | ✅ |
| FR-14 | All interactive elements have ≥ 44×44px touch target | ✅ |
| FR-15 | All gradient header strips use the same color tokens across screens | ✅ |
| FR-16 | All primary CTA buttons use the same teal color token across screens | ✅ |
| FR-17 | The four macro topics map to existing 7 categories per the table in §5 | ✅ |
| FR-18 | Topic card tap navigates to Study Mode pre-filtered to that macro topic | ✅ |
| FR-19 | Reset progress button lives on Ajustes only; Perfil shows "Ver ajustes →" link instead. Confirms via Spanish modal before wiping. | ✅ |
| FR-20 | `AppSettings` only persists `userName` and `examLength` (theme and sound cut from v1) | ✅ |

---

## 4. NON-FUNCTIONAL REQUIREMENTS

### Performance
- Time to Interactive (TTI) on Home, mobile 4G simulated: < 2.5s
- Bundle size after gzip: < 250 KB total
- No client-side network calls (everything bundled or localStorage)
- Performance chart renders without external charting lib (custom SVG); if needed, use a < 10 KB lib only

### Reliability
- App must not crash if localStorage is unavailable (in-memory fallback per US-16)
- All async-shaped operations (none in v1) are synchronous; no race conditions possible
- No external services → no SLA dependencies

### Security
- No PII collected (TESTUSER is a hardcoded placeholder)
- All rendered text uses React JSX escaping by default
- The single `dangerouslySetInnerHTML` site (StudyMode keyword highlighting) routes through `escapeHtml()` first; preserve this invariant
- No third-party tracking, analytics, or fonts loaded externally
- CSP-friendly (no inline scripts, no eval)

### Cost
- $0 hosting (GitHub Pages)
- $0 third-party services
- Build cost: human time only

### Accessibility (WCAG 2.1 AA)
- Color contrast: text ≥ 4.5:1, UI components ≥ 3:1
- All icon-only buttons have Spanish `aria-label`
- `<html lang="es">`, English question content marked `lang="en"`
- Keyboard navigable, visible focus rings
- Honors `prefers-reduced-motion`

### Compatibility
- Mobile-first; baseline: iPhone SE (375 × 667)
- Desktop graceful: max-width container 480px, centered
- Browsers: last 2 versions of Safari, Chrome, Firefox, Edge
- Future Capacitor-readiness: no DOM APIs that don't work in WebView

---

## 5. SYSTEM ARCHITECTURE

### High-level architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React 19 SPA                           │
│  ┌──────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │
│  │  App.tsx │→ │ Router  │→ │ Screen  │→ │ Components  │   │
│  │  (state) │  │ (state) │  │ Container│  │ (presentational)│
│  └──────────┘  └─────────┘  └─────────┘  └─────────────┘   │
│        ↕                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            progressStore (localStorage)              │   │
│  └──────────────────────────────────────────────────────┘   │
│        ↕                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │       data/questions.json (120-question bank)        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component breakdown

```
src/
├── App.tsx                              State-based router; routes Screen → component
├── types.ts                             Extended (see below)
├── data/questions.json                  Unchanged
├── store/
│   ├── progressStore.ts                 Extended (see below)
│   └── computed.ts                      NEW — derived metrics (mastery, readiness, vocab count)
├── components/
│   ├── HomeScreen.tsx                   FULL REWRITE — dashboard
│   ├── HomeScreen.css                   FULL REWRITE
│   ├── StudyMode.tsx                    Restyle header, no logic change
│   ├── StudyMode.css                    Restyle gradient header
│   ├── ExamMode.tsx                     Restyle header
│   ├── ExamMode.css                     Restyle gradient header
│   ├── ResultsScreen.tsx                Restyle hero
│   ├── ResultsScreen.css                Restyle hero
│   ├── OptionsDrawer.tsx                Spanish copy audit
│   ├── OptionsDrawer.css                Unchanged
│   ├── BottomTabBar.tsx                 NEW
│   ├── BottomTabBar.css                 NEW
│   ├── GradientHeader.tsx               NEW (shared header strip)
│   ├── GradientHeader.css               NEW
│   ├── TopicCard.tsx                    NEW
│   ├── TopicCard.css                    NEW
│   ├── PerformanceChart.tsx             NEW (custom SVG)
│   ├── PerformanceChart.css             NEW
│   ├── TemasScreen.tsx                  NEW
│   ├── TemasScreen.css                  NEW
│   ├── PerfilScreen.tsx                 NEW
│   ├── PerfilScreen.css                 NEW
│   └── AjustesScreen.tsx                NEW
│   └── AjustesScreen.css                NEW
└── styles/
    └── tokens.css                       NEW — extracted CSS custom properties (colors, radii, spacing)
```

### Type extensions (`src/types.ts`)

```ts
export type Screen = 'home' | 'temas' | 'study' | 'exam' | 'results' | 'perfil' | 'ajustes'

export type MacroTopic = 'senales' | 'reglas' | 'seguridad' | 'especial'

export interface MockExamRecord {
  id: string                  // ISO timestamp
  scoreCorrect: number
  scoreTotal: number          // always 50
  takenAt: string             // ISO date
}

export interface DailyReadiness {
  date: string                // YYYY-MM-DD (America/New_York)
  readinessPct: number        // 0-100
}

export interface DailyQuizState {
  streakDays: number
  lastCompletedDate: string | null  // YYYY-MM-DD
}

export interface Progress {
  studyAnswers: Record<string, StudyAnswer>
  bookmarks: string[]
  examQuestionIds: string[]
  examAnswers: ExamAnswer[]
  examComplete: boolean
  // NEW:
  mockHistory: MockExamRecord[]      // last 20 retained
  dailyReadiness: DailyReadiness[]   // last 30 days retained
  dailyQuiz: DailyQuizState
  masteredKeywords: string[]         // EN keyword strings
  studyAnswersWithoutHints: string[] // questionIds answered correctly with Spanish chip hidden
}

export interface AppSettings {
  examLength: 25 | 50
  userName: string             // 'TESTUSER' default
  onboardingComplete: boolean  // reserved for v2 onboarding tour; default true in v1 (no tour)
}
```

### Macro-topic mapping

| Macro topic | Spanish label | Existing categories |
|---|---|---|
| `senales` | Señales de Tráfico | `traffic-signals`, `road-markings` |
| `reglas` | Reglas del Camino | `right-of-way`, `speed-limits` |
| `seguridad` | Seguridad y Leyes | `dui`, `general` |
| `especial` | Conducción Especial | `school-zones` |

### Derived metrics (`src/store/computed.ts`) — function signatures

```ts
export function topicMasteryPct(progress: Progress, questions: Question[], topic: MacroTopic): number
export function passProbabilityPct(progress: Progress, questions: Question[]): number
export function masteredKeywordsCount(progress: Progress): number
export function recordDailyReadiness(progress: Progress, questions: Question[]): Progress
export function shouldShowReadyChip(progress: Progress): boolean
export function getRecentMockScores(progress: Progress, n: number): MockExamRecord[]
export function isStreakActive(progress: Progress, today: string): boolean
export function incrementStreak(progress: Progress, today: string): Progress
```

### CSS tokens (`src/styles/tokens.css`)

```css
:root {
  /* Brand */
  --color-brand-blue-deep: #1e3a8a;
  --color-brand-blue: #1d4ed8;
  --color-brand-teal: #10b981;
  --color-brand-teal-dark: #059669;
  --color-brand-amber: #f59e0b;

  /* Grays */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-700: #374151;
  --color-gray-900: #111827;

  /* Semantic */
  --color-success: #16a34a;
  --color-error: #dc2626;
  --color-warning: #ea580c;

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 9px;
  --radius-lg: 14px;
  --radius-pill: 999px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-cta: 0 4px 12px rgba(16,185,129,0.25);

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Gradient header */
  --gradient-header: linear-gradient(135deg, var(--color-brand-blue-deep) 0%, var(--color-brand-blue) 100%);
}
```

---

## 6. TASK DECOMPOSITION (AGENT-READY)

See companion plan file `docs/superpowers/plans/2026-05-08-dashboard-redesign.md` for the executable task list with checkboxes.

Summary of phases:

| Phase | Tasks | Assigned agent type |
|---|---|---|
| Foundation | Tokens CSS, types extension, computed.ts | Builder |
| Shared UI | GradientHeader, BottomTabBar, TopicCard, PerformanceChart | Builder |
| Home rewrite | HomeScreen.tsx, HomeScreen.css | Builder |
| New screens | TemasScreen, PerfilScreen, AjustesScreen | Builder |
| Existing screens restyle | StudyMode/ExamMode/ResultsScreen restyle headers | Builder |
| Routing | App.tsx update for 5-tab nav | Builder |
| Spanish audit | i18n sweep across all components | i18n-checker subagent (Verifier) |
| Visual review | Cross-screen consistency check | uiexpert subagent (Verifier) |
| a11y review | Contrast, ARIA, focus | a11y subagent (Verifier) |
| Validation | Build / tests / lint | validator subagent (Verifier) |
| Deploy | `npm run deploy` to GitHub Pages | Builder |

---

## 7. VALIDATION & TEST PLAN

### Unit tests (Vitest)

| Function | Test cases |
|---|---|
| `topicMasteryPct` | 0/N, N/N, N/0 (empty bank) |
| `passProbabilityPct` | All zero, all 100, mixed (verify rounding) |
| `masteredKeywordsCount` | Threshold edge: 2 hits = not mastered, 3 hits = mastered, hint-visible answers don't count |
| `incrementStreak` | Same day = no increment, +1 day = increment, +2 days = reset to 1, gap = reset |
| `shouldShowReadyChip` | 2 days at 80% = false, 3 days at 80% = true, dip below = false |
| `getRecentMockScores` | n=2 with 0/1/2/5 records |

### Component tests (React Testing Library)

| Component | Test cases |
|---|---|
| `HomeScreen` | Renders Spanish greeting; renders 4 topic cards; renders pass probability; vocab streak chip displays count; performance chart svg present; ready chip visible iff condition met; empty state renders |
| `BottomTabBar` | Renders 5 tabs; active tab has `aria-current="page"`; tap fires onChange |
| `TopicCard` | Renders topic name + %; tap fires callback |
| `PerformanceChart` | Renders dashed goal line at 80%; renders dots for mock scores; renders smooth line for readiness |
| `TemasScreen` | Renders 4 tiles; tap dispatches Study Mode pre-filtered |
| `PerfilScreen` | Reset button shows confirm modal; confirming wipes localStorage |
| `AjustesScreen` | Theme toggle persists; sound toggle persists |

### Integration tests

| Flow | Test |
|---|---|
| Home → Topic card → Study | Tapping `Señales` enters StudyMode filtered to senales-mapped categories |
| Home → Full mock → Results | Completing 50 Q increments mockHistory and updates dailyReadiness |
| Daily Quick Quiz streak | Completing on day N then N+1 increments to 2; skipping N+2 resets to 1 on N+3 |
| First open | No localStorage → home renders with all 0%, empty chart, no streak |

### Edge-case tests

- localStorage blocked → in-memory fallback works, toast shows once
- 0 questions in a topic (shouldn't happen, but defensive) → topic card shows `—%`, doesn't crash
- 100+ entries in dailyReadiness → trimmed to 30
- 50+ entries in mockHistory → trimmed to 20

### Subagent verifier passes

- `validator` → all green (build, tests, lint, git status clean)
- `i18n-checker` → zero English chrome leaks, glossary compliance
- `uiexpert` → all four screens use shared header / CTA / card system; mobile viewport renders without overflow at 375px
- `a11y` → contrast PASS, all icon buttons aria-labeled, `<html lang="es">`

---

## 8. ACCEPTANCE CRITERIA

### "DONE" conditions

1. ✅ All four subagents return PASS
2. ✅ `npm run build` clean (zero TS / Vite errors)
3. ✅ `npm test` 100% passing
4. ✅ `npm run lint` zero warnings, zero errors
5. ✅ `npm run preview` (after build) renders Home dashboard correctly at 375×667 viewport
6. ✅ Manual smoke test: complete one Daily Quick Quiz, see streak increment; take one Full Mock, see it appear in Recent Scores; tap each of 5 tabs and confirm screens render
7. ✅ Spec + plan + CLAUDE.md + agents committed and pushed
8. ✅ Deployed to GitHub Pages, live URL loads cleanly on mobile

### Pass / fail thresholds

- **PASS:** all 8 conditions met
- **FAIL:** any condition unmet → fix and re-verify; do not mark plan tasks complete

---

## 9. FAILURE MODES & GUARDRAILS

| Failure mode | Prevention | Recovery |
|---|---|---|
| English string accidentally added during refactor | `i18n-checker` runs before commit; CI grep guard (future) | Subagent surfaces file:line; fix before commit |
| Touch target shrinks below 44px in CSS rewrite | `uiexpert` checks min-height on all `button`, `a` | Bump min-height; re-verify |
| localStorage shape changes break existing users | Add migration: read old shape, transform to new shape on first load with new build | Test with seed `fl_driver_progress` from current prod |
| Performance chart breaks layout on small screens | Test at 320px width minimum; chart uses viewBox + preserveAspectRatio | Reduce chart height; verify |
| Daily streak silently resets due to TZ confusion | Always compute `today` via `Intl.DateTimeFormat('en-US', {timeZone: 'America/New_York'})` | Add unit test covering DST transition |
| Bundle size balloons from new chart code | Custom SVG only, no Chart.js / Recharts; size budgeted in vite | If exceeded, remove animation gradients before lib |

---

## 10. ITERATION & FEEDBACK LOOP

### How agents report results

- Each builder commit follows the message convention `feat: ...` / `fix: ...` / `style: ...` / `test: ...` / `docs: ...`
- After each plan task, run the relevant verifier subagent and paste verdict in the commit body
- Cousin testing produces a feedback file at `docs/cousin-feedback-{date}.md`; update spec if findings warrant

### How spec updates propagate

- This spec is the source of truth. If reality diverges (e.g. cousin says "the streak is annoying"), **update this spec first**, then update the plan, then implement the change. Never let code drift ahead of spec.

### How regression is prevented

- All tests run on every commit (manually for now; CI later)
- `validator` subagent gates deploy
- The four subagents collectively form the regression suite for visual / linguistic / accessibility quality

---

## 12. CLARIFICATIONS REQUIRED

None at spec-write time. The four open decisions surfaced during brainstorming were resolved (Spanish chrome no toggle, mean of topic mastery for probability, full nav with all 5 tabs no sub-tabs, 5-question streak-tracked quick quiz, hybrid performance chart with goal line).

If implementation surfaces ambiguity, append to this section with `[CLARIFY-{n}]` markers and ask before coding.

---

## 13. DESCOPE TIERS (LOCKED)

Decided 2026-05-08. All four screens promoted to Tier 1 because the storyboard mock shows a 5-tab nav and a 3-column home; partial implementation reads as broken.

| Tier | Items | Cut policy |
|---|---|---|
| **Tier 1 — must ship** | Phase 1 foundation, Phase 2 shared primitives (GradientHeader / BottomTabBar / TopicCard / PerformanceChart), Phase 3 Home, Phase 4 all three new screens (Temas / Perfil / Ajustes — minimal content), Phase 5 restyle existing screens, Phase 6 routing, Phase 7 all 4 subagent passes, Phase 8 deploy | Never cut |
| **Tier 2 — defer to v2** | Onboarding tour (3-slide intro), real dark mode, Perfil achievements, Ajustes sound toggle, Soporte → real ticketing system, Performance chart trendline smoothing | Build post-cousin-feedback |
| **Tier 3 — never** | Real authentication, push notifications, multi-language toggle, social/leaderboard, in-app feedback widget | Out of project scope until product validated |

## 14. DEVIL'S-ADVOCATE MITIGATIONS

Risks surfaced during pre-flight review and how they're addressed in the plan:

| Risk | Mitigation |
|---|---|
| Empty-state UX on day-1 | Inline microcopy on Home (`Empieza tu primer estudio para ver tu progreso.`) plus chart empty state. No tour in v1. |
| Scope creep / token burn | Hybrid execution: Opus orchestrates, Sonnet 4.6 subagents execute each plan task. Cold-context cost bounded by self-contained task definitions. |
| Restyling StudyMode could regress polished CSS | Phase 5 (restyle) runs *after* all new builds. Visual diff via `npm run preview` before/after each restyle. Tests must still pass. |
| Vocabulary mastery threshold at 3 yields near-zero count forever | Threshold lowered to ≥1 (FR-4). |
| Reset progress on two screens (drift risk) | Reset lives on Ajustes only; Perfil links there. |
| Half-built theme toggle looks like a bug | Theme toggle cut from v1 entirely. |
| Public GH Pages URL has no in-app feedback | Out of scope. Cousin reports via text/call. |
| Bundle size budget unmeasured | Snapshot baseline at start of Phase 8; budget = baseline +30 KB gzip. |

## 15. OPEN QUESTIONS FOR FUTURE PHASES

These are documented for the next session, not in scope here:

- Real auth (replace TESTUSER) — Firebase Anon → Email Link? Apple Sign-In for iOS phase?
- Push notifications for streak preservation
- Adaptive difficulty: switch from weighted-random to spaced-repetition (SM-2 / FSRS)
- Multi-question-bank support if FL DMV updates the exam (versioning the question bank)
- Localization to other states (CA, TX) using same architecture
