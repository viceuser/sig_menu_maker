"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeOverlayConfig } from "@/lib/overlay";
import { renderReactionDataUrls } from "@/lib/renderer";

type OverlayState = {
  pages: string[];
  pageDurationMs: number;
};

export default function OverlayPage() {
  const [overlay, setOverlay] = useState<OverlayState | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previousHtmlBackground = document.documentElement.style.background;
    const previousBodyBackground = document.body.style.background;
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";

    return () => {
      document.documentElement.style.background = previousHtmlBackground;
      document.body.style.background = previousBodyBackground;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const buildOverlay = async () => {
      try {
        setError(null);
        const token = window.location.hash.slice(1);
        const config = await decodeOverlayConfig(token);
        const rendered = await renderReactionDataUrls(config.items, {
          itemsPerPage: config.itemsPerPage,
          fadeIntervalMs: config.fadeInterval * 1000,
          fontPreset: config.fontPreset,
          fontSize: config.fontSize,
          contentAlign: config.contentAlign,
          strokeWidth: config.strokeWidth,
          textEffect: config.textEffect,
          gapMin: config.gapMin,
          gapBase: config.gapBase,
          gapMax: config.gapMax,
          rowHeight: config.rowHeight,
          verticalPadding: config.verticalPadding,
        });

        if (!active) return;
        setOverlay({ pages: rendered.pages, pageDurationMs: rendered.frameDurationMs });
        setPageIndex(0);
      } catch (reason) {
        if (!active) return;
        setOverlay(null);
        setError(reason instanceof Error ? reason.message : "OBS 오버레이를 만들지 못했습니다.");
      }
    };

    void buildOverlay();
    window.addEventListener("hashchange", buildOverlay);
    return () => {
      active = false;
      window.removeEventListener("hashchange", buildOverlay);
    };
  }, []);

  useEffect(() => {
    if (!overlay || overlay.pages.length <= 1) return;

    const timer = window.setInterval(() => {
      setPageIndex((current) => (current + 1) % overlay.pages.length);
    }, Math.max(1000, overlay.pageDurationMs));

    return () => window.clearInterval(timer);
  }, [overlay]);

  const pageImages = useMemo(() => overlay?.pages ?? [], [overlay]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-transparent">
      {pageImages.map((page, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          src={page}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ease-in-out"
          style={{ opacity: index === pageIndex ? 1 : 0 }}
        />
      ))}

      {error ? (
        <div className="grid h-full place-items-center p-6">
          <p className="rounded-md bg-red-600 px-4 py-3 text-sm font-bold text-white">{error}</p>
        </div>
      ) : null}
    </main>
  );
}
