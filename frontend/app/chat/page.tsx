"use client";

import { useEffect, useState } from "react";
import { ChatAssistant } from "../../components/ChatAssistant";
import { TutorialOverlay, type TutorialStep } from "../../components/TutorialOverlay";
import { getMode } from "../../lib/appMode";

export default function ChatPage() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTutorialTarget, setActiveTutorialTarget] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = window.localStorage.getItem("chatTutorialDismissed") === "true";
    if (getMode() === "educational" && !dismissed) {
      setShowTutorial(true);
    }
  }, []);

  const chatSteps: TutorialStep[] = [
    {
      title: "Write focused prompts",
      description:
        "Include a ticker, timeframe, and risk goal so the assistant can return a concrete answer.",
      targetId: "chat-assistant-panel",
      helperText: "Example: 'Analyze AAPL for a 2-week swing trade with medium risk.'"
    },
    {
      title: "Use chat before you execute",
      description:
        "Ask for a thesis summary and risks, then return to dashboard to place your trade.",
      targetId: "chat-return-link"
    }
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-10 p-6 sm:p-12">
      <header className="space-y-4 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 font-bold shadow-lg shadow-blue-200">
          💬
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
          AI <span className="text-blue-600 underline underline-offset-8 decoration-blue-200">Chat Assistant</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600 font-medium">
          Get personalized investment advice from our AI financial advisor. Ask about portfolio analysis,
          buy/sell recommendations, risk management strategies, and market insights.
        </p>
      </header>

      <div
        id="chat-assistant-panel"
        className={`max-w-4xl mx-auto ${
          activeTutorialTarget === "chat-assistant-panel"
            ? "rounded-3xl ring-4 ring-blue-300 ring-offset-2"
            : ""
        }`}
      >
        <ChatAssistant />
      </div>

      <footer
        id="chat-return-link"
        className={`text-center ${
          activeTutorialTarget === "chat-return-link"
            ? "rounded-3xl ring-4 ring-blue-300 ring-offset-2"
            : ""
        }`}
      >
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all font-sans"
        >
          &larr; Return to Dashboard
        </a>
      </footer>
      {showTutorial ? (
        <TutorialOverlay
          title="Chat Tutorial"
          steps={chatSteps}
          onStepChange={(step) => setActiveTutorialTarget(step.targetId ?? null)}
          onClose={() => {
            setShowTutorial(false);
            setActiveTutorialTarget(null);
          }}
          onDismissForever={() => {
            window.localStorage.setItem("chatTutorialDismissed", "true");
            setShowTutorial(false);
            setActiveTutorialTarget(null);
          }}
        />
      ) : null}
    </main>
  );
}