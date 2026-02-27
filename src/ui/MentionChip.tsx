"use client";

import type { AgentId } from "@/core/lib/types";
import { getAgentConfig } from "@/core/lib/agents";

interface MentionChipProps {
  agentId: AgentId;
  size?: "sm" | "md";
  interactive?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const colorStyles: Record<string, { base: string; selected: string; hover: string }> = {
  blue: {
    base: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    selected: "bg-blue-500/25 border-blue-500/50 ring-1 ring-blue-500/30",
    hover: "hover:bg-blue-500/20",
  },
  amber: {
    base: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    selected: "bg-amber-500/25 border-amber-500/50 ring-1 ring-amber-500/30",
    hover: "hover:bg-amber-500/20",
  },
};

export function MentionChip({
  agentId,
  size = "sm",
  interactive = false,
  selected = false,
  onClick,
  className = "",
}: MentionChipProps) {
  const config = getAgentConfig(agentId);
  const styles = colorStyles[config.color] ?? colorStyles.blue;
  const sizeClass =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";

  const Tag = interactive ? "button" : "span";

  return (
    <Tag
      onClick={interactive ? onClick : undefined}
      className={`inline-flex items-center gap-1 rounded-full border font-medium transition-colors ${
        styles.base
      } ${selected ? styles.selected : ""} ${
        interactive ? `cursor-pointer ${styles.hover}` : ""
      } ${sizeClass} ${className}`}
    >
      <span className="opacity-60">@</span>
      {config.label.toLowerCase()}
    </Tag>
  );
}
