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
      className={`group rounded-lg border bg-background p-3 shadow-sm transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 shadow-lg" : ""
      } ${
        highlighted
          ? "animate-pulse-highlight border-amber-500/40"
          : "border-foreground/10 hover:border-foreground/20"
      }`}
    >
      {editing ? (
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
          className="w-full bg-transparent text-sm font-medium outline-none"
        />
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm font-medium cursor-text"
            onDoubleClick={() => setEditing(true)}
          >
            {card.title}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="shrink-0 opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-red-500 transition-all"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
      {card.description && !editing && (
        <p className="mt-1 text-xs text-foreground/40 line-clamp-2">
          {card.description}
        </p>
      )}
    </div>
  );
}
