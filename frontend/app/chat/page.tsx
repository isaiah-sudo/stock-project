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
  const [activeTutorialTarget, setActiveTutorialTarget] = useState<string | null>(null);

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
      title: "Your Personal Mentor",
      description:
        "Think of this AI as your 24/7 financial tutor. You can ask it to explain complex charts or suggest a thesis for any stock ticker.",
      targetId: "chat-assistant-panel",
      helperText: "Try: 'Explain the risks of investing in semiconductor stocks right now.'"
    },
    {
      title: "Bridging Analysis and Action",
      description:
        "Once you've built a thesis here, head back to your dashboard to execute. Never trade without a plan!",
      targetId: "chat-return-link"
    }
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-10 sm:p-12">
      <Navbar />
      <PageHeader
        icon="💬"
        title="AI"
        accent="Chat Assistant"
        description="Open the chat panel to get personalized investment advice, portfolio guidance, and market insights from your AI assistant."
      />

      <section
        id="chat-assistant-panel"
        className={`rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-700 ease-out sm:p-6 ${isVisible ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"} ${
          activeTutorialTarget === "chat-assistant-panel"
            ? "ring-4 ring-blue-300 ring-offset-2"
            : ""
        }`}
      >
        <div className="min-h-[60vh] sm:min-h-[640px]">
          <ChatAssistant />
        </div>
      </section>

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
