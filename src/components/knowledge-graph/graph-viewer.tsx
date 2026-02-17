"use client";

import { useRef, useEffect, useCallback } from "react";
import type { KGNodeData, KGEdgeData } from "@/types";

interface GraphViewerProps {
  nodes: KGNodeData[];
  edges: KGEdgeData[];
}

const typeColors: Record<string, string> = {
  concept: "#60a5fa",
  entity: "#34d399",
  paper: "#a78bfa",
  fact: "#fbbf24",
  claim: "#f87171",
};

interface NodePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
  node: KGNodeData;
}

export function GraphViewer({ nodes, edges }: GraphViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionsRef = useRef<Map<string, NodePosition>>(new Map());
  const animFrameRef = useRef<number>(0);

  const initPositions = useCallback(() => {
    const existing = positionsRef.current;
    const newMap = new Map<string, NodePosition>();

    for (const node of nodes) {
      if (existing.has(node.id)) {
        newMap.set(node.id, { ...existing.get(node.id)!, node });
      } else {
        newMap.set(node.id, {
          x: 150 + Math.random() * 200,
          y: 100 + Math.random() * 150,
          vx: 0,
          vy: 0,
          node,
        });
      }
    }

    positionsRef.current = newMap;
  }, [nodes]);

  useEffect(() => {
    initPositions();
  }, [initPositions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const positions = positionsRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Simple force-directed simulation step
      const posArray = Array.from(positions.values());

      // Repulsion between all nodes
      for (let i = 0; i < posArray.length; i++) {
        for (let j = i + 1; j < posArray.length; j++) {
          const a = posArray[i];
          const b = posArray[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 800 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }

      // Attraction along edges
      for (const edge of edges) {
        const a = positions.get(edge.source);
        const b = positions.get(edge.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 80) * 0.01;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      // Center gravity
      for (const p of posArray) {
        p.vx += (w / 2 - p.x) * 0.001;
        p.vy += (h / 2 - p.y) * 0.001;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx;
        p.y += p.vy;
        p.x = Math.max(20, Math.min(w - 20, p.x));
        p.y = Math.max(20, Math.min(h - 20, p.y));
      }

      // Draw edges
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 1;
      for (const edge of edges) {
        const a = positions.get(edge.source);
        const b = positions.get(edge.target);
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        // Edge label
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        ctx.fillStyle = "#6b7280";
        ctx.font = "8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(edge.relationship, mx, my - 3);
      }

      // Draw nodes
      for (const p of posArray) {
        const color = typeColors[p.node.type] || "#9ca3af";

        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = "#e5e7eb";
        ctx.font = "9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(p.node.label, p.x, p.y + 16);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [nodes, edges]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-xs">
        Knowledge graph will appear here
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={300}
      className="w-full h-full"
    />
  );
}
