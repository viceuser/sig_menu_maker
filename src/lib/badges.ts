import type { BadgeConfig, BadgeShape, BadgeSize, TextPaint } from "./types";

export type BadgePresetId = "new" | "hot";

interface BadgePresetDefinition {
  id: BadgePresetId;
  label: string;
  icon: string;
  fill: TextPaint;
  textColor: string;
  borderColor: string;
  shape: BadgeShape;
  size: BadgeSize;
  tone: BadgeConfig["tone"];
}

export const BADGE_PRESETS: BadgePresetDefinition[] = [
  {
    id: "new",
    label: "NEW",
    icon: "✨",
    fill: { mode: "solid", color: "#00c853" },
    textColor: "#ffffff",
    borderColor: "#00c853",
    shape: "pill",
    size: "md",
    tone: "normal",
  },
  {
    id: "hot",
    label: "HOT",
    icon: "🔥",
    fill: { mode: "solid", color: "#f44336" },
    textColor: "#ffffff",
    borderColor: "#f44336",
    shape: "pill",
    size: "md",
    tone: "normal",
  },
];

function createBadgeId(prefix: "preset" | "custom", name: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}:${name}:${crypto.randomUUID()}`;
  }

  return `${prefix}:${name}:${Math.random().toString(36).slice(2, 10)}`;
}

export function createPresetBadge(id: BadgePresetId): BadgeConfig {
  const preset = BADGE_PRESETS.find((candidate) => candidate.id === id) ?? BADGE_PRESETS[0];
  return {
    id: createBadgeId("preset", preset.id),
    label: preset.label,
    icon: preset.icon,
    fill: preset.fill,
    textColor: preset.textColor,
    borderColor: preset.borderColor,
    shape: preset.shape,
    size: preset.size,
    tone: preset.tone,
  };
}

export function createCustomBadge(): BadgeConfig {
  return {
    id: createBadgeId("custom", "event"),
    label: "EVENT",
    icon: "🎉",
    fill: {
      mode: "gradient",
      from: "#ffe082",
      to: "#ff8f00",
      direction: "horizontal",
    },
    textColor: "#ffffff",
    borderColor: "#ff8f00",
    shape: "pill",
    size: "md",
    tone: "normal",
  };
}

export function cloneBadgeConfig(badge: BadgeConfig): BadgeConfig {
  return {
    ...badge,
    fill: badge.fill.mode === "solid" ? { ...badge.fill } : { ...badge.fill },
  };
}

export function sortBadges(badges: BadgeConfig[]) {
  const getOrder = (badge: BadgeConfig) => {
    if (badge.id.includes(":new")) return 0;
    if (badge.id.includes(":hot")) return 1;
    return 2;
  };

  return [...badges].sort((left, right) => getOrder(left) - getOrder(right));
}

export function getBadgeDisplayText(badge: BadgeConfig) {
  return badge.icon.trim() ? `${badge.icon.trim()} ${badge.label}` : badge.label;
}
