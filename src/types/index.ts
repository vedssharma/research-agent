import { z } from "zod";
import type { UIMessage } from "ai";

export interface SubTask {
  id: string;
  query: string;
  type: "web_search" | "paper_search" | "deep_dive";
  status: "pending" | "in_progress" | "completed" | "failed";
  findings: ResearchFinding[];
}

export interface ResearchFinding {
  source: string;
  title: string;
  content: string;
  relevance: number;
  sourceType: "web" | "paper" | "extraction";
}

export type AgentPhase =
  | "planning"
  | "researching"
  | "building_kg"
  | "synthesizing"
  | "complete";

export interface KGNodeData {
  id: string;
  label: string;
  type: "concept" | "entity" | "paper" | "fact" | "claim";
  properties: Record<string, unknown>;
  sources: string[];
}

export interface KGEdgeData {
  source: string;
  target: string;
  relationship: string;
  weight: number;
  evidence: string;
}

// ── Typed data part for streaming progress to the client ──────────────────────

export const agentProgressSchema = z.object({
  phase: z.enum(["planning", "researching", "building_kg", "synthesizing", "complete"]).optional(),
  subTasks: z
    .array(
      z.object({
        id: z.string(),
        query: z.string(),
        type: z.enum(["web_search", "paper_search", "deep_dive"]),
        status: z.enum(["pending", "in_progress", "completed", "failed"]),
        findings: z.array(
          z.object({
            source: z.string(),
            title: z.string(),
            content: z.string(),
            relevance: z.number(),
            sourceType: z.enum(["web", "paper", "extraction"]),
          })
        ),
      })
    )
    .optional(),
  knowledgeGraph: z
    .object({
      nodes: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          type: z.enum(["concept", "entity", "paper", "fact", "claim"]),
          properties: z.record(z.string(), z.unknown()),
          sources: z.array(z.string()),
        })
      ),
      edges: z.array(
        z.object({
          source: z.string(),
          target: z.string(),
          relationship: z.string(),
          weight: z.number(),
          evidence: z.string(),
        })
      ),
    })
    .optional(),
});

export type AgentProgressData = z.infer<typeof agentProgressSchema>;

/**
 * UIMessage type with our custom data part schemas.
 * The VALUE in the DATA_PARTS map must be the inferred TypeScript type,
 * NOT the Zod schema type itself.
 */
export type ResearchUIMessage = UIMessage<
  unknown,
  { "agent-progress": AgentProgressData }
>;
