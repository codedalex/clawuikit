"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IndexEntry } from "@/app/api/index/route";

const STORAGE_KEY = "openclaw_project_path";

export type IndexStatus = "idle" | "indexing" | "ready" | "error";

export interface CodebaseIndexState {
  projectPath: string | null;
  indexStatus: IndexStatus;
  fileCount: number;
  totalLines: number;
  languages: Record<string, number>;
  indexedAt: string | null;
  error: string | null;
  linkProject: (path: string) => Promise<void>;
  unlinkProject: () => void;
  reindex: () => Promise<void>;
  queryIndex: (query: string, maxFiles?: number) => Promise<IndexEntry[]>;
}

export function useCodebaseIndex(): CodebaseIndexState {
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [indexStatus, setIndexStatus] = useState<IndexStatus>("idle");
  const [fileCount, setFileCount] = useState(0);
  const [totalLines, setTotalLines] = useState(0);
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [indexedAt, setIndexedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pathRef = useRef<string | null>(null);

  // Persist path ref for closures
  useEffect(() => {
    pathRef.current = projectPath;
  }, [projectPath]);

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setProjectPath(saved);
      triggerIndex(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerIndex = useCallback(async (path: string) => {
    setIndexStatus("indexing");
    setError(null);

    try {
      const res = await fetch("/api/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: path }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        fileCount?: number;
        totalLines?: number;
        languages?: Record<string, number>;
        indexedAt?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Indexing failed");
      }

      setFileCount(data.fileCount ?? 0);
      setTotalLines(data.totalLines ?? 0);
      setLanguages(data.languages ?? {});
      setIndexedAt(data.indexedAt ?? null);
      setIndexStatus("ready");
    } catch (e) {
      setError((e as Error).message);
      setIndexStatus("error");
    }
  }, []);

  const linkProject = useCallback(
    async (path: string) => {
      localStorage.setItem(STORAGE_KEY, path);
      setProjectPath(path);
      await triggerIndex(path);
    },
    [triggerIndex],
  );

  const unlinkProject = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProjectPath(null);
    setIndexStatus("idle");
    setFileCount(0);
    setLanguages({});
    setIndexedAt(null);
    setError(null);
  }, []);

  const reindex = useCallback(async () => {
    if (pathRef.current) await triggerIndex(pathRef.current);
  }, [triggerIndex]);

  const queryIndex = useCallback(
    async (query: string, maxFiles = 12): Promise<IndexEntry[]> => {
      if (!pathRef.current || indexStatus !== "ready") return [];

      try {
        const res = await fetch("/api/index/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            projectPath: pathRef.current,
            maxFiles,
          }),
        });

        const data = (await res.json()) as { files?: IndexEntry[] };
        return data.files ?? [];
      } catch {
        return [];
      }
    },
    [indexStatus],
  );

  return {
    projectPath,
    indexStatus,
    fileCount,
    totalLines,
    languages,
    indexedAt,
    error,
    linkProject,
    unlinkProject,
    reindex,
    queryIndex,
  };
}
