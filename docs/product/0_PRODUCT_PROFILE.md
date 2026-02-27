# ClawUI v2 -- Product Profile

## What It Is

ClawUI is a starter kit for building AI-powered applications with CopilotKit and optional OpenClaw integration. Developers clone it, delete the demo, and build their own UI on top of the AI foundation.

## Three Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **standalone** | CopilotKit + your LLM (OpenAI, Anthropic, etc.) | Standard AI-powered app with no external dependencies |
| **openclaw** | OpenClaw controls the app via clawg-ui (AG-UI protocol) | Full OpenClaw gateway control; multi-channel access |
| **hybrid** | Both agents active with @mention routing | @copilot for local AI, @clawpilot for OpenClaw; user picks per-message |

## Target Users

- Developers building AI-powered web applications
- Teams integrating OpenClaw as a multi-channel agent gateway
- Hackathon participants needing a quick AI app scaffold

## Core Value

1. **Zero-to-AI in minutes** -- clone, set env vars, run
2. **Three modes, one codebase** -- switch between standalone, openclaw, and hybrid via a single env var
3. **Removable demo** -- kanban board demonstrates patterns; delete it and build your own
4. **Atomic design** -- clean component architecture that scales
5. **Native multi-agent** -- CopilotKit runtime handles agent routing, tool forwarding, and conversation management natively

## What Changed from v1

- Replaced manual OpenClaw proxy with CopilotKit's native multi-agent runtime
- Added ModeContext for mode-aware UI (mention chips only appear in hybrid mode)
- Reorganized into `core/`, `ui/`, and `demo/` for clear starter kit boundaries
- Fixed agent attribution, tool forwarding, and conversation history bugs
