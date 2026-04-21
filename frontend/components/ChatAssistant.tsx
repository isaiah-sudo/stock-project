"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export function ChatAssistant() {
  const [model, setModel] = useState("llama3.2:1b");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text:
        "Hi! I'm your AI financial advisor. I can review your portfolio and provide personalized investment advice, including specific buy/sell recommendations, rebalancing suggestions, and risk management strategies."
    }
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    const next = [...messages, { role: "user" as const, text: input }];
    setMessages(next);
    setLoading(true);
    const userText = input;
    setInput("");

    try {
      const data = await apiFetch<{ reply: string; model: string }>("/chat", {
        method: "POST",
        body: JSON.stringify({ message: userText, accountId: "demo-account", model })
      });
      setMessages([...next, { role: "assistant", text: data.reply }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setMessages([
        ...next,
        {
          role: "assistant",
          text: `I could not generate a response: ${errorMessage}. Check backend connectivity and Ollama status.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Chat Assistant</h3>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-sm"
          aria-label="Ollama model"
        />
      </div>
      <div className="mb-3 h-64 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-2">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={
                m.role === "user"
                  ? "inline-block rounded-xl bg-slate-900 px-3 py-2 text-sm text-white"
                  : "inline-block rounded-xl bg-white px-3 py-2 text-sm text-slate-800 shadow"
              }
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for personalized investment advice, buy/sell recommendations, or portfolio analysis..."
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-white"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
