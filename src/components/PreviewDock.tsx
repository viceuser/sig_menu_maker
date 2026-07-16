"use client";

import { useEffect, useState } from "react";
import { renderReactionCanvases } from "@/lib/renderer";
import type { ContentAlign, ReactionItem, TextEffect } from "@/lib/types";
import type { FontPresetId } from "@/lib/fonts";

const DOCK_OPEN_KEY = "realtime_preview_panel_open";

type RenderOptions = {
  itemsPerPage: number;
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
};

export function loadPreviewDockOpen() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(DOCK_OPEN_KEY) !== "false";
}

export function savePreviewDockOpen(isOpen: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DOCK_OPEN_KEY, String(isOpen));
}

export function PreviewDock({ items, options }: { items: ReactionItem[]; options: RenderOptions }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const [isRendering, setIsRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  const pageCount = pages.length || 1;
  const currentPageImage = pages[currentPage] ?? null;

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

  return (
    <div className="space-y-3">
      <div className="preview-stage flex min-h-[160px] items-center justify-center rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
        {renderError ? (
          <p className="text-sm text-red-500">{renderError}</p>
        ) : currentPageImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentPageImage}
            alt={`실시간 미리보기 ${currentPage + 1}페이지`}
            className="max-h-[320px] w-full object-contain"
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
          className="button-secondary h-9 px-3 text-xs"
        >
          이전
        </button>
        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400" aria-live="polite">
          {isRendering ? "렌더링 중..." : `${Math.min(currentPage + 1, pageCount)} / ${pageCount} 페이지`}
        </span>
        <button
          type="button"
          onClick={() => setCurrentPage((prev) => Math.min(pageCount - 1, prev + 1))}
          disabled={currentPage >= pageCount - 1}
          className="button-secondary h-9 px-3 text-xs"
        >
          다음
        </button>
      </div>
    </div>
  );
}
