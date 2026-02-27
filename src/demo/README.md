# Demo: Kanban Board

This folder contains a sample kanban board that demonstrates the AI architecture.

**To start fresh with your own UI:**

1. Delete this entire `src/demo/` folder
2. Delete `src/app/api/kanban/` (the demo's API route)
3. Remove the `@dnd-kit/*` dependencies from `package.json` if you don't need drag-and-drop

The app will fall back to a welcome page with getting-started instructions.

## What's inside

- `mock-data/kanban.seed.json` -- Committed seed data for the demo board
- `mock-data/kanban.json` -- Working data file (gitignored, auto-created from seed on first run)
- `lib/kanban-store.ts` -- Server-side JSON read/write and type definitions
- `hooks/useKanban.ts` -- Client-side state management with optimistic updates
- `hooks/useKanbanTools.ts` -- Registers kanban actions as CopilotKit tools
- `hooks/useKanbanReadable.ts` -- Exposes board state to AI agents
- `components/` -- Kanban UI following atomic design
- `KanbanDemo.tsx` -- Entry component that wires everything together

## How the AI integration works

1. `useKanbanTools` registers `useCopilotAction` hooks for addCard, moveCard, updateCard, deleteCard, addColumn, renameColumn, deleteColumn
2. `useKanbanReadable` exposes the full board state via `useCopilotReadable`
3. Both hooks self-register on mount and self-cleanup on unmount
4. When you delete this folder, the tools and state exposure deregister automatically
