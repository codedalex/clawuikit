"use client";

import { useEffect, useRef } from "react";
import type { KanbanActions, KanbanState } from "./useKanban";

export function useKanbanAutomations(
  state: KanbanState,
  actions: KanbanActions,
) {
  const prevCardsRef = useRef(state.cards);
  const simulatingCardsRef = useRef<Set<string>>(new Set());

  // 1. Detect New Cards for "Auto-Triage" and "Smart Breakdown"
  useEffect(() => {
    const prevCards = prevCardsRef.current;
    const currentCards = state.cards;

    if (currentCards.length > prevCards.length) {
      const newCards = currentCards.filter(
        (c) => !prevCards.some((pc) => pc.id === c.id),
      );

      newCards.forEach((newCard) => {
        console.log("Automation Triggered: New Card Detected", newCard.title);

        // --- SMART BREAKDOWN (+) ---
        if (newCard.title.endsWith("+")) {
          const baseTitle = newCard.title.slice(0, -1).trim();
          actions.updateCard(newCard.id, { title: baseTitle });

          const subtasks = [
            `Setup ${baseTitle} environment`,
            `Implement core ${baseTitle} logic`,
            `Verify ${baseTitle} implementation`,
          ];

          subtasks.forEach((task, index) => {
            setTimeout(
              () => {
                actions.addCard(
                  newCard.columnId,
                  `↳ ${task}`,
                  `Automated sub-task for ${baseTitle}`,
                );
              },
              (index + 1) * 800,
            );
          });
        }
        // --- AUTO-TRIAGE ---
        else if (!newCard.title.startsWith("[")) {
          const title = newCard.title.toLowerCase();
          let tag = "[TASK]";
          if (title.includes("fix") || title.includes("bug")) tag = "[FIX]";
          else if (title.includes("feat") || title.includes("add"))
            tag = "[FEATURE]";
          else if (title.includes("research") || title.includes("study"))
            tag = "[RESEARCH]";

          actions.updateCard(newCard.id, { title: `${tag} ${newCard.title}` });
        }
      });
    }

    prevCardsRef.current = currentCards;
  }, [state.cards, actions]);

  // 2. Simulate AI Execution Logic (Working -> Done/Error)
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    state.cards.forEach((card) => {
      const isWorking = card.executionStatus === "working";
      const hasRoomForLogs =
        !card.executionLogs || card.executionLogs.length < 5;
      const isAlreadySimulating = simulatingCardsRef.current.has(card.id);

      if (isWorking && hasRoomForLogs && !isAlreadySimulating) {
        simulatingCardsRef.current.add(card.id);

        const simulationSteps = [
          "🔨 Initializing agent environment...",
          "📂 Accessing codebase context...",
          "🧠 Generating implementation plan...",
          "📝 Writing code changes...",
          "✅ Execution complete. Awaiting verification.",
        ];

        const currentLogCount = card.executionLogs?.length || 0;
        if (currentLogCount < simulationSteps.length) {
          const timeout = setTimeout(() => {
            const nextLog = simulationSteps[currentLogCount];
            const isLast = currentLogCount === simulationSteps.length - 1;

            actions.updateCard(card.id, {
              executionLogs: [nextLog],
              executionStatus: isLast ? "done" : "working",
            });

            // Allow next step to trigger in next effect run
            simulatingCardsRef.current.delete(card.id);
          }, 2000);
          timeouts.push(timeout);
        }

        // Simulating an error for HITL
        if (
          currentLogCount === 2 &&
          card.title.toLowerCase().includes("complex")
        ) {
          const errorTimeout = setTimeout(() => {
            actions.updateCard(card.id, {
              executionStatus: "error",
              executionLogs: [
                "❌ Error: Ambiguous requirement detected.",
                "✋ Pausing for Admin correction...",
              ],
            });
            simulatingCardsRef.current.delete(card.id);
          }, 1000);
          timeouts.push(errorTimeout);
        }
      }
    });

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
      // Note: We don't clear simulatingCardsRef here because the effect
      // might re-run before the timeout fires. The timeout callback
      // handles the deletion.
    };
  }, [state.cards, actions]);

  // 3. Detect Movements
  useEffect(() => {
    // We already have state.cards changes handled.
    // This is just for console logging.
  }, [state.cards, state.columns]);
}
