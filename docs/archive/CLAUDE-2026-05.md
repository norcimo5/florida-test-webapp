# CLAUDE.md — Project instructions for Claude Code

## What this project is

A web app that helps **Spanish-primary Florida residents** pass the **English-only** Florida Class E Knowledge Exam. Florida law removed the Spanish-language test option, so the app teaches **pattern recognition of English keywords** rather than translation.

Live: `https://norcimo5.github.io/florida-test-webapp/` · Deploy: `npm run deploy`.

## The single most important rule

**Spanish chrome, English question content.**

- Every nav label, heading, button, status text, and copy string in the app shell is in **Spanish**.
- **English** appears *only* inside actual exam-format question text (because that is the recognition skill we are training).
- No EN/ES toggle. No "translate UI" option. The user is Spanish-primary; English chrome would make the app unusable.

If you find yourself writing `Home`, `Continue`, `Submit`, `Score`, `Settings` etc. in JSX or CSS, stop — use `Inicio`, `Continuar`, `Enviar`, `Puntaje`, `Ajustes`.

## Stack

- React 19 + TypeScript + Vite
- Vitest + React Testing Library (jsdom)
- Mobile-first custom CSS (no Tailwind, no UI library)
- Deployed to GitHub Pages via `gh-pages` package
- `vite.config.ts` uses `base: '/florida-test-webapp/'` — required for the gh-pages path; do not remove

## Commands

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # tsc -b && vite build
npm test             # vitest run
npm run test:watch   # interactive
npm run lint         # eslint
npm run deploy       # build + push dist/ to gh-pages branch
```

## Source layout

```
src/
  components/        HomeScreen, StudyMode, ExamMode, ResultsScreen, OptionsDrawer (each .tsx + .css)
  data/questions.json  120-question 2026 FL Class E bank
  store/progressStore.ts  localStorage persistence with in-memory fallback
  types.ts           Question, Progress, Category, StudyAnswer
  App.tsx            state-based router
tests/               Vitest specs co-located by component
docs/superpowers/
  specs/             Spec-driven design docs
  plans/             Checkbox-driven implementation plans (use superpowers:executing-plans)
storyboard/          Visual mocks the user provides for redesign work
```

## Active redesign (May 2026)

A major UI redesign is in flight. Reference: `storyboard/mock-main-screen-1.png`. Memory: `project_dashboard_redesign.md`.

**What's changing:**
- Home becomes a **dashboard** (Duolingo-meets-Apple-Fitness): personalized greeting, **Pass Probability Meter** (mean of topic mastery %), vocabulary streak chip, topic-progress cards, recent-scores list, performance trend chart.
- Greeting placeholder is **TESTUSER** until real auth is added.
- **5-tab bottom nav:** Inicio · Temas · Exámenes · Perfil · Ajustes.
- **Full Mock Exam = 50 questions** (matches real FL Class E exam). Pass = 40/50 (80%). The "10–20 MIN" label refers to duration.
- **Daily Quick Quiz** (tentative): 5 mixed questions, streak tracked.
- New screens needed: Temas (topic browser), Perfil (profile/auth placeholder), Ajustes (settings).
- **Aesthetic carries to all screens.** Same gradient header, same teal CTA, same rounded card style across Home, Study, Exam, Results.

## Workflow

1. **Prototype on web** → deploy to GitHub Pages.
2. **User's cousin** (real Spanish-primary FL resident) tests the live URL — they are the validation user. Treat them as the customer.
3. Polish based on cousin's feedback.
4. **Wrap as Android via Capacitor** + monetize with **RevenueCat IAP** (one-time unlock for full question bank). See `project_mobile_monetization.md` in user memory.

## Spec-driven development

The project follows a lightweight SDD flow:
- Specs live in `docs/superpowers/specs/` (`PROMPT.md` is the SDD template).
- Plans live in `docs/superpowers/plans/` with `- [ ]` checkboxes.
- Use `superpowers:executing-plans` to implement plans task-by-task, committing after each task.

For non-trivial work: write spec → plan → execute. Don't skip to coding.

## Helper tools — save what's reusable

When generating a one-off tool/script/command that succeeded and could be useful again, **save it** to a known location instead of throwing it away. The four project subagents already know to check these locations first before doing manual work.

- **`scripts/`** — shell or Node utility scripts. Add a one-line header comment explaining purpose. `chmod +x` to make executable. Examples: `check-spanish-chrome.sh`, `screenshot-mobile.mjs`, `check-contrast.mjs`.
- **`.claude/commands/`** — Claude Code slash commands as `.md` files with frontmatter. User can invoke with `/<name>`. Use this when the tool is a multi-step workflow Claude orchestrates (e.g., `/run-quality-gates` to dispatch all 4 subagents in parallel).
- **`.claude/agents/`** — already established for subagents. Don't duplicate those here.

**Naming:** kebab-case verb-noun (`check-spanish-chrome.sh`, not `i18n.sh`).

**Don't save:** throwaway one-liners, single-bug-fix scripts, anything narrowly tied to a one-time question.

When you save a tool, mention the path so the user knows where to find it.

## Quality gates — subagents

`.claude/agents/` defines four project subagents the Agent tool can dispatch. **Use them.**

- **validator** — runs build, tests, type-check, reports failures with file:line.
- **uiexpert** — reviews visual polish, mobile responsiveness, design consistency, layout rhythm.
- **i18n-checker** — guards the Spanish-chrome rule. Catches English leaking into UI strings, missing accents, grammar issues.
- **a11y** — checks color contrast, touch-target sizes, ARIA, keyboard nav.

**When to dispatch:** after any visual change, dispatch `uiexpert` + `i18n-checker` in parallel before committing. After any logic change, dispatch `validator`.

## Things to avoid

- Don't add Tailwind, MUI, or any UI library. Custom CSS with CSS custom properties only.
- Don't add backend services for the prototype phase — everything client-side, localStorage-backed.
- Don't add EN/ES toggle to UI chrome. (See "single most important rule.")
- Don't ship without running `npm test` and `npm run build`.
- Don't deploy without testing the gh-pages path locally (`npm run preview` after `npm run build`).
- Don't break the existing 120-question bank schema (`src/data/questions.json`) — extend, don't restructure.

## Resuming a session

If you lose context, in order:
1. Read this file.
2. `git log --oneline -20`.
3. Read `docs/superpowers/specs/` and `docs/superpowers/plans/` for active work.
4. Read `storyboard/` for any new visual mocks.
5. Check user memory at `MEMORY.md` (auto-loaded).
