"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import type { UIMessage } from "ai";

interface MessageListProps {
  messages: UIMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-300 mb-2">
            Research Agent
          </h2>
          <p className="text-sm">
            Ask a complex question and I&apos;ll research it for you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((msg) => {
          const content =
            msg.parts
              ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
              .map((p) => p.text)
              .join("") || "";

          if (!content) return null;

          return (
            <MessageBubble
              key={msg.id}
              role={msg.role as "user" | "assistant"}
              content={content}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
