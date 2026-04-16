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
      title: "Benchmark your performance",
      description:
        "Compare your portfolio with top users to spot whether your strategy is consistent.",
      targetId: "leaderboard-table"
    },
    {
      title: "Turn ranking feedback into actions",
      description:
        "If rank slows down, return to dashboard and adjust risk or position size.",
      targetId: "leaderboard-return-link",
      helperText: "Use this loop often: check rank -> adjust strategy -> re-check rank."
    }
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-10 p-6 sm:p-12">
      <Navbar />
      <PageHeader
        icon="🏆"
        title="Global"
        accent="Rankings"
        description="Compete with the top virtual traders in the simulator. Climb the leaderboard by maximizing your portfolio's net worth and unlocking rare achievements."
      />

      <section
        id="leaderboard-table"
        className={`rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200 ${
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
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all font-sans"
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
