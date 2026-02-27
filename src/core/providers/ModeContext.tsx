"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BridgeMode } from "@/core/lib/types";

interface ModeState {
  mode: BridgeMode;
  isHybrid: boolean;
  hasLocalAgent: boolean;
  hasOpenClaw: boolean;
}

const ModeContext = createContext<ModeState | null>(null);

function resolveMode(): BridgeMode {
  const raw = process.env.NEXT_PUBLIC_CLAWPILOT_MODE || "standalone";
  if (raw === "openclaw" || raw === "hybrid") return raw;
  return "standalone";
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const mode = resolveMode();

  const value: ModeState = {
    mode,
    isHybrid: mode === "hybrid",
    hasLocalAgent: mode === "standalone" || mode === "hybrid",
    hasOpenClaw: mode === "openclaw" || mode === "hybrid",
  };

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode(): ModeState {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return ctx;
}
