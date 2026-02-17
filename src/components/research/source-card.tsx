"use client";

import type { ResearchFinding } from "@/types";

interface SourceCardProps {
  finding: ResearchFinding;
}

export function SourceCard({ finding }: SourceCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-2">
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            finding.sourceType === "paper"
              ? "bg-purple-400"
              : finding.sourceType === "web"
                ? "bg-blue-400"
                : "bg-green-400"
          }`}
        />
        <span className="text-[10px] text-zinc-500 uppercase">
          {finding.sourceType}
        </span>
      </div>
      <p className="text-xs text-zinc-300 font-medium line-clamp-1">
        {finding.title}
      </p>
      <p className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5">
        {finding.content.slice(0, 150)}
      </p>
    </div>
  );
}
