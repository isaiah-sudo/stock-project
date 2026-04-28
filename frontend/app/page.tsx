"use client";

import { useRouter } from "next/navigation";
import { setMode, type AppMode } from "../lib/appMode";

export default function HomePage() {
  const router = useRouter();

  function handleSignIn(nextMode: AppMode) {
    setMode(nextMode);
    router.push("/sign-in");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-8 sm:py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-white">
            T
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">Trillium Finance</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Learn and invest smarter
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/sign-in")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Existing user sign in
        </button>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-12 pt-6 text-center sm:px-8 sm:pb-16 sm:pt-8">
        <p className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-700">
          Trillium Finance Simulator
        </p>
        <h1 className="mt-6 max-w-4xl text-3xl font-black tracking-tight text-slate-900 sm:mt-8 sm:text-5xl lg:text-6xl">
          Where learning and investing come together
        </h1>
        <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
          Build confidence with real market-style practice. Choose Educational mode for guided,
          interactive walkthroughs, or Personal mode for the full simulator experience.
        </p>

        <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          <button
            onClick={() => handleSignIn("personal")}
            className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-base font-black text-slate-900">Sign in to Personal</p>
            <p className="mt-1 text-sm text-slate-600">
              Continue with the standard app and no walkthrough prompts.
            </p>
          </button>
          <button
            onClick={() => handleSignIn("educational")}
            className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-base font-black text-blue-800">Sign in to Educational</p>
            <p className="mt-1 text-sm text-slate-700">
              Get guided explanations, highlighted UI hints, and interactive tutorial steps.
            </p>
          </button>
        </div>
      </section>
    </main>
  );
}
