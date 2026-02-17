import type { KGNode, KGEdge, KnowledgeGraphData } from "./types";

export class KnowledgeGraph {
  private nodes: Map<string, KGNode>;
  private adjacency: Map<string, KGEdge[]>;

  constructor(data?: KnowledgeGraphData) {
    this.nodes = new Map();
    this.adjacency = new Map();

    if (data) {
      for (const node of data.nodes) {
        this.nodes.set(node.id, node);
      }
      for (const edge of data.edges) {
        const edges = this.adjacency.get(edge.source) || [];
        edges.push(edge);
        this.adjacency.set(edge.source, edges);
      }
    }
  }

  addNode(node: KGNode): void {
    const existing = this.nodes.get(node.id);
    if (existing) {
      this.nodes.set(node.id, {
        ...existing,
        properties: { ...existing.properties, ...node.properties },
        sources: [...new Set([...existing.sources, ...node.sources])],
      });
    } else {
      this.nodes.set(node.id, node);
    }
  }

  addEdge(edge: KGEdge): void {
    const edges = this.adjacency.get(edge.source) || [];
    const existing = edges.find(
      (e) => e.target === edge.target && e.relationship === edge.relationship
    );
    if (existing) {
      existing.weight = Math.max(existing.weight, edge.weight);
    } else {
      edges.push(edge);
      this.adjacency.set(edge.source, edges);
    }
  }

  getConnectedSubgraph(
    nodeId: string,
    depth: number
  ): KnowledgeGraphData {
    const visited = new Set<string>();
    const resultNodes: KGNode[] = [];
    const resultEdges: KGEdge[] = [];
    const queue: { id: string; d: number }[] = [{ id: nodeId, d: 0 }];

    while (queue.length > 0) {
      const { id, d } = queue.shift()!;
      if (visited.has(id) || d > depth) continue;
      visited.add(id);

      const node = this.nodes.get(id);
      if (node) resultNodes.push(node);

      const edges = this.adjacency.get(id) || [];
      for (const edge of edges) {
        resultEdges.push(edge);
        if (!visited.has(edge.target)) {
          queue.push({ id: edge.target, d: d + 1 });
        }
      }
    }

    return { nodes: resultNodes, edges: resultEdges };
  }

  toText(): string {
    const nodeLines = Array.from(this.nodes.values()).map(
      (n) => `- [${n.type}] ${n.label} (${n.id})`
    );

    const edgeLines: string[] = [];
    for (const edges of this.adjacency.values()) {
      for (const e of edges) {
        edgeLines.push(
          `- ${e.source} --[${e.relationship}]--> ${e.target} (confidence: ${e.weight})`
        );
      }
    }

    let text = "## Entities\n" + nodeLines.join("\n");
    if (edgeLines.length > 0) {
      text += "\n\n## Relationships\n" + edgeLines.join("\n");
    }

    // Truncate to ~8000 chars to stay within token limits
    if (text.length > 8000) {
      text = text.slice(0, 8000) + "\n... (truncated)";
    }

    return text;
  }

  toData(): KnowledgeGraphData {
    const edges: KGEdge[] = [];
    for (const edgeList of this.adjacency.values()) {
      edges.push(...edgeList);
    }
    return {
      nodes: Array.from(this.nodes.values()),
      edges,
    };
  }
}
