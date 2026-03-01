"use client";

import { useEffect, useState, useRef } from "react";
import Vapi from "@vapi-ai/web";
import type { KanbanActions, KanbanState } from "./useKanban";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";

export function useVoiceBridge(state: KanbanState, actions: KanbanActions) {
  const [isCalling, setIsCalling] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);
  const actionsRef = useRef(actions);

  // Keep actionsRef up to date
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) {
      console.error("NEXT_PUBLIC_VAPI_PUBLIC_KEY is missing from .env");
      return;
    }

    if (!vapiRef.current) {
      console.log("Creating new Vapi instance...");
      const vapi = new Vapi(VAPI_PUBLIC_KEY);

      // Attach listeners immediately
      vapi.on("call-start", () => {
        console.log("Vapi Call Started");
        setIsCalling(true);
      });
      vapi.on("call-end", () => {
        console.log("Vapi Call Ended");
        setIsCalling(false);
      });
      vapi.on("error", (error) => {
        console.error("Vapi Error Event:", error);
        setIsCalling(false);
      });
      vapi.on("message", (message: any) => {
        console.log("Vapi Message Received:", message.type);
        if (message.type === "tool-call") {
          const { name, parameters } = message.toolCall;
          console.log("Vapi tool call:", name, parameters);

          if (name === "addCard") {
            const { columnId, title, description } = parameters;
            actionsRef.current.addCard(columnId, title, description);
          } else if (name === "moveCard") {
            const { cardId, toColumnId } = parameters;
            actionsRef.current.moveCard(cardId, toColumnId);
          } else if (name === "deleteCard") {
            const { cardId } = parameters;
            actionsRef.current.deleteCard(cardId);
          } else if (name === "executeTask") {
            const { cardId } = parameters;
            // The CopilotKit tool 'executeTask' does the heavy lifting, 
            // but we'll simulate the state change here for immediate Vapi feedback.
            const s = state; 
            const card = s.cards.find(c => c.id === cardId);
            const inProgressCol = s.columns.find(col => col.title.toLowerCase().includes("progress"));
            
            if (card && inProgressCol) {
              actionsRef.current.moveCard(cardId, inProgressCol.id);
              actionsRef.current.updateCard(cardId, { 
                executionStatus: "working",
                executionLogs: ["⚡ Voice execution triggered", "🛠️ Agent starting work..."]
              });
            }
          }
        }
      });

      vapiRef.current = vapi;
    }

    return () => {
      // In a production app, we might want to clean up listeners here,
      // but to keep the ref stable we'll just leave it.
    };
  }, [actions]);

  const toggleCall = () => {
    console.log("Toggle Call Clicked. Current isCalling:", isCalling);

    if (!vapiRef.current) {
      console.error("Vapi instance NOT initialized. Ref is null.");
      return;
    }

    if (isCalling) {
      console.log("Stopping call...");
      vapiRef.current.stop();
    } else {
      const assistantConfig: any = {
        name: "Developer Command Center",
        model: {
          provider: "openai",
          model: "gpt-4o",
          systemPrompt: `You are a developer's second brain. You help manage a Kanban board through voice. 
          The board has columns: ${state.columns.map((c) => `"${c.title}" (id: ${c.id})`).join(", ")}.
          Current cards: ${state.cards.map((c) => `"${c.title}" (id: ${c.id})`).join(", ")}.
          
          You can add, move, or delete cards. 
          NEW CAPABILITY: You can "execute" or "work on" a task. 
          When someone says "Work on task X" or "Execute X", use the executeTask tool. 
          This will move the card to In Progress and start an autonomous agent workflow.`,
        },
        tools: [
          {
            type: "function",
            name: "addCard",
            description: "Add a new card to the Kanban board.",
            parameters: {
              type: "object",
              properties: {
                columnId: {
                  type: "string",
                  description: "The ID of the column.",
                },
                title: {
                  type: "string",
                  description: "The title of the card.",
                },
                description: {
                  type: "string",
                  description: "The description of the card.",
                },
              },
              required: ["columnId", "title"],
            },
          },
          {
            type: "function",
            name: "moveCard",
            description: "Move an existing card to another column.",
            parameters: {
              type: "object",
              properties: {
                cardId: {
                  type: "string",
                  description: "The ID of the card to move.",
                },
                toColumnId: {
                  type: "string",
                  description: "The ID of the target column.",
                },
              },
              required: ["cardId", "toColumnId"],
            },
          },
          {
            type: "function",
            name: "deleteCard",
            description: "Delete a card from the board.",
            parameters: {
              type: "object",
              properties: {
                cardId: {
                  type: "string",
                  description: "The ID of the card to delete.",
                },
              },
              required: ["cardId"],
            },
          },
          {
            type: "function",
            name: "executeTask",
            description: "Start executing or working on a specific task.",
            parameters: {
              type: "object",
              properties: {
                cardId: {
                  type: "string",
                  description: "The ID of the card to work on.",
                },
              },
              required: ["cardId"],
            },
          },
        ],
      };

      console.log("Starting Vapi call with config...");
      try {
        vapiRef.current?.start(assistantConfig);
      } catch (err) {
        console.error("Vapi start failed synchronously:", err);
      }
    }
  };

  return { isCalling, toggleCall };
}
