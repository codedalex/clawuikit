"use client";

import { Badge } from "@/ui/Badge";

interface ColumnHeaderProps {
  title: string;
  count: number;
  onDelete?: () => void;
}

export function ColumnHeader({ title, count, onDelete }: ColumnHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1 pb-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground/80">{title}</h3>
        <Badge>{count}</Badge>
      </div>
      {onDelete && (
        <button
          onClick={onDelete}
          className="text-foreground/30 hover:text-red-500 transition-colors"
          aria-label={`Delete ${title} column`}
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
