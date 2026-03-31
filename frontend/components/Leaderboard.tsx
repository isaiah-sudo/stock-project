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

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium bg-white rounded-3xl border border-slate-100 animate-pulse">Loading rankings...</div>;

  if (error) return (
    <div className="p-8 rounded-3xl border border-red-100 bg-red-50 text-center text-red-600 font-bold">
      {error}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 text-xs font-bold uppercase tracking-widest text-slate-400">
            <th className="px-6 py-4">Rank</th>
            <th className="px-6 py-4">Trader</th>
            <th className="px-6 py-4 text-right">Net Worth</th>
            <th className="px-6 py-4 text-right">XP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {entries.map((entry, idx) => (
            <tr key={entry.userId} className="group hover:bg-slate-50 transition-colors">
              <td className="px-6 py-5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  idx === 0 ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200" :
                  idx === 1 ? "bg-slate-200 text-slate-700" :
                  idx === 2 ? "bg-orange-100 text-orange-700" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {idx + 1}
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-500">
                    {entry.email[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-700 lowercase">{entry.email}***</span>
                </div>
              </td>
              <td className="px-6 py-5 text-right font-mono font-bold text-slate-900">
                ${entry.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-5 text-right">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
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
