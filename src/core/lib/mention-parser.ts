import type { ParsedMention } from "./types";

const MENTION_REGEX = /^@(copilot|clawpilot)\s*/i;
const INLINE_MENTION_REGEX = /@(copilot|clawpilot)/gi;

export function parseMention(text: string): ParsedMention {
  const match = text.match(MENTION_REGEX);

  if (match) {
    const mentionLabel = match[1].toLowerCase();
    const agentId =
      mentionLabel === "clawpilot"
        ? ("clawpilot" as const)
        : ("default" as const);
    return {
      agentId,
      cleanText: text.slice(match[0].length).trim(),
      mentionLabel: `@${mentionLabel}`,
      hasExplicitMention: true,
    };
  }

  const inlineMatch = text.match(INLINE_MENTION_REGEX);
  if (inlineMatch) {
    const mentionLabel = inlineMatch[0].slice(1).toLowerCase();
    const agentId =
      mentionLabel === "clawpilot"
        ? ("clawpilot" as const)
        : ("default" as const);
    return {
      agentId,
      cleanText: text.replace(INLINE_MENTION_REGEX, "").trim(),
      mentionLabel: `@${mentionLabel}`,
      hasExplicitMention: true,
    };
  }

  return {
    agentId: "default",
    cleanText: text.trim(),
    mentionLabel: "@copilot",
    hasExplicitMention: false,
  };
}

export function hasMentionPrefix(text: string): boolean {
  return text.startsWith("@");
}

export function getMentionSuggestions(
  query: string,
): Array<{ id: string; label: string }> {
  const q = query.toLowerCase().replace("@", "");
  const options = [
    { id: "default", label: "@copilot" },
    { id: "clawpilot", label: "@clawpilot" },
  ];
  if (!q) return options;
  return options.filter((o) => o.label.toLowerCase().includes(q));
}
