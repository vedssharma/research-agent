"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { jsonSchema } from "ai";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { StreamingIndicator } from "./streaming-indicator";
import { TaskPanel } from "../research/task-panel";
import { ResearchTimeline } from "../research/research-timeline";
import { GraphPanel } from "../knowledge-graph/graph-panel";
import {
  type AgentProgressData,
  type SubTask,
  type KGNodeData,
  type KGEdgeData,
  type AgentPhase,
  type ResearchUIMessage,
} from "@/types";

// jsonSchema() satisfies FlexibleSchema<AgentProgressData> — Zod v4 schemas don't
// because FlexibleSchema expects the Zod v3 internal interface (_parse, etc.)
const agentProgressDataSchema = jsonSchema<AgentProgressData>({
  type: "object",
  properties: {
    phase: { type: "string" },
    subTasks: { type: "array" },
    knowledgeGraph: { type: "object" },
  },
  additionalProperties: true,
});

export function ChatInterface() {
  const [tasks, setTasks] = useState<SubTask[]>([]);
  const [kgNodes, setKgNodes] = useState<KGNodeData[]>([]);
  const [kgEdges, setKgEdges] = useState<KGEdgeData[]>([]);
  const [phase, setPhase] = useState<AgentPhase | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat<ResearchUIMessage>({
    dataPartSchemas: { "agent-progress": agentProgressDataSchema },
    onData: (part) => {
      // DataUIPart.type is "data-{key}" — the data- prefix is always included
      if (part.type !== "data-agent-progress") return;
      const { phase: p, subTasks, knowledgeGraph } = part.data;
      if (p) setPhase(p);
      if (subTasks) setTasks(subTasks as SubTask[]);
      if (knowledgeGraph) {
        setKgNodes(knowledgeGraph.nodes as KGNodeData[]);
        setKgEdges(knowledgeGraph.edges as KGEdgeData[]);
      }
    },
    onFinish: () => {
      setPhase("complete");
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setPhase("planning");
    setTasks([]);
    setKgNodes([]);
    setKgEdges([]);

    sendMessage({ text: input });
    setInput("");
  };

  const hasSidebarContent = tasks.length > 0 || kgNodes.length > 0;

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-zinc-200">
              Research Agent
            </h1>
            <p className="text-[10px] text-zinc-500">
              Autonomous web &amp; paper research with knowledge graph
            </p>
          </div>
          {hasSidebarContent && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded border border-zinc-800 transition-colors"
            >
              {sidebarOpen ? "Hide Panel" : "Show Panel"}
            </button>
          )}
        </header>

        <MessageList messages={messages} />
        <StreamingIndicator isLoading={isLoading} phase={phase} />
        <ChatInput
          input={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>

      {/* Research Side Panel */}
      {sidebarOpen && hasSidebarContent && (
        <aside className="w-80 border-l border-zinc-800 bg-zinc-950 overflow-y-auto flex-shrink-0">
          <TaskPanel tasks={tasks} />
          <ResearchTimeline tasks={tasks} />
          <GraphPanel nodes={kgNodes} edges={kgEdges} />
        </aside>
      )}
    </div>
  );
}
