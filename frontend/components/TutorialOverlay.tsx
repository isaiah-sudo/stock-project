"use client";

import { useEffect, useMemo, useState, useRef } from "react";

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
  onClose: () => void;
  onDismissForever?: () => void;
  onStepChange?: (step: TutorialStep, index: number) => void;
  onStepAction?: (step: TutorialStep, index: number) => void;
};

export function TutorialOverlay({
  title,
  steps,
  onClose,
  onDismissForever,
  onStepChange,
  onStepAction
}: TutorialOverlayProps) {
  const [index, setIndex] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const step = useMemo(() => steps[index], [steps, index]);
  const containerRef = useRef<HTMLDivElement>(null);

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  useEffect(() => {
    onStepChange?.(step, index);
    
    if (step.targetId) {
      const target = document.getElementById(step.targetId);
      if (target) {
        const rect = target.getBoundingClientRect();
        // Position tooltip below the target or above if no space
        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow > 300 ? rect.bottom + 20 : Math.max(20, rect.top - 320);
        const left = Math.min(window.innerWidth - 400, Math.max(20, rect.left + rect.width / 2 - 200));
        setTooltipPos({ top, left });
        
        target.classList.add("tutorial-target-highlight");
        return () => {
          target.classList.remove("tutorial-target-highlight");
        };
      }
    }
    setTooltipPos(null);
  }, [index, onStepChange, step]);

  const progress = ((index + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] pointer-events-auto" onClick={onClose} />
      
      <div 
        ref={containerRef}
        style={tooltipPos ? { 
          top: tooltipPos.top + window.scrollY, 
          left: tooltipPos.left + window.scrollX, 
          position: 'absolute' 
        } : {}}
        className={`pointer-events-auto w-full max-w-sm rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl transition-all duration-300 ${!tooltipPos ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-xl' : ''}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              Learning Lab
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <div 
               className="h-full bg-blue-600 transition-all duration-500 ease-out" 
               style={{ width: `${progress}%` }} 
             />
          </div>
          
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <h4 className="text-lg font-bold text-slate-900">{step.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium">{step.description}</p>
            {step.helperText ? (
              <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-xs font-bold text-blue-700 flex items-start gap-2">
                <span className="text-base leading-none">💡</span>
                <span>{step.helperText}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            disabled={isFirst}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
          >
            ← Back
          </button>

          <div className="flex items-center gap-3">
            {step.actionLabel ? (
              <button
                onClick={() => onStepAction?.(step, index)}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {step.actionLabel}
              </button>
            ) : null}
            
            {isLast ? (
              <button
                onClick={onClose}
                className="rounded-xl bg-slate-900 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800"
              >
                Start Learning
              </button>
            ) : (
              <button
                onClick={() => setIndex((current) => Math.min(steps.length - 1, current + 1))}
                className="rounded-xl bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
              >
                Next Step →
              </button>
            )}
          </div>
        </div>
        
        {onDismissForever && (
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
             <button
                onClick={onDismissForever}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
              >
                Hide tips forever
              </button>
          </div>
        )}
      </div>
    </div>
  );
}

