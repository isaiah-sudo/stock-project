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

function TrilliumLogoMark() {
  return (
    <svg
      viewBox="330 330 320 320"
      aria-hidden="true"
      className="h-6 w-6 text-white transition-all duration-300 group-hover:text-cyan-100 group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.9)] [&_path]:fill-current"
    >
      <path d="M460 478v2c-1.65 1.5-3.404 2.82-5.176 4.172-4.331 4.34-5.255 8.855-5.262 14.828.145 5.502.343 9.008 4.438 13 7.41 5.527 13.79 6.867 23 6 7.996-2.028 14.412-6.118 19-13l1 10h-2l-.062 3.125c-1.96 15.159-14.199 28.396-25.594 37.46-27.369 20.233-63.328 23.847-96.281 19.29A148.4 148.4 0 0 1 338 565c1.454-17.931 17.3-38.924 29-52h2c.26-.584.52-1.168.79-1.77 8.19-15.088 30.315-26.191 46.21-31.105 7.189-2.028 14.545-3.128 21.938-4.125l3.158-.453c6.991-.823 12.347-.118 18.904 2.453" />
      <path d="M579.281 485.082c9.715 4.91 18.383 10.933 26.719 17.918l2.582 2.02c13.975 11.446 24.002 29.217 32.293 44.918.49.924.978 1.85 1.482 2.802l1.385 2.662 1.246 2.39c.949 2.07 1.546 3.985 2.012 6.208-28.394 16.311-70.951 15.934-101.937 8.188-16.248-4.75-30.312-11.896-42.442-23.672-2.571-2.553-2.571-2.553-5.422-4.703C495 542 495 542 494.375 539.75c.78-3.429 2.377-5.721 4.313-8.625C501.186 527.08 503 522.801 503 518l3.727.105q2.448.043 4.898.082l2.45.077c7.394.09 12.492-2.125 17.925-7.264 4.145-5.574 3.869-12.36 3-19-2.09-5.383-5.933-9.049-10-13v-2c16.74-5.58 38.982.717 54.281 8.082" />
      <path d="M489 338c4.223 1.646 7.072 4.77 10.188 7.938l1.745 1.763c5.046 5.162 9.65 10.589 14.067 16.299.737.92 1.475 1.84 2.234 2.79C530.117 383.27 538.371 401.614 543 422l.688 2.953c1.464 7.609 1.515 15.193 1.562 22.922l.028 3.28c-.023 5.672-.357 10.494-2.278 15.845l-6.8 1.36q-3.498.7-6.993 1.406l-1.982.399-5.71 1.151A298 298 0 0 1 512 473l2-1c.428-10.103.238-18.735-6-27v-2l-1.687-.812C504 441 504 441 501.5 439.375c-2.609-1.696-2.609-1.696-6.5-1.375v-2c-7.266 1.498-13.166 3.113-18 9-3.206 5.088-5.144 10.055-5.098 16.11l.01 2.285.026 2.355.013 2.402q.02 2.925.049 5.848c-5.807-.725-11.305-2.028-16.951-3.54-3.496-.908-6.826-1.572-10.428-1.897L441 468c-7.162-10.742-4.002-32.947-1.812-45.125.531-2.652 1.155-5.247 1.812-7.875l.488-1.955c7.427-28.739 24.967-51.418 46.184-71.557 1.55-1.404 1.55-1.404 1.328-3.488" />
      <path d="m565.063 583.188 3.2.212q3.872.264 7.737.6c-3.421 5.146-7.795 7.561-13.062 10.5l-2.597 1.47C535.295 610 535.295 610 523 610l-1 2c-1.898.379-1.898.379-4.375.563l-2.79.218L512 613l-2.336.281c-30.437 3.546-60.78-1.569-87.664-16.281a700 700 0 0 0-6-3v-2l-1.766-.344c-2.418-.71-3.96-1.669-5.984-3.156l-1.86-1.344L405 586v-1c25.63-3.041 25.63-3.041 36 4 25.273 13.816 57.357 13.511 84.5 6.125 10.636-3.259 10.636-3.259 20.433-8.406 6.492-4.164 11.576-4.194 19.13-3.532" />
    </svg>
  );
}

export function Navbar({ onChatClick, experiencePoints }: NavbarProps) {
  const pathname = usePathname();
  const [mode, setCurrentMode] = useState<AppMode>("personal");
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [localXp, setLocalXp] = useState<number | null>(null);
  const [bgEffect, setBgEffect] = useState<BackgroundEffect>("solid");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <section className="rounded-[2rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Top row: Logo + Hamburger */}
        <div className="flex items-center justify-between">
          <a
            href="https://trilliumfinance.net"
            className="group flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 transition-all transform group-hover:rotate-6">
              <TrilliumLogoMark />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 transition-colors group-hover:text-blue-600 sm:text-xl">
              Trillium <span className="text-blue-600">Finance</span>
            </span>
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Collapsible content — always visible on lg+, togglable on mobile */}
        <div className={`${mobileMenuOpen ? "flex" : "hidden"} flex-col gap-3 border-t border-slate-100 dark:border-slate-700 pt-3 lg:flex lg:flex-1 lg:flex-row lg:items-center lg:justify-between lg:border-0 lg:pt-0 lg:pl-6`}>
          {/* Nav links */}
          <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-5 lg:gap-y-2 text-sm">
            <Link 
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-bold transition-all ${
                pathname === "/dashboard" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Portfolio
            </Link>
            <button
              onClick={() => { handleChatClick(); setMobileMenuOpen(false); }}
              className={`text-left text-sm font-bold transition-all ${
                pathname === "/chat" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Chat
            </button>
            <Link 
              href="/leaderboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-bold transition-all ${
                pathname === "/leaderboard" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Rankings
            </Link>
            <Link 
              href="/achievements"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-bold transition-all ${
                pathname === "/achievements" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Achievements
            </Link>
          </div>

          {/* Right-side controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 lg:justify-end">
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
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-600"
              title={`Switch to ${mode === "personal" ? "Educational" : "Personal"} Mode`}
            >
              {mode === "personal" ? (
                <>
                  <span className="hidden sm:inline">Personal</span>
                  <span className="text-base">💰</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Educational</span>
                  <span className="text-base">🎓</span>
                </>
              )}
            </button>

            <button 
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/";
              }}
              className="flex h-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
