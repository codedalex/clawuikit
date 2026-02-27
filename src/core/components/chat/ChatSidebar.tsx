"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { ErrorBoundary } from "@/ui/ErrorBoundary";
import { useSelectedAgentReadable } from "@/core/hooks/useSelectedAgentReadable";
import { useMode } from "@/core/providers/ModeContext";
import { MentionChatInput } from "./MentionChatInput";
import { AssistantMessageWithAttribution } from "./AssistantMessage";
import { UserMessageWithAttribution } from "./UserMessage";

export function ChatSidebar() {
  useSelectedAgentReadable();
  const { mode, isHybrid } = useMode();

  const label =
    mode === "openclaw"
      ? "ClawPilot"
      : mode === "hybrid"
        ? "Copilot / ClawPilot"
        : "Copilot";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-foreground/10 px-4 py-3">
        <h2 className="text-sm font-semibold">Chat</h2>
        <p className="text-[11px] text-foreground/40 mt-0.5">
          {isHybrid ? (
            <>
              Tag{" "}
              <span className="text-blue-500">@copilot</span> or{" "}
              <span className="text-amber-500">@clawpilot</span>
            </>
          ) : (
            <>Powered by {label}</>
          )}
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <CopilotChat
            Input={MentionChatInput}
            AssistantMessage={AssistantMessageWithAttribution}
            UserMessage={UserMessageWithAttribution}
            labels={{ initial: "How can I help?" }}
            className="h-full"
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
