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
    <section className="rounded-[2rem] bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-200 dark:border-slate-700 sm:p-8">
      <div className="mx-auto max-w-5xl lg:max-w-none text-center lg:text-left">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl shadow-blue-200 shadow-lg text-white sm:h-14 sm:w-14 sm:rounded-3xl sm:text-2xl">
          {icon}
        </div>
        <div className="mt-4 sm:mt-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl lg:text-5xl">
            {title} <span className="text-blue-600">{accent}</span>
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:mt-4 sm:text-lg sm:leading-8">
            {description}
          </p>
        </div>
        {footer ? <div className="mt-4 sm:mt-6">{footer}</div> : null}
      </div>
    </section>
  );
}
