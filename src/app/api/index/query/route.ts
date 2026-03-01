import { NextResponse } from "next/server";
import { indexStore, type IndexEntry } from "../route";

interface QueryResult extends IndexEntry {
  relevanceScore: number;
}

/** POST /api/index/query
 *  Finds the most relevant files in the index for a given natural-language query.
 */
export async function POST(req: Request) {
  try {
    const {
      query,
      projectPath,
      maxFiles = 12,
    } = (await req.json()) as {
      query: string;
      projectPath: string;
      maxFiles?: number;
    };

    if (!query || !projectPath) {
      return NextResponse.json(
        { error: "query and projectPath are required" },
        { status: 400 },
      );
    }

    const index = indexStore.get(projectPath);
    if (!index) {
      return NextResponse.json(
        {
          error: `No index found for ${projectPath}. Call POST /api/index first.`,
        },
        { status: 404 },
      );
    }

    // Tokenize query into keywords
    const keywords = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    if (keywords.length === 0) {
      return NextResponse.json({ files: [] });
    }

    // Score each file
    const scored: QueryResult[] = index.files.map((file) => {
      let score = 0;
      const pathLower = file.filePath.toLowerCase();
      const symbolsStr = file.symbols.join(" ").toLowerCase();
      const importsStr = file.imports.join(" ").toLowerCase();
      // Only check first 2000 chars of content for speed
      const contentPreview = file.content.slice(0, 2000).toLowerCase();

      for (const kw of keywords) {
        // Path match (highest value — directly relevant)
        if (pathLower.includes(kw)) score += 5;

        // Symbol name match (very relevant)
        if (symbolsStr.includes(kw)) score += 4;

        // Import match (related dependency)
        if (importsStr.includes(kw)) score += 2;

        // Content match
        const occurrences = (contentPreview.match(new RegExp(kw, "g")) ?? [])
          .length;
        score += Math.min(occurrences, 5); // cap at 5 pts from content
      }

      // Boost config files slightly (often critical context)
      if (
        pathLower.includes("config") ||
        pathLower.includes("schema") ||
        pathLower.includes("types") ||
        pathLower.includes("index")
      ) {
        score += 1;
      }

      return { ...file, relevanceScore: score };
    });

    // Sort by score, take top N
    const results = scored
      .filter((f) => f.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxFiles);

    return NextResponse.json({
      query,
      totalIndexed: index.files.length,
      found: results.length,
      files: results,
    });
  } catch (e) {
    console.error("[index/query] Error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// Common English stop words to ignore in queries
const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "you",
  "are",
  "was",
  "but",
  "not",
  "all",
  "can",
  "her",
  "his",
  "they",
  "new",
  "one",
  "our",
  "add",
  "get",
  "set",
  "use",
  "has",
  "have",
]);
