export interface KGNode {
  id: string;
  label: string;
  type: "concept" | "entity" | "paper" | "fact" | "claim";
  properties: Record<string, unknown>;
  sources: string[];
}

export interface KGEdge {
  source: string;
  target: string;
  relationship: string;
  weight: number;
  evidence: string;
}

export interface KnowledgeGraphData {
  nodes: KGNode[];
  edges: KGEdge[];
}
