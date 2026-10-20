# Deploying (publishing changes)

The app is static files served by **GitHub Pages** from the `gh-pages` branch of
`github.com/norcimo5/florida-test-webapp`. Address: https://norcimo5.github.io/florida-test-webapp/

## Publish

```bash
cd ~/Projects/florida-test-webapp
git status                 # commit your source changes first (branch: master — the live app's source)
npm test                   # all green
npm run deploy             # = npm run build, then push dist/ to the gh-pages branch
```

`npm run deploy` uses the `gh-pages` package: it replaces the whole `gh-pages` branch content
with `dist/` (plus a `.nojekyll` file, so GitHub Pages serves the files as-is without Jekyll). Everything the site needs must therefore come from the build — that's why
`privacy-policy.html` lives in `public/` (copied into `dist/`). GitHub Pages usually updates within
about a minute. Check: open the site in a private window; Ajustes shows the version number.

Before deploying a behaviour change: bump `"version"` in `package.json` and add a `CHANGELOG.md` entry.

## How updates reach phones

1. The installed app always opens from its offline cache (fast, works without signal).
2. In the background the service worker checks GitHub Pages for a new `sw.js` (on every launch,
   and every hour while open).
3. If there is one, it downloads all new files, then **waits**. `src/pwa/registerSW.ts` tells it to
   take over at a safe moment: as soon as the user is on a bottom-nav tab (Inicio, Temas,
   Exámenes, Perfil, Ajustes). The page reloads once onto the new version. It never interrupts an
   exam, a study question or code entry — not even if the app is sent to the background, and not
   if another open copy of the app (e.g. a browser tab) applies the update first.
4. Old cached files are deleted automatically (`cleanupOutdatedCaches`).

In practice: users get the new version within a minute or two of opening the app.

User data (localStorage) is not touched by updates. Changing the storage shape needs a migration
(see ARCHITECTURE.md §4).

## Roll back

Fastest: rebuild an older commit and deploy it.

```bash
git log --oneline                  # find the good commit
git checkout <good-commit>
npm ci && npm run deploy
git checkout master                # come back
```

Or revert the bad commit on master (`git revert <bad>`), then `npm run deploy`.
Phones pick up the rollback the same way as any update.

⚠️ **Never roll back to a build older than version 2.0.0** (anything before the PWA, or the first
2.0 commit `f625ec1`, whose service worker never switched versions in open apps). In particular,
deploying a build **without** a service worker does NOT remove the installed one: phones would
keep showing the cached app forever. To retire the service worker on purpose, deploy a build with
`VitePWA({ selfDestroying: true })` first.

## First-time / new machine setup

- Node.js 23.6 or newer (`node -v`), then `npm ci`.
- Git must be able to push to GitHub (`git push` works without asking for a password).
- To make codes on that machine, copy `~/keystores/fldmv-unlock-ed25519.key` securely
  (see UNLOCK-CODES.md). Deploying itself does not need the key.

## Moving to another host or a custom domain (later)

- The app expects to live at `/florida-test-webapp/`. The address/path appears in:
  `vite.config.ts` (`BASE`), `index.html` (icon links), `src/config/app.ts` (`APP_URL`),
  `tools/make-unlock-code.ts` (`APP_URL`, used in buyers' emails), `public/privacy-policy.html`
  (3 links), and the default `--url` of `tools/screenshots.ts` / `tools/offline-check.ts`.
  Find them all with `grep -rn "florida-test-webapp" --exclude-dir=node_modules --exclude-dir=dist .`
- ⚠️ Installed apps and saved progress are tied to the exact web address (origin). Moving to a new
  domain means users install again and start with empty progress (their Premium code still works:
  they re-enter it). Decide on a final address before promoting the app widely.
