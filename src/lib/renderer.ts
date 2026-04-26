import { getFontPreset, type FontPresetId } from "./fonts";
import type { ReactionItem } from "./types";

export const CANVAS_WIDTH = 720;
export const ROW_HEIGHT = 48;
export const CANVAS_PADDING_X = 34;
export const CANVAS_PADDING_Y = 24;

export function chunkItems(items: ReactionItem[], itemsPerPage: number) {
  const size = Math.max(1, itemsPerPage);
  const pages: ReactionItem[][] = [];

  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }

  return pages.length ? pages : [[]];
}

function roundedRect(
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

function drawTextWithStroke(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillStyle: string,
) {
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = fillStyle;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  label: string,
  color: string,
  x: number,
  centerY: number,
  fontFamily: string,
) {
  ctx.font = `700 13px ${fontFamily}`;
  const width = Math.ceil(ctx.measureText(label).width) + 14;
  const height = 22;
  const top = centerY - height / 2;

  roundedRect(ctx, x, top, width, height, 5);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, x + 7, centerY);

  return width + 6;
}

async function waitForCanvasFont(fontPreset: FontPresetId) {
  if (typeof document === "undefined" || !("fonts" in document)) return;

  const family = getFontPreset(fontPreset).cssFamily;
  await Promise.all([
    document.fonts.load(`500 26px ${family}`),
    document.fonts.load(`800 28px ${family}`),
    document.fonts.load(`700 13px ${family}`),
    document.fonts.ready,
  ]);
}

export function renderReactionPage(
  pageItems: ReactionItem[],
  itemsPerPage: number,
  fontPreset: FontPresetId,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_PADDING_Y * 2 + ROW_HEIGHT * Math.max(1, itemsPerPage);

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const fontFamily = getFontPreset(fontPreset).cssFamily;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "middle";

  for (let index = 0; index < itemsPerPage; index += 1) {
    const item = pageItems[index];
    const y = CANVAS_PADDING_Y + index * ROW_HEIGHT;

    if (!item) continue;

    const fillColor = item.isYellow ? "#000000" : item.textColor;
    const countColor = item.isYellow ? "#000000" : item.countColor;

    if (item.isYellow) {
      roundedRect(ctx, 14, y + 4, canvas.width - 28, ROW_HEIGHT - 8, 6);
      ctx.fillStyle = "#ffff00";
      ctx.fill();
    }

    ctx.font = `800 28px ${fontFamily}`;
    drawTextWithStroke(ctx, String(item.count), CANVAS_PADDING_X, y + ROW_HEIGHT / 2, countColor);

    const countWidth = Math.max(82, ctx.measureText(String(item.count)).width + 30);
    const textX = CANVAS_PADDING_X + countWidth;
    const safeText = item.text.trim() || "리액션";

    ctx.font = `500 26px ${fontFamily}`;
    drawTextWithStroke(ctx, safeText, textX, y + ROW_HEIGHT / 2, fillColor);

    let badgeX = textX + ctx.measureText(safeText).width + 14;
    const badgeY = y + ROW_HEIGHT / 2 + 1;

    if (item.isNew) badgeX += drawBadge(ctx, "NEW", "#00c853", badgeX, badgeY, fontFamily);
    if (item.isUpdate) badgeX += drawBadge(ctx, "UPDATE", "#2979ff", badgeX, badgeY, fontFamily);
    if (item.isHot) drawBadge(ctx, "HOT", "#f44336", badgeX, badgeY, fontFamily);
  }

  return canvas;
}

export async function renderReactionCanvases(
  items: ReactionItem[],
  itemsPerPage: number,
  fontPreset: FontPresetId,
) {
  await waitForCanvasFont(fontPreset);
  return chunkItems(items, itemsPerPage).map((page) =>
    renderReactionPage(page, itemsPerPage, fontPreset),
  );
}

export async function renderReactionDataUrls(
  items: ReactionItem[],
  itemsPerPage: number,
  fontPreset: FontPresetId,
) {
  const canvases = await renderReactionCanvases(items, itemsPerPage, fontPreset);
  return {
    pages: canvases.map((canvas) => canvas.toDataURL("image/png")),
    width: canvases[0]?.width ?? CANVAS_WIDTH,
    height: canvases[0]?.height ?? CANVAS_PADDING_Y * 2 + ROW_HEIGHT * itemsPerPage,
  };
}
