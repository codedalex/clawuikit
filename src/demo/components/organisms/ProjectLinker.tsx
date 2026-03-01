"use client";

import { useState, useRef } from "react";
import type { CodebaseIndexState } from "@/demo/hooks/useCodebaseIndex";

interface ProjectLinkerProps {
  index: CodebaseIndexState;
}

const LANG_COLORS: Record<string, string> = {
  typescript: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  javascript: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  python: "bg-green-500/20 text-green-300 border-green-500/30",
  css: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  markdown: "bg-white/10 text-white/50 border-white/20",
  json: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

const LANG_LABELS: Record<string, string> = {
  typescript: "TS", javascript: "JS", python: "PY", css: "CSS",
  markdown: "MD", json: "JSON", html: "HTML", rust: "RS",
  go: "GO", java: "JAVA",
};

export function ProjectLinker({ index }: ProjectLinkerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    projectPath,
    indexStatus,
    fileCount,
    languages,
    indexedAt,
    error,
    linkProject,
    unlinkProject,
    reindex,
  } = index;

  const handleLink = async () => {
    const val = inputValue.trim();
    if (!val) return;
    setIsEditing(false);
    await linkProject(val);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLink();
    if (e.key === "Escape") { setIsEditing(false); setInputValue(""); }
  };

  const topLangs = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const shortPath = projectPath
    ? projectPath.replace(/\\/g, "/").split("/").slice(-2).join("/")
    : null;

  const timeAgo = indexedAt
    ? (() => {
        const secs = Math.floor((Date.now() - new Date(indexedAt).getTime()) / 1000);
        if (secs < 60) return `${secs}s ago`;
        if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
        return `${Math.floor(secs / 3600)}h ago`;
      })()
    : null;

  // ── Not linked ──────────────────────────────────────────────────────────
  if (!projectPath || isEditing) {
    return (
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <input
              ref={inputRef}
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="C:/path/to/your/project"
              className="w-72 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 placeholder-white/20 focus:border-indigo-500/50 focus:outline-none"
            />
            <button
              onClick={handleLink}
              className="rounded-lg bg-indigo-600/80 hover:bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors"
            >
              Index →
            </button>
            <button
              onClick={() => { setIsEditing(false); setInputValue(""); }}
              className="rounded-lg border border-white/10 px-2 py-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/20 px-3 py-1.5 text-[11px] text-white/40 hover:border-indigo-500/50 hover:text-indigo-400 transition-all"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Link Project Folder
          </button>
        )}
      </div>
    );
  }

  // ── Indexing state ──────────────────────────────────────────────────────
  if (indexStatus === "indexing") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5">
        <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-[11px] text-white/50">
          Indexing <span className="text-white/70 font-medium">{shortPath}</span>…
        </span>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (indexStatus === "error") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 max-w-xs">
          <span className="text-red-400 text-xs">⚠</span>
          <span className="text-[10px] text-red-400 truncate">{error}</span>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="text-[10px] text-white/30 hover:text-white/60 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Ready state ─────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-2">
      {/* Project info pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-500/20 bg-green-500/10 group">
        <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
        <span className="text-[11px] font-medium text-white/70 max-w-[120px] truncate">
          {shortPath}
        </span>
        <span className="text-[10px] text-white/30">
          {fileCount} files
        </span>
        {timeAgo && (
          <span className="text-[9px] text-white/20 hidden group-hover:inline">
            • {timeAgo}
          </span>
        )}
      </div>

      {/* Language chips */}
      <div className="hidden md:flex items-center gap-1">
        {topLangs.map(([lang, count]) => (
          <span
            key={lang}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${LANG_COLORS[lang] ?? "bg-white/10 text-white/40 border-white/10"}`}
          >
            {LANG_LABELS[lang] ?? lang.toUpperCase().slice(0, 4)} {count}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <button
        onClick={reindex}
        title="Re-index project"
        className="p-1 rounded-md text-white/20 hover:text-white/60 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      <button
        onClick={unlinkProject}
        title="Unlink project"
        className="p-1 rounded-md text-white/20 hover:text-red-400 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
