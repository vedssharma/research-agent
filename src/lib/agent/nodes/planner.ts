import { z } from "zod";
import { getModel } from "@/lib/utils/model";
import { PLANNER_PROMPT } from "@/lib/utils/prompts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { AgentStateType } from "../state";

const researchPlanSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string().describe("Unique kebab-case task ID"),
      query: z.string().describe("Specific search query for this sub-task"),
      type: z
        .enum(["web_search", "paper_search", "deep_dive"])
        .describe("Type of research to perform"),
    })
  ),
});

export async function plannerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const model = getModel();
  const lastMessage = state.messages[state.messages.length - 1];
  const question =
    typeof lastMessage.content === "string"
      ? lastMessage.content
      : String(lastMessage.content);

  const modelWithTools = model.bindTools([
    {
      name: "create_research_plan",
      description:
        "Create a research plan with sub-tasks to answer the question",
      schema: researchPlanSchema,
    },
  ]);

  const response = await modelWithTools.invoke([
    new SystemMessage(PLANNER_PROMPT),
    new HumanMessage(question),
  ]);

  const toolCalls = response.tool_calls || [];
  const planCall = toolCalls.find(
    (tc) => tc.name === "create_research_plan"
  );

  if (planCall && planCall.args?.tasks?.length > 0) {
    const subTasks = planCall.args.tasks.map(
      (t: { id: string; query: string; type: string }) => ({
        id: t.id,
        query: t.query,
        type: t.type as "web_search" | "paper_search" | "deep_dive",
        status: "pending" as const,
        findings: [],
      })
    );

    return {
      originalQuestion: question,
      subTasks,
      currentPhase: "planning",
      currentTaskIndex: 0,
    };
  }

  // Simple question — no decomposition needed
  return {
    originalQuestion: question,
    subTasks: [],
    currentPhase: "planning",
  };
}
