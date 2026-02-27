"use client";

import { getMentionSuggestions } from "@/core/lib/mention-parser";
import type { AgentId } from "@/core/lib/types";

interface MentionDropdownProps {
  query: string;
  onSelect: (agentId: AgentId) => void;
  visible: boolean;
}

export function MentionDropdown({
  query,
  onSelect,
  visible,
}: MentionDropdownProps) {
  if (!visible) return null;

  const suggestions = getMentionSuggestions(query);
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-1 w-48 rounded-lg border border-foreground/10 bg-background shadow-lg overflow-hidden z-50">
      {suggestions.map((s) => (
        <button
          key={s.id}
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-foreground/5 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(s.id as AgentId);
          }}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              s.id === "clawpilot" ? "bg-amber-500" : "bg-blue-500"
            }`}
          />
          {s.label}
        </button>
      ))}
    </div>
  );
}
