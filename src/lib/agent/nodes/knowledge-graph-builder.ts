import { z } from "zod";
import { getModel } from "@/lib/utils/model";
import { KG_BUILDER_PROMPT } from "@/lib/utils/prompts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { AgentStateType } from "../state";
import type { KnowledgeGraphData } from "@/lib/knowledge-graph/types";

const kgExtractionSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string().describe("Unique kebab-case ID"),
      label: z.string().describe("Human-readable name"),
      type: z
        .enum(["concept", "entity", "paper", "fact", "claim"])
        .describe("Node type"),
      properties: z
        .record(z.string(), z.unknown())
        .describe("Additional properties like url, year, etc."),
    })
  ),
  edges: z.array(
    z.object({
      source: z.string().describe("Source node ID"),
      target: z.string().describe("Target node ID"),
      relationship: z
        .string()
        .describe(
          "Relationship type: relates_to, supports, contradicts, part_of, authored_by, caused_by, enables, requires"
        ),
      weight: z.number().min(0).max(1).describe("Confidence weight"),
      evidence: z.string().describe("Brief evidence text"),
    })
  ),
});

export async function knowledgeGraphBuilderNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  // Find the most recently completed task with findings
  const completedTasks = state.subTasks.filter(
    (t) => t.status === "completed" && t.findings.length > 0
  );

  if (completedTasks.length === 0) {
    return { currentPhase: "building_kg" };
  }

  // Get findings from the latest completed task
  const latestTask = completedTasks[completedTasks.length - 1];
  const findingsText = latestTask.findings
    .map((f) => `### ${f.title}\nSource: ${f.source}\n${f.content}`)
    .join("\n\n");

  const model = getModel();
  const modelWithTools = model.bindTools([
    {
      name: "extract_knowledge_graph",
      description:
        "Extract entities and relationships from research findings into a knowledge graph",
      schema: kgExtractionSchema,
    },
  ]);

  const response = await modelWithTools.invoke([
    new SystemMessage(KG_BUILDER_PROMPT),
    new HumanMessage(
      `Extract entities and relationships from these research findings about "${latestTask.query}":\n\n${findingsText}`
    ),
  ]);

  const toolCalls = response.tool_calls || [];
  const kgCall = toolCalls.find(
    (tc) => tc.name === "extract_knowledge_graph"
  );

  if (kgCall) {
    const kgData: KnowledgeGraphData = {
      nodes: (kgCall.args.nodes || []).map(
        (n: { id: string; label: string; type: string; properties: Record<string, unknown> }) => ({
          ...n,
          sources: [latestTask.id],
        })
      ),
      edges: kgCall.args.edges || [],
    };

    return {
      knowledgeGraph: kgData,
      currentPhase: "building_kg",
    };
  }

  return { currentPhase: "building_kg" };
}
