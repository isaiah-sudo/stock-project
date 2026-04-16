"use client";

import { useEffect, useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { type AppMode, getMode, setMode } from "../lib/appMode";

export default function HomePage() {
  const [mode, setCurrentMode] = useState<AppMode | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCurrentMode(getMode());
    setReady(true);
  }, []);

  function chooseMode(nextMode: AppMode) {
    setMode(nextMode);
    setCurrentMode(nextMode);
  }

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-4 bg-slate-50 py-12" />
    );
  }

  if (!mode) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 bg-slate-50 py-12">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <h1 className="text-3xl font-black text-slate-900">Choose your experience</h1>
          <p className="mt-3 text-slate-600">
            Start in educational mode for guided walkthroughs, or pick personal mode for
            the standard simulator experience.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <button
              onClick={() => chooseMode("educational")}
              className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-left transition hover:border-blue-400"
            >
              <p className="text-lg font-bold text-blue-700">Educational</p>
              <p className="mt-2 text-sm text-slate-600">
                Includes tutorial popups that explain what to do and how the platform works.
              </p>
            </button>
            <button
              onClick={() => chooseMode("personal")}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-400"
            >
              <p className="text-lg font-bold text-slate-900">Personal</p>
              <p className="mt-2 text-sm text-slate-600">
                Keeps the current app behavior with no walkthrough overlays.
              </p>
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-4 bg-slate-50 py-12">
      <AuthForm />
    </main>
  );
}
