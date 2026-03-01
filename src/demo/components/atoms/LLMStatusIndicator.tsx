"use client";

import { useEffect, useState } from "react";

type LLMStatus = "checking" | "online" | "offline";

export function LLMStatusIndicator() {
  const [status, setStatus] = useState<LLMStatus>("checking");
  const [model, setModel] = useState("");
  const [tooltip, setTooltip] = useState("");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/llm");
        const data = (await res.json()) as {
          ok: boolean;
          model?: string;
          modelReady?: boolean;
          error?: string;
        };
        if (data.ok) {
          setStatus("online");
          setModel(data.model ?? "");
          setTooltip(
            data.modelReady
              ? `✅ ${data.model} is ready`
              : `⚠️ Ollama running but model not found. Run: ollama pull ${data.model}`,
          );
        } else {
          setStatus("offline");
          setTooltip(data.error ?? "Ollama offline");
        }
      } catch {
        setStatus("offline");
        setTooltip("Ollama is not running. Install from https://ollama.com");
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  const dot =
    status === "online"
      ? "bg-green-400"
      : status === "offline"
      ? "bg-red-400"
      : "bg-yellow-400 animate-pulse";

  const label =
    status === "online"
      ? model.split(":")[0]
      : status === "offline"
      ? "AI Offline"
      : "Checking...";

  return (
    <div className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 cursor-default">
      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
        {label}
      </span>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-[10px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center leading-relaxed">
          {tooltip}
        </div>
      )}
    </div>
  );
}
