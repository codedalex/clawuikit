"use client";

import { useDroppable } from "@dnd-kit/core";

interface ColumnDropZoneProps {
  columnId: string;
  children: React.ReactNode;
}

export function ColumnDropZone({ columnId, children }: ColumnDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[120px] flex-1 flex-col gap-2 rounded-lg p-1 transition-colors ${
        isOver ? "bg-foreground/5" : ""
      }`}
    >
      {children}
    </div>
  );
}
