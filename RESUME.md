# How to Resume Development

If the session ended or you restarted your PC, open Claude Code in this directory and paste one of the prompts below.

## Resume Frontend Build

```
Read docs/superpowers/plans/2026-04-13-frontend.md and run `git log --oneline -20` to see what's been completed. Then continue executing from the next unchecked task using the superpowers:executing-plans skill. The spec is at docs/superpowers/specs/2026-04-13-florida-driver-prep-design.md if you need context.
```

## Resume Scraper Build (after frontend is done)

```
Read docs/superpowers/plans/2026-04-13-scraper.md and run `git log --oneline -20` to see what's been completed. Then continue executing from the next unchecked task using the superpowers:executing-plans skill.
```

## Check current status manually

```bash
git log --oneline -20          # see completed tasks
grep -n "\- \[" docs/superpowers/plans/2026-04-13-frontend.md  # see all checkboxes
grep -n "\- \[x\]" docs/superpowers/plans/2026-04-13-frontend.md  # see completed ones
```
