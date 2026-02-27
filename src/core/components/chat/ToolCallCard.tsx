"use client";

import { MentionChip } from "@/ui/MentionChip";
import { Spinner } from "@/ui/Spinner";
import type { AgentId } from "@/core/lib/types";

interface ToolCallCardProps {
  agentId: AgentId;
  toolName: string;
  status: "inProgress" | "executing" | "complete";
  args: Record<string, unknown>;
}

export function ToolCallCard({
  agentId,
  toolName,
  status,
  args,
}: ToolCallCardProps) {
  const borderColor =
    agentId === "clawpilot" ? "border-amber-500/30" : "border-blue-500/30";
  const isActive = status !== "complete";

  const argSummary = Object.entries(args)
    .filter(([, v]) => v !== undefined)
    .map(
      ([k, v]) =>
        `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`,
    )
    .join(", ");

  return (
    <div
      className={`rounded-lg border ${borderColor} bg-foreground/[0.02] p-3 text-sm`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isActive && <Spinner size="sm" />}
          <span className="font-mono text-xs font-medium">{toolName}</span>
        </div>
        <MentionChip agentId={agentId} size="sm" />
      </div>
      {argSummary && (
        <p className="mt-1.5 text-xs text-foreground/50 truncate">
          {argSummary}
        </p>
      )}
    </div>
  );
}
