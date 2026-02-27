# Modified clawg-ui Plugin Setup

This directory contains a fork of `@contextableai/clawg-ui` that adds **client tool support**. The official plugin (v0.2.7) ignores the `tools` field in `RunAgentInput`. This version stashes client-provided tools per session, registers them as OpenClaw agent tools, and emits AG-UI `TOOL_CALL_START/ARGS/END` events so CopilotKit can execute them on the client.

## Prerequisites

- OpenClaw gateway running (`openclaw gateway run` or LaunchAgent)
- Node.js >= 18

## Install

```bash
# From the clawui/ directory:
cp -r ./clawgui/clawg-ui ~/.openclaw/extensions/clawg-ui

# Install dependencies
cd ~/.openclaw/extensions/clawg-ui && npm install

# Restart the gateway to load the plugin
openclaw gateway restart
```

## Verify

```bash
openclaw plugins list
```

You should see:

```
CLAWG-UI  clawg-ui  loaded  global:clawg-ui/index.ts  0.2.7
```

If you see `error` status with "Cannot find module '@ag-ui/core'", run `npm install` inside `~/.openclaw/extensions/clawg-ui/`.

## Device Pairing

If this is your first time connecting, you need to pair the device:

```bash
# Initiate pairing (no auth header)
curl -s -X POST http://localhost:18789/v1/clawg-ui \
  -H "Content-Type: application/json" -d '{}'

# You'll get a 403 with a pairingCode and token. Save the token.

# Approve the device (on the machine running OpenClaw)
openclaw pairing approve clawg-ui <PAIRING_CODE>
```

Then set the token in your `.env`:

```
OPENCLAW_AGENT_TOKEN=<your-device-token>
NEXT_PUBLIC_OPENCLAW_AGENT_TOKEN=<your-device-token>
```

## What This Plugin Adds

| File | Purpose |
|------|---------|
| `src/tool-store.ts` | Per-session storage for client tools, SSE writers, and state flags |
| `src/client-tools.ts` | Factory converting AG-UI client tools to OpenClaw agent tools |
| `src/http-handler.ts` | Parses `RunAgentInput.tools` and context, stashes them per session |
| `index.ts` | `before_tool_call` / `tool_result_persist` hooks emit AG-UI TOOL_CALL events |

## How It Works

1. CopilotKit sends `RunAgentInput` with `tools` (from `useCopilotAction`) and `context` (from `useCopilotReadable`)
2. The plugin stashes the tools and registers them as OpenClaw agent tools via `api.registerTool()`
3. When the agent calls a client tool, the `before_tool_call` hook emits `TOOL_CALL_START`, `TOOL_CALL_ARGS`, and `TOOL_CALL_END` SSE events
4. CopilotKit receives the events and executes the tool handler on the client
5. The board/app state updates reactively in the browser

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Plugin shows `error` status | Run `cd ~/.openclaw/extensions/clawg-ui && npm install` |
| "plugin already exists" on install | Delete `~/.openclaw/extensions/clawg-ui/` first |
| 403 pairing_pending | Run `openclaw pairing approve clawg-ui <CODE>` |
| Gateway token mismatch after restart | Run `openclaw gateway install --force` |
| Tools not forwarded | Verify `CLAWPILOT_MODE=hybrid` or `openclaw` in `.env` |
