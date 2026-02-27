"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AgentId } from "@/core/lib/types";

interface AttributionState {
  getAgentForMessage: (messageId: string) => AgentId;
  setAttribute: (messageId: string, agentId: AgentId) => void;
  lastActiveAgent: AgentId;
  setLastActiveAgent: (agentId: AgentId) => void;
}

const AgentAttributionContext = createContext<AttributionState | null>(null);

export function AgentAttributionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const mapRef = useRef<Map<string, AgentId>>(new Map());
  const [lastActiveAgent, setLastActiveAgent] = useState<AgentId>("default");
  const [, forceUpdate] = useState(0);

  const setAttribute = useCallback(
    (messageId: string, agentId: AgentId) => {
      mapRef.current.set(messageId, agentId);
      forceUpdate((n) => n + 1);
    },
    [],
  );

  const getAgentForMessage = useCallback((messageId: string): AgentId => {
    return mapRef.current.get(messageId) ?? "default";
  }, []);

  return (
    <AgentAttributionContext.Provider
      value={{
        getAgentForMessage,
        setAttribute,
        lastActiveAgent,
        setLastActiveAgent,
      }}
    >
      {children}
    </AgentAttributionContext.Provider>
  );
}

export function useAttribution(): AttributionState {
  const ctx = useContext(AgentAttributionContext);
  if (!ctx) {
    throw new Error(
      "useAttribution must be used within an AgentAttributionProvider",
    );
  }
  return ctx;
}
