# ClawUI v2 -- AI Profile

## Agent Configuration

### Copilot (default agent)

- **ID**: `default`
- **Label**: Copilot
- **Color**: Blue
- **Mention**: `@copilot`
- **Backend**: `BuiltInAgent` with your configured LLM (OpenAI, etc.)
- **Available in**: standalone, hybrid modes

### ClawPilot (OpenClaw agent)

- **ID**: `clawpilot`
- **Label**: ClawPilot
- **Color**: Amber
- **Mention**: `@clawpilot`
- **Backend**: `HttpAgent` via AG-UI protocol to OpenClaw clawg-ui endpoint
- **Available in**: openclaw, hybrid modes

## Tool Registration

Tools are registered client-side via `useCopilotAction`. CopilotKit automatically forwards all registered tools to whichever agent handles the request via `RunAgentInput.tools`.

```typescript
useCopilotAction({
  name: "myTool",
  description: "What this tool does",
  parameters: [
    { name: "param1", type: "string", description: "..." },
  ],
  handler: async ({ param1 }) => {
    // Execute the tool
    return "Result message";
  },
});
```

## State Exposure

Application state is exposed to agents via `useCopilotReadable`:

```typescript
useCopilotReadable({
  description: "Current application state including...",
  value: myState,
});
```

Both agents see the same tools and state. The description field guides the LLM's understanding of what's available.

## Agent Routing (Hybrid Mode)

1. User types `@copilot` or `@clawpilot` in chat
2. `MentionChatInput` parses the mention and sets `selectedAgent`
3. `useSelectedAgentReadable` exposes the selection via `useCopilotReadable`
4. CopilotKit runtime routes to the correct registered agent
5. Response streams back through the unified CopilotKit client
