"use client";

import { MentionChip } from "@/ui/MentionChip";
import type { AgentId } from "@/core/lib/types";
import { AGENTS } from "@/core/lib/agents";

interface MentionChipBarProps {
  selected: AgentId;
  onSelect: (agent: AgentId) => void;
}

export function MentionChipBar({ selected, onSelect }: MentionChipBarProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-foreground/40 mr-0.5">Send to:</span>
      {Object.values(AGENTS).map((agent) => (
        <MentionChip
          key={agent.id}
          agentId={agent.id}
          interactive
          selected={selected === agent.id}
          onClick={() => onSelect(agent.id)}
          size="sm"
        />
      ))}
    </div>
  );
}
