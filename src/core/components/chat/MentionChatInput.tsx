"use client";

import {
  useCallback,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useMention } from "@/core/providers/MentionContext";
import { useAttribution } from "@/core/providers/AgentAttributionContext";
import { useMode } from "@/core/providers/ModeContext";
import { parseMention, hasMentionPrefix } from "@/core/lib/mention-parser";
import { MentionChipBar } from "./MentionChipBar";
import { MentionDropdown } from "./MentionDropdown";
import type { AgentId } from "@/core/lib/types";

interface MentionChatInputProps {
  inProgress: boolean;
  onSend: (text: string) => void | Promise<unknown>;
  isVisible?: boolean;
  onStop?: () => void;
  chatReady?: boolean;
}

export function MentionChatInput({
  inProgress,
  onSend,
}: MentionChatInputProps) {
  const { selectedAgent, setSelectedAgent } = useMention();
  const { setLastActiveAgent } = useAttribution();
  const { isHybrid, mode } = useMode();
  const [value, setValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownQuery, setDropdownQuery] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (text: string) => {
      setValue(text);

      if (isHybrid && hasMentionPrefix(text) && !text.includes(" ")) {
        setShowDropdown(true);
        setDropdownQuery(text);
      } else {
        setShowDropdown(false);
      }

      if (isHybrid) {
        const parsed = parseMention(text);
        if (parsed.hasExplicitMention && parsed.agentId !== selectedAgent) {
          setSelectedAgent(parsed.agentId);
        }
      }
    },
    [isHybrid, selectedAgent, setSelectedAgent],
  );

  const handleSelectFromDropdown = useCallback(
    (agentId: AgentId) => {
      setSelectedAgent(agentId);
      setShowDropdown(false);
      const label = agentId === "clawpilot" ? "@clawpilot " : "@copilot ";
      setValue(label);
      inputRef.current?.focus();
    },
    [setSelectedAgent],
  );

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      if (!value.trim() || inProgress) return;

      if (isHybrid) {
        const parsed = parseMention(value);
        const agent = parsed.hasExplicitMention
          ? parsed.agentId
          : selectedAgent;

        if (agent !== selectedAgent) {
          setSelectedAgent(agent);
        }

        setLastActiveAgent(agent);

        const body = parsed.hasExplicitMention
          ? parsed.cleanText
          : value.trim();
        const prefix = agent === "clawpilot" ? "@clawpilot" : "@copilot";
        const textToSend = `${prefix} ${body}`;

        setValue("");
        setShowDropdown(false);
        onSend(textToSend);
      } else {
        setLastActiveAgent(
          mode === "openclaw" ? "clawpilot" : "default",
        );
        const text = value.trim();
        setValue("");
        onSend(text);
      }
    },
    [
      value,
      inProgress,
      onSend,
      isHybrid,
      mode,
      selectedAgent,
      setSelectedAgent,
      setLastActiveAgent,
    ],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const placeholderLabel =
    mode === "openclaw"
      ? "ClawPilot"
      : isHybrid
        ? selectedAgent === "clawpilot"
          ? "@clawpilot"
          : "@copilot"
        : "Copilot";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-t border-foreground/10 p-3"
    >
      {isHybrid && (
        <MentionChipBar selected={selectedAgent} onSelect={setSelectedAgent} />
      )}
      <div className="relative flex items-end gap-2">
        {isHybrid && (
          <MentionDropdown
            query={dropdownQuery}
            onSelect={handleSelectFromDropdown}
            visible={showDropdown}
          />
        )}
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${placeholderLabel}...`}
          disabled={inProgress}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!value.trim() || inProgress}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background transition-colors hover:bg-foreground/90 disabled:opacity-30"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
