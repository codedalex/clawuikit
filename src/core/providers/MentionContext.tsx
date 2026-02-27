"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { AgentId } from "@/core/lib/types";

interface MentionState {
  selectedAgent: AgentId;
  setSelectedAgent: (agent: AgentId) => void;
  resetToDefault: () => void;
}

const MentionContext = createContext<MentionState | null>(null);

export function MentionContextProvider({ children }: { children: ReactNode }) {
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("default");

  const resetToDefault = useCallback(() => setSelectedAgent("default"), []);

  return (
    <MentionContext.Provider
      value={{ selectedAgent, setSelectedAgent, resetToDefault }}
    >
      {children}
    </MentionContext.Provider>
  );
}

export function useMention(): MentionState {
  const ctx = useContext(MentionContext);
  if (!ctx) {
    throw new Error("useMention must be used within a MentionContextProvider");
  }
  return ctx;
}
