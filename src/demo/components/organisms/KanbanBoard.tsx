"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type {
  KanbanState,
  KanbanActions,
  Card,
} from "@/demo/hooks/useKanban";
import { KanbanColumn } from "./KanbanColumn";
import { CardChip } from "@/demo/components/atoms/CardChip";

interface KanbanBoardProps {
  state: KanbanState;
  actions: KanbanActions;
  highlightedCardId: string | null;
}

export function KanbanBoard({
  state,
  actions,
  highlightedCardId,
}: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const sortedColumns = [...state.columns].sort((a, b) => a.order - b.order);

  function handleDragStart(event: DragStartEvent) {
    const card = state.cards.find((c) => c.id === event.active.id);
    if (card) setActiveCard(card);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const overId = over.id as string;

    const isOverColumn = state.columns.some((c) => c.id === overId);
    if (isOverColumn) {
      actions.moveCard(cardId, overId);
      return;
    }

    const overCard = state.cards.find((c) => c.id === overId);
    if (overCard && overCard.id !== cardId) {
      actions.moveCard(cardId, overCard.columnId, overCard.order);
    }
  }

  const handleAddColumn = () => {
    if (newColTitle.trim()) {
      actions.addColumn(newColTitle.trim());
      setNewColTitle("");
      setAddingColumn(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-4">
        <h1 className="text-lg font-semibold">Kanban Board</h1>
        <span className="text-xs text-foreground/40">
          {state.cards.length} cards &middot; {state.columns.length} columns
        </span>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {sortedColumns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              cards={state.cards.filter((c) => c.columnId === col.id)}
              highlightedCardId={highlightedCardId}
              actions={actions}
            />
          ))}

          <DragOverlay>
            {activeCard && (
              <CardChip
                title={activeCard.title}
                className="rotate-3 shadow-xl"
              />
            )}
          </DragOverlay>
        </DndContext>

        {addingColumn ? (
          <div className="flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-foreground/[0.03] p-3">
            <input
              value={newColTitle}
              onChange={(e) => setNewColTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
              autoFocus
              placeholder="Column title..."
              className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddColumn}
                className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAddingColumn(false);
                  setNewColTitle("");
                }}
                className="rounded-lg px-3 py-1.5 text-xs text-foreground/50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingColumn(true)}
            className="flex h-10 w-72 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-dashed border-foreground/15 text-sm text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground/60"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add column
          </button>
        )}
      </div>
    </div>
  );
}
