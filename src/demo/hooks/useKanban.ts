"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Card,
  Column,
  KanbanState as FullKanbanState,
} from "@/demo/lib/kanban-store";

export type { Card, Column };

export type KanbanState = Omit<FullKanbanState, "nextId">;

export interface KanbanActions {
  addCard: (columnId: string, title: string, description?: string) => string;
  moveCard: (cardId: string, toColumnId: string, toOrder?: number) => void;
  updateCard: (
    cardId: string,
    patch: Partial<Pick<Card, "title" | "description">>,
  ) => void;
  deleteCard: (cardId: string) => void;
  addColumn: (title: string) => string;
  renameColumn: (columnId: string, title: string) => void;
  deleteColumn: (columnId: string) => void;
  refresh: () => void;
}

const EMPTY: KanbanState = { columns: [], cards: [] };
const POLL_INTERVAL_MS = 3000;

function stateFingerprint(s: KanbanState): string {
  const cols = s.columns.map((c) => `${c.id}:${c.title}:${c.order}`).join("|");
  const cards = s.cards
    .map((c) => `${c.id}:${c.title}:${c.description}:${c.columnId}:${c.order}`)
    .join("|");
  return `${cols};;${cards}`;
}

async function api<T = unknown>(
  method: "GET" | "POST",
  body?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch("/api/kanban", {
    method,
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  return res.json();
}

let tempIdCounter = 0;
function tempId(prefix: string) {
  return `${prefix}-tmp-${++tempIdCounter}`;
}

export function useKanban() {
  const [state, setState] = useState<KanbanState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(
    null,
  );
  const fingerprintRef = useRef("");

  const highlightCard = useCallback((cardId: string) => {
    setHighlightedCardId(cardId);
    setTimeout(() => setHighlightedCardId(null), 1600);
  }, []);

  const fetchState = useCallback(async () => {
    const data = await api<KanbanState & { nextId?: number }>("GET");
    const next = { columns: data.columns, cards: data.cards };
    const fp = stateFingerprint(next);
    if (fp !== fingerprintRef.current) {
      fingerprintRef.current = fp;
      setState(next);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    const id = setInterval(fetchState, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchState]);

  const addCard = useCallback(
    (columnId: string, title: string, description = "") => {
      const optimisticId = tempId("card");
      const maxOrder = Math.max(
        -1,
        ...state.cards
          .filter((c) => c.columnId === columnId)
          .map((c) => c.order),
      );
      setState((s) => ({
        ...s,
        cards: [
          ...s.cards,
          {
            id: optimisticId,
            title,
            description,
            columnId,
            order: maxOrder + 1,
          },
        ],
      }));
      highlightCard(optimisticId);

      api("POST", { action: "addCard", columnId, title, description })
        .then(() => fetchState())
        .catch(() => fetchState());
      return optimisticId;
    },
    [state.cards, highlightCard, fetchState],
  );

  const moveCard = useCallback(
    (cardId: string, toColumnId: string, toOrder?: number) => {
      setState((s) => {
        const card = s.cards.find((c) => c.id === cardId);
        if (!card) return s;
        const order =
          toOrder ??
          Math.max(
            -1,
            ...s.cards
              .filter((c) => c.columnId === toColumnId)
              .map((c) => c.order),
          ) + 1;
        return {
          ...s,
          cards: s.cards.map((c) =>
            c.id === cardId ? { ...c, columnId: toColumnId, order } : c,
          ),
        };
      });
      highlightCard(cardId);
      api("POST", { action: "moveCard", cardId, toColumnId, toOrder })
        .then(() => fetchState())
        .catch(() => fetchState());
    },
    [highlightCard, fetchState],
  );

  const updateCard = useCallback(
    (
      cardId: string,
      patch: Partial<Pick<Card, "title" | "description">>,
    ) => {
      setState((s) => ({
        ...s,
        cards: s.cards.map((c) =>
          c.id === cardId ? { ...c, ...patch } : c,
        ),
      }));
      highlightCard(cardId);
      api("POST", { action: "updateCard", cardId, ...patch })
        .then(() => fetchState())
        .catch(() => fetchState());
    },
    [highlightCard, fetchState],
  );

  const deleteCard = useCallback(
    (cardId: string) => {
      setState((s) => ({
        ...s,
        cards: s.cards.filter((c) => c.id !== cardId),
      }));
      api("POST", { action: "deleteCard", cardId })
        .then(() => fetchState())
        .catch(() => fetchState());
    },
    [fetchState],
  );

  const addColumn = useCallback(
    (title: string) => {
      const optimisticId = tempId("col");
      const maxOrder = Math.max(-1, ...state.columns.map((c) => c.order));
      setState((s) => ({
        ...s,
        columns: [
          ...s.columns,
          { id: optimisticId, title, order: maxOrder + 1 },
        ],
      }));

      api("POST", { action: "addColumn", title })
        .then(() => fetchState())
        .catch(() => fetchState());
      return optimisticId;
    },
    [state.columns, fetchState],
  );

  const renameColumn = useCallback(
    (columnId: string, title: string) => {
      setState((s) => ({
        ...s,
        columns: s.columns.map((c) =>
          c.id === columnId ? { ...c, title } : c,
        ),
      }));
      api("POST", { action: "renameColumn", columnId, title })
        .then(() => fetchState())
        .catch(() => fetchState());
    },
    [fetchState],
  );

  const deleteColumn = useCallback(
    (columnId: string) => {
      setState((s) => ({
        ...s,
        columns: s.columns.filter((c) => c.id !== columnId),
        cards: s.cards.filter((c) => c.columnId !== columnId),
      }));
      api("POST", { action: "deleteColumn", columnId })
        .then(() => fetchState())
        .catch(() => fetchState());
    },
    [fetchState],
  );

  const actions: KanbanActions = {
    addCard,
    moveCard,
    updateCard,
    deleteCard,
    addColumn,
    renameColumn,
    deleteColumn,
    refresh: fetchState,
  };

  return { state, actions, highlightedCardId, loading };
}
