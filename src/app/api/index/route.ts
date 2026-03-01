import { NextResponse } from "next/server";
import { existsSync, statSync } from "fs";
import { readFile } from "fs/promises";
import { join, relative } from "path";
import fg from "fast-glob";
import Ignore from "ignore";

// ─── In-memory index store (per project path) ──────────────────────────────
export interface IndexEntry {
  filePath: string; // Relative path from project root
  language: string;
  content: string;
  symbols: string[]; // Exports, class names, function names
  imports: string[]; // Import paths
  size: number;
  lastModified: string;
}

export interface ProjectIndex {
  projectPath: string;
  indexedAt: string;
  files: IndexEntry[];
  stats: {
    totalFiles: number;
    totalLines: number;
    languages: Record<string, number>;
  };
}

// Global in-memory store
const indexStore = new Map<string, ProjectIndex>();
export { indexStore };

// ─── Language detection ─────────────────────────────────────────────────────
function detectLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    cs: "csharp",
    rb: "ruby",
    css: "css",
    scss: "css",
    sass: "css",
    html: "html",
    vue: "vue",
    svelte: "svelte",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    mdx: "markdown",
    sh: "shell",
    bash: "shell",
    sql: "sql",
    prisma: "prisma",
    env: "env",
  };
  return map[ext] ?? "text";
}

// ─── Symbol extraction (regex-based) ───────────────────────────────────────
function extractSymbols(content: string, language: string): string[] {
  const symbols: string[] = [];
  if (["typescript", "javascript"].includes(language)) {
    const patterns = [
      /export\s+(?:default\s+)?(?:function|class|const|let|var|type|interface|enum)\s+(\w+)/g,
      /(?:function|class)\s+(\w+)/g,
    ];
    for (const pattern of patterns) {
      for (const match of content.matchAll(pattern)) {
        if (match[1] && !symbols.includes(match[1])) symbols.push(match[1]);
      }
    }
  } else if (language === "python") {
    for (const match of content.matchAll(/(?:def|class)\s+(\w+)/g)) {
      if (match[1]) symbols.push(match[1]);
    }
  }
  return symbols.slice(0, 30); // Cap at 30 symbols per file
}

// ─── Import extraction ──────────────────────────────────────────────────────
function extractImports(content: string): string[] {
  const imports: string[] = [];
  const patterns = [
    /(?:import|require)\s+(?:.*?\s+from\s+)?['"]([\w@/.:-]+)['"]/g,
    /from\s+['"]([\w@/.:-]+)['"]/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      if (match[1] && !imports.includes(match[1])) imports.push(match[1]);
    }
  }
  return imports.slice(0, 20);
}

// ─── POST /api/index ────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { projectPath } = (await req.json()) as { projectPath: string };

    if (!projectPath) {
      return NextResponse.json(
        { error: "projectPath is required" },
        { status: 400 },
      );
    }

    // Normalize path
    const normalizedPath = projectPath.trim().replace(/["']/g, "");

    if (!existsSync(normalizedPath)) {
      return NextResponse.json(
        { error: `Path does not exist: ${normalizedPath}` },
        { status: 400 },
      );
    }

    if (!statSync(normalizedPath).isDirectory()) {
      return NextResponse.json(
        { error: "Path must be a directory" },
        { status: 400 },
      );
    }

    // Load .gitignore if present
    const ig = Ignore.default();
    const gitignorePath = join(normalizedPath, ".gitignore");
    if (existsSync(gitignorePath)) {
      const gitignoreContent = await readFile(gitignorePath, "utf-8");
      ig.add(gitignoreContent);
    }

    // Always ignore these
    ig.add([
      "node_modules",
      ".next",
      "dist",
      "build",
      ".git",
      "__pycache__",
      "*.min.js",
      "*.min.css",
      "*.map",
      "*.lock",
      "package-lock.json",
      ".env",
      ".env.*",
      "*.png",
      "*.jpg",
      "*.jpeg",
      "*.gif",
      "*.svg",
      "*.ico",
      "*.woff",
      "*.woff2",
      "*.ttf",
      "*.eot",
      "*.webp",
    ]);

    // Glob all source files
    const rawFiles = await fg(
      [
        "**/*.{ts,tsx,js,jsx,py,go,rs,java,cs,rb,css,scss,html,vue,svelte,json,yaml,yml,md,mdx,sh,sql,prisma}",
      ],
      {
        cwd: normalizedPath,
        dot: false,
        followSymbolicLinks: false,
        absolute: false,
        ignore: ["node_modules/**", ".next/**", "dist/**", ".git/**"],
      },
    );

    // Apply gitignore filter and cap at 500 files
    const filteredFiles = rawFiles.filter((f) => !ig.ignores(f)).slice(0, 500);

    // Index each file
    const entries: IndexEntry[] = [];
    const languages: Record<string, number> = {};
    let totalLines = 0;

    await Promise.all(
      filteredFiles.map(async (relPath) => {
        try {
          const absPath = join(normalizedPath, relPath);
          const stat = statSync(absPath);

          // Skip large files (> 200KB)
          if (stat.size > 200_000) return;

          const content = await readFile(absPath, "utf-8");
          const language = detectLanguage(relPath);
          const lines = content.split("\n").length;
          totalLines += lines;
          languages[language] = (languages[language] ?? 0) + 1;

          entries.push({
            filePath: relPath.replace(/\\/g, "/"),
            language,
            content,
            symbols: extractSymbols(content, language),
            imports: extractImports(content),
            size: stat.size,
            lastModified: stat.mtime.toISOString(),
          });
        } catch {
          // Skip unreadable files
        }
      }),
    );

    const index: ProjectIndex = {
      projectPath: normalizedPath,
      indexedAt: new Date().toISOString(),
      files: entries,
      stats: { totalFiles: entries.length, totalLines, languages },
    };

    indexStore.set(normalizedPath, index);

    return NextResponse.json({
      ok: true,
      projectPath: normalizedPath,
      fileCount: entries.length,
      totalLines,
      languages,
      indexedAt: index.indexedAt,
    });
  } catch (e) {
    console.error("[index] Error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ─── GET /api/index — check if a path is indexed ───────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectPath = searchParams.get("path");

  if (!projectPath) {
    return NextResponse.json({ indexed: false });
  }

  const index = indexStore.get(projectPath);
  if (!index) return NextResponse.json({ indexed: false });

  return NextResponse.json({
    indexed: true,
    fileCount: index.stats.totalFiles,
    totalLines: index.stats.totalLines,
    languages: index.stats.languages,
    indexedAt: index.indexedAt,
  });
}
