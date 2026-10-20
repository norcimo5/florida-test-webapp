# Unlock codes (Premium)

Premium is unlocked with a code you email to the buyer. No server, no payment processor.

## The everyday workflow

1. Buyer pays by Zelle / Cash App / PayPal and sends the proof email from the app
   (subject starts with "Quiero Premium", body says which plan).
2. You confirm the money arrived.
3. On your computer:

   ```bash
   cd ~/Projects/florida-test-webapp
   npm run code -- --email buyer@example.com --plan lifetime     # $99.99 plan
   npm run code -- --email buyer@example.com --plan monthly      # $34.99 plan (30 days)
   ```

4. Copy everything between the lines it prints (subject + Spanish message with the code) into
   your reply to the buyer. Send it **to the same email address** you used in the command.
5. The buyer opens the app → **Ajustes → Activar Premium** → types that email, pastes the code →
   **ACTIVAR**. Premium turns on instantly, offline.

### Monthly renewals

- A monthly code gives access through its last day, plus **3 grace days**. The app reminds the
  buyer from 3 days before the end, and re-locks after the grace days (their progress is kept).
- When they pay again, run the same `--plan monthly` command. If their current code is still
  running, the new 30 days **start after it ends** (paying early never loses days). They enter
  the new code the same way; it replaces the old one.
- `npm run code -- --list` shows every code you issued and **who ends within 5 days**.
- Other lengths: `--days 60` (any whole number 1–400).

### The sales log

Every code is appended to `tools/issued-codes.csv` (date, email, plan, expiry, code). It is
git-ignored because it holds customer emails — it stays on your computer. Back it up with your keys.

## Keys — read this once

| File | Where | What |
|---|---|---|
| Private (signing) key | `~/keystores/fldmv-unlock-ed25519.key` | Makes codes. **Secret. Back it up.** |
| Public key | `src/config/unlockPublicKey.ts` | Checks codes. Ships inside the app. Safe to publish. |

- Created once with `npm run code -- --init` (refuses to overwrite an existing key).
- Use another location with `FLDMV_UNLOCK_KEY=/path/to/file npm run code -- …`.
- **Never** put the private key in the project folder, email, chat or cloud notes.

### If the private key is lost

Codes already given out keep working **as long as the public key in the app doesn't change** (the
app only needs the public key). But you can't make new codes without the private key, so:
1. Move any old key file away, run `npm run code -- --init` (new key + updates the public key file).
2. `npm run deploy`.
3. ⚠️ From that update on, every code made with the old key stops working (on each phone's next
   app start). Re-issue codes to current Premium buyers right away — the sales log lists them.

### If the private key leaks (someone else could make codes)

Same as "lost": generate a new key, deploy, and re-issue codes to everyone in the sales log.

## Code format (for developers)

Defined only in `src/billing/unlockCode.ts` (shared by the app and the CLI).

```
payload (14 bytes)                          signature (64 bytes)
┌────┬────┬─────────┬─────────┬──────────┐ ┌──────────────────────┐
│ v  │plan│ issued  │ expires │ email    │ │ Ed25519(payload)     │
│ 1  │1|2 │ uint16  │ uint16  │ sha256   │ │                      │
│    │    │ days    │ days,   │ first 8  │ │                      │
│    │    │ since   │ 0=never │ bytes    │ │                      │
│    │    │ 1970    │         │          │ │                      │
└────┴────┴─────────┴─────────┴──────────┘ └──────────────────────┘
78 bytes → Crockford base32 (125 chars) → "FLDMV-XXXXX-XXXXX-…"
```

- plan 1 = lifetime, 2 = monthly. `expires` is the last day of access (inclusive).
- Email is normalized (trim + lowercase) before hashing, so `Ana@Gmail.com ` = `ana@gmail.com`.
- Parsing ignores spaces, dashes and case, and maps I/L → 1 and O → 0 (typing-safe).
- Verification returns `format`, `version`, `signature` or `email` errors. Each one has a Spanish
  message in `src/ui/screens/activationMessages.ts`. Expiry is judged separately by
  `billing/entitlement.ts`.
- Changing the format: bump the version byte, keep accepting version 1, and add tests.

### Security model (be honest about it)

- ✅ Nobody can **forge** a code without the private key (Ed25519 signature).
- ✅ Editing localStorage can't extend a plan: the stored code is re-verified on every start.
- ✅ A code only works with the buyer's email (sharing it means sharing their email too, and their
  email is shown in Perfil).
- ✅ Setting the phone's date back doesn't stretch a monthly plan: the app never goes back to a
  day earlier than the latest one it has seen (up to ~2 months back; see ARCHITECTURE.md §4).
- ✅ Re-entering an older code can't shorten a monthly plan or downgrade a lifetime one.
- ⚠️ Accepted risk: a technical person could modify the app's JavaScript in their own browser to
  skip the check, or clear the app's data and keep the phone's date in the past. That's acceptable
  for a low-price study app; closing it fully would need a server.

## Testing codes without bothering a real buyer

```bash
npm run code -- --email you+test@gmail.com --plan monthly --days 1
```

Then delete that line from `tools/issued-codes.csv` if you like. Automated tests use their own
throw-away keys (`tests/billing/unlock.test.ts`, `tests/ui/app.test.tsx`).
