"use client";

interface AvatarProps {
  label: string;
  color?: "blue" | "amber" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

const colorMap = {
  blue: "bg-blue-500/20 text-blue-600",
  amber: "bg-amber-500/20 text-amber-600",
  neutral: "bg-foreground/10 text-foreground/60",
};

const sizeMap = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
};

export function Avatar({
  label,
  color = "neutral",
  size = "md",
  className = "",
}: AvatarProps) {
  const initials = label
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold ${colorMap[color]} ${sizeMap[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
