"use client";

import type { AgentConfig, AgentId } from "./types";

export const AGENTS: Record<string, AgentConfig> = {
  copilot: { id: "default", label: "Copilot", color: "blue" },
  clawpilot: { id: "clawpilot", label: "ClawPilot", color: "amber" },
} as const;

export function getAgentConfig(agentId: AgentId): AgentConfig {
  return agentId === "clawpilot" ? AGENTS.clawpilot : AGENTS.copilot;
}
