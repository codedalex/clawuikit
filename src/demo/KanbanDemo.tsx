"use client";

import { useKanban } from "./hooks/useKanban";
import { useKanbanTools } from "./hooks/useKanbanTools";
import { useKanbanReadable } from "./hooks/useKanbanReadable";
import { KanbanBoard } from "./components/organisms/KanbanBoard";
import { useVoiceBridge } from "./hooks/useVoiceBridge";
import { useKanbanAutomations } from "./hooks/useKanbanAutomations";
import { useCodebaseIndex } from "./hooks/useCodebaseIndex";
import { LocalVoiceAssistant } from "@/core/components/LocalVoiceAssistant";

export default function KanbanDemo() {
  const { state, actions, highlightedCardId, loading } = useKanban();
  const voice = useVoiceBridge(state, actions);
  const index = useCodebaseIndex();

  useKanbanAutomations(state, actions);
  useKanbanTools(actions, state);
  useKanbanReadable(state);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/60" />
      </div>
    );
  }

  return (
    <>
      <KanbanBoard
        state={state}
        actions={actions}
        highlightedCardId={highlightedCardId}
        index={index}
      />
      <LocalVoiceAssistant voice={voice} />
    </>
  );
}
