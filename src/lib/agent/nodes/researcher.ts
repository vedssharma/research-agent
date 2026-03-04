import { getModel } from "@/lib/utils/model";
import { RESEARCHER_PROMPT } from "@/lib/utils/prompts";
import { getWebSearchTool, paperSearchTool, contentExtractorTool } from "@/lib/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { AgentStateType } from "../state";
import type { SubTask, ResearchFinding } from "@/types";

function getTools() {
  return [getWebSearchTool(), paperSearchTool, contentExtractorTool];
}

async function researchTask(task: SubTask): Promise<SubTask> {
  const model = getModel();
  const tools = getTools();
  const modelWithTools = model.bindTools(tools);

  const updatedTask: SubTask = { ...task, status: "in_progress", findings: [] };

  try {
    const response = await modelWithTools.invoke([
      new SystemMessage(RESEARCHER_PROMPT),
      new HumanMessage(
        `Research this sub-task: "${task.query}"\nTask type: ${task.type}`
      ),
    ]);

    const findings: ResearchFinding[] = [];
    const toolCalls = response.tool_calls || [];

    // Execute each tool call
    for (const toolCall of toolCalls) {
      try {
        const tool = tools.find((t) => t.name === toolCall.name);
        if (!tool) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (tool as any).invoke(toolCall.args);
        const resultStr = typeof result === "string" ? result : JSON.stringify(result);

        const sourceType: ResearchFinding["sourceType"] =
          toolCall.name === "search_papers"
            ? "paper"
            : toolCall.name === "extract_content"
              ? "extraction"
              : "web";

        findings.push({
          source: toolCall.name,
          title: `Results from ${toolCall.name}`,
          content: resultStr.slice(0, 2000),
          relevance: 0.8,
          sourceType,
        });
      } catch {
        // Skip failed tool calls
      }
    }

    if (toolCalls.length === 0 && typeof response.content === "string") {
      findings.push({
        source: "llm",
        title: "Direct response",
        content: response.content.slice(0, 2000),
        relevance: 0.5,
        sourceType: "web",
      });
    }

    updatedTask.status = "completed";
    updatedTask.findings = findings;
  } catch {
    updatedTask.status = "failed";
  }

  return updatedTask;
}

export async function researcherNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const pendingTasks = state.subTasks.filter((t) => t.status === "pending");
  if (pendingTasks.length === 0) {
    return { currentPhase: "researching" };
  }

  // Research all pending tasks simultaneously
  const completedTasks = await Promise.all(pendingTasks.map(researchTask));

  return {
    subTasks: completedTasks,
    currentPhase: "researching",
    currentTaskIndex: state.currentTaskIndex + pendingTasks.length,
  };
}
