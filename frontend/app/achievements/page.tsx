"use client";

import { TrophyRoom } from "../../components/TrophyRoom";
import { Navbar } from "../../components/Navbar";
import { PageHeader } from "../../components/PageHeader";

export default function AchievementsPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 p-3 sm:space-y-10 sm:p-12">
      <Navbar />
      <PageHeader
        icon="🏆"
        title="Achievement"
        accent="Trophy Room"
        description="Track your trading milestones and unlock rare achievements. Each trophy represents a significant accomplishment in your investment journey."
      />

      <section className="rounded-[2rem] bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <TrophyRoom />
      </section>

      <footer className="text-center">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-sans"
        >
          &larr; Return to Dashboard
        </a>
      </footer>
    </main>
  );
}