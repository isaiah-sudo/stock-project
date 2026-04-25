"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type AppMode, getMode, resetEducationTutorial, setMode } from "../lib/appMode";
import { type BackgroundEffect, getBackgroundEffect, setBackgroundEffect } from "../lib/backgroundTheme";
import { getCurrentLevel, getLevelProgress, type Portfolio } from "@stock/shared";
import { apiFetch } from "../lib/api";

interface NavbarProps {
  onChatClick?: () => void;
  experiencePoints?: number;
}

export function Navbar({ onChatClick, experiencePoints }: NavbarProps) {
  const pathname = usePathname();
  const [mode, setCurrentMode] = useState<AppMode>("personal");
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [localXp, setLocalXp] = useState<number | null>(null);
  const [bgEffect, setBgEffect] = useState<BackgroundEffect>("solid");

  useEffect(() => {
    const storedMode = getMode();
    if (storedMode) {
      setCurrentMode(storedMode);
    }
    setBgEffect(getBackgroundEffect());
    // Restore dark mode from localStorage
    const storedDark = localStorage.getItem("trillium_dark_mode");
    if (storedDark === "true") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (experiencePoints === undefined) {
      apiFetch<Portfolio>("/paper/portfolio")
        .then(p => setLocalXp(p.experiencePoints || 0))
        .catch(() => {});
    }
  }, [experiencePoints]);

  const xp = experiencePoints ?? localXp ?? 0;
  const currentLevel = getCurrentLevel(xp);
  const progress = getLevelProgress(xp);

  function handleModeChange(nextMode: AppMode) {
    setMode(nextMode);
    setCurrentMode(nextMode);
    if (nextMode === "educational") {
      resetEducationTutorial();
    }
  }

  function handleChatClick() {
    if (pathname === "/dashboard" && onChatClick) {
      onChatClick();
    } else {
      // Navigate to chat page for non-dashboard pages
      window.location.href = "/chat";
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <a
          href="https://trilliumfinance.net"
          className="group flex items-center gap-2 self-start"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white transition-all transform group-hover:rotate-6">
            T
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 transition-colors group-hover:text-blue-600 sm:text-xl">
            Trillium <span className="text-blue-600">Finance</span>
          </span>
        </a>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm sm:gap-8">
          <Link 
            href="/dashboard"
            className={`text-sm font-bold transition-all ${
              pathname === "/dashboard" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Portfolio
          </Link>
          <button
            onClick={handleChatClick}
            className={`text-sm font-bold transition-all ${
              pathname === "/chat" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Chat
          </button>
          <Link 
            href="/leaderboard"
            className={`text-sm font-bold transition-all ${
              pathname === "/leaderboard" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Rankings
          </Link>
          <Link 
            href="/achievements"
            className={`text-sm font-bold transition-all ${
              pathname === "/achievements" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Achievements
          </Link>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:gap-4 lg:w-auto lg:justify-end">
          {/* Rank & XP Badge */}
          <div className="hidden sm:flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-600">
            <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-600 pr-3">
              <span className="text-lg">{currentLevel.icon}</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{currentLevel.label}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black uppercase tracking-wide text-blue-600 font-num">{xp} XP</span>
              <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Settings Button */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-600"
              title="Settings"
            >
              ⚙️
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 shadow-lg z-50">
                <p className="mb-2 text-xs font-bold uppercase text-slate-400">Settings</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dark Mode</span>
                    <button 
                      onClick={() => {
                        const next = !isDarkMode;
                        setIsDarkMode(next);
                        if (next) {
                          document.documentElement.classList.add('dark');
                        } else {
                          document.documentElement.classList.remove('dark');
                        }
                        localStorage.setItem('trillium_dark_mode', String(next));
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  <div className="border-t border-slate-100 dark:border-slate-600 pt-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block">Background Effect</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { setBgEffect("solid"); setBackgroundEffect("solid"); }}
                        className={`flex-1 rounded-lg py-1.5 text-center text-sm transition ${bgEffect === "solid" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold" : "bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600"}`}
                        title="Solid Gradient"
                      >
                        ⬛
                      </button>
                      <button 
                        onClick={() => { setBgEffect("bubbles"); setBackgroundEffect("bubbles"); }}
                        className={`flex-1 rounded-lg py-1.5 text-center text-sm transition ${bgEffect === "bubbles" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold" : "bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600"}`}
                        title="Bubbles"
                      >
                        🫧
                      </button>
                      <button 
                        onClick={() => { setBgEffect("lights"); setBackgroundEffect("lights"); }}
                        className={`flex-1 rounded-lg py-1.5 text-center text-sm transition ${bgEffect === "lights" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold" : "bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600"}`}
                        title="Pulsing Lights"
                      >
                        ✨
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* App Mode Toggle */}
          <button
            onClick={() => handleModeChange(mode === "personal" ? "educational" : "personal")}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-600 sm:w-auto"
            title={`Switch to ${mode === "personal" ? "Educational" : "Personal"} Mode`}
          >
            {mode === "personal" ? (
              <>
                <span>Personal</span>
                <span className="text-base">💰</span>
              </>
            ) : (
              <>
                <span>Educational</span>
                <span className="text-base">🎓</span>
              </>
            )}
          </button>

          <button 
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            className="flex h-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 sm:w-auto"
          >
            Logout
          </button>
        </div>
      </div>
    </section>
  );
}
