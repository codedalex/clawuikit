"use client";

import { type ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { ModeProvider } from "./ModeContext";
import { MentionContextProvider } from "./MentionContext";
import { AgentAttributionProvider } from "./AgentAttributionContext";

interface ClawUIProviderProps {
  children: ReactNode;
}

export function ClawUIProvider({ children }: ClawUIProviderProps) {
  return (
    <ModeProvider>
      <MentionContextProvider>
        <CopilotKit runtimeUrl="/api/copilotkit">
          <AgentAttributionProvider>{children}</AgentAttributionProvider>
        </CopilotKit>
      </MentionContextProvider>
    </ModeProvider>
  );
}
