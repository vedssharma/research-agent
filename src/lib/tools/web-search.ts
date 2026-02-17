import { TavilySearch } from "@langchain/tavily";

let _tool: TavilySearch | null = null;

export function getWebSearchTool(): TavilySearch {
  if (!_tool) {
    _tool = new TavilySearch({ maxResults: 5 });
  }
  return _tool;
}
