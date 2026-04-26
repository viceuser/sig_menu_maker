export interface ReactionItem {
  id: string;
  count: number;
  text: string;
  countColor: string;
  textColor: string;
  isYellow: boolean;
  isNew: boolean;
  isUpdate: boolean;
  isHot: boolean;
}

export interface MenuConfig {
  items: ReactionItem[];
  itemsPerPage: number;
  fadeInterval: number;
  fontPreset: string;
}

export interface PreviewData {
  pages: string[];
  fadeInterval: number;
  width: number;
  height: number;
}

export const DEFAULT_COUNT_COLOR = "#f97671";
export const DEFAULT_TEXT_COLOR = "#ffffff";
export const DEFAULT_ITEMS_PER_PAGE = 15;
export const DEFAULT_FADE_INTERVAL = 7;
