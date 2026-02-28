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
    <div className="flex w-80 shrink-0 flex-col rounded-2xl glass p-4">
      <div className="flex items-center justify-between mb-4 group/col">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white/90 truncate max-w-[160px]">{column.title}</h2>
          <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-indigo-400 border border-white/5">
            {cards.length}
          </span>
        </div>
        <button
          onClick={() => actions.deleteColumn(column.id)}
          className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover/col:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <ColumnDropZone columnId={column.id}>
        <div className="flex flex-col gap-3 min-h-[50px]">
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
        </div>
      </ColumnDropZone>

      <div className="mt-4">
        {adding ? (
          <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
              placeholder="Task details..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-all"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
              >
                Add Task
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setNewTitle("");
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/30 hover:text-white/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] py-2.5 text-xs font-medium text-white/30 transition-all hover:bg-white/[0.05] hover:text-white/50 group"
          >
            <svg className="h-3.5 w-3.5 text-white/20 group-hover:text-white/40 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        )}
      </div>
    </div>
  );
}
