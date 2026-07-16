export type GradientDirection = "horizontal" | "vertical";
export type TextEffect = "none" | "shadow" | "neon" | "double-outline" | "extrude";
export type BadgeShape = "pill" | "rectangle" | "outline" | "ribbon";
export type BadgeSize = "sm" | "md" | "lg";
export type BadgeStyleTone = "normal" | "neon" | "retro";

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
export type ReactionRowType = "normal" | "centerText";

export interface BadgeConfig {
  id: string;
  label: string;
  icon: string;
  fill: TextPaint;
  textColor: string;
  borderColor: string;
  shape: BadgeShape;
  size: BadgeSize;
  tone: BadgeStyleTone;
}

export interface ReactionItem {
  id: string;
  rowType: ReactionRowType;
  count: number | null;
  text: string;
  countColor: TextPaint;
  textColor: TextPaint;
  badges: BadgeConfig[];
}

export type ContentAlign = "left" | "right";

export interface MenuConfig {
  items: ReactionItem[];
  itemsPerPage: number;
  fadeInterval: number;
  fontPreset: string;
  fontSize: number;
  contentAlign: ContentAlign;
  strokeWidth: number;
  textEffect: TextEffect;
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

export const DEFAULT_COUNT_COLOR: GradientPaint = {
  mode: "gradient",
  direction: "vertical",
  from: "#2979ff",
  to: "#ffffff",
};

export const DEFAULT_TEXT_COLOR: GradientPaint = {
  mode: "gradient",
  direction: "horizontal",
  from: "#000000",
  to: "#ffffff",
};

export const DEFAULT_ITEMS_PER_PAGE = 20;
export const DEFAULT_FADE_INTERVAL = 5;
export const DEFAULT_CONTENT_ALIGN: ContentAlign = "left";
export const DEFAULT_FONT_SIZE = 28;
export const DEFAULT_STROKE_WIDTH = 4;
export const DEFAULT_TEXT_EFFECT: TextEffect = "none";
export const DEFAULT_GAP_MIN = 6;
export const DEFAULT_GAP_BASE = 6;
export const DEFAULT_GAP_MAX = 16;
export const DEFAULT_ROW_HEIGHT = 43;
export const DEFAULT_VERTICAL_PADDING = 24;
