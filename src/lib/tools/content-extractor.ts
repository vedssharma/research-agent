import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { extract } from "@extractus/article-extractor";

export const contentExtractorTool = new DynamicStructuredTool({
  name: "extract_content",
  description:
    "Extract the main text content from a web page URL. Use this to get detailed content from a specific source.",
  schema: z.object({
    url: z.string().url().describe("The URL to extract content from"),
  }),
  func: async ({ url }) => {
    try {
      const article = await extract(url);

      if (article && article.content) {
        // Strip HTML tags from the extracted content
        const text = article.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        const title = article.title || "Untitled";
        const truncated = text.slice(0, 4000);

        return `Title: ${title}\nSource: ${url}\n\nContent:\n${truncated}${text.length > 4000 ? "\n... (truncated)" : ""}`;
      }

      return `Could not extract meaningful content from ${url}`;
    } catch {
      return `Failed to extract content from ${url}`;
    }
  },
});
