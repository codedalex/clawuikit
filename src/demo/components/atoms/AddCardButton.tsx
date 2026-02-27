"use client";

interface AddCardButtonProps {
  onClick: () => void;
}

export function AddCardButton({ onClick }: AddCardButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground/60"
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
      Add card
    </button>
  );
}
