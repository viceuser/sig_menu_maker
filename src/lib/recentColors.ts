const KEY = "recent_colors";
const MAX = 10;

export function normalizeHex(hex: string) {
  const value = hex.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(value) ? value : null;
}

export function getRecentColors(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((color) => normalizeHex(color)) : [];
  } catch {
    return [];
  }
}

export function addRecentColor(hex: string) {
  const normalized = normalizeHex(hex);
  if (!normalized || typeof window === "undefined") return;

  const prev = getRecentColors().filter((color) => color !== normalized);
  const next = [normalized, ...prev].slice(0, MAX);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}
