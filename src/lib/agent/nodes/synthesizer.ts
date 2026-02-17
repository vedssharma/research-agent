import { getModel } from "@/lib/utils/model";
import { SYNTHESIZER_PROMPT } from "@/lib/utils/prompts";
import { KnowledgeGraph } from "@/lib/knowledge-graph/graph";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { saveSession, getRelevantContext } from "@/lib/mcp/storage";
import type { AgentStateType } from "../state";

export async function synthesizerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const model = getModel();
  const kg = new KnowledgeGraph(state.knowledgeGraph);
  const kgText = kg.toText();

  const allFindings = state.subTasks
    .filter((t) => t.status === "completed")
    .flatMap((t) => t.findings)
    .map((f) => `- ${f.title}: ${f.content.slice(0, 500)}`)
    .join("\n");

  // Pull relevant past sessions to supplement current research
  const pastContext = await getRelevantContext(state.originalQuestion, 2).catch(() => "");

  const contextParts: string[] = [];
  if (kgText.length > 30) {
    contextParts.push(`Knowledge Graph:\n${kgText}`);
  }
  if (allFindings.length > 0) {
    contextParts.push(`Research Findings:\n${allFindings}`);
  }
  if (pastContext) {
    contextParts.push(`Relevant Past Research (from memory):\n${pastContext}`);
  }

  const context =
    contextParts.length > 0
      ? contextParts.join("\n\n")
      : "No specific research data was gathered. Answer based on your general knowledge.";

  // Use stream() so LangGraph emits token-level 'messages' events
  const modelStream = await model.stream([
    new SystemMessage(SYNTHESIZER_PROMPT),
    new HumanMessage(
      `${context}\n\n---\n\nOriginal Question: ${state.originalQuestion}\n\nPlease provide a comprehensive answer.`
    ),
  ]);

  // Aggregate chunks to build the final AIMessage for state
  let answerText = "";
  for await (const chunk of modelStream) {
    const content = chunk.content;
    if (typeof content === "string") {
      answerText += content;
    } else if (Array.isArray(content)) {
      for (const block of content) {
        if (block && typeof block === "object" && "text" in block) {
          answerText += String(block.text);
        }
      }
    }
  }

  // Persist the completed session for future reference (fire-and-forget; never blocks the response)
  const allRawFindings = state.subTasks.flatMap((t) => t.findings);
  const sessionId = await saveSession({
    question: state.originalQuestion,
    subTasks: state.subTasks,
    findings: allRawFindings,
    knowledgeGraph: state.knowledgeGraph,
    finalAnswer: answerText,
  }).catch(() => "");

  return {
    messages: [new AIMessage(answerText)],
    finalAnswer: answerText,
    currentPhase: "complete",
    sessionId,
  };
}
