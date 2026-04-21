import type { PortfolioCoaching } from "@stock/shared";

function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function renderList(title: string, items: string[], toneClasses: string) {
  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span aria-hidden="true" className="mt-0.5 font-bold">
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PortfolioCoachCard({ coaching }: { coaching: PortfolioCoaching }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-sky-700">Portfolio coach</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">A plain-language check-in</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{coaching.summary}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Style label</div>
          <div className="mt-1 text-sm font-semibold text-slate-950">
            {titleCase(coaching.styleLabel)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Risk level</div>
          <div className="mt-2 text-lg font-semibold text-slate-950">
            {titleCase(String(coaching.riskLevel))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Diversification
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-950">
            {titleCase(coaching.diversificationLabel)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Concentration
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-950">
            {formatPercent(coaching.concentrationPct)}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Largest position share of your paper portfolio.
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Holdings / cash</div>
          <div className="mt-2 text-lg font-semibold text-slate-950">{coaching.holdingsCount} holdings</div>
          <div className="mt-1 text-xs text-slate-600">Cash reserve: {formatPercent(coaching.cashPct)}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {renderList("Strengths", [coaching.strengths], "border-emerald-200 bg-emerald-50 text-emerald-950")}
        {renderList("Cautions", [coaching.cautions], "border-amber-200 bg-amber-50 text-amber-950")}
        {renderList("Next lessons", [coaching.nextLessons], "border-sky-200 bg-sky-50 text-sky-950")}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-base font-semibold text-slate-950">Reflection prompt</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">{coaching.reflectionPrompt}</p>
      </div>
    </section>
  );
}