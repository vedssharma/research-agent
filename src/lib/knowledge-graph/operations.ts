import type { KGNode, KGEdge } from "./types";

export function mergeNodes(existing: KGNode[], incoming: KGNode[]): KGNode[] {
  const map = new Map(existing.map((n) => [n.id, n]));
  for (const node of incoming) {
    const prev = map.get(node.id);
    if (prev) {
      map.set(node.id, {
        ...prev,
        properties: { ...prev.properties, ...node.properties },
        sources: [...new Set([...prev.sources, ...node.sources])],
      });
    } else {
      map.set(node.id, node);
    }
  }
  return Array.from(map.values());
}

export function mergeEdges(existing: KGEdge[], incoming: KGEdge[]): KGEdge[] {
  const key = (e: KGEdge) => `${e.source}::${e.target}::${e.relationship}`;
  const map = new Map(existing.map((e) => [key(e), e]));
  for (const edge of incoming) {
    const k = key(edge);
    const prev = map.get(k);
    if (prev) {
      map.set(k, {
        ...prev,
        weight: Math.max(prev.weight, edge.weight),
        evidence: prev.evidence.includes(edge.evidence)
          ? prev.evidence
          : `${prev.evidence}; ${edge.evidence}`,
      });
    } else {
      map.set(k, edge);
    }
  }
  return Array.from(map.values());
}
