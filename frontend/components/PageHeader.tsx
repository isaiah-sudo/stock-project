"use client";

import type { ReactNode } from "react";

interface PageHeaderProps {
  icon: string;
  title: string;
  accent: string;
  description: string;
  footer?: ReactNode;
}

export function PageHeader({ icon, title, accent, description, footer }: PageHeaderProps) {
  return (
    <section className="rounded-[2rem] bg-white dark:bg-slate-800 p-8 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="mx-auto max-w-5xl lg:max-w-none text-center lg:text-left">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 text-2xl shadow-blue-200 shadow-lg text-white">
          {icon}
        </div>
        <div className="mt-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
            {title} <span className="text-blue-600">{accent}</span>
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </section>
  );
}
