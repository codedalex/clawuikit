"use client";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "blue" | "amber" | "green" | "red";
  className?: string;
}

const variantMap = {
  default: "bg-foreground/10 text-foreground/70",
  blue: "bg-blue-500/15 text-blue-600",
  amber: "bg-amber-500/15 text-amber-600",
  green: "bg-green-500/15 text-green-600",
  red: "bg-red-500/15 text-red-600",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${variantMap[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
