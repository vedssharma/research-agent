"use client";

import type { AgentPhase } from "@/types";

interface StreamingIndicatorProps {
  isLoading: boolean;
  phase?: AgentPhase;
}

const phaseLabels: Record<AgentPhase, string> = {
  planning: "Planning research strategy...",
  researching: "Searching and gathering information...",
  building_kg: "Building knowledge graph...",
  synthesizing: "Synthesizing answer...",
  complete: "Done",
};

export function StreamingIndicator({ isLoading, phase }: StreamingIndicatorProps) {
  if (!isLoading) return null;

  const label = phase ? phaseLabels[phase] : "Thinking...";

  return (
    <div className="flex items-center gap-2 px-4 py-2 max-w-3xl mx-auto">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-zinc-400">{label}</span>
    </div>
  );
}
