# Examen de Manejo Florida — owner's guide

A study app for Spanish-speaking people preparing for Florida's **English-only** driver's license
knowledge exam. People open a link, tap "install", and it works like a normal phone app (Android
and iPhone), even offline. **No Google Play, no App Store.**

**The app:** https://norcimo5.github.io/florida-test-webapp/

---

## What users get

| Free | Premium |
|---|---|
| 5 study questions per day | Unlimited study (all 120 questions) |
| 1 daily quiz (5 questions) per day | Unlimited quizzes |
| Progress tracking | 50-question Full Mock Exam + score history |

Prices (set in `src/config/app.ts`): **US$34.99 per month** (30 days) or **US$99.99 for life**.

## How selling Premium works (no store, no card processor)

1. In the app, the buyer taps a locked feature → sees the price screen → pays you by
   **Zelle, Cash App or PayPal** (your handles go in `src/config/payment.ts`).
2. They tap **"ENVIAR COMPROBANTE"**. Their email opens, pre-filled to
   bitensemble.solutions@gmail.com, and they attach a screenshot of the payment.
3. You check the payment arrived, then run **one command** on your computer:

   ```bash
   cd ~/Projects/florida-test-webapp
   npm run code -- --email THEIR@EMAIL.com --plan lifetime
   ```

   (use `--plan monthly` for the monthly plan)

4. The command prints a ready-made Spanish email containing their code. Copy it into your reply.
5. They open the app → **Ajustes → Activar Premium** → paste the code. Done.

Monthly buyers: the code works for 30 days (+3 grace days). The app reminds them 3 days early.
When they pay again, run the same `monthly` command — the new 30 days are added on top.
See who's due: `npm run code -- --list`.

Full details, including what to do if the signing key is lost: **docs/UNLOCK-CODES.md**.

> ⚠️ **Back up `~/keystores/`** (it now holds `fldmv-unlock-ed25519.key`). Without that file you
> can't make new codes for the current app. Never share it, email it, or put it in the project.

## Publishing changes

```bash
cd ~/Projects/florida-test-webapp
npm test          # must say all tests passed
npm run deploy    # builds and publishes; live in ~1 minute
```

Phones pick up the new version the next time the app is opened (sometimes the time after).
More: **docs/DEPLOY.md**.

## Running it on your computer

```bash
npm install       # first time only
npm run dev       # then open http://localhost:5173/florida-test-webapp/
```

## Where to look next

- Something's wrong for a user → **docs/TROUBLESHOOTING.md**
- Change prices, the free limit, or add questions → **docs/UPGRADING.md**
- For an AI assistant or developer → **CLAUDE.md** (start there)
