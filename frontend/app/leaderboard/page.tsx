"use client";

import { useEffect, useState } from "react";
import { Leaderboard } from "../../components/Leaderboard";
import { Navbar } from "../../components/Navbar";
import { PageHeader } from "../../components/PageHeader";
import { TutorialOverlay, type TutorialStep } from "../../components/TutorialOverlay";
import { getMode } from "../../lib/appMode";

export default function LeaderboardPage() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem("leaderboardTutorialDismissed") === "true";
    if (getMode() === "educational" && !dismissed) {
      setShowTutorial(true);
    }
  }, []);

  const leaderboardSteps: TutorialStep[] = [
    {
      title: "Use rankings to benchmark your strategy",
      description:
        "Compare your portfolio growth against top users to understand if your returns come from consistency or short-term swings."
    },
    {
      title: "Pair rankings with achievements",
      description:
        "If your rank stalls, return to portfolio and target achievements that encourage better risk management."
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

      <section className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
        <Leaderboard />
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
          title="Leaderboard Tutorial"
          steps={leaderboardSteps}
          onClose={() => setShowTutorial(false)}
          onDismissForever={() => {
            window.localStorage.setItem("leaderboardTutorialDismissed", "true");
            setShowTutorial(false);
          }}
        />
      ) : null}
    </main>
  );
}
