# Troubleshooting

Symptom → likely cause → fix. Start from what the user tells you.

## Users

### "The app shows an old version" / "your fix isn't there"
- **Cause:** the service worker serves the cached version until the new one has downloaded, and it
  only switches when the user is on a main tab (never mid-exam, mid-question or while typing a code).
- **Fix:** open the app, go to Inicio, wait a few seconds (it reloads by itself), or close and
  reopen it. Check the version in Ajustes. Still old after a few hours → confirm the deploy really published (open the site in a
  private window); if a phone is stuck, clearing the site's data fixes it but **also deletes
  progress and Premium** (they'd re-enter their code).

### "My code doesn't work"
Ask for the exact message:
| Message (Spanish) | Cause | Fix |
|---|---|---|
| "…incompleto o tiene un error…" | part of the code missing / extra text pasted | ask them to copy the whole `FLDMV-…` block again |
| "…no es válido…" | a character changed, or code made with a different key | re-send the code from `tools/issued-codes.csv`; if the key was rotated, issue a new code |
| "…no corresponde a ese correo…" | typed a different email than the one in the command | tell them the exact email you used; or issue a new code for the email they use |
| "…venció el …" | monthly code past its end + grace | issue a renewal (`--plan monthly`) after payment |
| "Ya tienes Premium de por vida…" / "Tu código actual dura más…" | they entered an older/weaker code | nothing to fix — their better code stays active |
| "…necesita una versión más nueva…" | code format newer than their app | close/reopen the app to update |

### "I lost my progress"
- **iPhone, not installed:** Safari deletes data of websites not used for a while. Fix: install
  via Share → "Agregar a inicio" (the app nudges this). Lost data can't be recovered.
- **Different browser or device:** progress is per device/browser. Premium can be re-activated
  with the same email + code; progress doesn't sync.
- **They tapped "Reiniciar progreso":** expected (Premium is kept).

### "I have Premium but it says Bloqueada / it went back to free"
- Monthly plan ended (+3 grace days). Inicio shows "Tu acceso Premium terminó". Renew.
- Phone date is wrong (far in the future) → fix the date; the code is re-checked on next open.
  (If the date was wrong in the future by < 2 months, the app keeps that day until real time
  catches up — expected anti-rollback behaviour; reissue a monthly code with extra `--days` if fair.)
- They tapped "Quitar Premium de este dispositivo" → re-enter the code.
- Public key changed in a deploy (key rotation) → re-issue codes.

### "There's no Install button"
- **iPhone:** there is never a button — use Safari's Share → "Agregar a inicio" (Ajustes → Instalar app
  shows the steps). In Chrome/other browsers on iPhone, the Share menu also has it on recent iOS;
  otherwise open in Safari.
- **Android:** Chrome only offers install after the page has fully loaded; use the ⋮ menu →
  "Instalar app" / "Agregar a la pantalla principal". Some in-app browsers (Facebook, WhatsApp
  previews) can't install — open the link in Chrome.
- Already installed → the card and the Ajustes row disappear on purpose.

### "Pagar / Enviar comprobante doesn't open my email"
The button opens a `mailto:` link. If the phone has no email app set up, nothing happens. Ask them
to email bitensemble.solutions@gmail.com manually with the plan name and the payment screenshot.

### "The free questions ran out but it's a new day"
The counter resets on the phone's **local** date. If the phone's date/time zone is wrong, fix it.

## Developer

| Problem | Fix |
|---|---|
| `npm run code` → "No signing key" | run on the machine that has `~/keystores/fldmv-unlock-ed25519.key`, or set `FLDMV_UNLOCK_KEY` |
| CLI warns "public key does not match" | `src/config/unlockPublicKey.ts` isn't from your key: restore it from git, or (new key) deploy after `--init` |
| `npm run code` → syntax error about types | Node too old; need 23.6+ (`node -v`) |
| Tests: `localStorage` undefined | Node 25+ global shadows jsdom; `tests/setup.ts` installs a memory Storage — keep it |
| Site 404 on refresh of a deep link | can't happen with hash routes; if you add path routes, GitHub Pages needs a 404.html trick — don't |
| New file not offline | it must be matched by `workbox.globPatterns` in `vite.config.ts` |
| Fonts look different | Roboto comes from `@fontsource/roboto` (Latin subset) imported in `src/main.tsx` |
| Screenshot tool can't launch | it uses system Google Chrome (`channel: 'chrome'`); install Chrome or change the channel |
