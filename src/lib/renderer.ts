import { getFontPreset, type FontPresetId } from "./fonts";
import { getBadgeDisplayText } from "./badges";
import type { BadgeConfig, ContentAlign, TextEffect, TextPaint, ReactionItem } from "./types";

export const CANVAS_WIDTH = 720;
export const CANVAS_PADDING_X = 34;
const FULL_MENU_COLUMN_GAP = 16;

const COUNT_SLOT_SIDE_PADDING = 6;
const MIN_COUNT_DIGITS = "00000";
interface RenderOptions {
  itemsPerPage: number;
  fadeIntervalMs?: number;
  fontPreset: FontPresetId;
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

interface CropBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface CenterLineBounds {
  left: number;
  right: number;
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

function getCountFontSize(fontSize: number) {
  return fontSize + 2;
}

function getCountText(count: ReactionItem["count"]) {
  return typeof count === "number" && Number.isFinite(count) ? String(count) : "";
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
  textEffect: TextEffect,
  emphasis: "normal" | "strong" = "normal",
) {
  const textWidth = ctx.measureText(text).width;
  const bounds = getTextBounds(x, y, textWidth, align);
  const fillStyle = createPaintStyle(ctx, paint, bounds, emphasis);

  ctx.save();
  ctx.textAlign = align;
  ctx.lineJoin = "round";
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = fillStyle;

  if (textEffect === "shadow") {
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
  } else if (textEffect === "neon") {
    ctx.shadowColor = paint.mode === "solid" ? paint.color : paint.from;
    ctx.shadowBlur = Math.max(7, strokeWidth * 2);
  } else if (textEffect === "double-outline") {
    ctx.lineWidth = strokeWidth + 4;
    ctx.strokeStyle = "#000000";
    ctx.strokeText(text, x, y);
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fillStyle;
    ctx.fillText(text, x, y);
    ctx.restore();
    return;
  } else if (textEffect === "extrude") {
    ctx.fillStyle = "#3f3f46";
    for (let depth = 4; depth >= 1; depth -= 1) {
      ctx.strokeText(text, x + depth, y + depth);
      ctx.fillText(text, x + depth, y + depth);
    }
    ctx.fillStyle = fillStyle;
  }

  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function getBadgeGap(baseGap: number) {
  return Math.max(2, Math.round(baseGap));
}

function getBadgeSizeMetrics(size: BadgeConfig["size"]) {
  if (size === "sm") {
    return {
      fontSize: 11,
      fontWeight: 800,
      horizontalPadding: 7,
      height: 20,
      strokeWidth: 1.2,
    };
  }

  if (size === "lg") {
    return {
      fontSize: 15,
      fontWeight: 800,
      horizontalPadding: 11,
      height: 28,
      strokeWidth: 1.8,
    };
  }

  return {
    fontSize: 13,
    fontWeight: 800,
    horizontalPadding: 9,
    height: 24,
    strokeWidth: 1.5,
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function getBadgeRadius(badge: BadgeConfig, height: number) {
  if (badge.shape === "pill") return height / 2;
  if (badge.shape === "ribbon") return 4;
  if (badge.shape === "rectangle") return 4;
  return 6;
}

function drawRibbonBadge(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const notch = Math.min(12, Math.max(8, Math.round(width * 0.16)));
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width - notch, y);
  ctx.lineTo(x + width, y + height / 2);
  ctx.lineTo(x + width - notch, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
}

function createBadgeFillStyle(
  ctx: CanvasRenderingContext2D,
  badge: BadgeConfig,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  if (badge.fill.mode === "solid") {
    return badge.fill.color;
  }

  const gradient =
    badge.fill.direction === "vertical"
      ? ctx.createLinearGradient(left, top, left, top + height)
      : ctx.createLinearGradient(left, top, left + width, top);

  gradient.addColorStop(0, badge.fill.from);
  gradient.addColorStop(1, badge.fill.to);
  return gradient;
}

function getBadgeMetrics(
  ctx: CanvasRenderingContext2D,
  item: ReactionItem,
  baseGap: number,
) {
  const badgeGap = getBadgeGap(baseGap);
  ctx.save();
  const badges = item.badges
    .map((badge) => {
    const sizeMetrics = getBadgeSizeMetrics(badge.size);
    ctx.font =
      badge.tone === "retro"
        ? `${sizeMetrics.fontWeight} ${sizeMetrics.fontSize}px ui-monospace, monospace`
        : `${sizeMetrics.fontWeight} ${sizeMetrics.fontSize}px sans-serif`;
    const textWidth = ctx.measureText(getBadgeDisplayText(badge)).width;
    return {
      ...badge,
      width: Math.ceil(textWidth + sizeMetrics.horizontalPadding * 2),
      height: sizeMetrics.height,
      fontSize: sizeMetrics.fontSize,
      fontWeight: sizeMetrics.fontWeight,
      strokeWidth: sizeMetrics.strokeWidth,
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
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let currentX = x;
  badges.forEach((badge, index) => {
    const top = centerY - badge.height / 2;
    const radius = getBadgeRadius(badge, badge.height);
    ctx.font = `${badge.fontWeight} ${badge.fontSize}px sans-serif`;
    ctx.lineWidth = badge.strokeWidth;
    ctx.shadowBlur = badge.tone === "neon" ? 8 : 0;
    ctx.shadowColor = badge.tone === "neon" ? badge.borderColor : "transparent";
    ctx.shadowOffsetX = badge.tone === "retro" ? 2 : 0;
    ctx.shadowOffsetY = badge.tone === "retro" ? 2 : 0;

    if (badge.shape === "ribbon") {
      drawRibbonBadge(ctx, currentX, top, badge.width, badge.height);
    } else {
      drawRoundedRect(ctx, currentX, top, badge.width, badge.height, radius);
    }

    if (badge.shape === "outline") {
      ctx.strokeStyle = badge.borderColor;
      ctx.stroke();
    } else {
      ctx.fillStyle = createBadgeFillStyle(ctx, badge, currentX, top, badge.width, badge.height);
      ctx.fill();
      ctx.strokeStyle = badge.borderColor;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    if (badge.tone === "retro") {
      ctx.font = `${badge.fontWeight} ${badge.fontSize}px ui-monospace, monospace`;
    }
    ctx.fillStyle = badge.textColor;
    ctx.fillText(getBadgeDisplayText(badge), currentX + badge.width / 2, centerY + 0.5);
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

function getNormalRowContentBounds(
  ctx: CanvasRenderingContext2D,
  item: ReactionItem,
  fontFamily: string,
  fontSize: number,
  contentAlign: ContentAlign,
  gapMin: number,
  gapBase: number,
  gapMax: number,
): CenterLineBounds | null {
  if (item.rowType === "centerText") return null;

  const { totalWidth: badgeTotalWidth } = getBadgeMetrics(ctx, item, gapBase);
  const badgeGap = getBadgeGap(gapBase);
  const countFontSize = getCountFontSize(fontSize);
  ctx.font = `800 ${countFontSize}px ${fontFamily}`;
  const countText = getCountText(item.count);
  const hasCount = countText.length > 0;
  const countWidth = ctx.measureText(countText).width;
  const adaptiveGap = hasCount ? getAdaptiveGap(ctx, countText, item.text.trim(), gapMin, gapBase, gapMax) : 0;

  ctx.font = `500 ${fontSize}px ${fontFamily}`;

  if (contentAlign === "left") {
    const countLeft = CANVAS_PADDING_X;
    const textLeft = hasCount ? countLeft + countWidth + COUNT_SLOT_SIDE_PADDING + adaptiveGap : countLeft;
    const textRightLimit =
      CANVAS_WIDTH - CANVAS_PADDING_X - (badgeTotalWidth > 0 ? badgeTotalWidth + badgeGap : 0);
    const maxTextWidth = Math.max(40, textRightLimit - textLeft);
    const safeText = fitText(ctx, item.text.trim(), maxTextWidth);
    const textWidth = ctx.measureText(safeText).width;
    const left = hasCount ? countLeft : textLeft;
    const right = Math.max(hasCount ? countLeft + countWidth : textLeft, textLeft + textWidth);
    return { left, right };
  }

  const countRight = CANVAS_WIDTH - CANVAS_PADDING_X;
  const textRight = hasCount ? countRight - countWidth - COUNT_SLOT_SIDE_PADDING - adaptiveGap : countRight;
  const textLeftLimit = CANVAS_PADDING_X + (badgeTotalWidth > 0 ? badgeTotalWidth + badgeGap : 0);
  const maxTextWidth = Math.max(40, textRight - textLeftLimit);
  const safeText = fitText(ctx, item.text.trim(), maxTextWidth);
  const textWidth = ctx.measureText(safeText).width;
  const left = Math.min(hasCount ? countRight - countWidth : textRight, textRight - textWidth);
  const right = hasCount ? countRight : textRight;
  return { left, right };
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
  fontSize: number,
  strokeWidth: number,
  textEffect: TextEffect,
  gapMin: number,
  gapBase: number,
  gapMax: number,
) {
  const { totalWidth: badgeTotalWidth } = getBadgeMetrics(ctx, item, gapBase);
  const badgeGap = getBadgeGap(gapBase);
  const countFontSize = getCountFontSize(fontSize);
  ctx.font = `800 ${countFontSize}px ${fontFamily}`;
  const countText = getCountText(item.count);
  const hasCount = countText.length > 0;
  const countLeft = CANVAS_PADDING_X;
  const countWidth = ctx.measureText(countText).width;
  const adaptiveGap = hasCount ? getAdaptiveGap(ctx, countText, item.text.trim(), gapMin, gapBase, gapMax) : 0;
  const textLeft = hasCount ? countLeft + countWidth + COUNT_SLOT_SIDE_PADDING + adaptiveGap : countLeft;
  const textRightLimit =
    CANVAS_WIDTH - CANVAS_PADDING_X - (badgeTotalWidth > 0 ? badgeTotalWidth + badgeGap : 0);
  const maxTextWidth = Math.max(40, textRightLimit - textLeft);

  if (hasCount) {
    drawTextWithStroke(ctx, countText, countLeft, centerY, item.countColor, "left", strokeWidth, textEffect, "strong");
  }

  ctx.font = `500 ${fontSize}px ${fontFamily}`;
  const safeText = fitText(ctx, item.text.trim(), maxTextWidth);
  drawTextWithStroke(ctx, safeText, textLeft, centerY, item.textColor, "left", strokeWidth, textEffect);

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
  fontSize: number,
  strokeWidth: number,
  textEffect: TextEffect,
  gapMin: number,
  gapBase: number,
  gapMax: number,
) {
  const { totalWidth: badgeTotalWidth } = getBadgeMetrics(ctx, item, gapBase);
  const badgeGap = getBadgeGap(gapBase);
  const countFontSize = getCountFontSize(fontSize);
  ctx.font = `800 ${countFontSize}px ${fontFamily}`;
  const countText = getCountText(item.count);
  const hasCount = countText.length > 0;
  const countWidth = ctx.measureText(countText).width;
  const adaptiveGap = hasCount ? getAdaptiveGap(ctx, countText, item.text.trim(), gapMin, gapBase, gapMax) : 0;
  const countRight = CANVAS_WIDTH - CANVAS_PADDING_X;
  const textRight = hasCount ? countRight - countWidth - COUNT_SLOT_SIDE_PADDING - adaptiveGap : countRight;
  const textLeftLimit = CANVAS_PADDING_X + (badgeTotalWidth > 0 ? badgeTotalWidth + badgeGap : 0);
  const maxTextWidth = Math.max(40, textRight - textLeftLimit);

  if (hasCount) {
    drawTextWithStroke(ctx, countText, countRight, centerY, item.countColor, "right", strokeWidth, textEffect, "strong");
  }

  ctx.font = `500 ${fontSize}px ${fontFamily}`;
  const safeText = fitText(ctx, item.text.trim(), maxTextWidth);
  drawTextWithStroke(ctx, safeText, textRight, centerY, item.textColor, "right", strokeWidth, textEffect);

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
  fontSize: number,
  contentAlign: ContentAlign,
  strokeWidth: number,
  textEffect: TextEffect,
  gapMin: number,
  gapBase: number,
  gapMax: number,
  centerLineBounds?: CenterLineBounds,
) {
  const centerY = rowY + rowHeight / 2;

  if (item.rowType === "centerText") {
    const centerX = centerLineBounds
      ? (centerLineBounds.left + centerLineBounds.right) / 2
      : CANVAS_WIDTH / 2;
    const maxTextWidth = centerLineBounds
      ? Math.max(40, centerLineBounds.right - centerLineBounds.left)
      : CANVAS_WIDTH - CANVAS_PADDING_X * 2;
    ctx.font = `500 ${fontSize}px ${fontFamily}`;
    const safeText = fitText(ctx, item.text.trim(), maxTextWidth);
    drawTextWithStroke(
      ctx,
      safeText,
      centerX,
      centerY,
      item.textColor,
      "center",
      strokeWidth,
      textEffect,
    );
    return;
  }

  if (contentAlign === "left") {
    drawLeftExampleRow(ctx, item, centerY, fontFamily, fontSize, strokeWidth, textEffect, gapMin, gapBase, gapMax);
    return;
  }

  drawRightExampleRow(ctx, item, centerY, fontFamily, fontSize, strokeWidth, textEffect, gapMin, gapBase, gapMax);
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

function buildRawPageCanvases(
  items: ReactionItem[],
  options: RenderOptions,
  centerLineBoundsByPage?: Array<CenterLineBounds | undefined>,
) {
  const logicalPages = chunkItems(items, options.itemsPerPage);

  return logicalPages.map((page, pageIndex) =>
    renderSingleReactionPage(page, {
      itemsPerPage: options.itemsPerPage,
      fontPreset: options.fontPreset,
      fontSize: options.fontSize,
      contentAlign: options.contentAlign,
      strokeWidth: options.strokeWidth,
      textEffect: options.textEffect,
      gapMin: options.gapMin,
      gapBase: options.gapBase,
      gapMax: options.gapMax,
      rowHeight: options.rowHeight,
      verticalPadding: options.verticalPadding,
    }, options.itemsPerPage, centerLineBoundsByPage?.[pageIndex]),
  );
}

function renderSingleReactionPage(
  pageItems: ReactionItem[],
  options: RenderOptions,
  rowCount = options.itemsPerPage,
  centerLineBounds?: CenterLineBounds,
) {
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
      options.fontSize,
      options.contentAlign,
      options.strokeWidth,
      options.textEffect,
      options.gapMin,
      options.gapBase,
      options.gapMax,
      centerLineBounds,
    );
  }

  return canvas;
}

function getCenterLineBoundsByPage(items: ReactionItem[], options: RenderOptions) {
  const pages = chunkItems(items, options.itemsPerPage);
  const measurementCanvas = document.createElement("canvas");
  const ctx = measurementCanvas.getContext("2d");
  if (!ctx) return pages.map(() => undefined);

  const fontFamily = getFontPreset(options.fontPreset).cssFamily;

  return pages.map((page) => {
    const bounds = page
      .map((item) =>
        getNormalRowContentBounds(
          ctx,
          item,
          fontFamily,
          options.fontSize,
          options.contentAlign,
          options.gapMin,
          options.gapBase,
          options.gapMax,
        ),
      )
      .filter((value): value is CenterLineBounds => value !== null);

    if (bounds.length === 0) return undefined;

    return {
      left: Math.min(...bounds.map((value) => value.left)),
      right: Math.max(...bounds.map((value) => value.right)),
    };
  });
}

function buildCroppedPageCanvases(items: ReactionItem[], options: RenderOptions) {
  const logicalPages = chunkItems(items, options.itemsPerPage);
  const centerLineBoundsByPage = getCenterLineBoundsByPage(items, options);
  const firstPassCanvases = buildRawPageCanvases(items, options, centerLineBoundsByPage);
  const sharedWidth = firstPassCanvases[0]?.width ?? CANVAS_WIDTH;
  const sharedHeight =
    firstPassCanvases[0]?.height ?? options.verticalPadding * 2 + options.rowHeight * Math.max(1, options.itemsPerPage);
  const secondPassCanvases = buildRawPageCanvases(items, options, centerLineBoundsByPage);
  const finalBounds = mergeCropBounds(
    secondPassCanvases.map((canvas) => findCanvasContentBounds(canvas)),
    sharedWidth,
    sharedHeight,
  );

  return {
    pageCount: logicalPages.length,
    canvases: secondPassCanvases.map((canvas) => cropCanvas(canvas, finalBounds)),
    rawCanvases: secondPassCanvases,
  };
}

export async function renderReactionCanvases(items: ReactionItem[], options: RenderOptions) {
  await waitForCanvasFont(options.fontPreset);
  const { canvases, pageCount } = buildCroppedPageCanvases(items, options);

  return {
    canvases,
    pageCount,
  };
}

export async function renderReactionDataUrls(items: ReactionItem[], options: RenderOptions) {
  await waitForCanvasFont(options.fontPreset);
  const { canvases, pageCount } = buildCroppedPageCanvases(items, options);
  return {
    pages: canvases.map((canvas) => canvas.toDataURL("image/png")),
    frameDurationMs: Math.max(1000, Math.round(options.fadeIntervalMs ?? 5000)),
    width: canvases[0]?.width ?? CANVAS_WIDTH,
    height: canvases[0]?.height ?? options.verticalPadding * 2 + options.rowHeight * Math.max(1, options.itemsPerPage),
    fullMenuPage: "",
    fullMenuWidth: 0,
    fullMenuHeight: 0,
    pageCount,
  };
}

export async function renderFullMenuPng(items: ReactionItem[], options: RenderOptions) {
  await waitForCanvasFont(options.fontPreset);
  const { canvases, rawCanvases } = buildCroppedPageCanvases(items, options);
  const visibleCanvases =
    rawCanvases.length > 0
      ? rawCanvases.map((canvas) => {
          const bounds = findCanvasContentBounds(canvas);
          return cropCanvas(canvas, bounds);
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
