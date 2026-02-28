"use client";

import { useEffect, useState, useRef } from "react";
import Vapi from "@vapi-ai/web";
import type { KanbanActions, KanbanState } from "./useKanban";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";

export function useVoiceBridge(state: KanbanState, actions: KanbanActions) {
  const [isCalling, setIsCalling] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) {
      console.error("NEXT_PUBLIC_VAPI_PUBLIC_KEY is missing from .env");
      return;
    }
    vapiRef.current = new Vapi(VAPI_PUBLIC_KEY);

    const vapi = vapiRef.current;

    vapi.on("call-start", () => setIsCalling(true));
    vapi.on("call-end", () => setIsCalling(false));
    vapi.on("error", (error) => {
      console.error("Vapi Error:", error);
      setIsCalling(false);
    });

    vapi.on("message", (message: any) => {
      if (message.type === "tool-call") {
        const { name, parameters } = message.toolCall;
        console.log("Vapi tool call:", name, parameters);

        if (name === "addCard") {
          const { columnId, title, description } = parameters;
          actions.addCard(columnId, title, description);
        } else if (name === "moveCard") {
          const { cardId, toColumnId } = parameters;
          actions.moveCard(cardId, toColumnId);
        } else if (name === "deleteCard") {
          const { cardId } = parameters;
          actions.deleteCard(cardId);
        }
      }
    });

    return () => {
      vapi.removeAllListeners();
    };
  }, [actions]);

  const toggleCall = () => {
    if (isCalling) {
      vapiRef.current?.stop();
    } else {
      const assistantConfig: any = {
        name: "Developer Command Center",
        model: {
          provider: "openai",
          model: "gpt-4o",
          systemPrompt: `You are a developer's second brain. You help manage a Kanban board through voice. 
          The board has columns: ${state.columns.map((c) => `"${c.title}" (id: ${c.id})`).join(", ")}.
          Current cards: ${state.cards.map((c) => `"${c.title}" (id: ${c.id})`).join(", ")}.
          
          You can add, move, or delete cards. Always confirm the action once done.`,
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
        ],
      };

      vapiRef.current?.start(assistantConfig);
    }
  };

  return { isCalling, toggleCall };
}
