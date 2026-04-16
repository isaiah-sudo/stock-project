"use client";

import { useEffect, useState } from "react";
import { ChatAssistant } from "../../components/ChatAssistant";
import { Navbar } from "../../components/Navbar";
import { PageHeader } from "../../components/PageHeader";
import { TutorialOverlay, type TutorialStep } from "../../components/TutorialOverlay";
import { getMode } from "../../lib/appMode";

export default function ChatPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem("chatTutorialDismissed") === "true";
    if (getMode() === "educational" && !dismissed) {
      setShowTutorial(true);
    }
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const chatSteps: TutorialStep[] = [
    {
      title: "Ask specific questions for better guidance",
      description:
        "Include a ticker, timeframe, or risk goal in each prompt so the assistant can give more actionable responses."
    },
    {
      title: "Use chat to validate trade ideas",
      description:
        "Before buying or selling, ask for a quick thesis summary and risk checklist so you can compare alternatives."
    }
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-10 p-6 sm:p-12">
      <Navbar />
      <PageHeader
        icon="💬"
        title="AI"
        accent="Chat Assistant"
        description="Open the chat panel to get personalized investment advice, portfolio guidance, and market insights from your AI assistant."
      />

      <section className={`rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200 transition-all duration-700 ease-out ${isVisible ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"}`}>
        <div className="min-h-[640px]">
          <ChatAssistant />
        </div>
      </section>

      <footer className="text-center">
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
          onClose={() => setShowTutorial(false)}
          onDismissForever={() => {
            window.localStorage.setItem("chatTutorialDismissed", "true");
            setShowTutorial(false);
          }}
        />
      ) : null}
    </main>
  );
}