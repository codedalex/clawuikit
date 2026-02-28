# ClawUI Starter Kit v2

A starter kit for building AI-powered applications with [CopilotKit](https://copilotkit.ai) and optional [OpenClaw](https://openclaw.ai) integration.

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your OpenAI API key

# 3. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll see a kanban board demo with a chat sidebar.

## Modes

ClawUI supports three modes, controlled by `CLAWPILOT_MODE` in your `.env`:

| Mode | What it does |
|------|-------------|
| `standalone` | CopilotKit + your LLM only (default) |
| `openclaw` | OpenClaw controls the app via clawg-ui |
| `hybrid` | Both agents -- `@copilot` for your LLM, `@clawpilot` for OpenClaw |

### Standalone (default)

```env
CLAWPILOT_MODE=standalone
NEXT_PUBLIC_CLAWPILOT_MODE=standalone
OPENAI_API_KEY=sk-...
```

### OpenClaw

```env
CLAWPILOT_MODE=openclaw
NEXT_PUBLIC_CLAWPILOT_MODE=openclaw
OPENCLAW_AGENT_URL=http://localhost:18789/v1/clawg-ui
OPENCLAW_AGENT_TOKEN=your-token
```

Requires the clawg-ui plugin on your OpenClaw gateway. See `clawgui/SETUP.md`.

Having auth issues (401/403) with `@clawpilot`? Follow the first-time pairing guide: [`pairing-clawg-ui.md`](./pairing-clawg-ui.md).

### Hybrid

```env
CLAWPILOT_MODE=hybrid
NEXT_PUBLIC_CLAWPILOT_MODE=hybrid
OPENAI_API_KEY=sk-...
OPENCLAW_AGENT_URL=http://localhost:18789/v1/clawg-ui
OPENCLAW_AGENT_TOKEN=your-token
```

## Project Structure

```
src/
├── app/           Next.js pages and API routes
├── core/          ClawUI framework (keep this)
│   ├── providers/ Context providers (mode, mention, attribution)
│   ├── components/
│   │   ├── chat/  Chat sidebar and input components
│   │   └── layout/ SplitLayout, WelcomePage
│   ├── hooks/     Shared hooks
│   └── lib/       Agent config, bridge config, types
├── ui/            Base UI atoms (keep this)
└── demo/          Kanban demo (delete to start fresh)
```

## Building Your Own App

1. **Delete the demo**: `rm -rf src/demo/ src/app/api/kanban/`
2. **Create your UI** anywhere in `src/`
3. **Register tools** with `useCopilotAction`
4. **Expose state** with `useCopilotReadable`
5. **Import your component** in `src/app/page.tsx`

See `docs/engineering/2_REMOVING_DEMO.md` for detailed instructions.

## Adding AI Tools

```tsx
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

// Expose state to the AI
useCopilotReadable({
  description: "Current items in the shopping cart",
  value: cartItems,
});

// Register a tool the AI can call
useCopilotAction({
  name: "addToCart",
  description: "Add a product to the shopping cart",
  parameters: [
    { name: "productId", type: "string", description: "Product ID" },
    { name: "quantity", type: "number", description: "Quantity" },
  ],
  handler: async ({ productId, quantity }) => {
    addItem(productId, quantity);
    return `Added ${quantity}x ${productId} to cart`;
  },
});
```

Both agents (in hybrid mode) automatically see your tools and state.

## Documentation

- `docs/product/` -- Product profile and goals
- `docs/engineering/` -- Architecture, modes guide, demo removal
- `docs/ai/` -- Agent configuration reference
