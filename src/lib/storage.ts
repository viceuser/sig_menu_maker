import { DEFAULT_FONT_PRESET, isFontPresetId } from "./fonts";
import {
  DEFAULT_CONTENT_ALIGN,
  DEFAULT_COUNT_COLOR,
  DEFAULT_FADE_INTERVAL,
  DEFAULT_GAP_BASE,
  DEFAULT_GAP_MAX,
  DEFAULT_GAP_MIN,
  DEFAULT_ITEMS_PER_PAGE,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_TEXT_COLOR,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_VERTICAL_PADDING,
  type ContentAlign,
  type GradientDirection,
  type MenuConfig,
  type PreviewData,
  type ReactionItem,
  type TextPaint,
} from "./types";

const ITEMS_KEY = "reaction_items";
const CONFIG_KEY = "reaction_config";
const PREVIEW_KEY = "reaction_preview_data";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function isContentAlign(value: string): value is ContentAlign {
  return value === "left" || value === "right";
}

function isGradientDirection(value: string): value is GradientDirection {
  return value === "horizontal" || value === "vertical";
}

function isHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function normalizePaint(value: unknown, fallback: TextPaint): TextPaint {
  if (isHex(value)) {
    return { mode: "solid", color: value.toLowerCase() };
  }

  if (!value || typeof value !== "object") return fallback;

  const candidate = value as Record<string, unknown>;
  if (candidate.mode === "solid" && isHex(candidate.color)) {
    return { mode: "solid", color: candidate.color.toLowerCase() };
  }

  if (
    candidate.mode === "gradient" &&
    isHex(candidate.from) &&
    isHex(candidate.to) &&
    typeof candidate.direction === "string" &&
    isGradientDirection(candidate.direction)
  ) {
    return {
      mode: "gradient",
      from: candidate.from.toLowerCase(),
      to: candidate.to.toLowerCase(),
      direction: candidate.direction,
    };
  }

  return fallback;
}

function normalizeItem(value: unknown): ReactionItem | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== "string") return null;
  if (typeof candidate.text !== "string") return null;

  return {
    id: candidate.id,
    count: Number(candidate.count) || 0,
    text: candidate.text,
    countColor: normalizePaint(candidate.countColor, DEFAULT_COUNT_COLOR),
    textColor: normalizePaint(candidate.textColor, DEFAULT_TEXT_COLOR),
  };
}

export function loadItems(): ReactionItem[] {
  const rawItems = readJson<unknown[]>(ITEMS_KEY, []);
  return Array.isArray(rawItems) ? rawItems.map(normalizeItem).filter((item): item is ReactionItem => Boolean(item)) : [];
}

export function saveItems(items: ReactionItem[]) {
  window.localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export function loadConfig() {
  const config = readJson(CONFIG_KEY, {
    itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
    fadeInterval: DEFAULT_FADE_INTERVAL,
    fontPreset: DEFAULT_FONT_PRESET,
    contentAlign: DEFAULT_CONTENT_ALIGN,
    strokeWidth: DEFAULT_STROKE_WIDTH,
    gapMin: DEFAULT_GAP_MIN,
    gapBase: DEFAULT_GAP_BASE,
    gapMax: DEFAULT_GAP_MAX,
    rowHeight: DEFAULT_ROW_HEIGHT,
    verticalPadding: DEFAULT_VERTICAL_PADDING,
  });

  return {
    itemsPerPage: Number(config.itemsPerPage) || DEFAULT_ITEMS_PER_PAGE,
    fadeInterval: Number(config.fadeInterval) || DEFAULT_FADE_INTERVAL,
    fontPreset: isFontPresetId(config.fontPreset) ? config.fontPreset : DEFAULT_FONT_PRESET,
    contentAlign: isContentAlign(config.contentAlign) ? config.contentAlign : DEFAULT_CONTENT_ALIGN,
    strokeWidth: Number(config.strokeWidth) || DEFAULT_STROKE_WIDTH,
    gapMin: Number(config.gapMin) || DEFAULT_GAP_MIN,
    gapBase: Number(config.gapBase) || DEFAULT_GAP_BASE,
    gapMax: Number(config.gapMax) || DEFAULT_GAP_MAX,
    rowHeight: Number(config.rowHeight) || DEFAULT_ROW_HEIGHT,
    verticalPadding: Number(config.verticalPadding) || DEFAULT_VERTICAL_PADDING,
  };
}

export function saveConfig(
  config: Pick<
    MenuConfig,
    | "itemsPerPage"
    | "fadeInterval"
    | "fontPreset"
    | "contentAlign"
    | "strokeWidth"
    | "gapMin"
    | "gapBase"
    | "gapMax"
    | "rowHeight"
    | "verticalPadding"
  >,
) {
  window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function loadMenuConfig(): MenuConfig {
  const items = loadItems();
  const config = loadConfig();
  return { items, ...config };
}

export function saveMenuConfig(config: MenuConfig) {
  saveItems(config.items);
  saveConfig({
    itemsPerPage: config.itemsPerPage,
    fadeInterval: config.fadeInterval,
    fontPreset: config.fontPreset,
    contentAlign: config.contentAlign,
    strokeWidth: config.strokeWidth,
    gapMin: config.gapMin,
    gapBase: config.gapBase,
    gapMax: config.gapMax,
    rowHeight: config.rowHeight,
    verticalPadding: config.verticalPadding,
  });
}

export function savePreviewData(data: PreviewData) {
  window.localStorage.setItem(PREVIEW_KEY, JSON.stringify(data));
}

export function loadPreviewData(): PreviewData | null {
  return readJson<PreviewData | null>(PREVIEW_KEY, null);
}
