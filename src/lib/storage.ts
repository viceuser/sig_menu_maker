import { DEFAULT_FONT_PRESET, isFontPresetId, type FontPresetId } from "./fonts";
import {
  DEFAULT_FADE_INTERVAL,
  DEFAULT_ITEMS_PER_PAGE,
  type MenuConfig,
  type PreviewData,
  type ReactionItem,
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

export function loadItems(): ReactionItem[] {
  return readJson<ReactionItem[]>(ITEMS_KEY, []);
}

export function saveItems(items: ReactionItem[]) {
  window.localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export function loadConfig() {
  const config = readJson(CONFIG_KEY, {
    itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
    fadeInterval: DEFAULT_FADE_INTERVAL,
    fontPreset: DEFAULT_FONT_PRESET,
  });

  return {
    itemsPerPage: Number(config.itemsPerPage) || DEFAULT_ITEMS_PER_PAGE,
    fadeInterval: Number(config.fadeInterval) || DEFAULT_FADE_INTERVAL,
    fontPreset: isFontPresetId(config.fontPreset) ? config.fontPreset : DEFAULT_FONT_PRESET,
  };
}

export function saveConfig(
  config: Pick<MenuConfig, "itemsPerPage" | "fadeInterval" | "fontPreset">,
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
  });
}

export function savePreviewData(data: PreviewData) {
  window.localStorage.setItem(PREVIEW_KEY, JSON.stringify(data));
}

export function loadPreviewData(): PreviewData | null {
  return readJson<PreviewData | null>(PREVIEW_KEY, null);
}

export function saveFontPreset(fontPreset: FontPresetId) {
  const current = loadConfig();
  saveConfig({ ...current, fontPreset });
}
