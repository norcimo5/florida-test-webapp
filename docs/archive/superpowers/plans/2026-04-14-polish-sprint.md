# Florida Driver Prep — Polish Sprint Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite StudyMode to be mobile-first with weighted random recycling, Spanish explanations, keyword highlighting, and a progress bar; add responsive CSS fixes to all other screens.

**Architecture:** All changes are confined to existing files — no new screens, no new routes. The weighted-random logic and all new UI live inside `StudyMode.tsx`. The `explanation` field is optional on `Question` so existing test mocks require no changes.

**Tech Stack:** React 18, TypeScript, Vite, Vitest + React Testing Library, CSS custom properties (no Tailwind).

---

## File Map

| File | Action |
|------|--------|
| `src/types.ts` | Modify — add `explanation?: string` to `Question` |
| `src/components/StudyMode.tsx` | Full rewrite |
| `src/components/StudyMode.css` | Full rewrite |
| `src/components/HomeScreen.css` | Modify — add `@media (max-width: 480px)` block |
| `src/components/ExamMode.css` | Modify — add `@media (max-width: 480px)` block |
| `src/components/ResultsScreen.css` | Modify — add `@media (max-width: 480px)` block |
| `src/components/OptionsDrawer.css` | Modify — add `@media (max-width: 480px)` block |
| `tests/StudyMode.test.tsx` | Modify — remove Anterior tests, add new tests |

---

## Task 1: Add `explanation` field to Question type

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add the field**

Open `src/types.ts`. The `Question` interface currently ends at `source: string`. Add one line:

```ts
export interface Question {
  id: string
  en: QuestionEN
  es: QuestionES | null
  keywords: Keyword[]
  explanation?: string  // Spanish explanation shown after answering. Bolded EN keywords via JSX. Hidden if absent.
  category: Category
  source: string
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npm run build 2>&1 | head -20
```

Expected: no errors (the field is optional, so existing JSON and mocks are unaffected).

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add optional explanation field to Question type"
```

---

## Task 2: Rewrite StudyMode.tsx

**Files:**
- Rewrite: `src/components/StudyMode.tsx`

- [ ] **Step 1: Replace the file**

```tsx
import { useState } from 'react'
import type { Question, Progress, Category, StudyAnswer } from '../types'
import './StudyMode.css'

interface Props {
  questions: Question[]
  progress: Progress
  onProgressUpdate: (p: Progress) => void
  onBack: () => void
  reviewMode: boolean
}

const CATEGORY_LABELS: Record<Category, string> = {
  'traffic-signals': 'Señales',
  'speed-limits': 'Velocidad',
  'right-of-way': 'Prioridad',
  'school-zones': 'Escuelas',
  'dui': 'DUI',
  'road-markings': 'Marcas',
  'general': 'General',
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightKeywords(text: string, keywords: string[]): string {
  let result = escapeHtml(text)
  for (const kw of keywords) {
    const escapedKw = escapeHtml(kw)
    const regex = new RegExp(escapedKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    result = result.replace(regex, match => `<mark>${match}</mark>`)
  }
  return result
}

function pickWeightedRandom(
  pool: Question[],
  studyAnswers: Record<string, StudyAnswer>,
  excludeId: string | null
): Question {
  const candidates = excludeId ? pool.filter(q => q.id !== excludeId) : pool
  const eligible = candidates.length > 0 ? candidates : pool
  const weights = eligible.map(q => {
    const a = studyAnswers[q.id]
    if (!a) return 2        // unseen
    if (!a.correct) return 4 // wrong
    return 1                 // correct
  })
  const total = weights.reduce((sum, w) => sum + w, 0)
  let rand = Math.random() * total
  for (let i = 0; i < eligible.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return eligible[i]
  }
  return eligible[eligible.length - 1]
}

export default function StudyMode({ questions, progress, onProgressUpdate, onBack, reviewMode }: Props) {
  const displayQuestions = reviewMode
    ? questions.filter(q => {
        const a = progress.studyAnswers[q.id]
        return a && !a.correct
      })
    : questions

  const categories = Array.from(new Set(displayQuestions.map(q => q.category))) as Category[]
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')

  const getFiltered = (cat: Category | 'all') =>
    cat === 'all' ? displayQuestions : displayQuestions.filter(q => q.category === cat)

  const filtered = getFiltered(activeCategory)

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
    () => displayQuestions.length > 0
      ? pickWeightedRandom(displayQuestions, progress.studyAnswers, null)
      : null
  )
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, StudyAnswer>>({})
  const [esVisible, setEsVisible] = useState(true)

  const question = currentQuestion && filtered.some(q => q.id === currentQuestion.id)
    ? currentQuestion
    : filtered[0] ?? null

  const sessionAnswer = question ? sessionAnswers[question.id] : undefined
  const hasAnswered = !!sessionAnswer
  const answeredCount = filtered.filter(q => sessionAnswers[q.id] !== undefined).length

  const enKeywords = question?.keywords.map(k => k.en) ?? []
  const esKeywords = question?.keywords.map(k => k.es) ?? []
  const enQuestionHtml = question ? highlightKeywords(question.en.question, enKeywords) : ''
  const esQuestionHtml = question?.es ? highlightKeywords(question.es.question, esKeywords) : ''
  const explanationHtml = question?.explanation ? highlightKeywords(question.explanation, enKeywords) : ''

  const cardBorderColor = !hasAnswered ? '#1a56db' : sessionAnswer.correct ? '#16a34a' : '#dc2626'

  function handleSelect(index: number) {
    if (!question || hasAnswered) return
    const correct = index === question.en.correct
    const newAnswer: StudyAnswer = { selectedIndex: index, correct }
    setSessionAnswers(prev => ({ ...prev, [question.id]: newAnswer }))
    onProgressUpdate({
      ...progress,
      studyAnswers: { ...progress.studyAnswers, [question.id]: newAnswer },
    })
  }

  function handleNext() {
    if (filtered.length === 0) return
    setCurrentQuestion(pickWeightedRandom(filtered, progress.studyAnswers, question?.id ?? null))
    setEsVisible(true)
  }

  function handleCategoryChange(cat: Category | 'all') {
    setActiveCategory(cat)
    const pool = getFiltered(cat)
    if (pool.length > 0) {
      setCurrentQuestion(pickWeightedRandom(pool, progress.studyAnswers, null))
    }
    setEsVisible(true)
  }

  function toggleBookmark() {
    if (!question) return
    const bookmarks = progress.bookmarks.includes(question.id)
      ? progress.bookmarks.filter(id => id !== question.id)
      : [...progress.bookmarks, question.id]
    onProgressUpdate({ ...progress, bookmarks })
  }

  if (!question) {
    return (
      <div className="study__empty">
        <p>No hay preguntas en esta categoría.</p>
        <button className="study__back-btn" onClick={onBack}>← Volver</button>
      </div>
    )
  }

  const isBookmarked = progress.bookmarks.includes(question.id)
  const progressPct = filtered.length > 0 ? (answeredCount / filtered.length) * 100 : 0

  return (
    <div className="study">
      <header className="study__header">
        <button className="study__back-btn" onClick={onBack}>← Inicio</button>
        <div className="study__progress-wrap">
          <div className="study__progress-bar">
            <div className="study__progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="study__counter">{answeredCount} / {filtered.length}</span>
        </div>
        <button
          className={`study__bookmark-btn ${isBookmarked ? 'study__bookmark-btn--active' : ''}`}
          onClick={toggleBookmark}
          aria-label="Guardar pregunta"
        >
          🔖
        </button>
      </header>

      {categories.length > 1 && (
        <div className="study__categories">
          <button
            className={`study__cat-pill ${activeCategory === 'all' ? 'study__cat-pill--active' : ''}`}
            onClick={() => handleCategoryChange('all')}
          >
            Todas ({displayQuestions.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`study__cat-pill ${activeCategory === cat ? 'study__cat-pill--active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {CATEGORY_LABELS[cat]} ({displayQuestions.filter(q => q.category === cat).length})
            </button>
          ))}
        </div>
      )}

      <main className="study__main">
        <div className="study__card" style={{ borderColor: cardBorderColor }}>
          <div className="study__panel-label" style={{ color: cardBorderColor }}>
            🇺🇸 ENGLISH — EXAM FORMAT
          </div>

          <p className="study__question" dangerouslySetInnerHTML={{ __html: enQuestionHtml }} />

          {question.es && (
            <div className="study__es-chip">
              <div className="study__es-chip-left">
                <span className="study__es-flag">🇪🇸</span>
                {esVisible && (
                  <span className="study__es-text" dangerouslySetInnerHTML={{ __html: esQuestionHtml }} />
                )}
              </div>
              <button className="study__es-toggle" onClick={() => setEsVisible(v => !v)}>
                {esVisible ? 'ocultar' : 'mostrar'}
              </button>
            </div>
          )}

          <div className="study__choices">
            {question.en.choices.map((choice, i) => {
              const isCorrect = hasAnswered && i === question.en.correct
              const isWrong = hasAnswered && i === sessionAnswer.selectedIndex && !sessionAnswer.correct
              return (
                <button
                  key={i}
                  className={`study__choice ${isCorrect ? 'study__choice--correct' : ''} ${isWrong ? 'study__choice--wrong' : ''}`}
                  onClick={() => handleSelect(i)}
                  disabled={hasAnswered}
                >
                  {isCorrect && '✓ '}
                  {isWrong && '✗ '}
                  {choice}
                  {isWrong && <span className="study__choice-label"> (tu respuesta)</span>}
                </button>
              )
            })}
          </div>

          {hasAnswered && question.explanation && (
            <div className={`study__porque ${sessionAnswer.correct ? 'study__porque--correct' : 'study__porque--wrong'}`}>
              <div className="study__porque-label">
                ¿POR QUÉ?{sessionAnswer.correct ? ' ✓' : ''}
              </div>
              <div className="study__porque-text" dangerouslySetInnerHTML={{ __html: explanationHtml }} />
            </div>
          )}
        </div>

        <div className="study__keywords">
          <div className="study__keywords-label">PALABRAS CLAVE — MEMORIZA</div>
          <div className="study__keywords-list">
            {question.keywords.map((kw, i) => (
              <div key={i} className="study__keyword-item">
                <span className="study__keyword-en">{kw.en}</span>
                <span className="study__keyword-arrow">→</span>
                <span className="study__keyword-es">{kw.es}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="study__nav">
          <button className="study__nav-btn" onClick={handleNext}>
            Siguiente →
          </button>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Run existing tests to see what breaks**

```bash
npm test -- tests/StudyMode.test.tsx 2>&1 | tail -30
```

Expected: some failures — "Anterior" button gone, "Traducción no disponible" text gone. These get fixed in Task 6.

- [ ] **Step 3: Commit**

```bash
git add src/components/StudyMode.tsx
git commit -m "feat: rewrite StudyMode with weighted random, Spanish chip, keyword highlighting, progress bar"
```

---

## Task 3: Rewrite StudyMode.css

**Files:**
- Rewrite: `src/components/StudyMode.css`

- [ ] **Step 1: Replace the file**

```css
.study {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-gray-50);
}

.study__header {
  background: white;
  border-bottom: 1px solid var(--color-gray-200);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.study__back-btn {
  background: none;
  border: 1px solid var(--color-gray-200);
  padding: 6px 12px;
  border-radius: var(--radius-md);
  color: var(--color-gray-500);
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
}

.study__progress-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.study__progress-bar {
  flex: 1;
  height: 5px;
  background: var(--color-gray-200);
  border-radius: 10px;
  overflow: hidden;
}

.study__progress-fill {
  height: 100%;
  background: #1a56db;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.study__counter {
  font-size: 11px;
  color: var(--color-gray-400);
  white-space: nowrap;
}

.study__bookmark-btn {
  background: none;
  border: none;
  padding: 4px;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.4;
  flex-shrink: 0;
  line-height: 1;
}

.study__bookmark-btn--active { opacity: 1; }

.study__categories {
  background: white;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  gap: 8px;
  overflow-x: auto;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
}

.study__cat-pill {
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid var(--color-gray-200);
  background: white;
  color: var(--color-gray-500);
  white-space: nowrap;
  flex-shrink: 0;
}

.study__cat-pill--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  font-weight: 700;
}

.study__main {
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.study__card {
  background: white;
  border: 2px solid #1a56db;
  border-radius: 14px;
  padding: 16px;
}

.study__panel-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.2px;
  margin-bottom: 8px;
}

.study__question {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-gray-900);
  line-height: 1.5;
  margin-bottom: 12px;
}

.study__question mark {
  background: #fef08a;
  padding: 1px 2px;
  border-radius: 2px;
  font-weight: 700;
}

.study__es-chip {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.study__es-chip-left {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.study__es-flag {
  font-size: 14px;
  line-height: 1.2;
  flex-shrink: 0;
}

.study__es-text {
  font-size: 12px;
  color: #92400e;
  font-style: italic;
  line-height: 1.4;
}

.study__es-text mark {
  background: #fef08a;
  font-style: normal;
  font-weight: 700;
}

.study__es-toggle {
  font-size: 10px;
  color: #a16207;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  white-space: nowrap;
  flex-shrink: 0;
  padding: 0;
}

.study__choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.study__choice {
  padding: 10px 14px;
  border: 1.5px solid var(--color-gray-200);
  border-radius: 9px;
  background: white;
  text-align: left;
  font-size: 14px;
  color: var(--color-gray-700);
  cursor: pointer;
  min-height: 44px;
  width: 100%;
  transition: border-color 0.15s, background 0.15s;
}

.study__choice:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.study__choice:disabled { cursor: default; }

.study__choice--correct {
  border-color: #16a34a !important;
  background: #f0fdf4 !important;
  color: #16a34a !important;
  font-weight: 700;
}

.study__choice--wrong {
  border-color: #dc2626 !important;
  background: #fef2f2 !important;
  color: #dc2626 !important;
  font-weight: 600;
}

.study__choice-label {
  font-weight: 400;
  font-size: 11px;
}

.study__porque {
  border-radius: 9px;
  padding: 10px 12px;
  margin-top: 12px;
}

.study__porque--wrong {
  background: #fff7ed;
  border: 1.5px solid #fed7aa;
}

.study__porque--correct {
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
}

.study__porque-label {
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.study__porque--wrong .study__porque-label { color: #ea580c; }
.study__porque--correct .study__porque-label { color: #15803d; }

.study__porque-text {
  font-size: 12px;
  line-height: 1.6;
}

.study__porque--wrong .study__porque-text { color: #7c2d12; }
.study__porque--correct .study__porque-text { color: #14532d; }

.study__porque-text mark {
  background: transparent;
  font-weight: 700;
}

.study__keywords {
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 12px;
  padding: 12px 14px;
}

.study__keywords-label {
  font-size: 8px;
  font-weight: 800;
  color: #166534;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.study__keywords-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.study__keyword-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.study__keyword-en {
  background: white;
  border: 1px solid #bbf7d0;
  border-radius: 5px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #15803d;
}

.study__keyword-arrow {
  font-size: 11px;
  color: var(--color-gray-400);
}

.study__keyword-es {
  font-size: 11px;
  color: #166534;
}

.study__nav {
  display: flex;
}

.study__nav-btn {
  flex: 1;
  padding: 13px 20px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  background: #1a56db;
  border: none;
  color: white;
  min-height: 44px;
}

.study__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
  color: var(--color-gray-500);
}
```

- [ ] **Step 2: Verify visually**

```bash
npm run dev
```

Open `http://localhost:5173`, click Modo Estudio, verify: single column, progress bar in header, 🔖 icon, 🇪🇸 amber chip, keyword cards at bottom, full-width Siguiente button. No Anterior button.

- [ ] **Step 3: Commit**

```bash
git add src/components/StudyMode.css
git commit -m "feat: rewrite StudyMode CSS — mobile-first single column"
```

---

## Task 4: Responsive CSS fixes for other screens

**Files:**
- Modify: `src/components/HomeScreen.css`
- Modify: `src/components/ExamMode.css`
- Modify: `src/components/ResultsScreen.css`
- Modify: `src/components/OptionsDrawer.css`

- [ ] **Step 1: Append to HomeScreen.css**

```css
@media (max-width: 480px) {
  .home__main {
    padding: 16px;
  }
  .home__actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .home__action-btn {
    width: 100%;
  }
}
```

- [ ] **Step 2: Append to ExamMode.css**

```css
@media (max-width: 480px) {
  .exam__main {
    padding: 12px;
  }
  .exam__choice {
    min-height: 44px;
    font-size: 14px;
  }
  .exam__nav {
    flex-direction: column;
    gap: 8px;
  }
  .exam__nav-btn {
    width: 100%;
  }
}
```

- [ ] **Step 3: Append to ResultsScreen.css**

```css
@media (max-width: 480px) {
  .results__breakdown-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .results__actions {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Append to OptionsDrawer.css**

```css
@media (max-width: 480px) {
  .drawer {
    width: 100%;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/HomeScreen.css src/components/ExamMode.css src/components/ResultsScreen.css src/components/OptionsDrawer.css
git commit -m "feat: add mobile-first responsive CSS to all screens"
```

---

## Task 5: Update StudyMode tests

**Files:**
- Rewrite: `tests/StudyMode.test.tsx`

- [ ] **Step 1: Replace test file**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import StudyMode from '../src/components/StudyMode'
import type { Question, Progress } from '../src/types'

const mockQuestion: Question = {
  id: 'q_0001',
  en: {
    question: 'What should you do when you see a flashing yellow light?',
    choices: ['Stop completely', 'Speed up', 'Slow down and proceed with caution', 'Yield'],
    correct: 2,
  },
  es: {
    question: '¿Qué debe hacer cuando ve una luz amarilla intermitente?',
    choices: ['Detenerse', 'Acelerar', 'Disminuir velocidad y proceder con precaución', 'Ceder'],
  },
  keywords: [
    { en: 'flashing yellow', es: 'luz amarilla intermitente' },
    { en: 'slow down', es: 'disminuir velocidad' },
  ],
  explanation: 'Flashing yellow significa reducir la velocidad. Solo flashing red significa detenerse.',
  category: 'traffic-signals',
  source: 'flhsmv-2026',
}

const defaultProgress: Progress = {
  studyAnswers: {},
  bookmarks: [],
  examQuestionIds: [],
  examAnswers: [],
  examComplete: false,
}

function renderStudy(overrides: Partial<Parameters<typeof StudyMode>[0]> = {}) {
  return render(
    <StudyMode
      questions={[mockQuestion]}
      progress={defaultProgress}
      onProgressUpdate={vi.fn()}
      onBack={vi.fn()}
      reviewMode={false}
      {...overrides}
    />
  )
}

describe('StudyMode', () => {
  it('renders the English question text', () => {
    const { container } = renderStudy()
    expect(container.querySelector('.study__question')).toBeInTheDocument()
    expect(container.querySelector('.study__question')!.textContent).toMatch(/flashing yellow light/i)
  })

  it('renders the Spanish chip when es is present', () => {
    renderStudy()
    expect(screen.getByText('ocultar')).toBeInTheDocument()
  })

  it('hides Spanish text and shows "mostrar" when ocultar is clicked', async () => {
    renderStudy()
    await userEvent.click(screen.getByText('ocultar'))
    expect(screen.queryByText('ocultar')).not.toBeInTheDocument()
    expect(screen.getByText('mostrar')).toBeInTheDocument()
  })

  it('does not render Spanish chip when es is null', () => {
    renderStudy({ questions: [{ ...mockQuestion, es: null }] })
    expect(screen.queryByText('ocultar')).not.toBeInTheDocument()
    expect(screen.queryByText('mostrar')).not.toBeInTheDocument()
  })

  it('renders keywords in PALABRAS CLAVE section', () => {
    const { container } = renderStudy()
    const enKeywords = container.querySelectorAll('.study__keyword-en')
    const texts = Array.from(enKeywords).map(el => el.textContent)
    expect(texts).toContain('flashing yellow')
    expect(texts).toContain('slow down')
  })

  it('renders a Siguiente button', () => {
    renderStudy()
    expect(screen.getByText(/Siguiente/i)).toBeInTheDocument()
  })

  it('does not render an Anterior button', () => {
    renderStudy()
    expect(screen.queryByText(/Anterior/i)).not.toBeInTheDocument()
  })

  it('calls onProgressUpdate when an answer is selected', async () => {
    const onProgressUpdate = vi.fn()
    renderStudy({ onProgressUpdate })
    const choices = screen.getAllByRole('button', { name: /Slow down and proceed/i })
    await userEvent.click(choices[0])
    expect(onProgressUpdate).toHaveBeenCalled()
  })

  it('shows ¿POR QUÉ? box after answering wrong', async () => {
    renderStudy()
    await userEvent.click(screen.getAllByRole('button', { name: /Stop completely/i })[0])
    expect(screen.getByText(/¿POR QUÉ\?/)).toBeInTheDocument()
  })

  it('shows ¿POR QUÉ? box after answering correct', async () => {
    renderStudy()
    await userEvent.click(screen.getAllByRole('button', { name: /Slow down and proceed/i })[0])
    expect(screen.getByText(/¿POR QUÉ\?/)).toBeInTheDocument()
  })

  it('does not show ¿POR QUÉ? when explanation is absent', async () => {
    renderStudy({ questions: [{ ...mockQuestion, explanation: undefined }] })
    await userEvent.click(screen.getAllByRole('button', { name: /Stop completely/i })[0])
    expect(screen.queryByText(/¿POR QUÉ\?/)).not.toBeInTheDocument()
  })

  it('highlights keywords with mark elements', () => {
    const { container } = renderStudy()
    expect(container.querySelector('mark')).toBeInTheDocument()
  })

  it('choices are disabled after answering', async () => {
    renderStudy()
    const choiceBtn = screen.getAllByRole('button', { name: /Stop completely/i })[0]
    await userEvent.click(choiceBtn)
    const allChoices = screen.getAllByRole('button').filter(b =>
      ['Stop completely', 'Speed up', 'Slow down', 'Yield'].some(t => b.textContent?.includes(t))
    )
    allChoices.forEach(btn => expect(btn).toBeDisabled())
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm test -- tests/StudyMode.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/StudyMode.test.tsx
git commit -m "test: update StudyMode tests for new mobile-first UI"
```

---

## Task 6: Build and deploy

- [ ] **Step 1: Production build**

```bash
npm run build
```

Expected: no TypeScript errors, no build errors.

- [ ] **Step 2: Deploy to GitHub Pages**

```bash
npm run deploy
```

Expected: `Published` message. Site live at `https://norcimo5.github.io/florida-test-webapp/`.

- [ ] **Step 3: Commit any last changes**

```bash
git add -A
git status  # should be clean after deploy
```

