"use client";

import { SourceCard } from "./source-card";
import type { SubTask } from "@/types";

interface ResearchTimelineProps {
  tasks: SubTask[];
}

export function ResearchTimeline({ tasks }: ResearchTimelineProps) {
  const completedTasks = tasks.filter(
    (t) => t.status === "completed" && t.findings.length > 0
  );

  if (completedTasks.length === 0) return null;

  return (
    <div className="p-3 border-t border-zinc-800">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        Sources Found
      </h3>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {completedTasks.flatMap((task) =>
          task.findings.map((finding, i) => (
            <SourceCard key={`${task.id}-${i}`} finding={finding} />
          ))
        )}
      </div>
    </div>
  );
}
