import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { searchSessions, getSession } from "@/lib/mcp/storage";

/**
 * Returns LangChain tools that let the researcher node query persistent memory.
 * These wrap the same storage layer used by the MCP server, so data is shared.
 */
export function getMemoryTools() {
  return [
    new DynamicStructuredTool({
      name: "search_past_research",
      description:
        "Search previously completed research sessions by keyword. " +
        "Call this BEFORE conducting new web or paper searches to check if relevant " +
        "information was already gathered in a prior session.",
      schema: z.object({
        query: z.string().describe("Keywords related to the topic you are researching"),
      }),
      func: async ({ query }) => {
        try {
          const sessions = await searchSessions(query, 3);
          if (sessions.length === 0) return "No past research found on this topic.";
          return JSON.stringify(
            sessions.map((s) => ({
              id: s.id,
              question: s.question,
              date: new Date(s.createdAt).toLocaleDateString(),
              tags: s.tags,
              taskCount: s.taskCount,
              findingCount: s.findingCount,
            })),
            null,
            2
          );
        } catch {
          return "Memory search unavailable.";
        }
      },
    }),

    new DynamicStructuredTool({
      name: "recall_research_session",
      description:
        "Retrieve the full findings and answer from a specific past research session by its ID. " +
        "Use the ID returned by search_past_research to get detailed content.",
      schema: z.object({
        sessionId: z
          .string()
          .describe("The session UUID returned by search_past_research"),
      }),
      func: async ({ sessionId }) => {
        try {
          const session = await getSession(sessionId);
          if (!session) return "Session not found.";

          const findingLines = session.findings
            .slice(0, 8)
            .map((f) => `[${f.sourceType}] ${f.title}: ${f.content.slice(0, 300)}`)
            .join("\n");

          return (
            `Original Question: ${session.question}\n` +
            `Researched on: ${new Date(session.createdAt).toLocaleDateString()}\n\n` +
            `Key Findings:\n${findingLines || "(no findings recorded)"}\n\n` +
            `Summary:\n${session.finalAnswer.slice(0, 800)}`
          );
        } catch {
          return "Could not retrieve session.";
        }
      },
    }),
  ];
}
