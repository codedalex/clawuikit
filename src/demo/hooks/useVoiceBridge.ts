"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { KanbanActions, KanbanState } from "./useKanban";
import type { VoiceIntent } from "@/app/api/voice/route";

type RecordingState = "idle" | "recording" | "processing" | "result" | "error";

export interface VoiceBridgeResult {
  isRecording: boolean;
  recordingState: RecordingState;
  transcript: string;
  intent: VoiceIntent | null;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  confirmIntent: () => void;
  dismissResult: () => void;
}

export function useVoiceBridge(
  state: KanbanState,
  actions: KanbanActions,
): VoiceBridgeResult {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [intent, setIntent] = useState<VoiceIntent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const actionsRef = useRef(actions);
  const stateRef = useRef(state);

  // Keep refs current
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");
    setIntent(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/ogg;codecs=opus";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop mic tracks
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });

        if (blob.size < 1000) {
          setError("Recording too short. Hold and speak clearly.");
          setRecordingState("idle");
          return;
        }

        setRecordingState("processing");
        await transcribeAndParse(blob);
      };

      recorder.start(100); // collect 100ms chunks
      mediaRecorderRef.current = recorder;
      setRecordingState("recording");
    } catch (err) {
      setError("Microphone access denied. Please allow mic permissions.");
      setRecordingState("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const transcribeAndParse = async (blob: Blob) => {
    try {
      const form = new FormData();
      form.append("audio", blob, "recording.webm");

      const res = await fetch("/api/voice", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Voice API error: ${res.status}`);

      const data = (await res.json()) as {
        transcript: string;
        intent: VoiceIntent | null;
      };

      if (!data.transcript) {
        setError("Couldn't hear anything. Please try again.");
        setRecordingState("idle");
        return;
      }

      setTranscript(data.transcript);
      setIntent(data.intent);
      setRecordingState("result");

      // Auto-confirm if confidence is very high
      if (
        data.intent &&
        data.intent.confidence >= 0.9 &&
        data.intent.action !== "unknown"
      ) {
        setTimeout(() => executeIntent(data.intent!), 3000);
      }
    } catch (err) {
      setError((err as Error).message);
      setRecordingState("error");
    }
  };

  const executeIntent = useCallback((resolvedIntent: VoiceIntent) => {
    const s = stateRef.current;
    const a = actionsRef.current;
    const { action, params } = resolvedIntent;

    if (action === "addCard") {
      // Map column name to id
      const col =
        s.columns.find((c) =>
          c.title
            .toLowerCase()
            .includes((params.column ?? "to do").toLowerCase()),
        ) ?? s.columns[0];
      if (col)
        a.addCard(col.id, params.title ?? "New Task", params.description ?? "");
    } else if (action === "moveCard") {
      const card = s.cards.find((c) =>
        c.title.toLowerCase().includes((params.title ?? "").toLowerCase()),
      );
      const col = s.columns.find((c) =>
        c.title.toLowerCase().includes((params.column ?? "").toLowerCase()),
      );
      if (card && col) a.moveCard(card.id, col.id);
    } else if (action === "deleteCard") {
      const card = s.cards.find((c) =>
        c.title.toLowerCase().includes((params.title ?? "").toLowerCase()),
      );
      if (card) a.deleteCard(card.id);
    } else if (action === "executeTask") {
      const card = s.cards.find((c) =>
        c.title.toLowerCase().includes((params.title ?? "").toLowerCase()),
      );
      const inProgress = s.columns.find((c) =>
        c.title.toLowerCase().includes("progress"),
      );
      if (card && inProgress) {
        a.moveCard(card.id, inProgress.id);
        a.updateCard(card.id, {
          executionStatus: "analyzing",
          executionLogs: ["⚡ Voice command: starting execution..."],
        });
      }
    }

    setRecordingState("idle");
    setTranscript("");
    setIntent(null);
  }, []);

  const confirmIntent = useCallback(() => {
    if (intent) executeIntent(intent);
  }, [intent, executeIntent]);

  const dismissResult = useCallback(() => {
    setRecordingState("idle");
    setTranscript("");
    setIntent(null);
    setError(null);
  }, []);

  return {
    isRecording: recordingState === "recording",
    recordingState,
    transcript,
    intent,
    error,
    startRecording,
    stopRecording,
    confirmIntent,
    dismissResult,
  };
}
