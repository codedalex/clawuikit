"use client";

import { AssistantMessage as CopilotAssistantMessage } from "@copilotkit/react-ui";
import type { AssistantMessageProps } from "@copilotkit/react-ui";
import { MentionChip } from "@/ui/MentionChip";
import { useAttribution } from "@/core/providers/AgentAttributionContext";
import { useMode } from "@/core/providers/ModeContext";

export function AssistantMessageWithAttribution(
  props: AssistantMessageProps,
) {
  const { lastActiveAgent } = useAttribution();
  const { isHybrid } = useMode();

  return (
    <div className="flex flex-col gap-1">
      {isHybrid && (
        <MentionChip
          agentId={lastActiveAgent}
          size="sm"
          className="self-start"
        />
      )}
      <CopilotAssistantMessage {...props} />
    </div>
  );
}
