# Florida Driver Prep — Phone-First Polish Sprint Design

## Goal

Refactor StudyMode to be mobile-first and single-column, add answer explanations in Spanish, add keyword highlighting in question text, add a progress bar, and implement weighted random question selection (wrong-answer recycling). Minor responsive fixes across all other screens.

## Architecture

All changes are confined to existing components and data files — no new screens, no new routes, no new stores. The weighted random logic lives inside `StudyMode.tsx`. The `explanation` field is added to the `Question` type and all 5 seed questions.

## Data Changes

### `src/types.ts`

Add `explanation` field to `Question`:

```ts
export interface Question {
  id: string
  en: QuestionEN
  es: QuestionES | null
  keywords: Keyword[]
  explanation: string   // Spanish explanation shown after answering. English keywords bolded in JSX.
  category: Category
  source: string
}
```

### `src/data/questions.json`

Add `explanation` to all 5 seed questions. Explanations are written in Spanish. English keywords that appear in the explanation must also appear bolded in JSX at render time (handled by the keyword highlighting logic — same mechanism as the question text).

Explanations:

- **q_0001** (flashing yellow): `"Flashing yellow significa reducir la velocidad y tener precaución al cruzar. Solo la flashing red obliga a detenerse por completo, igual que un STOP."`
- **q_0002** (school bus): `"Cuando un school bus tiene sus red lights flashing, debes detenerte desde ambas direcciones en una calle sin división (undivided road). En carreteras divididas, solo se detienen los que van detrás."`
- **q_0003** (school zone speed): `"El límite en una school zone con niños presentes es 20 mph en Florida. Recuerda: school zone + children present = 20 mph."`
- **q_0004** (solid yellow line): `"Una solid yellow line en tu lado significa no adelantar (must not pass). Si la línea es discontinua en tu lado, puedes adelantar con precaución."`
- **q_0005** (BAC): `"En Florida el límite legal de alcohol en sangre es 0.08% BAC. Conducir con ese nivel o más es illegal y puede resultar en arresto por DUI."`

---

## Component Changes

### `src/components/StudyMode.tsx` — full rewrite

**Weighted random selection** replaces sequential index navigation.

Logic:
```
weight(q) =
  studyAnswers[q.id] doesn't exist  → 2   (unseen)
  studyAnswers[q.id].correct = false → 4   (got it wrong)
  studyAnswers[q.id].correct = true  → 1   (already correct)
```

On "Siguiente", pick the next question by weighted random draw from the full filtered pool, excluding the current question ID to prevent back-to-back repeats. The counter shows `answered / total` (how many have been answered at least once), not a sequential position.

**Spanish chip** (`esVisible` state, default `true`):
- Renders inside the main EN card, below the English question text
- `background: #fffbeb`, `border: 1px solid #fde68a`, `border-radius: 8px`
- Contains: `🇪🇸` flag + italic Spanish question text with keywords bolded
- "ocultar" / "mostrar" toggle link in top-right of chip
- When `esVisible = false`: chip collapses entirely (not just hidden — removed from layout so it doesn't leave a gap)
- `esVisible` resets to `true` whenever the current question changes (i.e., on every "Siguiente" press)

**Keyword highlighting** (applies to both English question text AND explanation text):
- For each `question.keywords`, find case-insensitive matches in the text string
- Wrap matches in `<mark>` (yellow background `#fef08a`, slight bold)
- Render via `dangerouslySetInnerHTML` on a `<span>` — escape HTML entities (`&`, `<`, `>`, `"`) in the source string before injecting, then apply keyword wrapping on the escaped string
- Same highlighting applied inside the 🇪🇸 chip to the Spanish question text (using `keyword.es` values)

**Card border color** changes based on answer state:
- Unanswered: `border: 2px solid #1a56db` (blue)
- Answered wrong: `border: 2px solid #dc2626` (red)
- Answered correct: `border: 2px solid #16a34a` (green)

**¿POR QUÉ? box** appears after answering, inside the main card below the choices:
- Wrong: `background: #fff7ed`, `border: 1.5px solid #fed7aa`, label color `#ea580c`
- Correct: `background: #f0fdf4`, `border: 1.5px solid #bbf7d0`, label color `#15803d`
- Content: `question.explanation` with keyword highlighting applied (same regex mechanism)
- Label text: `¿POR QUÉ?`

**Progress bar** replaces the plain counter in the header:
- Thin bar (`height: 5px`) + right-aligned `X / N` text
- `X` = number of questions answered at least once in this session
- Bar color: `#1a56db` (blue) always — does not change to green per-question (keeps it clean)
- Bar fills based on `answeredCount / total`

**"Anterior" button removed** — weighted random navigation has no meaningful "go back". Only "Siguiente →" button, full-width on mobile.

**Layout structure** (single column, mobile-first):
```
[header: back button | progress bar + counter]
[main card]
  label: 🇺🇸 ENGLISH — EXAM FORMAT
  question text (keywords highlighted)
  [🇪🇸 amber chip — hideable]
  [answer choices]
  [¿POR QUÉ? box — appears after answering]
[PALABRAS CLAVE card]
[Siguiente → button, full width]
```

---

### `src/components/StudyMode.css` — full rewrite

Mobile-first. No `max-width: 900px` desktop assumption. Single column always.

Key rules:
- `.study__main`: `max-width: 480px`, `margin: 0 auto`, `padding: 16px`
- `.study__bilingual` removed — no longer a two-column grid
- All cards full-width
- `.study__nav`: single full-width "Siguiente →" button
- `.study__choice`: `min-height: 44px` (touch target), `font-size: 15px`
- Category pills scroll horizontally if overflow: `overflow-x: auto`, `flex-wrap: nowrap`

---

### All other screens — responsive fixes only

Add to each screen's CSS file, inside a `@media (max-width: 480px)` block:

**HomeScreen.css:**
- Dashboard stat cards: `grid-template-columns: 1fr 1fr` → `1fr 1fr` stays (2 cols fine on mobile)
- Action buttons: full width (`width: 100%`)
- Padding: reduce from `24px` to `16px`

**ExamMode.css:**
- Already single column — just reduce padding and ensure `min-height: 44px` on choices
- `.exam__nav`: buttons full-width using `flex: 1`

**ResultsScreen.css:**
- `.results__breakdown-row`: stack label above bar on small screens (`flex-direction: column`, `align-items: flex-start`)
- `.results__actions`: `grid-template-columns: 1fr` (stack buttons vertically)

**OptionsDrawer.css:**
- `.drawer`: `width: 100%` on mobile (full-screen drawer instead of 360px panel)

---

## Testing

Existing tests for `StudyMode` need updates:
- Remove tests that rely on "Anterior" button (it's gone)
- Add test: `getByText(/Siguiente/i)` exists
- Add test: answering wrong shows `¿POR QUÉ?` text
- Add test: `esVisible` toggle hides/shows Spanish chip
- Keyword highlighting tests: verify `<mark>` appears in rendered output

All other screen tests (ExamMode, ResultsScreen, HomeScreen) should pass unchanged — their logic doesn't change, only CSS.

---

## What this does NOT change

- ExamMode logic — stays English-only, no explanations during exam
- ResultsScreen — no changes to logic, minor CSS only  
- progressStore — no changes
- App.tsx routing — no changes
- Bookmark functionality — preserved as-is
- Category filter pills — preserved, just made horizontally scrollable on mobile
