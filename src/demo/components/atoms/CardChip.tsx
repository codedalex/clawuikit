"use client";

interface CardChipProps {
  title: string;
  highlighted?: boolean;
  className?: string;
}

export function CardChip({
  title,
  highlighted = false,
  className = "",
}: CardChipProps) {
  return (
    <div
      className={`rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm font-medium shadow-sm transition-shadow ${
        highlighted ? "animate-pulse-highlight" : ""
      } ${className}`}
    >
      {title}
    </div>
  );
}
