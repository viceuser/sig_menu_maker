import { getFontPreset, type FontPresetId } from "./fonts";
import type { ContentAlign, TextPaint, ReactionItem } from "./types";

export const CANVAS_WIDTH = 720;
export const CANVAS_PADDING_X = 34;
const FULL_MENU_COLUMN_GAP = 16;

const COUNT_SLOT_SIDE_PADDING = 6;
const MIN_COUNT_DIGITS = "00000";
const BADGE_STYLES = {
  NEW: { label: "NEW", color: "#00c853" },
  UPDATE: { label: "UPDATE", color: "#2979ff" },
  HOT: { label: "HOT", color: "#f44336" },
} as const;

interface RenderOptions {
  itemsPerPage: number;
  fontPreset: FontPresetId;
  contentAlign: ContentAlign;
  strokeWidth: number;
  gapMin: number;
  gapBase: number;
  gapMax: number;
  rowHeight: number;
  verticalPadding: number;
}

interface CropBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeCropBounds(bounds: CropBounds, width: number, height: number) {
  return {
    left: clamp(bounds.left, 0, width - 1),
    top: clamp(bounds.top, 0, height - 1),
    right: clamp(bounds.right, 1, width),
    bottom: clamp(bounds.bottom, 1, height),
  };
}

export function chunkItems(items: ReactionItem[], itemsPerPage: number) {
  const size = Math.max(1, itemsPerPage);
  const pages: ReactionItem[][] = [];

  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }

  return pages.length ? pages : [[]];
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let fitted = text;
  while (fitted.length > 0 && ctx.measureText(`${fitted}...`).width > maxWidth) {
    fitted = fitted.slice(0, -1);
  }

  return fitted ? `${fitted}...` : "";
}

function getTextBounds(x: number, y: number, width: number, align: CanvasTextAlign) {
  if (align === "right") {
    return { left: x - width, right: x, top: y - 22, bottom: y + 22 };
  }

  if (align === "center") {
    return { left: x - width / 2, right: x + width / 2, top: y - 22, bottom: y + 22 };
  }

  return { left: x, right: x + width, top: y - 22, bottom: y + 22 };
}

function createPaintStyle(
  ctx: CanvasRenderingContext2D,
  paint: TextPaint,
  bounds: ReturnType<typeof getTextBounds>,
  emphasis: "normal" | "strong" = "normal",
) {
  if (paint.mode === "solid") {
    return paint.color;
  }

  const gradient =
    paint.direction === "vertical"
      ? ctx.createLinearGradient(bounds.left, bounds.top, bounds.left, bounds.bottom)
      : ctx.createLinearGradient(bounds.left, bounds.top, bounds.right, bounds.top);

  if (emphasis === "strong") {
    gradient.addColorStop(0, paint.from);
    gradient.addColorStop(0.35, paint.from);
    gradient.addColorStop(0.65, paint.to);
    gradient.addColorStop(1, paint.to);
    return gradient;
  }

  gradient.addColorStop(0, paint.from);
  gradient.addColorStop(1, paint.to);
  return gradient;
}

function drawTextWithStroke(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  paint: TextPaint,
  align: CanvasTextAlign,
  strokeWidth: number,
  emphasis: "normal" | "strong" = "normal",
) {
  const textWidth = ctx.measureText(text).width;
  const bounds = getTextBounds(x, y, textWidth, align);

  ctx.textAlign = align;
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = createPaintStyle(ctx, paint, bounds, emphasis);
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

function getBadgeDefinitions(item: ReactionItem) {
  return [
    item.isNew ? BADGE_STYLES.NEW : null,
    item.isUpdate ? BADGE_STYLES.UPDATE : null,
    item.isHot ? BADGE_STYLES.HOT : null,
  ].filter(Boolean) as Array<(typeof BADGE_STYLES)[keyof typeof BADGE_STYLES]>;
}

function getBadgeGap(baseGap: number) {
  return Math.max(2, Math.round(baseGap));
}

function getBadgeMetrics(ctx: CanvasRenderingContext2D, item: ReactionItem, baseGap: number) {
  const badgeGap = getBadgeGap(baseGap);
  ctx.save();
  ctx.font = "800 14px sans-serif";
  const badges = getBadgeDefinitions(item).map((badge) => {
    const textWidth = ctx.measureText(badge.label).width;
    return {
      ...badge,
      width: Math.ceil(textWidth + 18),
      height: 22,
    };
  });
  ctx.restore();

  const totalWidth = badges.reduce((sum, badge, index) => sum + badge.width + (index > 0 ? badgeGap : 0), 0);
  return { badges, totalWidth, badgeGap };
}

function drawBadges(
  ctx: CanvasRenderingContext2D,
  x: number,
  centerY: number,
  item: ReactionItem,
  baseGap: number,
) {
  const { badges, badgeGap } = getBadgeMetrics(ctx, item, baseGap);
  if (badges.length === 0) return 0;

  ctx.save();
  ctx.font = "800 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let currentX = x;
  badges.forEach((badge, index) => {
    const top = centerY - badge.height / 2;
    const radius = 6;

    ctx.fillStyle = badge.color;
    ctx.beginPath();
    ctx.moveTo(currentX + radius, top);
    ctx.lineTo(currentX + badge.width - radius, top);
    ctx.quadraticCurveTo(currentX + badge.width, top, currentX + badge.width, top + radius);
    ctx.lineTo(currentX + badge.width, top + badge.height - radius);
    ctx.quadraticCurveTo(currentX + badge.width, top + badge.height, currentX + badge.width - radius, top + badge.height);
    ctx.lineTo(currentX + radius, top + badge.height);
    ctx.quadraticCurveTo(currentX, top + badge.height, currentX, top + badge.height - radius);
    ctx.lineTo(currentX, top + radius);
    ctx.quadraticCurveTo(currentX, top, currentX + radius, top);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(badge.label, currentX + badge.width / 2, centerY + 0.5);
    currentX += badge.width + (index < badges.length - 1 ? badgeGap : 0);
  });

  ctx.restore();
  return badges.reduce((sum, badge, index) => sum + badge.width + (index > 0 ? badgeGap : 0), 0);
}

function getCountSlotWidth(ctx: CanvasRenderingContext2D, countText: string) {
  const minimumWidth = ctx.measureText(MIN_COUNT_DIGITS).width;
  const countWidth = ctx.measureText(countText).width;
  return Math.ceil(Math.max(minimumWidth, countWidth) + COUNT_SLOT_SIDE_PADDING * 2);
}

function getAdaptiveGap(
  ctx: CanvasRenderingContext2D,
  countText: string,
  text: string,
  gapMin: number,
  gapBase: number,
  gapMax: number,
) {
  const countSlotWidth = getCountSlotWidth(ctx, countText);
  const countWidth = ctx.measureText(countText).width;
  const slotSlack = Math.max(0, countSlotWidth - countWidth);
  const textLengthPenalty = text.length > 10 ? Math.min(4, Math.floor((text.length - 10) / 5)) : 0;
  const safeMin = Math.min(gapMin, gapBase, gapMax);
  const safeMax = Math.max(gapMin, gapBase, gapMax);
  const safeBase = clamp(gapBase, safeMin, safeMax);
  return clamp(Math.round(safeBase + slotSlack * 0.04 - textLengthPenalty), safeMin, safeMax);
}

async function waitForCanvasFont(fontPreset: FontPresetId) {
  if (typeof document === "undefined" || !("fonts" in document)) return;

  const family = getFontPreset(fontPreset).cssFamily;
  await Promise.all([
    document.fonts.load(`500 26px ${family}`),
    document.fonts.load(`800 28px ${family}`),
    document.fonts.ready,
  ]);
}

function drawLeftExampleRow(
  ctx: CanvasRenderingContext2D,
  item: ReactionItem,
  centerY: number,
  fontFamily: string,
  strokeWidth: number,
  gapMin: number,
  gapBase: number,
  gapMax: number,
) {
  const { totalWidth: badgeTotalWidth } = getBadgeMetrics(ctx, item, gapBase);
  const badgeGap = getBadgeGap(gapBase);
  ctx.font = `800 28px ${fontFamily}`;
  const countText = String(item.count);
  const countLeft = CANVAS_PADDING_X;
  const countWidth = ctx.measureText(countText).width;
  const adaptiveGap = getAdaptiveGap(ctx, countText, item.text.trim(), gapMin, gapBase, gapMax);
  const textLeft = countLeft + countWidth + COUNT_SLOT_SIDE_PADDING + adaptiveGap;
  const textRightLimit =
    CANVAS_WIDTH - CANVAS_PADDING_X - (badgeTotalWidth > 0 ? badgeTotalWidth + badgeGap : 0);
  const maxTextWidth = Math.max(40, textRightLimit - textLeft);

  drawTextWithStroke(ctx, countText, countLeft, centerY, item.countColor, "left", strokeWidth, "strong");

  ctx.font = `500 26px ${fontFamily}`;
  const safeText = fitText(ctx, item.text.trim() || "REACTION", maxTextWidth);
  drawTextWithStroke(ctx, safeText, textLeft, centerY, item.textColor, "left", strokeWidth);

  if (badgeTotalWidth > 0) {
    const textWidth = ctx.measureText(safeText).width;
    const badgeLeft = textLeft + textWidth + badgeGap;
    drawBadges(ctx, badgeLeft, centerY, item, gapBase);
  }
}

function drawRightExampleRow(
  ctx: CanvasRenderingContext2D,
  item: ReactionItem,
  centerY: number,
  fontFamily: string,
  strokeWidth: number,
  gapMin: number,
  gapBase: number,
  gapMax: number,
) {
  const { totalWidth: badgeTotalWidth } = getBadgeMetrics(ctx, item, gapBase);
  const badgeGap = getBadgeGap(gapBase);
  ctx.font = `800 28px ${fontFamily}`;
  const countText = String(item.count);
  const countWidth = ctx.measureText(countText).width;
  const adaptiveGap = getAdaptiveGap(ctx, countText, item.text.trim(), gapMin, gapBase, gapMax);
  const countRight = CANVAS_WIDTH - CANVAS_PADDING_X;
  const textRight = countRight - countWidth - COUNT_SLOT_SIDE_PADDING - adaptiveGap;
  const textLeftLimit = CANVAS_PADDING_X + (badgeTotalWidth > 0 ? badgeTotalWidth + badgeGap : 0);
  const maxTextWidth = Math.max(40, textRight - textLeftLimit);

  drawTextWithStroke(ctx, countText, countRight, centerY, item.countColor, "right", strokeWidth, "strong");

  ctx.font = `500 26px ${fontFamily}`;
  const safeText = fitText(ctx, item.text.trim() || "REACTION", maxTextWidth);
  drawTextWithStroke(ctx, safeText, textRight, centerY, item.textColor, "right", strokeWidth);

  if (badgeTotalWidth > 0) {
    const textWidth = ctx.measureText(safeText).width;
    const badgeLeft = textRight - textWidth - badgeGap - badgeTotalWidth;
    drawBadges(ctx, badgeLeft, centerY, item, gapBase);
  }
}

function drawReactionRow(
  ctx: CanvasRenderingContext2D,
  item: ReactionItem,
  rowY: number,
  rowHeight: number,
  fontFamily: string,
  contentAlign: ContentAlign,
  strokeWidth: number,
  gapMin: number,
  gapBase: number,
  gapMax: number,
) {
  const centerY = rowY + rowHeight / 2;

  if (contentAlign === "left") {
    drawLeftExampleRow(ctx, item, centerY, fontFamily, strokeWidth, gapMin, gapBase, gapMax);
    return;
  }

  drawRightExampleRow(ctx, item, centerY, fontFamily, strokeWidth, gapMin, gapBase, gapMax);
}

function findCanvasContentBounds(canvas: HTMLCanvasElement, padding = 10): CropBounds {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { left: 0, top: 0, right: canvas.width, bottom: canvas.height };
  }

  const { width, height } = canvas;
  const image = ctx.getImageData(0, 0, width, height);
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = image.data[(y * width + x) * 4 + 3];
      if (alpha === 0) continue;

      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < 0 || bottom < 0) {
    return { left: 0, top: 0, right: width, bottom: height };
  }

  return normalizeCropBounds(
    {
      left: left - padding,
      top: top - padding,
      right: right + padding + 1,
      bottom: bottom + padding + 1,
    },
    width,
    height,
  );
}

function mergeCropBounds(boundsList: CropBounds[], width: number, height: number): CropBounds {
  if (boundsList.length === 0) {
    return { left: 0, top: 0, right: width, bottom: height };
  }

  return normalizeCropBounds(
    {
      left: Math.min(...boundsList.map((bounds) => bounds.left)),
      top: Math.min(...boundsList.map((bounds) => bounds.top)),
      right: Math.max(...boundsList.map((bounds) => bounds.right)),
      bottom: Math.max(...boundsList.map((bounds) => bounds.bottom)),
    },
    width,
    height,
  );
}

function cropCanvas(canvas: HTMLCanvasElement, bounds: CropBounds) {
  const safeBounds = normalizeCropBounds(bounds, canvas.width, canvas.height);
  const cropped = document.createElement("canvas");
  cropped.width = Math.max(1, safeBounds.right - safeBounds.left);
  cropped.height = Math.max(1, safeBounds.bottom - safeBounds.top);

  const ctx = cropped.getContext("2d");
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, cropped.width, cropped.height);
  ctx.drawImage(
    canvas,
    safeBounds.left,
    safeBounds.top,
    cropped.width,
    cropped.height,
    0,
    0,
    cropped.width,
    cropped.height,
  );

  return cropped;
}

function buildRawPageCanvases(items: ReactionItem[], options: RenderOptions) {
  const logicalPages = chunkItems(items, options.itemsPerPage);

  return logicalPages.map((page) =>
    renderSingleReactionPage(page, {
      itemsPerPage: options.itemsPerPage,
      fontPreset: options.fontPreset,
      contentAlign: options.contentAlign,
      strokeWidth: options.strokeWidth,
      gapMin: options.gapMin,
      gapBase: options.gapBase,
      gapMax: options.gapMax,
      rowHeight: options.rowHeight,
      verticalPadding: options.verticalPadding,
    }),
  );
}

function renderSingleReactionPage(pageItems: ReactionItem[], options: RenderOptions, rowCount = options.itemsPerPage) {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = options.verticalPadding * 2 + options.rowHeight * Math.max(1, rowCount);

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const fontFamily = getFontPreset(options.fontPreset).cssFamily;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "middle";

  for (let index = 0; index < options.itemsPerPage; index += 1) {
    const item = pageItems[index];
    if (!item) continue;

    const rowY = options.verticalPadding + index * options.rowHeight;
    drawReactionRow(
      ctx,
      item,
      rowY,
      options.rowHeight,
      fontFamily,
      options.contentAlign,
      options.strokeWidth,
      options.gapMin,
      options.gapBase,
      options.gapMax,
    );
  }

  return canvas;
}

export async function renderReactionCanvases(items: ReactionItem[], options: RenderOptions) {
  await waitForCanvasFont(options.fontPreset);

  const logicalPages = chunkItems(items, options.itemsPerPage);
  const rawCanvases = buildRawPageCanvases(items, options);

  const mergedBounds = mergeCropBounds(
    rawCanvases.map((canvas) => findCanvasContentBounds(canvas)),
    rawCanvases[0]?.width ?? CANVAS_WIDTH,
    rawCanvases[0]?.height ?? options.verticalPadding * 2 + options.rowHeight * Math.max(1, options.itemsPerPage),
  );
  const canvases = rawCanvases.map((canvas) => cropCanvas(canvas, mergedBounds));

  return {
    canvases,
    pageCount: logicalPages.length,
  };
}

export async function renderReactionDataUrls(items: ReactionItem[], options: RenderOptions) {
  const { canvases, pageCount } = await renderReactionCanvases(items, options);
  return {
    pages: canvases.map((canvas) => canvas.toDataURL("image/png")),
    width: canvases[0]?.width ?? CANVAS_WIDTH,
    height: canvases[0]?.height ?? options.verticalPadding * 2 + options.rowHeight * Math.max(1, options.itemsPerPage),
    fullMenuPage: "",
    fullMenuWidth: 0,
    fullMenuHeight: 0,
    pageCount,
  };
}

export async function renderFullMenuPng(items: ReactionItem[], options: RenderOptions) {
  const { canvases } = await renderReactionCanvases(items, options);
  const rawCanvases = buildRawPageCanvases(items, options);
  const visibleCanvases =
    rawCanvases.length > 0
      ? rawCanvases.map((canvas) => {
          const bounds = findCanvasContentBounds(canvas);
          return cropCanvas(canvas, {
            left: bounds.left,
            top: 0,
            right: bounds.right,
            bottom: canvas.height,
          });
        })
      : [renderSingleReactionPage([], options)];
  const totalWidth =
    visibleCanvases.reduce((sum, canvas) => sum + canvas.width, 0) +
    FULL_MENU_COLUMN_GAP * Math.max(0, visibleCanvases.length - 1);
  const totalHeight = Math.max(...visibleCanvases.map((canvas) => canvas.height), canvases[0]?.height ?? 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, totalWidth);
  canvas.height = Math.max(1, totalHeight);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      page: "",
      width: 0,
      height: 0,
    };
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let offsetX = 0;
  visibleCanvases.forEach((columnCanvas) => {
    ctx.drawImage(columnCanvas, offsetX, 0);
    offsetX += columnCanvas.width + FULL_MENU_COLUMN_GAP;
  });

  return {
    page: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}
