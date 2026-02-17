#!/usr/bin/env node
/**
 * Research Memory MCP Server
 *
 * A standalone Model Context Protocol server that provides persistent storage
 * for research sessions. Run with:
 *   npm run mcp-server
 *
 * Exposes 5 tools:
 *   - save_research_session      Save a completed session
 *   - list_research_sessions     List recent sessions
 *   - search_research_sessions   Keyword search across sessions
 *   - get_research_session       Retrieve a session by ID
 *   - get_relevant_context       Get formatted past context for a new question
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  saveSession,
  listSessions,
  searchSessions,
  getSession,
  getRelevantContext,
} from "./storage.js";

const server = new McpServer({
  name: "research-memory",
  version: "1.0.0",
});

// ── Tool: save_research_session ──────────────────────────────────────────────

server.tool(
  "save_research_session",
  "Save a completed research session to persistent local storage so it can be referenced in future queries",
  {
    question: z.string().describe("The original research question"),
    finalAnswer: z.string().describe("The synthesized final answer"),
    subTasks: z
      .array(z.any())
      .optional()
      .describe("Array of completed sub-tasks with their findings"),
    findings: z
      .array(z.any())
      .optional()
      .describe("Flat array of all research findings"),
    knowledgeGraph: z
      .any()
      .optional()
      .describe("Knowledge graph { nodes, edges } extracted during research"),
  },
  async ({ question, finalAnswer, subTasks, findings, knowledgeGraph }) => {
    try {
      const id = await saveSession({
        question,
        finalAnswer,
        subTasks: (subTasks as never[]) ?? [],
        findings: (findings as never[]) ?? [],
        knowledgeGraph: (knowledgeGraph as never) ?? { nodes: [], edges: [] },
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ sessionId: id, saved: true }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error saving session: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool: list_research_sessions ─────────────────────────────────────────────

server.tool(
  "list_research_sessions",
  "List recent research sessions with metadata (question, date, tags, task count)",
  {
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(20)
      .describe("Maximum number of sessions to return"),
  },
  async ({ limit }) => {
    try {
      const sessions = await listSessions(limit);
      return {
        content: [{ type: "text", text: JSON.stringify(sessions, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error listing sessions: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool: search_research_sessions ───────────────────────────────────────────

server.tool(
  "search_research_sessions",
  "Search past research sessions by keyword. Returns matching sessions ranked by relevance.",
  {
    query: z.string().describe("Keywords to search for across question text and topic tags"),
    limit: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .default(5)
      .describe("Maximum number of results to return"),
  },
  async ({ query, limit }) => {
    try {
      const sessions = await searchSessions(query, limit);
      return {
        content: [{ type: "text", text: JSON.stringify(sessions, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error searching sessions: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool: get_research_session ───────────────────────────────────────────────

server.tool(
  "get_research_session",
  "Retrieve the full data for a specific past research session including all findings and knowledge graph",
  {
    sessionId: z.string().describe("The session UUID returned by save or search tools"),
  },
  async ({ sessionId }) => {
    try {
      const session = await getSession(sessionId);
      if (!session) {
        return {
          content: [{ type: "text", text: `No session found with ID: ${sessionId}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(session, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error retrieving session: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool: get_relevant_context ────────────────────────────────────────────────

server.tool(
  "get_relevant_context",
  "Get formatted summaries from past research sessions that are relevant to a new question. Useful for avoiding duplicate research.",
  {
    question: z.string().describe("The new research question to find relevant past context for"),
    limit: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .default(3)
      .describe("Maximum number of past sessions to include in context"),
  },
  async ({ question, limit }) => {
    try {
      const context = await getRelevantContext(question, limit);
      return {
        content: [
          {
            type: "text",
            text: context || "No relevant past research found.",
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error retrieving context: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

// ── Start server ──────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[research-memory] MCP server listening on stdio");
}

main().catch((err) => {
  console.error("[research-memory] Fatal error:", err);
  process.exit(1);
});
