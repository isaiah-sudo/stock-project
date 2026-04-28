"use client";

import { useEffect, useState } from "react";
import { Leaderboard } from "../../components/Leaderboard";
import { Navbar } from "../../components/Navbar";
import { PageHeader } from "../../components/PageHeader";
import { TutorialOverlay, type TutorialStep } from "../../components/TutorialOverlay";
import { getMode } from "../../lib/appMode";

export default function LeaderboardPage() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTutorialTarget, setActiveTutorialTarget] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = window.localStorage.getItem("leaderboardTutorialDismissed") === "true";
    if (getMode() === "educational" && !dismissed) {
      setShowTutorial(true);
    }
  }, []);

  const leaderboardSteps: TutorialStep[] = [
    {
      title: "Learning from the Pros",
      description:
        "The leaderboard isn't just for ranking; it's a library of successful strategies. Look at what top traders are holding.",
      targetId: "leaderboard-table"
    },
    {
      title: "The Growth Mindset",
      description:
        "If your rank drops, don't worry! It's a signal to review your recent trades in the dashboard and ask the AI for a portfolio health check.",
      targetId: "leaderboard-return-link",
      helperText: "Educational Tip: Consistent slow growth often beats risky spikes in the long run."
    }
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-3 sm:space-y-10 sm:p-12">
      <Navbar />
      <PageHeader
        icon="🏆"
        title="Global"
        accent="Rankings"
        description="Compete with the top virtual traders in the simulator. Climb the leaderboard by maximizing your portfolio's net worth and unlocking rare achievements."
      />

      <section
        id="leaderboard-table"
        className={`rounded-[2rem] bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700 ${
          activeTutorialTarget === "leaderboard-table"
            ? "ring-4 ring-blue-300 ring-offset-2"
            : ""
        }`}
      >
        <Leaderboard />
      </section>

      <footer
        id="leaderboard-return-link"
        className={`text-center ${
          activeTutorialTarget === "leaderboard-return-link"
            ? "ring-4 ring-blue-300 ring-offset-2"
            : ""
        }`}
      >
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-sans"
        >
          &larr; Return to Dashboard
        </a>
      </footer>
      {showTutorial ? (
        <TutorialOverlay
          title="Leaderboard Tutorial"
          steps={leaderboardSteps}
          onStepChange={(step) => setActiveTutorialTarget(step.targetId ?? null)}
          onClose={() => {
            setShowTutorial(false);
            setActiveTutorialTarget(null);
          }}
          onDismissForever={() => {
            window.localStorage.setItem("leaderboardTutorialDismissed", "true");
            setShowTutorial(false);
            setActiveTutorialTarget(null);
          }}
        />
      ) : null}
    </main>
  );
}
