"use client";

export type AppMode = "educational" | "personal";

const APP_MODE_KEY = "appMode";
const EDUCATION_DISMISSED_KEY = "educationTutorialDismissed";

export function getMode(): AppMode | null {
  if (typeof window === "undefined") return null;
  const mode = window.localStorage.getItem(APP_MODE_KEY);
  if (mode === "educational" || mode === "personal") {
    return mode;
  }
  return null;
}

export function setMode(mode: AppMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APP_MODE_KEY, mode);
}

export function getDefaultRouteForMode(_mode: AppMode) {
  return "/dashboard";
}

export function shouldShowEducationTutorial() {
  if (typeof window === "undefined") return false;
  return (
    getMode() === "educational" &&
    window.localStorage.getItem(EDUCATION_DISMISSED_KEY) !== "true"
  );
}

export function dismissEducationTutorial() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EDUCATION_DISMISSED_KEY, "true");
}

export function resetEducationTutorial() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(EDUCATION_DISMISSED_KEY);
}
