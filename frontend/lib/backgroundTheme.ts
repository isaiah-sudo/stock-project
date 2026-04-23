export type BackgroundEffect = "solid" | "bubbles" | "lights";

const STORAGE_KEY = "trillium_bg_effect";

export function getBackgroundEffect(): BackgroundEffect {
  if (typeof window === "undefined") return "solid";
  return (localStorage.getItem(STORAGE_KEY) as BackgroundEffect) || "solid";
}

export function setBackgroundEffect(effect: BackgroundEffect) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, effect);
  window.dispatchEvent(new Event("bgEffectChanged"));
}
