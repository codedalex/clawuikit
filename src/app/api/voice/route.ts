import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { nodewhisper } from "nodejs-whisper";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "deepseek-coder-v2:16b";

/** POST /api/voice
 *  Accepts multipart form with audio blob.
 *  Returns { transcript, intent }
 */
export async function POST(req: Request) {
  const tmpPath = join(process.cwd(), "tmp", `recording-${randomUUID()}.webm`);

  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;

    if (!audio || audio.size === 0) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    // Write audio blob to temp file
    const buffer = Buffer.from(await audio.arrayBuffer());
    await writeFile(tmpPath, buffer).catch(() => {
      // Ensure tmp dir exists
      const { mkdirSync } = require("fs") as typeof import("fs");
      mkdirSync(join(process.cwd(), "tmp"), { recursive: true });
      return writeFile(tmpPath, buffer);
    });

    // Transcribe with local Whisper
    const transcript = await transcribeWithWhisper(tmpPath);

    if (!transcript || transcript.trim() === "") {
      return NextResponse.json({ transcript: "", intent: null });
    }

    // Parse intent using local LLM
    const intent = await parseIntent(transcript);

    return NextResponse.json({ transcript: transcript.trim(), intent });
  } catch (e) {
    console.error("[voice] Error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  } finally {
    // Clean up temp file
    await unlink(tmpPath).catch(() => null);
  }
}

async function transcribeWithWhisper(audioPath: string): Promise<string> {
  try {
    const result = await nodewhisper(audioPath, {
      modelName: "base.en",
      autoDownloadModelName: "base.en",
      removeWavFileAfterTranscription: false,
      withCuda: false,
      whisperOptions: {
        outputInText: true,
        translateToEnglish: false,
        wordTimestamps: false,
        language: "en",
      },
    });
    return Array.isArray(result)
      ? result.map((r: any) => r.speech).join(" ")
      : String(result);
  } catch (err) {
    console.error("[whisper] Transcription failed:", err);
    throw new Error("Whisper transcription failed: " + (err as Error).message);
  }
}

/** Use the local LLM to extract a structured intent from the transcript */
async function parseIntent(transcript: string): Promise<VoiceIntent | null> {
  const prompt = `You are a Kanban assistant. Parse this voice command into a JSON action.

Voice command: "${transcript}"

Available actions:
- addCard: add a new task
- moveCard: move a task to a column
- deleteCard: remove a task
- executeTask: run AI on a task
- getStatus: list tasks in a column
- abortAgent: stop the AI agent

Rules:
- respond ONLY with a JSON object, no explanation, no markdown
- use "unknown" if you cannot determine the action
- column names: "To Do", "In Progress", "In Review", "Done"

JSON format:
{
  "action": "addCard",
  "params": { "column": "To Do", "title": "Fix login bug", "description": "" },
  "confidence": 0.95,
  "summary": "Add task: Fix login bug"
}`;

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        system:
          "You parse voice commands into JSON. Respond ONLY with valid JSON.",
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { response: string };
    const raw = data.response.trim();

    // Extract JSON from the response (even if wrapped in markdown)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as VoiceIntent;
  } catch {
    // If LLM parsing fails, return a simple fallback based on keywords
    return fallbackParse(transcript);
  }
}

function fallbackParse(transcript: string): VoiceIntent | null {
  const lower = transcript.toLowerCase();

  if (
    lower.includes("add") ||
    lower.includes("create") ||
    lower.includes("new task")
  ) {
    const title = transcript.replace(/add|create|new task/gi, "").trim();
    return {
      action: "addCard",
      params: { column: "To Do", title },
      confidence: 0.6,
      summary: `Add: ${title}`,
    };
  }
  if (lower.includes("move")) {
    return {
      action: "moveCard",
      params: {},
      confidence: 0.5,
      summary: transcript,
    };
  }
  if (lower.includes("delete") || lower.includes("remove")) {
    return {
      action: "deleteCard",
      params: {},
      confidence: 0.5,
      summary: transcript,
    };
  }
  if (
    lower.includes("execute") ||
    lower.includes("work on") ||
    lower.includes("run")
  ) {
    return {
      action: "executeTask",
      params: {},
      confidence: 0.5,
      summary: transcript,
    };
  }
  return {
    action: "unknown",
    params: {},
    confidence: 0.1,
    summary: transcript,
  };
}

export interface VoiceIntent {
  action:
    | "addCard"
    | "moveCard"
    | "deleteCard"
    | "executeTask"
    | "getStatus"
    | "abortAgent"
    | "unknown";
  params: Record<string, string>;
  confidence: number;
  summary: string;
}
