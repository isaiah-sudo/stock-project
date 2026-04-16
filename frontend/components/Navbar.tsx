"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type AppMode, getMode, resetEducationTutorial, setMode } from "../lib/appMode";

export function Navbar() {
  const pathname = usePathname();
  const [mode, setCurrentMode] = useState<AppMode>("personal");

  useEffect(() => {
    const storedMode = getMode();
    if (storedMode) {
      setCurrentMode(storedMode);
    }
  }, []);

  function handleModeChange(nextMode: AppMode) {
    setMode(nextMode);
    setCurrentMode(nextMode);
    if (nextMode === "educational") {
      resetEducationTutorial();
    }
  }

  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white transition-all transform group-hover:rotate-6">
            T
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
            Trillium <span className="text-blue-600">Finance</span>
          </span>
        </div>

        <div className="flex items-center gap-10">
          <Link 
            href="/dashboard"
            className={`text-sm font-bold transition-all ${
              pathname === "/dashboard" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Portfolio
          </Link>
          <Link 
            href="/chat"
            className={`text-sm font-bold transition-all ${
              pathname === "/chat" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Chat
          </Link>
          <Link 
            href="/leaderboard"
            className={`text-sm font-bold transition-all ${
              pathname === "/leaderboard" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Rankings
          </Link>
          <Link 
            href="/achievements"
            className={`text-sm font-bold transition-all ${
              pathname === "/achievements" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Achievements
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
            Mode
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value as AppMode)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
            >
              <option value="personal">Personal</option>
              <option value="educational">Educational</option>
            </select>
          </label>
          <button 
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
          >
            Logout
          </button>
        </div>
      </div>
    </section>
  );
}
