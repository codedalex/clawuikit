export type BridgeMode = "standalone" | "openclaw" | "hybrid";

export type AgentId = "default" | "clawpilot";

export interface AgentConfig {
  id: AgentId;
  label: string;
  color: string;
}

export interface ParsedMention {
  agentId: AgentId;
  cleanText: string;
  mentionLabel: string;
  hasExplicitMention: boolean;
}
