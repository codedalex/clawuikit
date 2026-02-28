# Pairing `clawg-ui` (First-Time Setup Guide)

This guide is for developers using this repo for the first time.

If you see:

- `HTTP 401 unauthorized`
- `Authentication required`
- `@clawpilot` not responding

…it usually means your `OPENCLAW_AGENT_TOKEN` is missing, stale, or not approved.

---

## What this is

`clawg-ui` uses **device pairing**.

- ✅ You must use a **paired device token**
- ❌ Do **not** use your gateway master token (`gateway.auth.token`)

Every cloned/forked app should pair as its own device.

---

## Step 1) Install `clawg-ui` plugin (if not already installed)

If `clawg-ui` is not installed on your gateway host yet:

```bash
# From this repo root:
cp -r ./clawgui/clawg-ui ~/.openclaw/extensions/clawg-ui
cd ~/.openclaw/extensions/clawg-ui && npm install
openclaw gateway restart
```

Verify plugin is loaded:

```bash
openclaw plugins list
```

You should see a loaded `clawg-ui` entry.

---

## Prerequisites

- OpenClaw gateway is running on the machine you’re targeting
- You can access the gateway endpoint (default `http://127.0.0.1:18789`)
- This app has `OPENCLAW_AGENT_URL` set to `/v1/clawg-ui`

Check gateway:

```bash
openclaw gateway status
```

---

## Step 2) Request pairing token

From your app repo:

```bash
curl -i http://127.0.0.1:18789/v1/clawg-ui \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"pair"}]}'
```

Expected response: `403 pairing_pending` with JSON containing:

- `pairingCode` (example: `ABCD1234`)
- `token` (save this)

---

## Important note about the token

`openclaw pairing list` and `openclaw pairing approve` do **not** print the paired token.

You only get the token from the original `pair` HTTP response (`error.pairing.token`).
Save it immediately.

If you lost it, run Step 2 again to generate a new token/code pair.

## Step 3) Approve pairing on gateway host

Run on the machine that owns the OpenClaw gateway:

```bash
openclaw pairing approve clawg-ui <PAIRING_CODE>
```

Example:

```bash
openclaw pairing approve clawg-ui ABCD1234
```

If needed, list pending requests:

```bash
openclaw pairing list clawg-ui
```

---

## Step 4) Update `.env`

Set these values in your project:

```env
CLAWPILOT_MODE=openclaw
NEXT_PUBLIC_CLAWPILOT_MODE=openclaw
OPENCLAW_AGENT_URL=http://127.0.0.1:18789/v1/clawg-ui
OPENCLAW_AGENT_TOKEN=<PAIRED_DEVICE_TOKEN>
```

> In hybrid mode, use `CLAWPILOT_MODE=hybrid` and keep the same `OPENCLAW_*` values.

---

## Step 5) Restart app

```bash
npm run dev
```

(Or restart your process manager/container.)

---

## Step 6) Verify token works

```bash
curl -i http://127.0.0.1:18789/v1/clawg-ui \
  -H "Authorization: Bearer <PAIRED_DEVICE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"ping"}]}'
```

If auth is correct, you should **not** get `401 Authentication required`.

---

## Common errors

### `401 unauthorized`
Cause: wrong/stale token, missing `Authorization` header, or copied the wrong value.

Fix:
1. Re-run pairing flow
2. Approve new code
3. Replace `OPENCLAW_AGENT_TOKEN`
4. Restart app

### `403 pairing_pending`
Cause: token exists but pairing not approved.

Fix:
```bash
openclaw pairing approve clawg-ui <PAIRING_CODE>
```

### `Connection refused`
Cause: gateway not running or wrong host/port.

Fix:
```bash
openclaw gateway status
```
Then correct `OPENCLAW_AGENT_URL`.

---

## Recommended copy for public README

You can link this guide with:

```md
Having `@clawpilot` auth issues? See [pairing-clawg-ui.md](./pairing-clawg-ui.md).
```

---

## Security note

- Never commit `.env`
- Treat `OPENCLAW_AGENT_TOKEN` like a secret
- If leaked, rotate by creating a new paired token
