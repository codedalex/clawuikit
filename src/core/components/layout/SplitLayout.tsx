"use client";

import { useState } from "react";

interface SplitLayoutProps {
  main: React.ReactNode;
  sidebar: React.ReactNode;
  defaultSidebarOpen?: boolean;
}

export function SplitLayout({
  main,
  sidebar,
  defaultSidebarOpen = true,
}: SplitLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <main className="flex-1 overflow-auto">{main}</main>

      {sidebarOpen && (
        <aside className="hidden w-[380px] shrink-0 border-l border-foreground/10 md:flex md:flex-col">
          {sidebar}
        </aside>
      )}

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 md:hidden"
        aria-label={sidebarOpen ? "Close chat" : "Open chat"}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {sidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          )}
        </svg>
      </button>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="w-[340px] bg-background border-l border-foreground/10 flex flex-col">
            {sidebar}
          </aside>
        </div>
      )}
    </div>
  );
}
