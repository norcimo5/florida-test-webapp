# Florida Driver's Test Prep — Design Spec
**Date:** 2026-04-13
**Status:** Approved

---

## 1. SYSTEM INTENT

### Problem Statement
Florida law requires driving exams to be administered in English only. A large portion of Florida residents are Spanish-primary speakers who cannot pass the exam due to a language barrier — not a lack of driving knowledge. This app closes that gap.

### Target Users
Spanish-speaking Florida residents preparing for their first driver's license exam who have limited English reading ability.

### Success Criteria
- User can study all ~200-400 Florida DMV questions bilingually
- User can identify and memorize the 2-3 key English keywords per question needed to answer correctly on the real exam
- User can simulate the real exam (English-only, 50 randomized questions)
- Progress persists across browser sessions without requiring login
- App loads and is usable on a desktop browser within 2 seconds

### Non-Goals
- No mobile-first optimization (desktop-first for v1; responsive later)
- No user accounts or backend authentication
- No real-time question updates (admin trigger re-scrape on demand)
- No multilingual support beyond English and Spanish
- No accessibility audit (v1 prototype scope)

---

## 2. USER STORIES (EARS FORMAT)

**Study flow:**
```
WHEN a user opens the app
THE SYSTEM SHALL display a home dashboard
WITH progress summary (correct / incorrect / unanswered) and two mode buttons

WHEN a user enters Study Mode
THE SYSTEM SHALL display questions with English and Spanish side-by-side
WITH key English keywords highlighted in yellow in the question text
AND a PALABRAS CLAVE box showing the 2-3 keywords with Spanish translations

WHEN a user answers a question in Study Mode
THE SYSTEM SHALL immediately reveal the correct answer
WITH color feedback (green = correct, red = incorrect)

WHEN a user clicks "Marcar para repasar"
THE SYSTEM SHALL bookmark that question
WITH the bookmark persisted to localStorage
```

**Exam simulation flow:**
```
WHEN a user enters Exam Simulation mode
THE SYSTEM SHALL present questions in English only
WITH no Spanish translation visible
AND questions drawn randomly from the full question bank

WHEN a user selects an answer in Exam mode
THE SYSTEM SHALL record the answer without revealing correctness
WITH correctness revealed only at the end of the exam

WHEN a user completes the exam
THE SYSTEM SHALL display a results screen
WITH score (X/50), pass/fail status (passing = 80%), and breakdown by category
```

**Progress & options:**
```
WHEN a user opens the Options drawer
THE SYSTEM SHALL allow selecting exam length (25 or 50 questions)
WITH the selection persisted to localStorage

WHEN a user clicks "Reiniciar examen actual"
THE SYSTEM SHALL clear the current exam attempt only
WITH study progress and bookmarks preserved

WHEN a user clicks "Borrar todo el progreso"
THE SYSTEM SHALL prompt for confirmation
WITH a destructive action clearing all localStorage data on confirmation

WHEN a user revisits the app
THE SYSTEM SHALL restore all progress from localStorage
WITH no login or account required
```

**Edge cases:**
```
WHEN a question has no available Spanish translation
THE SYSTEM SHALL display a placeholder: "Traducción no disponible"
WITH the English version still fully functional

WHEN localStorage is unavailable (private browsing)
THE SYSTEM SHALL display a warning banner
WITH the app still fully functional (in-memory only for that session)
```

---

## 3. FUNCTIONAL REQUIREMENTS

- **FR-1** — Home dashboard displays correct / incorrect / unanswered counts and a progress bar
- **FR-2** — Home dashboard has two mode entry points: Exam Simulation and Study Mode
- **FR-3** — Home dashboard has a "Review missed questions" shortcut when ≥1 incorrect answers exist
- **FR-4** — Study Mode displays questions in two side-by-side panels: English (blue border) and Spanish (yellow border)
- **FR-5** — Study Mode highlights key English keywords in yellow in the question text on both panels
- **FR-6** — Study Mode displays a PALABRAS CLAVE box below the question with at least 1 keyword card (EN word + ES translation); typically 2-3
- **FR-7** — Study Mode allows filtering questions by category via pill buttons
- **FR-8** — Study Mode shows correct answer immediately after user selection
- **FR-9** — Study Mode has a "Marcar para repasar" bookmark button per question
- **FR-10** — Exam Simulation presents English-only questions, randomized on every session
- **FR-11** — Exam Simulation supports 25 or 50 question lengths (user-configured)
- **FR-12** — Exam Simulation reveals all answers only on the results screen
- **FR-13** — Results screen shows score (X/N), pass/fail (≥80% = pass), and per-category breakdown
- **FR-14** — Options drawer is accessible from the top nav bar (⚙️ icon)
- **FR-15** — Options drawer includes: exam length toggle (25/50), reset exam, reset all progress
- **FR-16** — "Borrar todo" requires a confirmation step before executing
- **FR-17** — All progress (answers, bookmarks, exam length preference) stored in localStorage
- **FR-18** — Question bank loaded from `src/data/questions.json` at build time
- **FR-19** — Scraper generates `src/data/questions.json` from multiple sources, deduplicated by normalized question text similarity (>90% match threshold; see Section 7)
- **FR-20** — Scraper is triggerable via GitHub Actions `workflow_dispatch`

---

## 4. NON-FUNCTIONAL REQUIREMENTS

| Category | Requirement |
|---|---|
| Performance | Initial page load < 2s on a standard broadband connection |
| Performance | questions.json must be < 2MB (gzip); split if needed |
| Reliability | App must function fully offline after first load (questions baked in) |
| Reliability | localStorage failures must degrade gracefully (in-memory fallback) |
| Security | No user data transmitted to any server; all state is local |
| Cost | Zero hosting cost for v1 (Vercel free tier) |
| Cost | Translation API usage minimized: translate once at scrape time, cache in JSON |
| Maintainability | Re-scrape and redeploy cycle < 5 minutes via GitHub Actions |

---

## 5. SYSTEM ARCHITECTURE

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Scraper Pipeline (Python)                               │
│  Sources: flhsmv.gov, DMV.org, additional prep sites     │
│  Steps: scrape → deduplicate → translate (ES) → tag      │
│  keywords → output questions.json                        │
│  Trigger: GitHub Actions workflow_dispatch               │
└───────────────────────────┬──────────────────────────────┘
                            │ src/data/questions.json
                            │ (committed to repo)
┌───────────────────────────▼──────────────────────────────┐
│  React + Vite Frontend                                   │
│  ├── HomeScreen (dashboard + mode selection)             │
│  ├── StudyMode (bilingual, keyword highlighting)         │
│  ├── ExamMode (English-only simulation)                  │
│  ├── ResultsScreen (score, pass/fail, breakdown)         │
│  ├── OptionsDrawer (settings)                            │
│  └── progressStore (localStorage abstraction)            │
│  Deploy: Vercel (free tier)                              │
└──────────────────────────────────────────────────────────┘
```

### Question Data Contract

```json
{
  "id": "q_001",
  "en": {
    "question": "What should you do when you see a flashing yellow light?",
    "choices": [
      "Stop completely",
      "Speed up to clear the intersection",
      "Slow down and proceed with caution",
      "Yield to all traffic"
    ],
    "correct": 2,  // 0-based index into choices array
  },
  "es": {
    "question": "¿Qué debe hacer cuando ve una luz amarilla intermitente?",
    "choices": [
      "Detenerse completamente",
      "Acelerar para cruzar",
      "Disminuir velocidad y proceder con cautela",
      "Ceder el paso a todo el tráfico"
    ]
  },
  "keywords": [
    { "en": "flashing yellow", "es": "luz amarilla intermitente" },
    { "en": "slow down", "es": "disminuir velocidad" },
    { "en": "caution", "es": "precaución" }
  ],
  "category": "traffic-signals",
  "source": "flhsmv.gov"
}
```

### Component Breakdown

| Component | Responsibility |
|---|---|
| `HomeScreen` | Dashboard, progress summary, mode routing, options trigger |
| `StudyMode` | Bilingual layout, keyword highlighting, category filter, bookmarking |
| `ExamMode` | English-only questions, answer recording, navigation |
| `ResultsScreen` | Score display, pass/fail, category breakdown, retry action |
| `OptionsDrawer` | Exam length toggle, reset actions, about text |
| `progressStore` | localStorage read/write abstraction; in-memory fallback |
| `questions.json` | Static question bank, generated by scraper |

### External Dependencies

| Dependency | Purpose |
|---|---|
| Vercel | Static hosting + CDN |
| GitHub Actions | Scraper trigger (workflow_dispatch) |
| Translation API (e.g. LibreTranslate or DeepL free tier) | Spanish translations at scrape time |
| BeautifulSoup / requests (Python) | Web scraping |

---

## 6. TASK DECOMPOSITION (AGENT-READY)

| Task ID | Description | Inputs | Outputs | Dependencies | Agent |
|---|---|---|---|---|---|
| T-01 | Scaffold React + Vite project | None | Project structure, package.json | None | Builder |
| T-02 | Define TypeScript types for Question, Progress, Settings | Data contract above | `src/types.ts` | T-01 | Builder |
| T-03 | Implement `progressStore` module | localStorage API | `src/store/progressStore.ts` | T-02 | Builder |
| T-04 | Build `HomeScreen` component | progressStore, questions.json | HomeScreen UI | T-03 | Builder |
| T-05 | Build `StudyMode` component | questions.json, progressStore | StudyMode UI with keyword highlighting | T-03 | Builder |
| T-06 | Build `ExamMode` component | questions.json, progressStore | ExamMode UI (English only) | T-03 | Builder |
| T-07 | Build `ResultsScreen` component | exam answers, questions.json | ResultsScreen UI | T-06 | Builder |
| T-08 | Build `OptionsDrawer` component | progressStore | OptionsDrawer UI | T-03 | Builder |
| T-09 | Wire routing between all screens | All components | Single-page app navigation | T-04–T-08 | Coordinator |
| T-10 | Write Python scraper for flhsmv.gov | Target URLs | Raw question list | None | Builder |
| T-11 | Write Python scraper for DMV.org + others | Target URLs | Raw question list | None | Builder |
| T-12 | Deduplication + merge pipeline | T-10, T-11 outputs | Merged question list | T-10, T-11 | Builder |
| T-13 | Translation step (ES generation) | Merged question list | questions with `es` field | T-12 | Builder |
| T-14 | Keyword extraction/tagging step | Merged translated list | questions with `keywords` field | T-13 | Builder |
| T-15 | Output `src/data/questions.json` | T-14 output | questions.json | T-14 | Builder |
| T-16 | GitHub Actions workflow_dispatch for scraper | T-10–T-15 | `.github/workflows/scrape.yml` | T-15 | Builder |
| T-17 | Vercel deployment config | T-01, T-15 | `vercel.json`, live URL | T-09, T-15 | Coordinator |
| T-18 | End-to-end verification | Live app | Pass/fail report | T-17 | Verifier |

---

## 7. VALIDATION & TEST PLAN

**Unit tests:**
- `progressStore`: save/load/clear/fallback behavior
- Deduplication logic: questions with >90% text similarity collapsed to one
- Keyword extraction: at least 1 keyword tagged per question
- Exam randomization: no two consecutive runs produce the same order

**Integration tests:**
- Study Mode: selecting correct answer shows green highlight + PALABRAS CLAVE box
- Study Mode: bookmark button persists to localStorage
- Exam Mode: answers not revealed during exam; all revealed on ResultsScreen
- Options: exam length change persists after page reload
- "Borrar todo": confirmation dialog appears; data cleared on confirm; no data cleared on cancel

**Edge case tests:**
- Question with missing ES translation renders placeholder
- localStorage unavailable: warning banner shown, app still functional
- questions.json with 0 questions: graceful empty state message
- Exam with 25 questions: ResultsScreen pass threshold is still 80% (20/25)

---

## 8. ACCEPTANCE CRITERIA

| Criterion | Pass Condition |
|---|---|
| Question bank loaded | ≥ 50 unique questions in questions.json at launch |
| Bilingual display | Every question shows EN and ES side-by-side in Study Mode |
| Keyword highlighting | Every question has ≥ 1 keyword in the PALABRAS CLAVE box |
| Exam simulation | English-only, randomized, no answer reveals during exam |
| Pass/fail threshold | ≥ 80% = pass (40/50 or 20/25) |
| Progress persistence | Progress survives a page reload (localStorage) |
| Reset exam | Resets exam attempt; study progress unaffected |
| Reset all | Wipes all data after confirmation; confirmation required |
| Options persistence | Exam length preference survives page reload |
| Load performance | App fully interactive within 2 seconds on broadband |
| Deploy | Live Vercel URL accessible publicly |

---

## 9. FAILURE MODES & GUARDRAILS

| Failure Mode | Prevention | Recovery |
|---|---|---|
| Scraper blocked by target site | Polite crawl delays (2-3s between requests), rotate user-agents | Manual fallback: import questions from JSON export |
| Translation API quota exceeded | Translate only new/changed questions per scrape run | Cache all translated questions; skip already-translated ones |
| questions.json malformed | JSON schema validation step in scraper pipeline | Abort deploy; keep previous questions.json |
| localStorage quota exceeded | Compress stored data; evict oldest exam attempts | Show warning; continue with in-memory only |
| Duplicate questions in bank | Normalized text similarity deduplication (>90% match = duplicate) | Manual review flag on near-duplicates |
| Wrong answer marked correct (scraper error) | Verifier agent spot-checks 10% of questions against source | Flag for manual review; do not auto-correct |

---

## 10. ITERATION & FEEDBACK LOOP

- **Scraper results:** GitHub Actions logs show questions added/removed/deduplicated per run
- **Spec updates:** Any change to data contract (e.g. new field) requires updating T-02 types, scraper output, and affected components
- **Regression prevention:** questions.json is committed to git — diffs are reviewable before deploy; no silent overwrites
- **User feedback path:** v1 has no analytics; collect feedback manually via shared URL during prototype demos
- **Keyword quality:** Keywords are auto-tagged by scraper (heuristic); a manual review pass is recommended before public launch

---

## Design Decisions Log

| Decision | Rationale |
|---|---|
| Static JAMstack (no backend) | Prototype goal; zero cost; fastest path to shareable URL |
| localStorage (no accounts) | Removes auth complexity entirely for v1 |
| Side-by-side bilingual layout | Best for learning EN/ES correlation simultaneously |
| PALABRAS CLAVE box | Core pedagogical mechanic — keyword memoization |
| Always-randomized exam | Prevents memorization of answer order; simulates real exam |
| GitHub Actions workflow_dispatch | Simple admin trigger with no server required |
| 80% pass threshold | Matches Florida DHSMV actual passing score requirement |
