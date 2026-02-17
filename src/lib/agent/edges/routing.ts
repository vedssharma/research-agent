import type { AgentStateType } from "../state";

export function routeAfterPlanning(state: AgentStateType): string {
  if (state.subTasks.length === 0) {
    return "synthesizer";
  }
  return "researcher";
}

export function routeAfterKGUpdate(state: AgentStateType): string {
  const pendingTasks = state.subTasks.filter((t) => t.status === "pending");
  if (pendingTasks.length > 0) {
    return "researcher";
  }
  return "synthesizer";
}
