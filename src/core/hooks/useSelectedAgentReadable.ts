"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useMention } from "@/core/providers/MentionContext";

/**
 * Exposes the currently-selected agent to the CopilotKit runtime via
 * `useCopilotReadable`. The runtime uses this to route requests to the
 * correct agent (default BuiltInAgent or clawpilot HttpAgent).
 */
export function useSelectedAgentReadable() {
  const { selectedAgent } = useMention();

  useCopilotReadable({
    description: "Selected agent for routing: 'default' or 'clawpilot'",
    value: selectedAgent,
  });
}
