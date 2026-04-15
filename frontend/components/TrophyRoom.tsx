"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface Achievement {
  id: string;
  type: string;
  unlockedAt: string;
}

const ACHIEVEMENT_META: Record<string, { label: string; icon: string; desc: string }> = {
  FIRST_TRADE: { label: "First Trade", icon: "🤝", desc: "Executed your first order" },
  TEN_PCT_GAIN: { label: "Investor", icon: "📈", desc: "Reached 10% portfolio growth" },
  ALL_STAR: { label: "All Star", icon: "🌟", desc: "Doubled your initial capital" },
  PROFIT_TAKER: { label: "Profit Taker", icon: "💰", desc: "Sold a stock for a gain" },
  DIVERSIFIED: { label: "Diversified", icon: "🌍", desc: "Hold 5+ different assets" },
  WHALE: { label: "Whale", icon: "🐋", desc: "Executed a $10k+ trade" },
  BULL_RUN: { label: "Bull Run", icon: "🐂", desc: "Reach $50k market value" }
};

export function TrophyRoom() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Achievement[]>("/paper/achievements")
      .then(setAchievements)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-slate-400 text-sm">Loading trophies...</div>;

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
      <h2 className="mb-4 text-lg font-bold text-slate-800 flex items-center gap-2">
        <span className="text-xl">🏆</span> Trophy Room
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Object.entries(ACHIEVEMENT_META).map(([type, meta]) => {
          const isUnlocked = achievements.some(a => a.type === type);
          return (
            <div 
              key={type}
              className={`flex flex-col items-center justify-center rounded-2xl p-4 text-center transition-all ${
                isUnlocked ? "bg-blue-50 border border-blue-100 shadow-sm" : "bg-slate-50 opacity-40 grayscale"
              }`}
            >
              <div className="mb-2 text-2xl">{meta.icon}</div>
              <div className="text-sm font-bold text-slate-800">{meta.label}</div>
              <div className="text-xs text-slate-500 mt-1 leading-tight">{meta.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
