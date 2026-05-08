The polish sprint spec is approved and committed at docs/superpowers/specs/2026-04-14-polish-sprint-design.md. The plan file was started at docs/superpowers/plans/2026-04-14-polish-sprint.md but may be incomplete. Read the spec, complete the plan if needed, then execute it using subagent-driven development. The tasks are:
(1) add explanation?: string to src/types.ts
(2) replace src/data/questions.json with a full 120-question 2026 Florida DMV bank
(3) rewrite src/components/StudyMode.tsx with weighted random recycling, Spanish chip, ¿POR QUÉ? box, keyword highlighting, progress bar
(4) rewrite src/components/StudyMode.css mobile-first
(5) add @media (max-width: 480px) to the other 4 screen CSS files
(6) update tests/StudyMode.test.tsx.
Use subagents for execution — dispatch one per task and do not wait for me between tasks.
