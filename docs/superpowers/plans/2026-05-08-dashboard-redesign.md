# Florida Driver Prep — Dashboard Redesign Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement task-by-task. After each task, commit with the suggested message and dispatch the relevant subagent (validator / uiexpert / i18n-checker / a11y) before marking the task complete.

**Spec:** `docs/superpowers/specs/2026-05-08-dashboard-redesign-design.md`
**Reference mock:** `storyboard/mock-main-screen-1.png`
**Goal:** Ship the Spanish-locked dashboard redesign described in the spec, deployed to GitHub Pages, validated by all four project subagents, ready for cousin testing.

---

## File map

| File | Action | Phase |
|---|---|---|
| `src/styles/tokens.css` | NEW | 1 |
| `src/main.tsx` (or `index.css`) | Modify — import tokens | 1 |
| `src/types.ts` | Modify — extend types | 1 |
| `src/store/progressStore.ts` | Modify — extend defaults + migration | 1 |
| `src/store/computed.ts` | NEW | 1 |
| `src/components/GradientHeader.{tsx,css}` | NEW | 2 |
| `src/components/BottomTabBar.{tsx,css}` | NEW | 2 |
| `src/components/TopicCard.{tsx,css}` | NEW | 2 |
| `src/components/PerformanceChart.{tsx,css}` | NEW | 2 |
| `src/components/HomeScreen.{tsx,css}` | FULL REWRITE | 3 |
| `src/components/TemasScreen.{tsx,css}` | NEW | 4 |
| `src/components/PerfilScreen.{tsx,css}` | NEW | 4 |
| `src/components/AjustesScreen.{tsx,css}` | NEW | 4 |
| `src/components/StudyMode.{tsx,css}` | Modify — adopt GradientHeader | 5 |
| `src/components/ExamMode.{tsx,css}` | Modify — adopt GradientHeader | 5 |
| `src/components/ResultsScreen.{tsx,css}` | Modify — adopt gradient hero | 5 |
| `src/App.tsx` | Modify — new routing + tab bar | 6 |
| `tests/computed.test.ts` | NEW | 7 |
| `tests/HomeScreen.test.tsx` | NEW | 7 |
| `tests/BottomTabBar.test.tsx` | NEW | 7 |
| `tests/TopicCard.test.tsx` | NEW | 7 |
| `tests/PerformanceChart.test.tsx` | NEW | 7 |
| `tests/TemasScreen.test.tsx` | NEW | 7 |
| `tests/PerfilScreen.test.tsx` | NEW | 7 |
| `tests/AjustesScreen.test.tsx` | NEW | 7 |
| `tests/StudyMode.test.tsx` | Modify if header structure changes asserts | 7 |
| `tests/ExamMode.test.tsx` | Modify if header structure changes asserts | 7 |

---

## Phase 1 — Foundation

### Task 1.1: Create CSS tokens file

- [ ] **Step 1: Create `src/styles/tokens.css`** — copy the full `:root` block from §5 of the spec.
- [ ] **Step 2: Import it once globally** — append `import './styles/tokens.css'` to `src/main.tsx` (or whichever file is the app entrypoint, check first with `grep -l "createRoot" src/`).
- [ ] **Step 3: Verify build clean** — `npm run build 2>&1 | tail -10`. Expected: no errors.
- [ ] **Step 4: Commit**
  ```bash
  git add src/styles/tokens.css src/main.tsx
  git commit -m "feat: extract design tokens to shared tokens.css"
  ```

### Task 1.2: Extend types

- [ ] **Step 1: Edit `src/types.ts`** — add `MacroTopic`, `MockExamRecord`, `DailyReadiness`, `DailyQuizState`, extend `Screen` to `'home' | 'temas' | 'study' | 'exam' | 'results' | 'perfil' | 'ajustes'`, extend `Progress` with the four new fields, extend `AppSettings` with `theme`, `sound`, `userName`. Use exact shapes from spec §5.
- [ ] **Step 2: Verify TS build** — `npm run build 2>&1 | tail -20`. Existing code referencing the old `Progress` should still compile because we only added optional/new fields.
- [ ] **Step 3: Commit**
  ```bash
  git add src/types.ts
  git commit -m "feat: extend types for dashboard redesign (mock history, daily readiness, streak, settings)"
  ```

### Task 1.3: Update progressStore with migration

- [ ] **Step 1: Edit `src/store/progressStore.ts`** — extend `defaultProgress` with new fields (mockHistory, dailyReadiness, dailyQuiz, masteredKeywords, studyAnswersWithoutHints) and `defaultSettings` with `userName: 'TESTUSER'` and `onboardingComplete: true`. Add a one-time migration in `loadProgress` and `loadSettings`: if loaded data is missing any of the new keys, fill from defaults and re-save. **Do NOT add theme or sound fields — they were cut from v1 per spec §13.**
- [ ] **Step 2: Add helper exports** — `pushDailyReadiness`, `pushMockExamRecord`, `setUserName`. Each is a pure function returning new Progress/Settings.
- [ ] **Step 3: Test the migration manually** — in browser devtools, set a stale `fl_driver_progress` shape and confirm `loadProgress()` returns the new shape without crashing.
- [ ] **Step 4: Commit**
  ```bash
  git add src/store/progressStore.ts
  git commit -m "feat: progressStore migration for new fields + helper setters"
  ```

### Task 1.4: Computed metrics module

- [ ] **Step 1: Create `src/store/computed.ts`** with the function signatures from spec §5. Implementation notes:
  - `topicMasteryPct`: filter questions by macro topic via the mapping table; count studyAnswers entries that are `correct`; return `(correct / total) * 100` rounded.
  - `passProbabilityPct`: arithmetic mean of all 4 topic mastery %.
  - `masteredKeywordsCount`: scan `progress.studyAnswersWithoutHints`; for each questionId, look up keywords; count EN keywords that appear in ≥3 such questionIds; return unique count.
  - `recordDailyReadiness`: compute today's date in `America/New_York`; if last entry is today, replace; else append; trim to 30.
  - `shouldShowReadyChip`: last 3 dailyReadiness entries all ≥ 80%.
  - `getRecentMockScores(progress, n)`: slice `mockHistory` last n.
  - `isStreakActive` / `incrementStreak`: TZ-aware date math via `Intl.DateTimeFormat('en-US', {timeZone: 'America/New_York'})`.
- [ ] **Step 2: Add the macro-topic mapping constant**:
  ```ts
  export const MACRO_TOPIC_MAP: Record<MacroTopic, Category[]> = {
    senales: ['traffic-signals', 'road-markings'],
    reglas: ['right-of-way', 'speed-limits'],
    seguridad: ['dui', 'general'],
    especial: ['school-zones'],
  }
  export const MACRO_TOPIC_LABELS: Record<MacroTopic, string> = {
    senales: 'Señales de Tráfico',
    reglas: 'Reglas del Camino',
    seguridad: 'Seguridad y Leyes',
    especial: 'Conducción Especial',
  }
  ```
- [ ] **Step 3: Verify TS build** — `npm run build 2>&1 | tail -10`.
- [ ] **Step 4: Commit**
  ```bash
  git add src/store/computed.ts
  git commit -m "feat: derived metrics module (mastery, probability, streak, readiness)"
  ```

### Task 1.5: Unit-test computed metrics

- [ ] **Step 1: Create `tests/computed.test.ts`** with the unit-test cases from spec §7.
- [ ] **Step 2: Run tests** — `npm test -- tests/computed.test.ts`. All pass.
- [ ] **Step 3: Commit**
  ```bash
  git add tests/computed.test.ts
  git commit -m "test: unit tests for computed metrics"
  ```

---

## Phase 2 — Shared UI primitives

### Task 2.1: GradientHeader

- [ ] **Step 1: Create `src/components/GradientHeader.tsx`**:
  - Props: `{ title: string; left?: ReactNode; right?: ReactNode; variant?: 'full' | 'strip' }`
  - `variant="full"` is the home hero (tall, with greeting/probability slot via children).
  - `variant="strip"` is the slim header for Study/Exam/Results.
- [ ] **Step 2: Create `src/components/GradientHeader.css`** using `var(--gradient-header)`, with `.header__strip` and `.header__full` modifiers.
- [ ] **Step 3: Quick smoke render** — temporarily add `<GradientHeader title="Test" />` to App, verify in `npm run dev`, then remove.
- [ ] **Step 4: Commit**
  ```bash
  git add src/components/GradientHeader.tsx src/components/GradientHeader.css
  git commit -m "feat: shared GradientHeader component (full + strip variants)"
  ```

### Task 2.2: BottomTabBar

- [ ] **Step 1: Create `src/components/BottomTabBar.tsx`**:
  - Props: `{ active: Screen; onChange: (s: Screen) => void }`
  - Renders 5 fixed tabs: Inicio (🏠), Temas (📚), Exámenes (📝), Perfil (👤), Ajustes (⚙).
  - Active tab gets `aria-current="page"` and active CSS class.
  - Each tab is a `<button>` with `aria-label` (e.g. "Ir a Temas"), min-height 56px, full-width hit area.
- [ ] **Step 2: Create `src/components/BottomTabBar.css`** — fixed bottom, white bg, 1px top border, 5 equal columns, icons above tiny labels.
- [ ] **Step 3: Test file `tests/BottomTabBar.test.tsx`** — covers the spec §7 cases for this component.
- [ ] **Step 4: Run tests** — pass.
- [ ] **Step 5: Commit**
  ```bash
  git add src/components/BottomTabBar.tsx src/components/BottomTabBar.css tests/BottomTabBar.test.tsx
  git commit -m "feat: BottomTabBar with 5 tabs, aria-current, 56px touch targets"
  ```

### Task 2.3: TopicCard

- [ ] **Step 1: Create `src/components/TopicCard.tsx`**:
  - Props: `{ topic: MacroTopic; masteryPct: number; onTap: () => void }`
  - Renders the topic emoji + Spanish label + horizontal progress bar + percent.
- [ ] **Step 2: CSS** — rounded `var(--radius-lg)`, white bg, 1px gray-200 border, hover lifts shadow slightly.
- [ ] **Step 3: Test** — `tests/TopicCard.test.tsx`.
- [ ] **Step 4: Commit**
  ```bash
  git add src/components/TopicCard.tsx src/components/TopicCard.css tests/TopicCard.test.tsx
  git commit -m "feat: TopicCard component with mastery progress bar"
  ```

### Task 2.4: PerformanceChart (custom SVG)

- [ ] **Step 1: Create `src/components/PerformanceChart.tsx`**:
  - Props: `{ readiness: DailyReadiness[]; mockScores: MockExamRecord[] }`
  - Renders an inline `<svg>` with `viewBox="0 0 300 140"`.
  - Y-axis 0–100, X-axis last 7 days.
  - Solid path for readiness line (smoothed via SVG `Q` quadratic curves or just linear).
  - Dashed horizontal line at y representing 80% (`stroke-dasharray`).
  - Dots (filled circles, teal) for any mock score taken within those 7 days.
  - Labels: tiny day initials (L M M J V S D) at the bottom; 80% goal label on the right.
- [ ] **Step 2: Empty state** — if `readiness` is empty, render a centered Spanish message: `Empieza tu primer estudio para ver tu progreso.`
- [ ] **Step 3: Test** — `tests/PerformanceChart.test.tsx` — assert presence of dashed line, dots, path; assert empty state.
- [ ] **Step 4: Commit**
  ```bash
  git add src/components/PerformanceChart.tsx src/components/PerformanceChart.css tests/PerformanceChart.test.tsx
  git commit -m "feat: PerformanceChart custom SVG with readiness line, mock-score dots, 80% goal line"
  ```

---

## Phase 3 — Home rewrite

### Task 3.1: HomeScreen.tsx full rewrite

- [ ] **Step 1: Replace `src/components/HomeScreen.tsx`** — compose:
  - `<GradientHeader variant="full" />` containing greeting `¡Hola, {settings.userName}!`, readiness sentence `Estás {p}% lista para aprobar`, vocab streak chip `🔥 {n} palabras dominadas`, probability bar, label `Probabilidad de Aprobar`.
  - Three columns (CSS grid 2-1 split on >480px, stacks on mobile if needed):
    - Left: section heading `ESTUDIAR Y ENTRENAR` + 4 `<TopicCard>`s.
    - Center: section heading `EXÁMENES DE PRÁCTICA` + Full Mock card (teal CTA) + Quick Quiz card (white).
    - Right: section heading `MI PROGRESO` + Recent scores list + `<PerformanceChart />` + `Listo/a para el examen real 🎯` chip if `shouldShowReadyChip`.
  - Streak indicator near header: `Racha: {streakDays} día(s)` if `dailyQuiz.streakDays > 0`.
- [ ] **Step 2: Wire metrics** — call `topicMasteryPct`, `passProbabilityPct`, `masteredKeywordsCount`, `getRecentMockScores`, `shouldShowReadyChip` from `computed.ts`.
- [ ] **Step 3: Empty state** — if no progress at all, show inline microcopy `Empieza tu primer estudio para ver tu progreso.` instead of recent scores.
- [ ] **Step 4: Verify in browser** — `npm run dev`, navigate to home, confirm visually matches the brainstorm ASCII.
- [ ] **Step 5: Commit**
  ```bash
  git add src/components/HomeScreen.tsx
  git commit -m "feat: rewrite HomeScreen as Spanish-locked dashboard with topics, mocks, progress"
  ```

### Task 3.2: HomeScreen.css full rewrite

- [ ] **Step 1: Replace `src/components/HomeScreen.css`** — mobile-first single column at < 480px, columnar layout above. Use only tokens from `tokens.css`.
- [ ] **Step 2: Manual viewport check** — Chrome devtools at 375×667. No horizontal scroll. All touch targets ≥ 44px.
- [ ] **Step 3: Commit**
  ```bash
  git add src/components/HomeScreen.css
  git commit -m "feat: HomeScreen CSS using design tokens, mobile-first columnar"
  ```

### Task 3.3: HomeScreen test

- [ ] **Step 1: Create `tests/HomeScreen.test.tsx`** — cover spec §7 cases.
- [ ] **Step 2: Run tests** — pass.
- [ ] **Step 3: Commit**
  ```bash
  git add tests/HomeScreen.test.tsx
  git commit -m "test: HomeScreen dashboard tests"
  ```

---

## Phase 4 — New screens

### Task 4.1: TemasScreen

- [ ] **Step 1: Create `src/components/TemasScreen.tsx`** — `<GradientHeader variant="strip" title="Temas" />` + 4 `<TopicCard>`s in a single column (full-width, larger than on Home), each tap navigates to Study Mode pre-filtered.
- [ ] **Step 2: CSS + test.** Test: 4 tiles render; tap on each fires correct callback.
- [ ] **Step 3: Commit**
  ```bash
  git add src/components/TemasScreen.tsx src/components/TemasScreen.css tests/TemasScreen.test.tsx
  git commit -m "feat: TemasScreen with 4 macro-topic tiles"
  ```

### Task 4.2: PerfilScreen

- [ ] **Step 1: Create `src/components/PerfilScreen.tsx`**:
  - Strip header `Perfil`.
  - Avatar circle (placeholder gradient with first letter of `userName`), name `TESTUSER` (read-only for v1).
  - Stat rows: `Preguntas respondidas: N` / `Racha actual: N días` / `Probabilidad de aprobar: N%` / `Palabras dominadas: N`.
  - Footer link: `Ver ajustes →` that navigates to the Ajustes screen.
  - **No destructive actions on this screen** — reset lives on Ajustes only (per spec FR-19).
- [ ] **Step 2: CSS + test.** Test that link navigates to Ajustes.
- [ ] **Step 3: Commit**
  ```bash
  git add src/components/PerfilScreen.tsx src/components/PerfilScreen.css tests/PerfilScreen.test.tsx
  git commit -m "feat: PerfilScreen with stats + link to Ajustes"
  ```

### Task 4.3: AjustesScreen

- [ ] **Step 1: Create `src/components/AjustesScreen.tsx`** with exactly three rows:
  - **Row 1 — Reiniciar progreso** (button): shows confirmation modal `¿Estás seguro? Esta acción no se puede deshacer.` with `Cancelar` / `Reiniciar` buttons; on confirm, calls `clearAll()` from progressStore and toasts `Progreso reiniciado.`
  - **Row 2 — Versión X.X.X** (read-only label): pulls version from `package.json` via Vite's `import.meta.env` or hardcoded constant.
  - **Row 3 — Soporte** (link): `mailto:mperez.tech@gmail.com?subject=FL%20DMV%20Prep%20-%20Soporte`.
  - **No theme toggle. No sound toggle.** (Cut from v1 per spec §13 descope tiers.)
- [ ] **Step 2: CSS + test.** Test that confirm modal appears, that confirming wipes localStorage, that cancel preserves state.
- [ ] **Step 3: Commit**
  ```bash
  git add src/components/AjustesScreen.tsx src/components/AjustesScreen.css tests/AjustesScreen.test.tsx
  git commit -m "feat: AjustesScreen with reset confirm, version, soporte"
  ```

---

## Phase 5 — Restyle existing screens

### Task 5.1: StudyMode adopts GradientHeader

- [ ] **Step 1: Edit `src/components/StudyMode.tsx`** — replace the existing custom `<header className="study__header">` with `<GradientHeader variant="strip" title="Estudio" left={<button>← Inicio</button>} right={<bookmark btn>}>` and put the progress bar inside the strip.
- [ ] **Step 2: Adjust CSS** — remove now-redundant `.study__header*` rules, keep cat pills + main + card + keywords styles.
- [ ] **Step 3: Run StudyMode tests** — `npm test -- tests/StudyMode.test.tsx`. Update assertions if `.study__header` selector is gone (use semantic queries instead).
- [ ] **Step 4: Commit**
  ```bash
  git add src/components/StudyMode.tsx src/components/StudyMode.css tests/StudyMode.test.tsx
  git commit -m "style: StudyMode adopts shared GradientHeader"
  ```

### Task 5.2: ExamMode adopts GradientHeader

- [ ] **Step 1: Edit `src/components/ExamMode.tsx`** — strip header `Examen Completo` with timer slot and exit button. No bottom tab bar during exam (focus mode).
- [ ] **Step 2: CSS adjustments.**
- [ ] **Step 3: Tests.**
- [ ] **Step 4: Commit**
  ```bash
  git add src/components/ExamMode.tsx src/components/ExamMode.css tests/ExamMode.test.tsx
  git commit -m "style: ExamMode adopts shared GradientHeader, hides bottom nav during exam"
  ```

### Task 5.3: ResultsScreen restyle hero

- [ ] **Step 1: Edit `src/components/ResultsScreen.tsx`** — replace the existing hero with a full-variant `<GradientHeader>` containing the celebratory `🎉 ¡APROBASTE!` / `😔 Sigue practicando` headline and the score `{n} / 50 = {p}%`.
- [ ] **Step 2: Below the header, render `DESEMPEÑO POR CATEGORÍA` rows mapped to macro topics, plus two CTAs `Repasar Errores` (teal) and `Volver al Inicio` (white outline).**
- [ ] **Step 3: After ResultsScreen renders, append the completed mock to `progress.mockHistory` via `pushMockExamRecord` before the user navigates away.**
- [ ] **Step 4: Tests + commit.**
  ```bash
  git add src/components/ResultsScreen.tsx src/components/ResultsScreen.css tests/ResultsScreen.test.tsx
  git commit -m "style: ResultsScreen with gradient hero + macro-topic breakdown + mock history persistence"
  ```

---

## Phase 6 — Routing

### Task 6.1: App.tsx update

- [ ] **Step 1: Edit `src/App.tsx`** — extend the `Screen` switch to handle the new screens (`temas`, `perfil`, `ajustes`). Render `<BottomTabBar>` on Inicio / Temas / Perfil / Ajustes (NOT on Study, Exam, or Results — focus mode).
- [ ] **Step 2: Wire pre-filtered Study entry from Temas** — pass `filterTopic?: MacroTopic` prop into StudyMode; StudyMode's existing category filter logic respects it.
- [ ] **Step 3: Daily readiness recording** — on every Home mount, call `recordDailyReadiness(progress, questions)` and persist.
- [ ] **Step 4: Smoke test all 5 tabs** — `npm run dev`, click each tab, confirm renders.
- [ ] **Step 5: Commit**
  ```bash
  git add src/App.tsx
  git commit -m "feat: App routing for 5-tab nav, Temas pre-filter, daily readiness recording"
  ```

---

## Phase 7 — Quality gates (subagents)

> **Important:** dispatch each subagent with the Agent tool. Read its full report. Fix every "Critical" issue. Re-run until PASS.

### Task 7.1: i18n-checker pass

- [ ] **Step 1: Dispatch `i18n-checker` subagent** with prompt: "Audit all UI strings in src/components/ and index.html for English chrome leaks. Report file:line for every violation per your spec."
- [ ] **Step 2: Fix every violation reported.**
- [ ] **Step 3: Re-dispatch — must return PASS.**
- [ ] **Step 4: Commit any fixes**
  ```bash
  git add -A
  git commit -m "fix: resolve i18n-checker findings — Spanish chrome compliance"
  ```

### Task 7.2: uiexpert pass

- [ ] **Step 1: Dispatch `uiexpert` subagent.**
- [ ] **Step 2: Fix every Critical issue. Address Important issues.**
- [ ] **Step 3: Re-dispatch — must return SHIPPABLE.**
- [ ] **Step 4: Commit fixes**
  ```bash
  git add -A
  git commit -m "fix: resolve uiexpert findings — visual polish + responsiveness"
  ```

### Task 7.3: a11y pass

- [ ] **Step 1: Dispatch `a11y` subagent.**
- [ ] **Step 2: Fix every Critical issue.**
- [ ] **Step 3: Re-dispatch — must return PASS.**
- [ ] **Step 4: Commit fixes**
  ```bash
  git add -A
  git commit -m "fix: resolve a11y findings — contrast, ARIA, touch targets"
  ```

### Task 7.4: validator final pass

- [ ] **Step 1: Dispatch `validator` subagent.**
- [ ] **Step 2: Must return PASS (build clean, all tests passing, lint clean, git clean).**

---

## Phase 8 — Ship

### Task 8.1: Manual smoke test

- [ ] **Step 1: Build + preview** — `npm run build && npm run preview`. Open at iPhone-SE viewport (375×667).
- [ ] **Step 2: Run the smoke checklist:**
  - Home renders dashboard correctly.
  - Tap each of 5 tabs; each screen renders.
  - Tap a topic card → enters Study filtered to that topic.
  - Complete one Daily Quick Quiz → streak shows on Home.
  - Take a Full Mock (50 q) → result appears in Recent Scores; daily readiness updates.
  - Reset progress in Perfil → all metrics return to 0.
- [ ] **Step 3: Document any issues** — fix and re-run validator.

### Task 8.2: Deploy to GitHub Pages

- [ ] **Step 1: Deploy** — `npm run deploy`. Wait for "Published" message.
- [ ] **Step 2: Verify live URL** — open `https://norcimo5.github.io/florida-test-webapp/` on phone, run smoke test there.
- [ ] **Step 3: Final commit if anything changed**
  ```bash
  git add -A
  git status  # should be clean after this
  ```

### Task 8.3: Notify cousin

- [ ] **Step 1: Share URL with cousin** for real-user validation. (Manual — outside agent scope.)
- [ ] **Step 2: Create `docs/cousin-feedback-2026-05-XX.md`** when feedback arrives, then return to spec for v2 changes.

---

## Done definition

All boxes checked. All four subagents PASS. Live URL works on a real phone. The user has shared it with their cousin.
