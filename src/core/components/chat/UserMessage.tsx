"use client";

import { UserMessage as CopilotUserMessage } from "@copilotkit/react-ui";
import type { UserMessageProps } from "@copilotkit/react-ui";
import { MentionChip } from "@/ui/MentionChip";
import { useMode } from "@/core/providers/ModeContext";
import type { AgentId } from "@/core/lib/types";

const AGENT_PREFIX = /^@(copilot|clawpilot)\s*/i;

function parseAgentFromContent(content: string): {
  agentId: AgentId;
  cleanContent: string;
} {
  const match = content.match(AGENT_PREFIX);
  if (match) {
    const label = match[1].toLowerCase();
    return {
      agentId: label === "clawpilot" ? "clawpilot" : "default",
      cleanContent: content.slice(match[0].length),
    };
  }
  return { agentId: "default", cleanContent: content };
}

export function UserMessageWithAttribution(props: UserMessageProps) {
  const { isHybrid } = useMode();

  const rawContent =
    typeof props.message?.content === "string" ? props.message.content : "";

  const { agentId, cleanContent } = isHybrid
    ? parseAgentFromContent(rawContent)
    : { agentId: "default" as AgentId, cleanContent: rawContent };

  const patchedMessage = props.message
    ? { ...props.message, content: cleanContent }
    : props.message;

  return (
    <div className="flex flex-col items-end gap-1">
      {isHybrid && (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-foreground/40">Send to</span>
          <MentionChip agentId={agentId} size="sm" />
        </div>
      )}
      <CopilotUserMessage {...props} message={patchedMessage} />
    </div>
  );
}
