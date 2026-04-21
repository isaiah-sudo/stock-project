"use client";

import { TrophyRoom } from "../../components/TrophyRoom";
import { Navbar } from "../../components/Navbar";
import { PageHeader } from "../../components/PageHeader";

export default function AchievementsPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-10 p-6 sm:p-12">
      <Navbar />
      <PageHeader
        icon="🏆"
        title="Achievement"
        accent="Trophy Room"
        description="Track your trading milestones and unlock rare achievements. Each trophy represents a significant accomplishment in your investment journey."
      />

      <section className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
        <TrophyRoom />
      </section>

      <footer className="text-center">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all font-sans"
        >
          &larr; Return to Dashboard
        </a>
      </footer>
    </main>
  );
}
