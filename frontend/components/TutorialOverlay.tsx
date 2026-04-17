"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

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
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; isMobile?: boolean } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const step = useMemo(() => steps[index], [steps, index]);

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  // Measurement and positioning logic
  const updatePosition = () => {
    if (step.targetId) {
      const target = document.getElementById(step.targetId);
      const tooltip = tooltipRef.current;
      
      if (target && tooltip) {
        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const isMobile = window.innerWidth < 640;

        if (isMobile) {
          setTooltipPos({ top: 0, left: 0, isMobile: true });
        } else {
          const padding = 20;
          const boxHeight = tooltipRect.height;
          const boxWidth = tooltipRect.width;
          
          let top = rect.bottom + padding;
          if (top + boxHeight > window.innerHeight - padding) {
             top = rect.top - boxHeight - padding;
          }
          top = Math.max(padding, Math.min(top, window.innerHeight - boxHeight - padding));

          let left = rect.left + rect.width / 2 - boxWidth / 2;
          left = Math.max(padding, Math.min(left, window.innerWidth - boxWidth - padding));
          
          setTooltipPos({ top, left, isMobile: false });
        }
        
        target.classList.add("tutorial-target-highlight");
      }
    } else {
      setTooltipPos(null);
    }
  };

  useLayoutEffect(() => {
    onStepChange?.(step, index);
    updatePosition();
    
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      if (step.targetId) {
        document.getElementById(step.targetId)?.classList.remove("tutorial-target-highlight");
      }
    };
  }, [index, onStepChange, step]);

  const progress = ((index + 1) / steps.length) * 100;

  // Handle styles based on position and mobile state
  const getTooltipStyle = () => {
    if (!tooltipPos) return {};
    if (tooltipPos.isMobile) {
      return {
        position: "fixed" as const,
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "400px"
      };
    }
    return {
      position: "fixed" as const,
      top: tooltipPos.top,
      left: tooltipPos.left,
    };
  };

  return (
    <div className={`fixed inset-0 z-[60] ${!tooltipPos ? "flex items-center justify-center" : ""} bg-slate-900/40 p-4 backdrop-blur-sm transition-all duration-500`}>
      <div 
        ref={tooltipRef}
        className={`w-full ${tooltipPos?.isMobile ? "" : "max-w-sm"} rounded-[2rem] border border-slate-100 bg-white p-6 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]`}
        style={getTooltipStyle()}
      >
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
  );
}

