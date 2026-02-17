import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import { plannerNode } from "./nodes/planner";
import { researcherNode } from "./nodes/researcher";
import { knowledgeGraphBuilderNode } from "./nodes/knowledge-graph-builder";
import { synthesizerNode } from "./nodes/synthesizer";
import { routeAfterPlanning, routeAfterKGUpdate } from "./edges/routing";

const graph = new StateGraph(AgentState)
  .addNode("planner", plannerNode)
  .addNode("researcher", researcherNode)
  .addNode("kg_builder", knowledgeGraphBuilderNode)
  .addNode("synthesizer", synthesizerNode)
  .addEdge(START, "planner")
  .addConditionalEdges("planner", routeAfterPlanning, [
    "researcher",
    "synthesizer",
  ])
  .addEdge("researcher", "kg_builder")
  .addConditionalEdges("kg_builder", routeAfterKGUpdate, [
    "researcher",
    "synthesizer",
  ])
  .addEdge("synthesizer", END);

export const compiledGraph = graph.compile();
