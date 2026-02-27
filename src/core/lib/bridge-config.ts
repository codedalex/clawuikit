import type { BridgeMode } from "./types";

export interface StandaloneConfig {
  mode: "standalone";
  model: string;
}

export interface OpenClawConfig {
  mode: "openclaw";
  openclawUrl: string;
  openclawToken?: string;
}

export interface HybridConfig {
  mode: "hybrid";
  model: string;
  openclawUrl: string;
  openclawToken?: string;
}

export type BridgeConfig = StandaloneConfig | OpenClawConfig | HybridConfig;

export function getBridgeConfig(): BridgeConfig {
  const mode = (process.env.CLAWPILOT_MODE || "standalone") as BridgeMode;

  if (mode === "hybrid") {
    const openclawUrl = process.env.OPENCLAW_AGENT_URL;
    if (!openclawUrl) {
      throw new Error(
        "[bridge] CLAWPILOT_MODE=hybrid requires OPENCLAW_AGENT_URL to be set",
      );
    }
    return {
      mode: "hybrid",
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      openclawUrl,
      openclawToken: process.env.OPENCLAW_AGENT_TOKEN,
    };
  }

  if (mode === "openclaw") {
    const openclawUrl = process.env.OPENCLAW_AGENT_URL;
    if (!openclawUrl) {
      throw new Error(
        "[bridge] CLAWPILOT_MODE=openclaw requires OPENCLAW_AGENT_URL to be set",
      );
    }
    return {
      mode: "openclaw",
      openclawUrl,
      openclawToken: process.env.OPENCLAW_AGENT_TOKEN,
    };
  }

  return {
    mode: "standalone",
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
  };
}
