"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { renderReactionCanvases } from "@/lib/renderer";
import type { ContentAlign, ReactionItem } from "@/lib/types";
import type { FontPresetId } from "@/lib/fonts";

const PANEL_POSITION_KEY = "realtime_preview_panel_position";
const PANEL_OPEN_KEY = "realtime_preview_panel_open";
const PANEL_WIDTH = 320;
const PANEL_HEIGHT_GUARD = 420;
const PANEL_MARGIN = 12;

type PanelPosition = {
  x: number;
  y: number;
};

type RenderOptions = {
  itemsPerPage: number;
  fontPreset: FontPresetId;
  fontSize: number;
  contentAlign: ContentAlign;
  strokeWidth: number;
  gapMin: number;
  gapBase: number;
  gapMax: number;
  rowHeight: number;
  verticalPadding: number;
};

function clampPosition(position: PanelPosition) {
  if (typeof window === "undefined") return position;

  return {
    x: Math.min(window.innerWidth - PANEL_WIDTH - PANEL_MARGIN, Math.max(PANEL_MARGIN, position.x)),
    y: Math.min(window.innerHeight - PANEL_HEIGHT_GUARD - PANEL_MARGIN, Math.max(PANEL_MARGIN, position.y)),
  };
}

function loadPanelPosition() {
  if (typeof window === "undefined") return { x: 24, y: 24 };

  try {
    const raw = window.localStorage.getItem(PANEL_POSITION_KEY);
    if (!raw) return clampPosition({ x: window.innerWidth - PANEL_WIDTH - 24, y: window.innerHeight - 420 });
    const parsed = JSON.parse(raw) as Partial<PanelPosition>;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") {
      return clampPosition({ x: window.innerWidth - PANEL_WIDTH - 24, y: window.innerHeight - 420 });
    }
    return clampPosition({ x: parsed.x, y: parsed.y });
  } catch {
    return clampPosition({ x: window.innerWidth - PANEL_WIDTH - 24, y: window.innerHeight - 420 });
  }
}

function savePanelPosition(position: PanelPosition) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PANEL_POSITION_KEY, JSON.stringify(position));
}

export function loadRealtimePreviewPanelOpen() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PANEL_OPEN_KEY) === "true";
}

export function saveRealtimePreviewPanelOpen(isOpen: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PANEL_OPEN_KEY, String(isOpen));
}

export function RealtimePreviewPanel({
  items,
  options,
  onClose,
}: {
  items: ReactionItem[];
  options: RenderOptions;
  onClose: () => void;
}) {
  const [position, setPosition] = useState<PanelPosition>(() => loadPanelPosition());
  const [minimized, setMinimized] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const [isRendering, setIsRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; panelX: number; panelY: number } | null>(null);
  const positionRef = useRef(position);

  const pageCount = pages.length || 1;
  const currentPageImage = pages[currentPage] ?? null;

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => {
        const next = clampPosition(current);
        savePanelPosition(next);
        return next;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setIsRendering(true);
      setRenderError(null);
      try {
        const rendered = await renderReactionCanvases(items, options);
        if (!active) return;
        const nextPages = rendered.canvases.map((canvas) => canvas.toDataURL("image/png"));
        setPages(nextPages);
        setCurrentPage((prev) => Math.min(prev, Math.max(0, nextPages.length - 1)));
      } catch (error) {
        if (!active) return;
        setRenderError(error instanceof Error ? error.message : "미리보기를 만들지 못했습니다.");
      } finally {
        if (active) setIsRendering(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [items, options]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      panelX: position.x,
      panelY: position.y,
    };

    const handleMove = (moveEvent: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) return;

      const next = clampPosition({
        x: start.panelX + (moveEvent.clientX - start.mouseX),
        y: start.panelY + (moveEvent.clientY - start.mouseY),
      });
      setPosition(next);
    };

    const handleUp = () => {
      savePanelPosition(positionRef.current);
      dragStartRef.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const summary = useMemo(() => {
    if (isRendering) return "렌더링 중";
    if (renderError) return "오류";
    return `${Math.min(currentPage + 1, pageCount)} / ${pageCount} 페이지`;
  }, [currentPage, isRendering, pageCount, renderError]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{ left: position.x, top: position.y, width: PANEL_WIDTH }}
      className="fixed z-[990] rounded-lg border border-zinc-300 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div
        onPointerDown={handlePointerDown}
        className="flex cursor-move items-center justify-between gap-3 rounded-t-lg border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950"
      >
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Live Preview
          </p>
          <p className="truncate text-sm font-black text-zinc-950 dark:text-zinc-50">실시간 미리보기</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMinimized((current) => !current)}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            {minimized ? "열기" : "최소화"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            닫기
          </button>
        </div>
      </div>

      {!minimized ? (
        <div className="space-y-3 p-4">
          <div className="flex min-h-[140px] items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
            {renderError ? (
              <p className="text-sm text-red-500">{renderError}</p>
            ) : currentPageImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentPageImage}
                alt={`실시간 미리보기 ${currentPage + 1}페이지`}
                className="max-h-[240px] w-full object-contain"
              />
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isRendering ? "미리보기를 만드는 중입니다..." : "표시할 미리보기가 없습니다."}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage <= 0}
              className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
            >
              이전
            </button>
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              {Math.min(currentPage + 1, pageCount)} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(pageCount - 1, prev + 1))}
              disabled={currentPage >= pageCount - 1}
              className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
            >
              다음
            </button>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
