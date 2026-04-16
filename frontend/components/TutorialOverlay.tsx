"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

export type TutorialStep = {
  title: string;
  description: string;
  targetId?: string;
  actionLabel?: string;
  helperText?: string;
};

type TutorialOverlayProps = {
  title: string;
  steps: TutorialStep[];
  targetId?: string;
  onClose: () => void;
  onDismissForever?: () => void;
  onStepChange?: (step: TutorialStep, index: number) => void;
  onStepAction?: (step: TutorialStep, index: number) => void;
};

export function TutorialOverlay({
  title,
  steps,
  targetId,
  onClose,
  onDismissForever,
  onStepChange,
  onStepAction
}: TutorialOverlayProps) {
  const [index, setIndex] = useState(0);
  const [containerStyle, setContainerStyle] = useState<CSSProperties | null>(null);
  const step = useMemo(() => steps[index], [steps, index]);

  useEffect(() => {
    const updatePosition = () => {
      if (!targetId) {
        setContainerStyle(null);
        return;
      }

      const element = document.getElementById(targetId);
      if (!element) {
        setContainerStyle(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      const width = Math.min(460, window.innerWidth - 32);
      const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 16), window.innerWidth - width - 16);
      const top = rect.bottom + 12;

      setContainerStyle({
        position: "fixed",
        top,
        left,
        width,
        zIndex: 70
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [targetId]);

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  useEffect(() => {
    onStepChange?.(step, index);
  }, [index, onStepChange, step]);

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-slate-900/40" />
      <div className="fixed inset-0 z-[70] pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-xl ${containerStyle ? "" : "absolute inset-0 flex items-center justify-center px-4"}`}
          style={containerStyle ?? undefined}
        >
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
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
              {step.helperText ? (
                <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                  {step.helperText}
                </p>
              ) : null}
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
                {step.actionLabel ? (
                  <button
                    onClick={() => onStepAction?.(step, index)}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                  >
                    {step.actionLabel}
                  </button>
                ) : null}
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
      </div>
    </>
  );
}
