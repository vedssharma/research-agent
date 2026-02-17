import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { StoredSession, SessionMeta, SessionIndex } from "./types";
import type { SubTask, ResearchFinding } from "../../types";
import type { KnowledgeGraphData } from "../knowledge-graph/types";

const STORAGE_DIR = path.join(process.cwd(), ".research-memory");
const SESSIONS_DIR = path.join(STORAGE_DIR, "sessions");
const INDEX_FILE = path.join(STORAGE_DIR, "index.json");

async function ensureDirs(): Promise<void> {
  await fs.mkdir(SESSIONS_DIR, { recursive: true });
}

async function readIndex(): Promise<SessionIndex> {
  try {
    const data = await fs.readFile(INDEX_FILE, "utf-8");
    return JSON.parse(data) as SessionIndex;
  } catch {
    return { sessions: [] };
  }
}

async function writeIndex(index: SessionIndex): Promise<void> {
  await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), "utf-8");
}

function extractTags(text: string): string[] {
  const stopWords = new Set([
    "that", "this", "with", "from", "have", "been", "what", "when",
    "where", "which", "will", "your", "they", "their", "them", "then",
    "than", "also", "some", "more", "over", "into", "only", "both",
    "about", "would", "could", "should", "does", "make",
  ]);
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? [];
  const freq: Record<string, number> = {};
  for (const word of words) {
    if (!stopWords.has(word)) freq[word] = (freq[word] ?? 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

export async function saveSession(input: {
  question: string;
  subTasks: SubTask[];
  findings: ResearchFinding[];
  knowledgeGraph: KnowledgeGraphData;
  finalAnswer: string;
}): Promise<string> {
  await ensureDirs();

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const tags = extractTags(input.question + " " + input.finalAnswer);

  const stored: StoredSession = { id, createdAt, tags, ...input };
  await fs.writeFile(
    path.join(SESSIONS_DIR, `${id}.json`),
    JSON.stringify(stored, null, 2),
    "utf-8"
  );

  const index = await readIndex();
  const meta: SessionMeta = {
    id,
    createdAt,
    question: input.question,
    tags,
    taskCount: input.subTasks.length,
    findingCount: input.findings.length,
  };

  index.sessions.unshift(meta);
  if (index.sessions.length > 200) index.sessions = index.sessions.slice(0, 200);
  await writeIndex(index);

  return id;
}

export async function listSessions(limit = 20): Promise<SessionMeta[]> {
  const index = await readIndex();
  return index.sessions.slice(0, limit);
}

export async function searchSessions(query: string, limit = 5): Promise<SessionMeta[]> {
  const index = await readIndex();
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);

  const scored = index.sessions
    .map((s) => {
      const text = (s.question + " " + s.tags.join(" ")).toLowerCase();
      const score = queryWords.reduce(
        (sum, w) => sum + (text.includes(w) ? 1 : 0),
        0
      );
      return { ...s, score };
    })
    .filter((s) => s.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export async function getSession(id: string): Promise<StoredSession | null> {
  try {
    const data = await fs.readFile(
      path.join(SESSIONS_DIR, `${id}.json`),
      "utf-8"
    );
    return JSON.parse(data) as StoredSession;
  } catch {
    return null;
  }
}

export async function getRelevantContext(question: string, limit = 3): Promise<string> {
  const matches = await searchSessions(question, limit);
  if (matches.length === 0) return "";

  const parts: string[] = [];
  for (const meta of matches) {
    const session = await getSession(meta.id);
    if (!session) continue;
    const date = new Date(session.createdAt).toLocaleDateString();
    parts.push(
      `### "${session.question}"\n_Researched: ${date}_\n\n${session.finalAnswer.slice(0, 800)}`
    );
  }

  return parts.join("\n\n---\n\n");
}
