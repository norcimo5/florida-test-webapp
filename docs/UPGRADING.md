# Upgrading & changing things

Recipes for common changes. After any change: `npm test`, `npm run lint`, update docs +
`CHANGELOG.md`, bump `package.json` version, `npm run deploy`.

## Change prices
`src/config/app.ts` → `PRICES`. The paywall and the payment email use these strings.
Also update any price text you published elsewhere (social posts, flyers).
If you change the monthly length, change `MONTHLY_DAYS` **and** the CLI default `--days`
(`tools/make-unlock-code.ts`).

## Set or change payment handles
`src/config/payment.ts` → fill `handle` for Zelle / Cash App / PayPal ('' hides one). With all
empty, the paywall asks buyers to email first and you reply with payment details.

## Change the free allowance
`FREE_PER_DAY` in `src/domain/gating.ts` — the study header ("N gratis hoy") follows automatically.
Then update the README "What users get" table, the CHANGELOG, and the tests that assume 5
(`tests/domain/domain.test.ts` gating cases, `tests/ui/app.test.tsx` "5 gratis hoy" and
`freeCount: 5`). ⚠️ The "5 preguntas" texts on Inicio and Exámenes are the **Daily Quiz length**
(`DAILY_QUIZ_LENGTH` in `src/domain/metrics.ts`), not the free allowance — leave them unless you
change the quiz length too.

## Change grace / reminder days
`GRACE_DAYS` and `REMIND_DAYS` in `src/billing/entitlement.ts`; update the paywall/README wording
and `tests/billing/unlock.test.ts`.

## Add or edit questions
1. Edit `src/data/questions.json` (shape: `src/domain/types.ts` → `Question`). Keep `id` unique,
   `en.correct` a valid index, `category` one of the listed categories (unknown ones fall into
   "Seguridad y Leyes"). `keywords[].en` must appear in `en.question` to be highlighted.
2. Keep the Android copy in sync if it still matters:
   `../florida-test-android-app/app/src/main/assets/questions.json`.
3. Update the count test in `tests/domain/domain.test.ts` (it expects 120).
4. Never label questions as "real exam questions" (store/legal rule).

## Add a screen
1. Create `src/ui/screens/NewScreen.tsx` with a header comment; build it from `core.tsx`
   components and token classes.
2. Add a route in `App.tsx` (`Screen` switch) and document it in `src/ui/router.ts` + ARCHITECTURE.md §7.
3. Navigate with `navigate('/new')`; decide push vs replace (see router docs).
4. Add a scenario to `tools/screenshots.ts` and a test in `tests/ui/`.
5. Spanish only (HARD rule).

## Change colors / fonts / spacing
Edit `src/ui/theme/tokens.css` (and `typography.css` for type). Keep DESIGN-SYSTEM.md tables in
sync. If the Android app is still maintained, change `Theme.kt`/`Type.kt`/`Dimens.kt` the same way.

## Update dependencies
```bash
npm outdated
npm install <pkg>@<exact-version>   # one at a time
npm test && npm run build && npm run shots
```
Watch: `vite-plugin-pwa` (service worker behaviour), `@noble/*` (code verification — rerun the
unlock tests), `react` major versions.

## Future paths (when it's worth it)

| Goal | Path |
|---|---|
| Automatic card payments + instant unlock | Lemon Squeezy or Stripe Payment Links + a small serverless webhook that emails the code (reuse `createUnlockCode` server-side). No app change needed: codes stay the same. |
| Accounts / progress sync across devices | Supabase or Firebase auth + storage; replace `appStore.ts` persistence behind the same actions. |
| Back in Google Play / App Store | Wrap this app with **Capacitor** (same code, native shell), or publish the PWA to Play as a Trusted Web Activity (Bubblewrap). Store rules then require store billing for digital goods in most regions. |
| Custom domain | See DEPLOY.md "Moving to another host" — do it before wide promotion (origin change resets installs/progress). |
| Push notifications (study reminders) | Web Push works on Android and on iOS 16.4+ **only when installed**; needs a small push server. |
