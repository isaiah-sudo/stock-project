"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white transition-all transform group-hover:rotate-6">
            S
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
            Simulator <span className="text-blue-600">Pro</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link 
            href="/dashboard"
            className={`text-sm font-bold transition-all ${
              pathname === "/dashboard" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Portfolio
          </Link>
          <Link 
            href="/leaderboard"
            className={`text-sm font-bold transition-all ${
              pathname === "/leaderboard" ? "text-blue-600 underline underline-offset-8" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Rankings
          </Link>
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
    </nav>
  );
}
