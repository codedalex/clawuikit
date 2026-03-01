import { NextResponse } from "next/server";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "deepseek-coder-v2:16b";

// GET /api/llm/health  (health check – inline)
export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error("Ollama not reachable");
    const data = (await res.json()) as { models?: { name: string }[] };
    const models = data.models?.map((m) => m.name) ?? [];
    const modelReady = models.some((m) =>
      m.startsWith(OLLAMA_MODEL.split(":")[0]),
    );
    return NextResponse.json({
      ok: true,
      model: OLLAMA_MODEL,
      models,
      modelReady,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Ollama is not running. Install from https://ollama.com then run: ollama pull " +
          OLLAMA_MODEL,
      },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      prompt,
      system,
      model = OLLAMA_MODEL,
      stream = true,
      context,
    } = (await req.json()) as {
      prompt: string;
      system?: string;
      model?: string;
      stream?: boolean;
      context?: string[];
    };

    // Build the full prompt, injecting context files if provided
    const contextBlock =
      context && context.length > 0
        ? `\n\n--- CODEBASE CONTEXT ---\n${context.join("\n\n---\n\n")}\n--- END CONTEXT ---\n\n`
        : "";

    const fullPrompt = contextBlock + prompt;

    const body = JSON.stringify({
      model,
      prompt: fullPrompt,
      system:
        system ??
        "You are an expert software engineer. Be concise, precise, and write production-quality code.",
      stream,
    });

    const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(120_000),
    });

    if (!ollamaRes.ok) {
      const text = await ollamaRes.text();
      return NextResponse.json({ error: text }, { status: ollamaRes.status });
    }

    if (!stream) {
      const data = (await ollamaRes.json()) as { response: string };
      return NextResponse.json({ response: data.response });
    }

    // Stream SSE back to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = ollamaRes.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(Boolean);

            for (const line of lines) {
              try {
                const parsed = JSON.parse(line) as {
                  response: string;
                  done: boolean;
                };
                const event = `data: ${JSON.stringify({ token: parsed.response, done: parsed.done })}\n\n`;
                controller.enqueue(encoder.encode(event));
                if (parsed.done) {
                  controller.close();
                  return;
                }
              } catch {
                // Skip malformed JSON lines
              }
            }
          }
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
