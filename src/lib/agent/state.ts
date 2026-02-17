import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import type { SubTask, AgentPhase } from "@/types";
import type { KnowledgeGraphData } from "@/lib/knowledge-graph/types";
import { mergeNodes, mergeEdges } from "@/lib/knowledge-graph/operations";

export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,

  originalQuestion: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),

  subTasks: Annotation<SubTask[]>({
    reducer: (prev, next) => {
      const map = new Map(prev.map((t) => [t.id, t]));
      for (const t of next) {
        map.set(t.id, { ...map.get(t.id)!, ...t });
      }
      return Array.from(map.values());
    },
    default: () => [],
  }),

  currentTaskIndex: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 0,
  }),

  knowledgeGraph: Annotation<KnowledgeGraphData>({
    reducer: (prev, next) => ({
      nodes: mergeNodes(prev.nodes, next.nodes),
      edges: mergeEdges(prev.edges, next.edges),
    }),
    default: () => ({ nodes: [], edges: [] }),
  }),

  finalAnswer: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),

  currentPhase: Annotation<AgentPhase>({
    reducer: (_, next) => next,
    default: () => "planning" as AgentPhase,
  }),

  /** ID of the persisted session written by the synthesizer after completion */
  sessionId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
});

export type AgentStateType = typeof AgentState.State;
