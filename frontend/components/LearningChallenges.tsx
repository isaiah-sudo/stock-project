"use client";

import { useMemo, useState } from "react";
import type { LearningChallenge } from "@stock/shared";

function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function LearningChallenges({
  challenges,
}: {
  challenges: LearningChallenge[];
}) {
  const [selectedByChallenge, setSelectedByChallenge] = useState<Record<string, string>>({});

  const selectedOptions = useMemo(() => {
    return Object.fromEntries(
      challenges.map((challenge) => [
        challenge.id,
        challenge.options.find((option) => option.id === selectedByChallenge[challenge.id]) ?? null,
      ]),
    ) as Record<string, LearningChallenge["options"][number] | null>;
  }, [challenges, selectedByChallenge]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 text-sky-950">
        <h2 className="text-xl font-semibold">Scenario-based learning</h2>
        <p className="mt-2 text-sm leading-6 text-sky-900">
          Try each scenario, pick the answer that sounds best to you, and compare your thinking with
          the built-in explanation. These are learning prompts, not personal investment advice.
        </p>
      </div>

      <div className="grid gap-6">
        {challenges.map((challenge) => {
          const selectedOption = selectedOptions[challenge.id];
          const bestOption = challenge.options.find((option) => option.isBest) ?? null;

          return (
            <section
              key={challenge.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                      Category: {titleCase(challenge.category)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                      Difficulty: {titleCase(challenge.difficulty)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                      Concept: {challenge.concept}
                    </span>
                  </div>

                  <h3 className="mt-3 text-xl font-semibold text-slate-950">{challenge.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{challenge.scenario}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {challenge.options.map((option) => {
                  const isSelected = selectedOption?.id === option.id;
                  const shouldRevealBest = Boolean(selectedOption) && option.isBest;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setSelectedByChallenge((current) => ({
                          ...current,
                          [challenge.id]: option.id,
                        }))
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-sky-500 bg-sky-50 text-sky-950"
                          : shouldRevealBest
                            ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                            : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                      }`}
                      aria-pressed={isSelected}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{option.label}</span>
                        {shouldRevealBest ? (
                          <span className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-900">
                            Best learning answer
                          </span>
                        ) : null}
                        {isSelected && !option.isBest ? (
                          <span className="rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-sky-900">
                            Your selection
                          </span>
                        ) : null}
                      </div>

                      {isSelected ? (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3 text-sm leading-6">
                          <div className="font-semibold text-slate-900">Why this choice means something</div>
                          <p className="mt-1 text-slate-700">{option.explanation}</p>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {selectedOption ? (
                <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr,1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h4 className="text-base font-semibold text-slate-950">Takeaway</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{challenge.takeaway}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h4 className="text-base font-semibold text-slate-950">Best answer reminder</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {bestOption ? bestOption.label : "Review the explanation that best balances learning goals."}
                    </p>
                    {bestOption ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{bestOption.explanation}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}