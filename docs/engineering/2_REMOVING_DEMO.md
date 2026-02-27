# Removing the Kanban Demo

Follow these steps to remove the demo and start building your own UI.

## Steps

1. **Delete the demo folder**:
   ```bash
   rm -rf src/demo/
   ```

2. **Delete the demo API route**:
   ```bash
   rm -rf src/app/api/kanban/
   ```

3. **Remove demo dependencies** (optional, if you don't need drag-and-drop):
   ```bash
   npm uninstall @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

4. **Clean up the gitignore**: Remove the `src/demo/mock-data/kanban.json` line from `.gitignore`.

## What Happens

- `page.tsx` dynamically imports `@/demo/KanbanDemo`. When the folder is gone, the import fails silently and the app falls back to `WelcomePage`.
- All CopilotKit tools (`useCopilotAction`) and readables (`useCopilotReadable`) from the demo auto-deregister since the components unmount.
- No code changes are required in `page.tsx` -- it handles the missing demo gracefully.

## Building Your Own UI

1. Create your components anywhere in `src/` (e.g., `src/features/myapp/`)
2. Import your main component in `page.tsx` replacing the `DemoComponent` dynamic import
3. Register your tools with `useCopilotAction` and expose state with `useCopilotReadable`
4. The chat sidebar and AI integration work automatically

## What to Keep

- `src/core/` -- providers, chat UI, hooks, agent config
- `src/ui/` -- reusable UI atoms
- `src/app/layout.tsx` -- root layout with ClawUIProvider
- `src/app/api/copilotkit/` -- CopilotKit runtime
