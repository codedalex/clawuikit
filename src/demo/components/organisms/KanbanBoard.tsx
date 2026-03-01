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
import { LLMStatusIndicator } from "@/demo/components/atoms/LLMStatusIndicator";
import { ProjectLinker } from "./ProjectLinker";
import type { CodebaseIndexState } from "@/demo/hooks/useCodebaseIndex";

interface KanbanBoardProps {
  state: KanbanState;
  actions: KanbanActions;
  highlightedCardId: string | null;
  index: CodebaseIndexState;
}

export function KanbanBoard({
  state,
  actions,
  highlightedCardId,
  index,
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
    <div className="flex h-screen flex-col bg-[#020617] text-slate-50 selection:bg-indigo-500/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="p-2.5 premium-gradient rounded-xl shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 10V7" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white/90">Command Center</h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-indigo-400/80">Developer Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ProjectLinker index={index} />
          <LLMStatusIndicator />
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-white/80">{state.cards.length} Tasks</span>
            <span className="text-[10px] text-white/30 truncate max-w-[150px]">{state.columns.length} Active Workstreams</span>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex flex-1 gap-6 overflow-x-auto p-8 custom-scrollbar">
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
              <div className="w-72 scale-105 rotate-2">
                <CardChip
                  title={activeCard.title}
                  className="glass !bg-white/10 !border-white/20 shadow-2xl"
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {addingColumn ? (
          <div className="flex w-80 shrink-0 flex-col gap-3 rounded-2xl glass p-4 animate-in fade-in zoom-in-95 duration-200">
            <input
              value={newColTitle}
              onChange={(e) => setNewColTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
              autoFocus
              placeholder="List name..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddColumn}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
              >
                Create List
              </button>
              <button
                onClick={() => {
                  setAddingColumn(false);
                  setNewColTitle("");
                }}
                className="rounded-xl px-4 py-2 text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingColumn(true)}
            className="flex h-[max-content] w-80 shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] py-4 text-sm font-medium text-white/30 transition-all hover:bg-white/[0.04] hover:border-white/10 hover:text-white/50 group"
          >
            <div className="p-1 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            New Workstream
          <