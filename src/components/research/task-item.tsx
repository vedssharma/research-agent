"use client";

import type { SubTask } from "@/types";

interface TaskItemProps {
  task: SubTask;
}

const statusConfig = {
  pending: { icon: "\u25CB", color: "text-zinc-500", bg: "bg-zinc-800" },
  in_progress: { icon: "\u25CF", color: "text-blue-400", bg: "bg-blue-900/30" },
  completed: { icon: "\u2713", color: "text-green-400", bg: "bg-green-900/30" },
  failed: { icon: "\u2717", color: "text-red-400", bg: "bg-red-900/30" },
};

export function TaskItem({ task }: TaskItemProps) {
  const config = statusConfig[task.status];

  return (
    <div className={`rounded-lg px-3 py-2 ${config.bg} border border-zinc-800`}>
      <div className="flex items-start gap-2">
        <span
          className={`${config.color} text-sm mt-0.5 ${task.status === "in_progress" ? "animate-pulse" : ""}`}
        >
          {config.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-300 truncate">
            {task.query}
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {task.type.replace("_", " ")} &middot; {task.status.replace("_", " ")}
          </p>
          {task.findings.length > 0 && (
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {task.findings.length} finding{task.findings.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
