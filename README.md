# Research Agent

An autonomous AI research assistant that decomposes complex questions into sub-tasks, searches the web and academic papers, builds a knowledge graph from discovered information, and synthesizes a final answer — all streamed back to you in real time.

Built with **Next.js 16**, **Vercel AI SDK v6**, and **LangGraph.js**.

## How it works

When you ask a question, a multi-node LangGraph agent runs in the background:

```
planner → researcher → kg_builder → (loop until done) → synthesizer
```

1. **Planner** — Decomposes your question into focused sub-tasks (web searches, paper searches, or deep dives).
2. **Researcher** — Executes each sub-task using Tavily web search, Semantic Scholar / arXiv paper search, and an article content extractor.
3. **Knowledge Graph Builder** — Extracts entities and relationships from findings into an in-memory knowledge graph.
4. **Synthesizer** — Serializes the knowledge graph and generates a final, cited answer.

The UI shows a split-pane view: the chat on the left, and a live research panel (task status, sources, timeline) + interactive knowledge graph on the right.

## Prerequisites

- Node.js 18+
- An OpenAI **or** Anthropic API key
- A [Tavily](https://tavily.com) API key (for web search)

## Setup

**1. Clone and install dependencies**

```bash
git clone <repo-url>
cd research-agent
npm install
```

**2. Configure environment variables**

Create a `.env.local` file at the project root:

```bash
# Choose your LLM provider: "openai" (default) or "anthropic"
MODEL_PROVIDER=openai

# Add the key for whichever provider you chose
OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# Required for web search
TAVILY_API_KEY=tvly-...
```

**3. Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build + TypeScript type check |
| `npm run lint` | Run ESLint |

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| AI orchestration | LangGraph.js |
| Streaming | Vercel AI SDK v6 (`@ai-sdk/react`, `@ai-sdk/langchain`) |
| LLM providers | OpenAI or Anthropic (switchable via env var) |
| Web search | Tavily |
| Paper search | Semantic Scholar + arXiv REST APIs |
| Content extraction | `@extractus/article-extractor` |
| Knowledge graph | Custom in-memory graph with canvas-based force-directed viewer |
| Styling | Tailwind CSS v4 |
