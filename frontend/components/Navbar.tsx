"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type AppMode, getMode, resetEducationTutorial, setMode } from "../lib/appMode";

interface NavbarProps {
  onChatClick?: () => void;
}

export function Navbar({ onChatClick }: NavbarProps) {
  const pathname = usePathname();
  const [mode, setCurrentMode] = useState<AppMode>("personal");
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  function handleChatClick() {
    if (pathname === "/dashboard" && onChatClick) {
      onChatClick();
    } else {
      // Navigate to chat page for non-dashboard pages
      window.location.href = "/chat";
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <a
          href="https://trilliumfinance.net"
          className="group flex items-center gap-2 self-start"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white transition-all transform group-hover:rotate-6">
            T
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 sm:text-xl">
            Trillium <span className="text-blue-600">Finance</span>
          </span>
        </a>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm sm:gap-8">
          <Link 
            href="/dashboard"
            className={`text-sm font-bold transition-all ${
              pathname === "/dashboard" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Portfolio
          </Link>
          <button
            onClick={handleChatClick}
            className={`text-sm font-bold transition-all ${
              pathname === "/chat" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Chat
          </button>
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

        <div className="flex w-full flex-wrap items-center gap-2 sm:gap-4 lg:w-auto lg:justify-end">
          {/* Settings Button */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
              title="Settings"
            >
              ⚙️
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-lg z-50">
                <p className="mb-2 text-xs font-bold uppercase text-slate-400">Settings</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Dark Mode</span>
                  <button 
                    onClick={() => {
                      setIsDarkMode(!isDarkMode);
                      document.documentElement.classList.toggle('dark');
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* App Mode Toggle */}
          <button
            onClick={() => handleModeChange(mode === "personal" ? "educational" : "personal")}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
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
            className="flex h-10 items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 sm:w-auto"
          >
            Logout
          </button>
        </div>
      </div>
    </section>
  );
}
