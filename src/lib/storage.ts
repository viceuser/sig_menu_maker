import { DEFAULT_FONT_PRESET, isFontPresetId } from "./fonts";
import { createPresetBadge, sortBadges } from "./badges";
import {
  type BadgeConfig,
  DEFAULT_CONTENT_ALIGN,
  DEFAULT_COUNT_COLOR,
  DEFAULT_FADE_INTERVAL,
  DEFAULT_FONT_SIZE,
  DEFAULT_GAP_BASE,
  DEFAULT_GAP_MAX,
  DEFAULT_GAP_MIN,
  DEFAULT_ITEMS_PER_PAGE,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_TEXT_COLOR,
  DEFAULT_VERTICAL_PADDING,
  type ContentAlign,
  type GradientDirection,
  type MenuConfig,
  type PreviewData,
  type ReactionItem,
  type ReactionRowType,
  type TextPaint,
} from "./types";

const ITEMS_KEY = "reaction_items";
const CONFIG_KEY = "reaction_config";
const PREVIEW_KEY = "reaction_preview_data";

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function removeStorageKey(key: string) {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(key);
}

function readJson(key: string): unknown {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    removeStorageKey(key);
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isContentAlign(value: unknown): value is ContentAlign {
  return value === "left" || value === "right";
}

function isReactionRowType(value: unknown): value is ReactionRowType {
  return value === "normal" || value === "centerText";
}

function isGradientDirection(value: unknown): value is GradientDirection {
  return value === "horizontal" || value === "vertical";
}

function isHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function isBadgeShape(value: unknown): value is BadgeConfig["shape"] {
  return value === "pill" || value === "rectangle" || value === "outline" || value === "ribbon";
}

function isBadgeSize(value: unknown): value is BadgeConfig["size"] {
  return value === "sm" || value === "md" || value === "lg";
}

function isBadgeTone(value: unknown): value is BadgeConfig["tone"] {
  return value === "normal" || value === "neon" || value === "retro";
}

export function normalizePaint(value: unknown, fallback: TextPaint): TextPaint {
  if (isHex(value)) {
    return { mode: "solid", color: value.toLowerCase() };
  }

  if (!isObject(value)) return fallback;

  if (value.mode === "solid" && isHex(value.color)) {
    return { mode: "solid", color: value.color.toLowerCase() };
  }

  if (value.mode === "gradient" && isHex(value.from) && isHex(value.to) && isGradientDirection(value.direction)) {
    return {
      mode: "gradient",
      from: value.from.toLowerCase(),
      to: value.to.toLowerCase(),
      direction: value.direction,
    };
  }

  return fallback;
}

export function isBadgeConfig(value: unknown): value is BadgeConfig {
  if (!isObject(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.icon === "string" &&
    isHex(value.textColor) &&
    isHex(value.borderColor) &&
    isBadgeShape(value.shape) &&
    isBadgeSize(value.size) &&
    isBadgeTone(value.tone)
  );
}

function normalizeBadge(value: unknown): BadgeConfig | null {
  if (!isBadgeConfig(value)) return null;

  return {
    id: value.id,
    label: value.label,
    icon: value.icon,
    fill: normalizePaint(value.fill, { mode: "solid", color: value.borderColor.toLowerCase() }),
    textColor: value.textColor.toLowerCase(),
    borderColor: value.borderColor.toLowerCase(),
    shape: value.shape,
    size: value.size,
    tone: value.tone,
  };
}

function normalizeLegacyBadges(candidate: Record<string, unknown>) {
  const legacy: BadgeConfig[] = [];
  if (candidate.isNew) legacy.push(createPresetBadge("new"));
  if (candidate.isHot) legacy.push(createPresetBadge("hot"));
  return sortBadges(legacy);
}

function normalizeItem(value: unknown): ReactionItem | null {
  if (!isObject(value)) return null;
  if (typeof value.id !== "string" || typeof value.text !== "string") return null;

  const normalizedCount =
    value.count === null || value.count === undefined || value.count === ""
      ? null
      : Number.isFinite(Number(value.count))
        ? Number(value.count)
        : null;

  return {
    id: value.id,
    rowType: isReactionRowType(value.rowType) ? value.rowType : "normal",
    count: normalizedCount,
    text: value.text,
    countColor: normalizePaint(value.countColor, DEFAULT_COUNT_COLOR),
    textColor: normalizePaint(value.textColor, DEFAULT_TEXT_COLOR),
    badges: Array.isArray(value.badges)
      ? sortBadges(value.badges.map(normalizeBadge).filter(isDefined))
      : normalizeLegacyBadges(value),
  };
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

function normalizeItemsPayload(value: unknown) {
  if (!Array.isArray(value)) return { items: [], changed: value != null };

  const normalized = value.map(normalizeItem).filter(isDefined);
  return {
    items: normalized,
    changed: normalized.length !== value.length,
  };
}

function normalizeNumber(value: unknown, fallback: number, min = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, numeric);
}

function normalizeConfigPayload(value: unknown) {
  const fallback = {
    itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
    fadeInterval: DEFAULT_FADE_INTERVAL,
    fontPreset: DEFAULT_FONT_PRESET,
    fontSize: DEFAULT_FONT_SIZE,
    contentAlign: DEFAULT_CONTENT_ALIGN,
    strokeWidth: DEFAULT_STROKE_WIDTH,
    gapMin: DEFAULT_GAP_MIN,
    gapBase: DEFAULT_GAP_BASE,
    gapMax: DEFAULT_GAP_MAX,
    rowHeight: DEFAULT_ROW_HEIGHT,
    verticalPadding: DEFAULT_VERTICAL_PADDING,
  };

  if (!isObject(value)) {
    return { config: fallback, changed: value != null };
  }

  const config = {
    itemsPerPage: normalizeNumber(value.itemsPerPage, DEFAULT_ITEMS_PER_PAGE, 1),
    fadeInterval: normalizeNumber(value.fadeInterval, DEFAULT_FADE_INTERVAL, 1),
    fontPreset:
      typeof value.fontPreset === "string" && isFontPresetId(value.fontPreset)
        ? value.fontPreset
        : DEFAULT_FONT_PRESET,
    fontSize: normalizeNumber(value.fontSize, DEFAULT_FONT_SIZE, 1),
    contentAlign: isContentAlign(value.contentAlign) ? value.contentAlign : DEFAULT_CONTENT_ALIGN,
    strokeWidth: normalizeNumber(value.strokeWidth, DEFAULT_STROKE_WIDTH, 0),
    gapMin: normalizeNumber(value.gapMin, DEFAULT_GAP_MIN, 0),
    gapBase: normalizeNumber(value.gapBase, DEFAULT_GAP_BASE, 0),
    gapMax: normalizeNumber(value.gapMax, DEFAULT_GAP_MAX, 0),
    rowHeight: normalizeNumber(value.rowHeight, DEFAULT_ROW_HEIGHT, 1),
    verticalPadding: normalizeNumber(value.verticalPadding, DEFAULT_VERTICAL_PADDING, 0),
  };

  const changed =
    config.itemsPerPage !== value.itemsPerPage ||
    config.fadeInterval !== value.fadeInterval ||
    config.fontPreset !== value.fontPreset ||
    config.fontSize !== value.fontSize ||
    config.contentAlign !== value.contentAlign ||
    config.strokeWidth !== value.strokeWidth ||
    config.gapMin !== value.gapMin ||
    config.gapBase !== value.gapBase ||
    config.gapMax !== value.gapMax ||
    config.rowHeight !== value.rowHeight ||
    config.verticalPadding !== value.verticalPadding;

  return { config, changed };
}

function normalizePreviewData(value: unknown): PreviewData | null {
  if (!isObject(value)) return null;
  if (!Array.isArray(value.pages) || !value.pages.every((page) => typeof page === "string")) return null;

  return {
    pages: value.pages,
    frameDurationMs: normalizeNumber(value.frameDurationMs, 1000, 1),
    width: normalizeNumber(value.width, 1, 1),
    height: normalizeNumber(value.height, 1, 1),
    pageCount: normalizeNumber(value.pageCount, value.pages.length || 1, 1),
    fullMenuPage: typeof value.fullMenuPage === "string" ? value.fullMenuPage : undefined,
    fullMenuWidth: typeof value.fullMenuWidth === "number" ? value.fullMenuWidth : undefined,
    fullMenuHeight: typeof value.fullMenuHeight === "number" ? value.fullMenuHeight : undefined,
  };
}

export function loadItems(): ReactionItem[] {
  const raw = readJson(ITEMS_KEY);
  const { items, changed } = normalizeItemsPayload(raw);
  if (changed) {
    if (items.length > 0) writeJson(ITEMS_KEY, items);
    else removeStorageKey(ITEMS_KEY);
  }
  return items;
}

export function saveItems(items: ReactionItem[]) {
  writeJson(ITEMS_KEY, items);
}

export function loadConfig() {
  const raw = readJson(CONFIG_KEY);
  const { config, changed } = normalizeConfigPayload(raw);
  if (changed) {
    writeJson(CONFIG_KEY, config);
  }
  return config;
}

export function saveConfig(
  config: Pick<
    MenuConfig,
    | "itemsPerPage"
    | "fadeInterval"
    | "fontPreset"
    | "fontSize"
    | "contentAlign"
    | "strokeWidth"
    | "gapMin"
    | "gapBase"
    | "gapMax"
    | "rowHeight"
    | "verticalPadding"
  >,
) {
  writeJson(CONFIG_KEY, config);
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
    fontSize: config.fontSize,
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
  writeJson(PREVIEW_KEY, data);
}

export function loadPreviewData(): PreviewData | null {
  const raw = readJson(PREVIEW_KEY);
  const normalized = normalizePreviewData(raw);
  if (!normalized && raw != null) {
    removeStorageKey(PREVIEW_KEY);
  }
  return normalized;
}
