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
        "Yo. I’m your portfolio goblin. Ask me what’s thriving, what’s cooked, or what to buy next."
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
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          text: "The coach tripped over its own shoelaces. Check the backend and Ollama, then try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white dark:bg-slate-800 p-3 shadow sm:p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
        <h3 className="text-base font-semibold sm:text-lg dark:text-slate-100">AI Chat Assistant</h3>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 px-2 py-1 text-sm sm:w-28"
          aria-label="Ollama model"
        />
      </div>
      <div className="flex-1 min-h-0 mb-3 space-y-2 overflow-y-auto rounded-lg bg-slate-50 dark:bg-slate-900/50 p-2">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={
                m.role === "user"
                  ? "inline-block max-w-full break-words rounded-xl bg-slate-900 dark:bg-blue-600 px-3 py-2 text-sm text-white sm:max-w-[85%]"
                  : "inline-block max-w-full break-words rounded-xl bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 shadow sm:max-w-[85%]"
              }
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for a quick portfolio check, a buy/sell opinion, or a plain-English explain-it-like-I’m-14 answer..."
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 px-3 py-2"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-white sm:w-auto"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
