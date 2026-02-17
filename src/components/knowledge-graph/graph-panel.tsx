"use client";

import { GraphViewer } from "./graph-viewer";
import type { KGNodeData, KGEdgeData } from "@/types";

interface GraphPanelProps {
  nodes: KGNodeData[];
  edges: KGEdgeData[];
}

const typeColors: Record<string, string> = {
  concept: "bg-blue-400",
  entity: "bg-green-400",
  paper: "bg-purple-400",
  fact: "bg-yellow-400",
  claim: "bg-red-400",
};

export function GraphPanel({ nodes, edges }: GraphPanelProps) {
  return (
    <div className="border-t border-zinc-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Knowledge Graph
        </h3>
        {nodes.length > 0 && (
          <span className="text-[10px] text-zinc-500">
            {nodes.length} nodes &middot; {edges.length} edges
          </span>
        )}
      </div>
      {nodes.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {Object.entries(typeColors).map(([type, color]) => {
            const count = nodes.filter((n) => n.type === type).length;
            if (count === 0) return null;
            return (
              <div key={type} className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                <span className="text-[9px] text-zinc-500">
                  {type} ({count})
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div className="rounded-lg bg-zinc-900 border border-zinc-800 h-56 overflow-hidden">
        <GraphViewer nodes={nodes} edges={edges} />
      </div>
    </div>
  );
}
