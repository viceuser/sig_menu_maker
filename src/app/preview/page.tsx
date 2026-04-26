"use client";

import { useEffect, useMemo, useState } from "react";
import { exportGifFromDataUrls } from "@/lib/gifExporter";
import { loadPreviewData } from "@/lib/storage";
import type { PreviewData } from "@/lib/types";

export default function PreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setData(loadPreviewData());
  }, []);

  useEffect(() => {
    if (!data || data.pages.length <= 1) return;

    const timer = window.setInterval(() => {
      setPageIndex((index) => (index + 1) % data.pages.length);
    }, Math.max(1, data.fadeInterval) * 1000);

    return () => window.clearInterval(timer);
  }, [data]);

  const pageLabel = useMemo(() => {
    if (!data?.pages.length) return "0 / 0";
    return `${pageIndex + 1} / ${data.pages.length}`;
  }, [data?.pages.length, pageIndex]);

  const saveGif = async () => {
    if (!data) return;

    try {
      setIsExporting(true);
      setMessage("GIF 생성 중...");
      await exportGifFromDataUrls(data.pages, data.fadeInterval, data.width, data.height);
      setMessage("투명 배경 GIF 저장을 시작했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "GIF 생성에 실패했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!data || data.pages.length === 0) {
    return (
      <main className="grid min-h-screen place-items-center bg-transparent p-6 text-zinc-950">
        <div className="text-center">
          <h1 className="mb-3 text-2xl font-black">미리보기 데이터가 없습니다.</h1>
          <button type="button" onClick={() => window.close()} className="preview-button">
            닫기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="preview-stage flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-zinc-950">
      <div
        className="relative grid max-h-[78vh] w-full place-items-center"
        style={{ aspectRatio: `${data.width} / ${data.height}` }}
      >
        {data.pages.map((page, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={page}
            src={page}
            alt={`리액션 메뉴 ${index + 1}`}
            className={[
              "absolute max-h-full max-w-full object-contain opacity-0 transition-opacity duration-[800ms] ease-in-out",
              index === pageIndex ? "opacity-100" : "",
            ].join(" ")}
          />
        ))}
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-3">
        <span className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-black">
          {pageLabel}
        </span>
        <button type="button" onClick={saveGif} disabled={isExporting} className="preview-button">
          {isExporting ? "생성 중" : "GIF 저장"}
        </button>
        <button type="button" onClick={() => window.close()} className="preview-button">
          닫기
        </button>
        {message ? <span className="w-full text-center text-sm text-zinc-600">{message}</span> : null}
      </footer>
    </main>
  );
}
