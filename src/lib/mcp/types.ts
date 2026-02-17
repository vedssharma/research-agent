import type { SubTask, ResearchFinding } from "../../types";
import type { KnowledgeGraphData } from "../knowledge-graph/types";

export interface StoredSession {
  id: string;
  createdAt: string;
  question: string;
  subTasks: SubTask[];
  findings: ResearchFinding[];
  knowledgeGraph: KnowledgeGraphData;
  finalAnswer: string;
  tags: string[];
}

export interface SessionMeta {
  id: string;
  createdAt: string;
  question: string;
  tags: string[];
  taskCount: number;
  findingCount: number;
}

export interface SessionIndex {
  sessions: SessionMeta[];
}
