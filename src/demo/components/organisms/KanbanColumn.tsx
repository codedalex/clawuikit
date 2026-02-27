"use client";

import { useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Card, Column, KanbanActions } from "@/demo/hooks/useKanban";
import { ColumnHeader } from "@/demo/components/atoms/ColumnHeader";
import { AddCardButton } from "@/demo/components/atoms/AddCardButton";
import { KanbanCard } from "@/demo/components/molecules/KanbanCard";
import { ColumnDropZone } from "@/demo/components/molecules/ColumnDropZone";

interface KanbanColumnProps {
  column: Column;
  cards: Card[];
  highlightedCardId: string | null;
  actions: KanbanActions;
}

export function KanbanColumn({
  column,
  cards,
  highlightedCardId,
  actions,
}: KanbanColumnProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const sortedCards = [...cards].sort((a, b) => a.order - b.order);
  const cardIds = sortedCards.map((c) => c.id);

  const handleAdd = () => {
    if (newTitle.trim()) {
      actions.addCard(column.id, newTitle.trim());
      setNewTitle("");
      setAdding(false);
    }
  };

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-foreground/[0.03] p-3">
      <ColumnHeader
        title={column.title}
        count={cards.length}
        onDelete={() => actions.deleteColumn(column.id)}
      />

      <ColumnDropZone columnId={column.id}>
        <SortableContext
          items={cardIds}
          strategy={verticalListSortingStrategy}
        >
          {sortedCards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              highlighted={highlightedCardId === card.id}
              onUpdate={(patch) => actions.updateCard(card.id, patch)}
              onDelete={() => actions.deleteCard(card.id)}
            />
          ))}
        </SortableContext>
      </ColumnDropZone>

      {adding ? (
        <div className="mt-2 flex flex-col gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
            placeholder="Card title..."
            className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/20"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background"
            >
              Add
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewTitle("");
              }}
              className="rounded-lg px-3 py-1.5 text-xs text-foreground/50 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <AddCardButton onClick={() => setAdding(true)} />
      )}
    </div>
  );
}
