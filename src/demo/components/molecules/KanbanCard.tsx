"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "@/demo/hooks/useKanban";

interface KanbanCardProps {
  card: Card;
  highlighted: boolean;
  onUpdate: (patch: Partial<Pick<Card, "title" | "description">>) => void;
  onDelete: () => void;
}

export function KanbanCard({
  card,
  highlighted,
  onUpdate,
  onDelete,
}: KanbanCardProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: "card", card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== card.title) {
      onUpdate({ title: editTitle.trim() });
    }
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm transition-all cursor-grab active:cursor-grabbing hover:bg-white/[0.08] hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5 ${
        isDragging ? "opacity-30 scale-95" : ""
      } ${
        highlighted
          ? "ring-2 ring-indigo-500/50 bg-indigo-500/10 border-indigo-500/30 animate-pulse-glow"
          : ""
      }`}
    >
      {editing ? (
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
          className="w-full bg-transparent text-sm font-semibold text-white outline-none"
        />
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3
              className="text-sm font-semibold text-white/90 leading-snug cursor-text line-clamp-2"
              onDoubleClick={() => setEditing(true)}
            >
              {card.title}
            </h3>
            {card.description && (
              <p className="mt-1.5 text-xs text-white/40 line-clamp-3 leading-relaxed">
                {card.description}
              </p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="shrink-0 p-1 rounded-md text-white/10 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full premium-gradient shadow-glow shadow-indigo-500/40" />
        </div>
        <span className="text-[9px] font-bold text-white/10 uppercase tracking-tighter">
          #{card.id.slice(-4)}
        </span>
      </div>
    </div>
  );
}
