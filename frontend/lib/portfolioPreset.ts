"use client";

import { type PortfolioPresetId } from "@stock/shared";

const PORTFOLIO_PRESET_KEY = "trillium_portfolio_preset";
const PORTFOLIO_PRESET_CHANGED_EVENT = "portfolioPresetChanged";

export function getPortfolioPreset(): PortfolioPresetId {
  if (typeof window === "undefined") {
    return "standard";
  }

  const stored = window.localStorage.getItem(PORTFOLIO_PRESET_KEY);
  if (stored === "conservative" || stored === "standard" || stored === "aggressive") {
    return stored;
  }

  return "standard";
}

export function setPortfolioPreset(preset: PortfolioPresetId) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PORTFOLIO_PRESET_KEY, preset);
  window.dispatchEvent(new CustomEvent(PORTFOLIO_PRESET_CHANGED_EVENT, { detail: { preset } }));
}

export function onPortfolioPresetChange(handler: (preset: PortfolioPresetId) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = (event: Event) => {
    handler((event as CustomEvent<{ preset: PortfolioPresetId }>).detail.preset);
  };

  window.addEventListener(PORTFOLIO_PRESET_CHANGED_EVENT, listener);
  return () => window.removeEventListener(PORTFOLIO_PRESET_CHANGED_EVENT, listener);
}
