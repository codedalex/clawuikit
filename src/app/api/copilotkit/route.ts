import {
  CopilotRuntime,
  OpenAIAdapter,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";
import { NextRequest } from "next/server";
import {
  getBridgeConfig,
  type BridgeConfig,
} from "@/core/lib/bridge-config";

const config = getBridgeConfig();

function buildAgents(cfg: BridgeConfig) {
  const agents: Record<string, unknown> = {};

  if (cfg.mode === "standalone" || cfg.mode === "hybrid") {
    agents.default = {
      model: `openai/${cfg.model}`,
    };
  }

  if (cfg.mode === "openclaw" || cfg.mode === "hybrid") {
    const headers: Record<string, string> = {};
    if (cfg.openclawToken) {
      headers["Authorization"] = `Bearer ${cfg.openclawToken}`;
    }

    const httpAgent = new HttpAgent({
      url: cfg.openclawUrl,
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    });

    const key = cfg.mode === "openclaw" ? "default" : "clawpilot";
    agents[key] = httpAgent;
  }

  return agents;
}

function buildServiceAdapter(cfg: BridgeConfig) {
  if (cfg.mode === "openclaw") {
    return new ExperimentalEmptyAdapter();
  }
  return new OpenAIAdapter({ model: cfg.model });
}

const runtime = new CopilotRuntime({
  agents: buildAgents(config) as Record<string, any>,
});

const serviceAdapter = buildServiceAdapter(config) as any;

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
