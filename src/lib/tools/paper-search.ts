import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract: string | null;
  url: string;
  year: number | null;
  citationCount: number;
  authors: { name: string }[];
}

interface ArxivEntry {
  title: string;
  summary: string;
  id: string;
  published: string;
  authors: string[];
}

async function searchSemanticScholar(query: string): Promise<string[]> {
  const params = new URLSearchParams({
    query,
    limit: "5",
    fields: "title,abstract,url,year,citationCount,authors",
  });

  const res = await fetch(
    `https://api.semanticscholar.org/graph/v1/paper/search?${params}`
  );

  if (!res.ok) return [];

  const data = await res.json();
  const papers: SemanticScholarPaper[] = data.data || [];

  return papers.map((p) => {
    const authors = p.authors.map((a) => a.name).join(", ");
    return `[Semantic Scholar] "${p.title}" (${p.year || "n/a"}) by ${authors}\nCitations: ${p.citationCount}\nAbstract: ${(p.abstract || "No abstract").slice(0, 500)}\nURL: ${p.url}`;
  });
}

async function searchArxiv(query: string): Promise<string[]> {
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    max_results: "5",
    sortBy: "relevance",
  });

  const res = await fetch(`http://export.arxiv.org/api/query?${params}`);
  if (!res.ok) return [];

  const text = await res.text();
  const entries: ArxivEntry[] = [];

  // Simple XML parsing for arXiv Atom feed
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(text)) !== null) {
    const entry = match[1];
    const title =
      entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || "";
    const summary =
      entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim() || "";
    const id = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim() || "";
    const published =
      entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() || "";

    const authorNames: string[] = [];
    const authorRegex = /<author>\s*<name>([\s\S]*?)<\/name>/g;
    let authorMatch;
    while ((authorMatch = authorRegex.exec(entry)) !== null) {
      authorNames.push(authorMatch[1].trim());
    }

    entries.push({
      title,
      summary,
      id,
      published,
      authors: authorNames,
    });
  }

  return entries.map(
    (e) =>
      `[arXiv] "${e.title}" (${e.published.slice(0, 4)}) by ${e.authors.join(", ")}\nAbstract: ${e.summary.slice(0, 500)}\nURL: ${e.id}`
  );
}

export const paperSearchTool = new DynamicStructuredTool({
  name: "search_papers",
  description:
    "Search academic papers on Semantic Scholar and arXiv. Use for scientific research, technical topics, and academic findings.",
  schema: z.object({
    query: z.string().describe("Search query for academic papers"),
    source: z
      .enum(["semantic_scholar", "arxiv", "both"])
      .default("both")
      .describe("Which paper database to search"),
  }),
  func: async ({ query, source }) => {
    const results: string[] = [];

    if (source === "semantic_scholar" || source === "both") {
      const ssResults = await searchSemanticScholar(query);
      results.push(...ssResults);
    }

    if (source === "arxiv" || source === "both") {
      const arxivResults = await searchArxiv(query);
      results.push(...arxivResults);
    }

    if (results.length === 0) {
      return "No papers found for this query.";
    }

    return results.join("\n\n---\n\n");
  },
});
