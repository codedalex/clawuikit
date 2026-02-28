"use client";

import { createElement, useRef } from "react";
import { useCopilotAction } from "@copilotkit/react-core";
import { ToolCallCard } from "@/core/components/chat/ToolCallCard";
import { useAttribution } from "@/core/providers/AgentAttributionContext";
import type { KanbanActions, KanbanState } from "./useKanban";

export function useKanbanTools(actions: KanbanActions, state: KanbanState) {
  const { lastActiveAgent } = useAttribution();

  const stateRef = useRef(state);
  stateRef.current = state;
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const columnSummary = () =>
    stateRef.current.columns
      .map((c) => `${c.title} (id: ${c.id})`)
      .join(", ");

  const cardSummary = () =>
    stateRef.current.cards
      .map((c) => `"${c.title}" (id: ${c.id}, in: ${c.columnId})`)
      .join(", ");

  useCopilotAction(
    {
      name: "getBoard",
      description:
        "Get the current kanban board state including all columns and cards with their IDs. " +
        "Always call this first when you need to look up card or column IDs.",
      parameters: [],
      handler: async () => {
        const s = stateRef.current;
        return {
          columns: s.columns.map((c) => ({
            id: c.id,
            title: c.title,
            order: c.order,
          })),
          cards: s.cards.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            columnId: c.columnId,
            order: c.order,
          })),
        };
      },
    },
    [state.columns.length, state.cards.length],
  );

  useCopilotAction(
    {
      name: "addCard",
      description:
        "Add a new card to a kanban column. Available columns: " +
        columnSummary(),
      parameters: [
        {
          name: "columnId",
          type: "string",
          description: "Target column ID",
        },
        { name: "title", type: "string", description: "Card title" },
        {
          name: "description",
          type: "string",
          description: "Card description (optional)",
          required: false,
        },
      ],
      handler: async ({ columnId, title, description }) => {
        const s = stateRef.current;
        const col = s.columns.find((c) => c.id === columnId);
        if (!col)
          return `Error: column "${columnId}" not found. Available: ${columnSummary()}`;
        const id = actionsRef.current.addCard(
          columnId,
          title,
          description ?? "",
        );
        return `Created card "${title}" (id: ${id}) in column "${col.title}"`;
      },
      render: (props: { status: string; args: Record<string, unknown> }) =>
        createElement(ToolCallCard, {
          agentId: lastActiveAgent,
          toolName: "addCard",
          status: props.status as "inProgress" | "executing" | "complete",
          args: props.args,
        }),
    },
    [state.columns.length, state.cards.length],
  );

  useCopilotAction(
    {
      name: "moveCard",
      description:
        "Move a card to a different column. Available columns: " +
        columnSummary() +
        ". Current cards: " +
        cardSummary(),
      parameters: [
        {
          name: "cardId",
          type: "string",
          description: "Card ID to move",
        },
        {
          name: "toColumnId",
          type: "string",
          description: "Target column ID",
        },
      ],
      handler: async ({ cardId, toColumnId }) => {
        const s = stateRef.current;
        const card = s.cards.find((c) => c.id === cardId);
        const col = s.columns.find((c) => c.id === toColumnId);
        if (!card)
          return `Error: card "${cardId}" not found. Current cards: ${cardSummary()}`;
        if (!col)
          return `Error: column "${toColumnId}" not found. Available: ${columnSummary()}`;
        actionsRef.current.moveCard(cardId, toColumnId);
        return `Moved "${card.title}" to "${col.title}"`;
      },
      render: (props: { status: string; args: Record<string, unknown> }) =>
        createElement(ToolCallCard, {
          agentId: lastActiveAgent,
          toolName: "moveCard",
          status: props.status as "inProgress" | "executing" | "complete",
          args: props.args,
        }),
    },
    [state.columns.length, state.cards.length],
  );

  useCopilotAction(
    {
      name: "updateCard",
      description:
        "Update a card's title or description. Current cards: " +
        cardSummary(),
      parameters: [
        {
          name: "cardId",
          type: "string",
          description: "Card ID to update",
        },
        {
          name: "title",
          type: "string",
          description: "New title (optional)",
          required: false,
        },
        {
          name: "description",
          type: "string",
          description: "New description (optional)",
          required: false,
        },
      ],
      handler: async ({ cardId, title, description }) => {
        const s = stateRef.current;
        const card = s.cards.find((c) => c.id === cardId);
        if (!card)
          return `Error: card "${cardId}" not found. Current cards: ${cardSummary()}`;
        const patch: Record<string, string> = {};
        if (title) patch.title = title;
        if (description) patch.description = description;
        actionsRef.current.updateCard(cardId, patch);
        return `Updated card "${card.title}" (${Object.keys(patch).join(", ")} changed)`;
      },
      render: (props: { status: string; args: Record<string, unknown> }) =>
        createElement(ToolCallCard, {
          agentId: lastActiveAgent,
          toolName: "updateCard",
          status: props.status as "inProgress" | "executing" | "complete",
          args: props.args,
        }),
    },
    [state.cards.length],
  );

  useCopilotAction(
    {
      name: "deleteCard",
      description:
        "Delete a card from the board. Current cards: " + cardSummary(),
      parameters: [
        {
          name: "cardId",
          type: "string",
          description: "Card ID to delete",
        },
      ],
      handler: async ({ cardId }) => {
        const s = stateRef.current;
        const card = s.cards.find((c) => c.id === cardId);
        if (!card)
          return `Error: card "${cardId}" not found. Current cards: ${cardSummary()}`;
        actionsRef.current.deleteCard(cardId);
        return `Deleted card "${card.title}"`;
      },
      render: (props: { status: string; args: Record<string, unknown> }) =>
        createElement(ToolCallCard, {
          agentId: lastActiveAgent,
          toolName: "deleteCard",
          status: props.status as "inProgress" | "executing" | "complete",
          args: props.args,
        }),
    },
    [state.cards.length],
  );

  useCopilotAction(
    {
      name: "addColumn",
      description:
        "Add a new column to the kanban board. Existing columns: " +
        columnSummary(),
      parameters: [
        { name: "title", type: "string", description: "Column title" },
      ],
      handler: async ({ title }) => {
        const id = actionsRef.current.addColumn(title);
        return `Created column "${title}" (id: ${id})`;
      },
      render: (props: { status: string; args: Record<string, unknown> }) =>
        createElement(ToolCallCard, {
          agentId: lastActiveAgent,
          toolName: "addColumn",
          status: props.status as "inProgress" | "executing" | "complete",
          args: props.args,
        }),
    },
    [state.columns.length],
  );

  useCopilotAction(
    {
      name: "renameColumn",
      description:
        "Rename a column on the board. Available columns: " + columnSummary(),
      parameters: [
        {
          name: "columnId",
          type: "string",
          description: "Column ID",
        },
        { name: "title", type: "string", description: "New title" },
      ],
      handler: async ({ columnId, title }) => {
        const s = stateRef.current;
        const col = s.columns.find((c) => c.id === columnId);
        if (!col)
          return `Error: column "${columnId}" not found. Available: ${columnSummary()}`;
        actionsRef.current.renameColumn(columnId, title);
        return `Renamed column from "${col.title}" to "${title}"`;
      },
    },
    [state.columns.length],
  );

  useCopilotAction(
    {
      name: "deleteColumn",
      description:
        "Delete a column and all its cards from the board. Available columns: " +
        columnSummary(),
      parameters: [
        {
          name: "columnId",
          type: "string",
          description: "Column ID to delete",
        },
      ],
      handler: async ({ columnId }) => {
        const s = stateRef.current;
        const col = s.columns.find((c) => c.id === columnId);
        if (!col)
          return `Error: column "${columnId}" not found. Available: ${columnSummary()}`;
        actionsRef.current.deleteColumn(columnId);
        return `Deleted column "${col.title}" and all its cards`;
      },
    },
    [state.columns.length],
  );
}
