import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

export function getModel() {
  const provider = process.env.MODEL_PROVIDER || "openai";

  if (provider === "anthropic") {
    return new ChatAnthropic({
      model: "claude-sonnet-4-5-20250929",
      temperature: 0,
    });
  }

  return new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
  });
}
