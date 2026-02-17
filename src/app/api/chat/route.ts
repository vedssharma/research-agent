import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
} from "ai";
import { toBaseMessages } from "@ai-sdk/langchain";
import { compiledGraph } from "@/lib/agent/graph";
import { agentProgressSchema, type ResearchUIMessage } from "@/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { messages }: { messages: ResearchUIMessage[] } = await req.json();
  const langchainMessages = await toBaseMessages(messages);

  const lastMessage = messages[messages.length - 1];
  const question =
    lastMessage?.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("") || "";

  const graphStream = await compiledGraph.stream(
    { messages: langchainMessages, originalQuestion: question },
    { streamMode: ["values", "messages"] }
  );

  const stream = createUIMessageStream<ResearchUIMessage>({
    // execute receives { writer }, not writer directly
    execute: async ({ writer }) => {
      // Track the active text part across streaming chunks
      let textPartId: string | null = null;

      for await (const chunk of graphStream) {
        // LangGraph emits [modeType, data] tuples with multiple streamModes
        if (!Array.isArray(chunk)) continue;
        const [mode, data] = chunk as [string, unknown];

        if (mode === "messages") {
          // data is [BaseMessageChunk, metadata] — extract text content
          const [messageChunk] = Array.isArray(data) ? data : [data];
          const content = (messageChunk as { content?: unknown })?.content;

          let text = "";
          if (typeof content === "string") {
            text = content;
          } else if (Array.isArray(content)) {
            for (const block of content) {
              if (
                block &&
                typeof block === "object" &&
                "type" in block &&
                block.type === "text" &&
                "text" in block &&
                typeof block.text === "string"
              ) {
                text += block.text;
              }
            }
          }

          if (text) {
            if (!textPartId) {
              textPartId = generateId();
              writer.write({ type: "text-start", id: textPartId });
            }
            writer.write({ type: "text-delta", id: textPartId, delta: text });
          }
        } else if (mode === "values") {
          // data is the full agent state snapshot — send as a progress data part
          const state = data as {
            currentPhase?: string;
            subTasks?: unknown[];
            knowledgeGraph?: unknown;
          };

          const progressData = agentProgressSchema.safeParse({
            phase: state.currentPhase,
            subTasks: state.subTasks,
            knowledgeGraph: state.knowledgeGraph,
          });

          if (progressData.success) {
            writer.write({
              type: "data-agent-progress",
              id: generateId(),
              data: progressData.data,
            });
          }
        }
      }

      // Close the text part once the stream is exhausted
      if (textPartId) {
        writer.write({ type: "text-end", id: textPartId });
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
