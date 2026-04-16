"use client";

import { useMemo, useState } from "react";

export type TutorialStep = {
  title: string;
  description: string;
};

type TutorialOverlayProps = {
  title: string;
  steps: TutorialStep[];
  onClose: () => void;
  onDismissForever?: () => void;
};

export function TutorialOverlay({
  title,
  steps,
  onClose,
  onDismissForever
}: TutorialOverlayProps) {
  const [index, setIndex] = useState(0);
  const step = useMemo(() => steps[index], [steps, index]);

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Guided Mode
            </p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500">
            Step {index + 1} of {steps.length}
          </p>
          <h4 className="mt-2 text-lg font-bold text-slate-900">{step.title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            disabled={isFirst}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            Back
          </button>

          <div className="flex items-center gap-2">
            {onDismissForever ? (
              <button
                onClick={onDismissForever}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Don't show again
              </button>
            ) : null}
            {isLast ? (
              <button
                onClick={onClose}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Finish
              </button>
            ) : (
              <button
                onClick={() => setIndex((current) => Math.min(steps.length - 1, current + 1))}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
