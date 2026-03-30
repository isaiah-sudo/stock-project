"use client";

import { Leaderboard } from "../../components/Leaderboard";

export default function LeaderboardPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-10 p-6 sm:p-12">
      <header className="space-y-4 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 font-bold shadow-lg shadow-yellow-200">
           🏆
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Global <span className="text-blue-600 underline underline-offset-8 decoration-blue-200">Rankings</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600 font-medium">
          Compete with the top virtual traders in the simulator. Climb the 
          leaderboard by maximizing your portfolio's net worth and unlocking rare achievements.
        </p>
      </header>

      <Leaderboard />

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
