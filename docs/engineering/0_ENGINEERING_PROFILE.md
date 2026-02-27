# ClawUI v2 -- Engineering Profile

## Architecture

### Agent Model

All agents register natively in CopilotKit's `CopilotRuntime`. No manual proxying.

- **Standalone** -- single `BuiltInAgent` backed by your LLM
- **OpenClaw** -- single `HttpAgent` from `@ag-ui/client` pointing to clawg-ui
- **Hybrid** -- `BuiltInAgent` (default) + `HttpAgent` (clawpilot); CopilotKit routes between them

The runtime handles AG-UI protocol, tool forwarding, streaming, and conversation management natively.

### Provider Stack

```
ModeProvider (exposes current mode to client)
  └── MentionContextProvider (selected agent tracking)
       └── CopilotKit (runtimeUrl=/api/copilotkit)
            └── AgentAttributionProvider (message-to-agent mapping)
                 └── App
```

`ClawUIProvider` composes all four providers.

### Key Patterns

| Pattern | Where | Description |
|---------|-------|-------------|
| Native multi-agent runtime | `api/copilotkit/route.ts` | Both BuiltInAgent and HttpAgent registered in CopilotRuntime agents map |
| Mode-aware UI | `ModeContext` + chat components | Mention chips and @agent tags only render in hybrid mode |
| Hook-based tool registration | `demo/hooks/` | Tools register via `useCopilotAction`, auto-cleanup on unmount |
| Atomic design | `ui/` + `core/components/` | Reusable atoms, composed molecules/organisms |
| Removable demo | `demo/` | Self-contained; deleting it deregisters all tools automatically |

### Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript 5
- CopilotKit v1.52+ (`@copilotkit/*`)
- AG-UI Client (`@ag-ui/client`) for HttpAgent
- Tailwind CSS 3
- @dnd-kit for drag-and-drop (demo only)

### File Layout

```
src/
├── app/
│   └── api/
│       ├── copilotkit/  # Unified CopilotKit runtime (all agents registered here)
│       └── kanban/      # Demo API (delete with demo/)
├── core/
│   ├── providers/     # ModeContext, MentionContext, AgentAttribution, ClawUIProvider
│   ├── components/
│   │   ├── chat/      # ChatSidebar, MentionChatInput, message components
│   │   └── layout/    # SplitLayout, WelcomePage
│   ├── hooks/         # useSelectedAgentReadable
│   └── lib/           # agents, bridge-config, mention-parser, types
├── ui/                # Base UI atoms (Button, Badge, Avatar, Spinner, etc.)
└── demo/              # Removable kanban demo
    ├── mock-data/     # kanban.seed.json (tracked) + kanban.json (gitignored)
    ├── lib/           # kanban-store.ts (server-side persistence)
    ├── hooks/         # useKanban, useKanbanTools, useKanbanReadable
    └── components/    # Kanban UI (atoms, molecules, organisms)
```

### Data Flow

```
Browser (useKanban) ──> POST /api/kanban ──> src/demo/mock-data/kanban.json
                        GET  /api/kanban  <──
OpenClaw (WhatsApp) ──> POST /api/kanban ──> src/demo/mock-data/kanban.json
                        GET  /api/kanban  <──
```

Client-side tools register via `useCopilotAction`. CopilotKit forwards tools to all agents via `RunAgentInput.tools`.
