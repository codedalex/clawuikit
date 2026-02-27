# ClawUI v2 -- Modes Guide

## Overview

ClawUI supports three operational modes, controlled by a single env var:

```env
CLAWPILOT_MODE=standalone   # or: openclaw, hybrid
NEXT_PUBLIC_CLAWPILOT_MODE=standalone  # must match (client-side)
```

## Standalone Mode (default)

**What**: CopilotKit + your LLM. No OpenClaw dependency.

**Config**:
```env
CLAWPILOT_MODE=standalone
NEXT_PUBLIC_CLAWPILOT_MODE=standalone
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

**Runtime**: Single `BuiltInAgent` registered as `default` in CopilotRuntime.

**UI**: Simple chat input, no mention chips or @agent tags.

## OpenClaw Mode

**What**: OpenClaw controls everything via the clawg-ui plugin (AG-UI protocol).

**Config**:
```env
CLAWPILOT_MODE=openclaw
NEXT_PUBLIC_CLAWPILOT_MODE=openclaw
OPENCLAW_AGENT_URL=http://localhost:18789/v1/clawg-ui
OPENCLAW_AGENT_TOKEN=your-device-pairing-token
```

**Runtime**: Single `HttpAgent` registered as `default`. Uses `ExperimentalEmptyAdapter` (no local LLM needed).

**UI**: Simple chat input labeled "ClawPilot", no mention chips.

**Requires**: OpenClaw gateway running with the `clawg-ui` plugin installed. See `clawgui/SETUP.md`.

## Hybrid Mode

**What**: Both agents active. User chooses per-message via @mentions.

**Config**:
```env
CLAWPILOT_MODE=hybrid
NEXT_PUBLIC_CLAWPILOT_MODE=hybrid
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENCLAW_AGENT_URL=http://localhost:18789/v1/clawg-ui
OPENCLAW_AGENT_TOKEN=your-device-pairing-token
```

**Runtime**: Two agents registered -- `default` (BuiltInAgent) and `clawpilot` (HttpAgent).

**UI**: Full mention system with chip bar, @agent autocomplete, and message attribution badges.

**Agent routing**: User types `@copilot` or `@clawpilot` to select. `useSelectedAgentReadable` exposes the selection to the runtime. CopilotKit routes to the correct agent.
