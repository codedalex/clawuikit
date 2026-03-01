"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "@/demo/hooks/useKanban";

interface KanbanCardProps {
  card: Card;
  highlighted: boolean;
  onUpdate: (
    patch: Partial<Pick<Card, "title" | "description" | "executionStatus" | "executionLogs">>,
  ) => void;
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
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3
                className={`text-sm font-semibold leading-snug cursor-text line-clamp-2 transition-colors ${
                  card.executionStatus === "working" ? "text-indigo-400" : "text-white/90"
                }`}
                onDoubleClick={() => setEditing(true)}
              >
                {card.title}
              </h3>
              {card.description && (
                <p className="mt-1 text-[10px] text-white/40 line-clamp-2 leading-tight">
                  {card.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {card.executionStatus !== "working" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ executionStatus: "working", executionLogs: ["⚡ Starting execution..."] });
                  }}
                  className="p-1 rounded-md text-indigo-400 hover:bg-indigo-400/10"
                  title="Execute with AI"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded-md text-white/10 hover:text-red-400 hover:bg-red-400/10"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Execution Progress & Logs */}
          {card.executionStatus && card.executionStatus !== "idle" && (
            <div className="mt-2 space-y-2 rounded-lg bg-black/20 p-2 border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    card.executionStatus === "working" ? "bg-indigo-400 animate-pulse" :
                    card.executionStatus === "done" ? "bg-green-400" :
                    card.executionStatus === "error" ? "bg-red-400" : "bg-white/20"
                  }`} />
                  <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
                    {card.executionStatus}
                  </span>
                </div>
              </div>
              
              {card.executionLogs && card.executionLogs.length > 0 && (
                <div className="max-h-20 overflow-y-auto custom-scrollbar">
                  {card.executionLogs.map((log, i) => (
                    <div key={i} className="text-[9px] text-white/30 font-mono py-0.5 border-t border-white/5 first:border-0">
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {card.executionStatus === "working" && (
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500/50 animate-shimmer" style={{ width: '40%' }} />
                </div>
              )}

              {card.executionStatus === "error" && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[10px] text-white/60 mb-1.5 font-medium">Provide Correction:</p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-[10px] text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50"
                      placeholder="e.g. Use the v2 API instead..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value;
                          if (val.trim()) {
                            onUpdate({ 
                              executionStatus: "working", 
                              executionLogs: [`🙋 Admin Correction: ${val}`, "🔄 Resuming execution..."] 
                            });
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex gap-1.5 items-center">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-glow" />
          <span className="text-[10px] font-medium text-white/20 uppercase tracking-widest leading-none">
            #{card.id.slice(-4)}
          </span>
        </div>
        {card.executionStatus === "done" && (
          <span className="text-[10px] font-bold text-green-500/50 uppercase tracking-tighter">Verified</span>
        )}
      </div>
    </div>
  );
}
