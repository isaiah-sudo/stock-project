"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface LeaderboardEntry {
  userId: string;
  email: string;
  totalValue: number;
  exp: number;
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<LeaderboardEntry[]>("/leaderboard")
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 animate-pulse">Loading rankings...</div>;

  if (error) return (
    <div className="p-8 rounded-3xl border border-red-100 bg-red-50 text-center text-red-600 font-bold">
      {error}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-slate-700/50 text-xs font-bold uppercase tracking-widest text-slate-400">
            <th className="px-3 py-3 sm:px-6 sm:py-4">Rank</th>
            <th className="px-3 py-3 sm:px-6 sm:py-4">Trader</th>
            <th className="px-3 py-3 text-right sm:px-6 sm:py-4">Net Worth</th>
            <th className="px-3 py-3 text-right sm:px-6 sm:py-4">XP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
          {entries.map((entry, idx) => (
            <tr key={entry.userId} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <td className="px-3 py-3 sm:px-6 sm:py-5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm ${
                  idx === 0 ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200" :
                  idx === 1 ? "bg-slate-200 text-slate-700" :
                  idx === 2 ? "bg-orange-100 text-orange-700" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {idx + 1}
                </div>
              </td>
              <td className="px-3 py-3 sm:px-6 sm:py-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-600 dark:to-slate-700 sm:flex items-center justify-center font-bold text-slate-500 dark:text-slate-300">
                    {entry.email[0].toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate font-semibold text-slate-700 dark:text-slate-200 text-xs lowercase sm:max-w-none sm:text-sm">{entry.email}***</span>
                </div>
              </td>
              <td className="px-3 py-3 text-right font-num font-bold text-slate-900 dark:text-slate-100 text-xs sm:px-6 sm:py-5 sm:text-sm">
                ${entry.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-3 py-3 text-right sm:px-6 sm:py-5">
                <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 font-num sm:px-3 sm:py-1 sm:text-xs">
                  {entry.exp} XP
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
