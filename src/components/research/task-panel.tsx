"use client";

import { TaskItem } from "./task-item";
import type { SubTask } from "@/types";

interface TaskPanelProps {
  tasks: SubTask[];
}

export function TaskPanel({ tasks }: TaskPanelProps) {
  if (tasks.length === 0) return null;

  const completed = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Research Tasks
        </h3>
        <span className="text-[10px] text-zinc-500">
          {completed}/{tasks.length}
        </span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
