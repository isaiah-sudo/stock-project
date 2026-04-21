"use client";
import { useState } from "react";

type LearnMoreProps = {
  title: string;
  content: string;
};

export function LearnMore({ title, content }: LearnMoreProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block ml-1.5 align-middle">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-50 text-[10px] font-black text-blue-500 transition-all hover:bg-blue-600 hover:text-white hover:scale-110 shadow-sm"
      >
        ?
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 z-[80] mb-3 w-56 -translate-x-1/2 transform animate-in fade-in zoom-in duration-200">
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl shadow-blue-900/10">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-500 mb-1.5">{title}</p>
            <p className="text-[11px] leading-relaxed text-slate-600 font-bold">{content}</p>
            <div className="absolute top-[calc(100%-6px)] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white border-r border-b border-blue-100" />
          </div>
        </div>
      )}
    </div>
  );
}
