import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@langchain/langgraph",
    "@langchain/core",
    "@langchain/openai",
    "@langchain/anthropic",
    "@langchain/tavily",
    "cheerio",
    "@extractus/article-extractor",
    "@modelcontextprotocol/sdk",
  ],
};

export default nextConfig;
