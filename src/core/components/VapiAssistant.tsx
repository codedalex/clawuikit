"use client";

import React from "react";

interface VapiAssistantProps {
  isCalling: boolean;
  toggleCall: () => void;
}

export const VapiAssistant = ({ isCalling, toggleCall }: VapiAssistantProps) => {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="relative group">
        {/* Glow Aura */}
        {isCalling && (
          <div className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
        )}
        <div className={`absolute -inset-1 rounded-full opacity-40 blur-lg transition duration-1000 group-hover:opacity-100 group-hover:duration-200 pointer-events-none ${
          isCalling ? "bg-red-500 animate-pulse-glow" : "premium-gradient"
        }`} />
        
        <button
          onClick={toggleCall}
          className={`relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 ring-1 ring-white/20 active:scale-90 ${
            isCalling 
              ? "bg-gradient-to-tr from-red-600 to-red-400 text-white" 
              : "bg-[#0f172a] text-white hover:bg-[#1e293b]"
          }`}
        >
          {isCalling ? (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-white rounded-full transition-all duration-300"
                  style={{
                    height: `${Math.random() * 20 + 10}px`,
                    animation: `pulse-glow 1s ease-in-out infinite ${i * 0.2}s`
                  }}
                />
              ))}
            </div>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line strokeLinecap="round" strokeLinejoin="round" x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
        </button>

        {/* Label */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg glass opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          <span className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">
            {isCalling ? "Listening..." : "Voice Control"}
          </span>
        </div>
      </div>
    </div>
  );
};
