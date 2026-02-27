"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`h-10 w-full rounded-lg border bg-transparent px-3 text-sm transition-colors placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          error
            ? "border-red-500 focus-visible:ring-red-500"
            : "border-foreground/20 focus-visible:ring-foreground/30"
        } ${className}`}
        {...props}
      />
    );
  },
);

TextInput.displayName = "TextInput";
