"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthForm } from "../../components/AuthForm";
import { getMode, type AppMode } from "../../lib/appMode";

export default function SignInPage() {
  const [mode, setMode] = useState<AppMode>("personal");

  useEffect(() => {
    setMode(getMode() ?? "personal");
  }, []);

  const isEducational = mode === "educational";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            &larr; Back to Home
          </Link>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              isEducational ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"
            }`}
          >
            {isEducational ? "Educational mode" : "Personal mode"}
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">Welcome to Trillium Finance</h1>
          <p className="mt-3 text-slate-600">
            {isEducational
              ? "Sign in to continue with interactive guidance and tutorial highlights."
              : "Sign in to continue with your standard simulator experience."}
          </p>
        </div>

        <div className="flex justify-center">
          <AuthForm />
        </div>
      </div>
    </main>
  );
}
