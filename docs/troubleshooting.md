# Troubleshooting

Quick fixes for common setup issues in ClawUI + CopilotKit + OpenClaw projects.

## 1) App won’t start

### Symptoms
- `npm run dev` fails
- Build errors on startup

### Checks
- Confirm Node version (`node -v`) is >= 18
- Reinstall deps:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 2) `@copilot` not responding

### Symptoms
- Chat UI loads, but no response from Copilot

### Checks
- Ensure `.env` exists and has a valid provider key (e.g., `OPENAI_API_KEY`)
- Verify model value is valid (`OPENAI_MODEL`)
- Restart dev server after `.env` changes

---

## 3) `@clawpilot` not responding

### Symptoms
- `@copilot` works, `@clawpilot` does nothing/fails

### Checks
- `CLAWPILOT_MODE` is `hybrid` or `openclaw`
- `NEXT_PUBLIC_CLAWPILOT_MODE` matches `CLAWPILOT_MODE`
- `OPENCLAW_AGENT_URL` points to the AG-UI endpoint
- `OPENCLAW_AGENT_TOKEN` is a valid paired token (not gateway master token)
- OpenClaw gateway is running

Test token manually:

```bash
curl -s -N -X POST "$OPENCLAW_AGENT_URL" \
  -H "Authorization: Bearer $OPENCLAW_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello"}]}'
```

---

## 4) `401 unauthorized` from OpenClaw

### Cause
Using wrong token type or expired token.

### Fix
- Re-run pairing flow for `clawg-ui`
- Approve pairing on gateway
- Update `.env` with the new paired token
- Restart app

---

## 5) Works in browser, not from WhatsApp

### Checks
- WhatsApp channel is linked on gateway
- Sender is allowlisted (`allowFrom` if configured)
- App endpoint is reachable from where gateway runs
- If gateway runs on VPS, don’t use `localhost` for app URL unless app is on same host

---

## 6) Localhost works, VPS can’t reach app

### Cause
`localhost` on VPS points to VPS itself, not your laptop.

### Fix options
- Deploy app to reachable URL (recommended)
- Use Tailscale/Cloudflare Tunnel
- Put app and gateway on same private network

---

## 7) Board actions flaky via UI automation

### Better approach
Use server action endpoints (`/api/kanban` or `/api/agent/actions`) for mutations; keep browser automation for visual checks.

---

## 8) Quick diagnostics

```bash
openclaw status
openclaw plugins list
openclaw plugins doctor
openclaw logs --follow
```

For app side:

```bash
curl -s http://localhost:3000/api/kanban
```

---

## 9) Recommended secure baseline

- Scoped delegated token for app actions
- Short token TTL + rotation
- Server-side schema validation (Zod)
- Per-action policy (allow/confirm/deny)
- Audit log for all agent actions

---

If you want, extend this file with project-specific commands, known errors, and exact recovery steps for your team.
