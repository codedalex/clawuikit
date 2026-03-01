"use client";

import { useRef, useEffect } from "react";
import type { VoiceBridgeResult } from "@/demo/hooks/useVoiceBridge";

interface LocalVoiceAssistantProps {
  voice: VoiceBridgeResult;
}

export function LocalVoiceAssistant({ voice }: LocalVoiceAssistantProps) {
  const {
    recordingState,
    transcript,
    intent,
    error,
    startRecording,
    stopRecording,
    confirmIntent,
    dismissResult,
  } = voice;

  // Auto-dismiss error after 4s
  useEffect(() => {
    if (recordingState === "error") {
      const t = setTimeout(dismissResult, 4000);
      return () => clearTimeout(t);
    }
  }, [recordingState, dismissResult]);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">

      {/* Result / Confirmation bubble */}
      {(recordingState === "result" || recordingState === "error") && (
        <div
          className="max-w-xs rounded-2xl border border-white/10 bg-[#0d1117]/90 backdrop-blur-xl p-4 shadow-2xl"
          style={{ animation: "fadeInUp 0.25s ease" }}
        >
          {recordingState === "error" && error && (
            <div className="flex items-start gap-2">
              <span className="text-red-400 text-lg">⚠</span>
              <p className="text-xs text-red-400 leading-relaxed">{error}</p>
            </div>
          )}

          {recordingState === "result" && (
            <>
              <div className="mb-3">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Heard</p>
                <p className="text-xs text-white/80 leading-relaxed italic">"{transcript}"</p>
              </div>

              {intent && intent.action !== "unknown" && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Will Do</p>
                  <p className="text-xs text-indigo-300 font-medium">{intent.summary}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <div
                      className="h-1 rounded-full bg-indigo-500/50"
                      style={{ width: `${intent.confidence * 100}%`, maxWidth: "100%" }}
                    />
                    <span className="text-[9px] text-white/20">
                      {Math.round(intent.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              )}

              {intent?.action === "unknown" && (
                <p className="text-xs text-white/40 mb-3">Couldn't determine action. Please try again.</p>
              )}

              <div className="flex gap-2">
                {intent && intent.action !== "unknown" && (
                  <button
                    onClick={confirmIntent}
                    className="flex-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors"
                  >
                    ✅ Confirm
                  </button>
                )}
                <button
                  onClick={dismissResult}
                  className="flex-1 rounded-lg border border-white/10 hover:bg-white/5 px-3 py-1.5 text-[11px] text-white/50 transition-colors"
                >
                  ✕ Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Processing indicator */}
      {recordingState === "processing" && (
        <div className="px-4 py-2 rounded-full border border-white/10 bg-[#0d1117]/90 backdrop-blur-xl">
          <span className="text-[11px] text-indigo-300 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            Transcribing...
          </span>
        </div>
      )}

      {/* Main mic button */}
      <div className="relative group">
        {/* Glow aura */}
        {recordingState === "recording" && (
          <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
        )}
        <div className={`absolute -inset-1 rounded-full blur-lg opacity-40 transition duration-1000 group-hover:opacity-80 pointer-events-none ${
          recordingState === "recording" ? "bg-red-500" : "bg-indigo-600"
        }`} />

        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={recordingState === "processing"}
          className={`relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-200 ring-1 ring-white/20 active:scale-90 select-none ${
            recordingState === "recording"
              ? "bg-gradient-to-tr from-red-600 to-red-400 scale-110"
              : recordingState === "processing"
              ? "bg-[#0f172a] opacity-60 cursor-not-allowed"
              : "bg-[#0f172a] hover:bg-[#1e293b] cursor-pointer"
          }`}
          title={recordingState === "recording" ? "Release to transcribe" : "Hold to speak"}
        >
          {recordingState === "recording" ? (
            /* Waveform bars while recording */
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-white rounded-full"
                  style={{
                    height: "16px",
                    animation: `waveform-${i} 0.6s ease-in-out infinite alternate`,
                  }}
                />
              ))}
            </div>
          ) : (
            /* Mic icon */
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line strokeLinecap="round" x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
        </button>

        {/* Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#0d1117]/90 border border-white/10 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          <span className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">
            {recordingState === "recording" ? "Release to send" : "Hold to speak"}
          </span>
        </div>
      </div>

      {/* Inline waveform keyframes */}
      <style>{`
        @keyframes waveform-1 { from { height: 8px } to { height: 20px } }
        @keyframes waveform-2 { from { height: 14px } to { height: 10px } }
        @keyframes waveform-3 { from { height: 10px } to { height: 22px } }
        @keyframes waveform-4 { from { height: 18px } to { height: 8px } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
