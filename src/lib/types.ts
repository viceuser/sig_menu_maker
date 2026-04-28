export type GradientDirection = "horizontal" | "vertical";

export interface SolidPaint {
  mode: "solid";
  color: string;
}

export interface GradientPaint {
  mode: "gradient";
  from: string;
  to: string;
  direction: GradientDirection;
}

export type TextPaint = SolidPaint | GradientPaint;

export interface ReactionItem {
  id: string;
  count: number;
  text: string;
  countColor: TextPaint;
  textColor: TextPaint;
  isNew: boolean;
  isUpdate: boolean;
  isHot: boolean;
}

export type ContentAlign = "left" | "right";

export interface MenuConfig {
  items: ReactionItem[];
  itemsPerPage: number;
  fadeInterval: number;
  fontPreset: string;
  contentAlign: ContentAlign;
  strokeWidth: number;
  gapMin: number;
  gapBase: number;
  gapMax: number;
  rowHeight: number;
  verticalPadding: number;
}

export interface PreviewData {
  pages: string[];
  frameDurationMs: number;
  width: number;
  height: number;
  pageCount: number;
  fullMenuPage?: string;
  fullMenuWidth?: number;
  fullMenuHeight?: number;
}

export const DEFAULT_COUNT_COLOR: SolidPaint = { mode: "solid", color: "#f97671" };
export const DEFAULT_TEXT_COLOR: SolidPaint = { mode: "solid", color: "#ffffff" };
export const DEFAULT_ITEMS_PER_PAGE = 15;
export const DEFAULT_FADE_INTERVAL = 7;
export const DEFAULT_CONTENT_ALIGN: ContentAlign = "left";
export const DEFAULT_STROKE_WIDTH = 1.5;
export const DEFAULT_GAP_MIN = 7;
export const DEFAULT_GAP_BASE = 8;
export const DEFAULT_GAP_MAX = 16;
export const DEFAULT_ROW_HEIGHT = 54;
export const DEFAULT_VERTICAL_PADDING = 24;
