"use client";

import { useMemo, useState } from "react";
import { ReactionTable } from "@/components/ReactionTable";
import { useReactionStore } from "@/hooks/useReactionStore";
import { FONT_PRESETS } from "@/lib/fonts";
import { renderFullMenuPng, renderReactionDataUrls } from "@/lib/renderer";
import { savePreviewData } from "@/lib/storage";

export default function Home() {
  const store = useReactionStore();
  const [status, setStatus] = useState("준비됨");

  const pagesCount = useMemo(
    () => Math.max(1, Math.ceil(store.items.length / Math.max(1, store.itemsPerPage))),
    [store.items.length, store.itemsPerPage],
  );

  const renderOptions = {
    itemsPerPage: store.itemsPerPage,
    fontPreset: store.fontPreset,
    contentAlign: store.contentAlign,
    strokeWidth: store.strokeWidth,
    gapMin: store.gapMin,
    gapBase: store.gapBase,
    gapMax: store.gapMax,
    rowHeight: store.rowHeight,
    verticalPadding: store.verticalPadding,
  } as const;

  const openPreview = async () => {
    setStatus("미리보기 생성 중...");
    store.saveAll();

    const rendered = await renderReactionDataUrls(store.items, renderOptions);
    const fullMenu = await renderFullMenuPng(store.items, renderOptions);

    savePreviewData({
      pages: rendered.pages,
      frameDurationMs: store.fadeInterval * 1000,
      width: rendered.width,
      height: rendered.height,
      pageCount: rendered.pageCount,
      fullMenuPage: fullMenu.page,
      fullMenuWidth: fullMenu.width,
      fullMenuHeight: fullMenu.height,
    });

    window.open("/preview", "reaction-preview", "width=920,height=760");
    setStatus("미리보기 창을 열었습니다.");
  };

  if (!store.isLoaded) {
    return <main className="grid min-h-screen place-items-center bg-zinc-50 text-zinc-600">불러오는 중...</main>;
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-5 py-6">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#f97671]">Reaction Menu Maker</p>
              <h1 className="text-3xl font-black">리액션 메뉴판 생성기</h1>
            </div>
            <p className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-bold text-white">
              리액션 {store.items.length}개 / {pagesCount}페이지
            </p>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-zinc-600">
            정렬, 간격, 외곽선, 행 높이를 조절하면서 GIF 미리보기와 전체 PNG를 함께 확인할 수 있습니다.
          </p>
        </header>

        <section className="flex flex-wrap items-center gap-3 rounded-md border border-zinc-200 bg-white p-4">
          <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
            페이지 표시 개수
            <input
              type="number"
              min={1}
              max={60}
              value={store.itemsPerPage}
              onChange={(event) => store.setItemsPerPage(Math.max(1, Number(event.target.value)))}
              className="h-10 w-24 rounded-md border border-zinc-300 px-3 font-mono outline-none focus:border-zinc-950"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
            전환 간격(초)
            <input
              type="number"
              min={1}
              max={120}
              value={store.fadeInterval}
              onChange={(event) => store.setFadeInterval(Math.max(1, Number(event.target.value)))}
              className="h-10 w-24 rounded-md border border-zinc-300 px-3 font-mono outline-none focus:border-zinc-950"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
            출력 폰트
            <select
              value={store.fontPreset}
              onChange={(event) => {
                store.setFontPreset(event.target.value as typeof store.fontPreset);
                setStatus("폰트를 변경했습니다.");
              }}
              className="h-10 min-w-52 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-950"
            >
              {FONT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} / {preset.description}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
            정렬
            <select
              value={store.contentAlign}
              onChange={(event) => {
                store.setContentAlign(event.target.value as typeof store.contentAlign);
                setStatus(event.target.value === "left" ? "왼쪽 정렬로 변경했습니다." : "오른쪽 정렬로 변경했습니다.");
              }}
              className="h-10 min-w-40 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-950"
            >
              <option value="left">1번 왼쪽 정렬</option>
              <option value="right">2번 오른쪽 정렬</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
            Stroke 굵기
            <input
              type="number"
              min={0.5}
              max={4}
              step={0.1}
              value={store.strokeWidth}
              onChange={(event) => store.setStrokeWidth(Math.max(0.5, Math.min(4, Number(event.target.value) || 0.5)))}
              className="h-10 w-24 rounded-md border border-zinc-300 px-3 font-mono outline-none focus:border-zinc-950"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
            기본 간격
            <input
              type="number"
              min={0}
              max={24}
              step={1}
              value={store.gapBase}
              onChange={(event) => store.setGapBase(Math.max(0, Math.min(24, Number(event.target.value) || 0)))}
              className="h-10 w-20 rounded-md border border-zinc-300 px-3 font-mono outline-none focus:border-zinc-950"
            />
            <span className="text-xs font-medium text-zinc-500">범위 0~24px</span>
          </label>

          <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
            행 높이
            <input
              type="number"
              min={36}
              max={96}
              step={1}
              value={store.rowHeight}
              onChange={(event) => store.setRowHeight(Math.max(36, Math.min(96, Number(event.target.value) || 36)))}
              className="h-10 w-20 rounded-md border border-zinc-300 px-3 font-mono outline-none focus:border-zinc-950"
            />
            <span className="text-xs font-medium text-zinc-500">범위 36~96px</span>
          </label>

          <button
            type="button"
            onClick={() => {
              store.saveSettings();
              setStatus("설정을 저장했습니다.");
            }}
            className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-bold hover:border-zinc-950"
          >
            설정 저장
          </button>

          <button
            type="button"
            onClick={openPreview}
            className="h-10 rounded-md bg-[#00c853] px-4 text-sm font-black text-white hover:bg-[#00a846]"
          >
            새 창 미리보기
          </button>

          <span className="ml-auto text-sm font-medium text-zinc-500">{status}</span>
        </section>

        <details className="rounded-md border border-zinc-200 bg-white" open={false}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-zinc-800">
            상세 설정
          </summary>
          <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 px-4 py-4">
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
              최소 간격
              <input
                type="number"
                min={0}
                max={20}
                step={1}
                value={store.gapMin}
                onChange={(event) => store.setGapMin(Math.max(0, Math.min(20, Number(event.target.value) || 0)))}
                className="h-10 w-20 rounded-md border border-zinc-300 px-3 font-mono outline-none focus:border-zinc-950"
              />
              <span className="text-xs font-medium text-zinc-500">범위 0~20px</span>
            </label>

            <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
              최대 간격
              <input
                type="number"
                min={0}
                max={32}
                step={1}
                value={store.gapMax}
                onChange={(event) => store.setGapMax(Math.max(0, Math.min(32, Number(event.target.value) || 0)))}
                className="h-10 w-20 rounded-md border border-zinc-300 px-3 font-mono outline-none focus:border-zinc-950"
              />
              <span className="text-xs font-medium text-zinc-500">범위 0~32px</span>
            </label>

            <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
              상하 여백
              <input
                type="number"
                min={0}
                max={80}
                step={1}
                value={store.verticalPadding}
                onChange={(event) =>
                  store.setVerticalPadding(Math.max(0, Math.min(80, Number(event.target.value) || 0)))
                }
                className="h-10 w-20 rounded-md border border-zinc-300 px-3 font-mono outline-none focus:border-zinc-950"
              />
              <span className="text-xs font-medium text-zinc-500">범위 0~80px</span>
            </label>
          </div>
        </details>

        <section className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={store.addItem} className="button-primary">
            + 추가
          </button>
          <button
            type="button"
            onClick={() => {
              store.deleteSelected();
              setStatus("선택한 항목을 삭제했습니다.");
            }}
            disabled={store.selectedCount === 0}
            className="button-secondary disabled:cursor-not-allowed disabled:opacity-45"
          >
            삭제
          </button>
          <button
            type="button"
            onClick={() => {
              store.saveOnlyItems();
              setStatus("항목을 저장했습니다.");
            }}
            className="button-secondary"
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => {
              store.reload();
              setStatus("저장된 데이터를 불러왔습니다.");
            }}
            className="button-secondary"
          >
            새로고침
          </button>
          <p className="ml-auto text-sm font-bold text-zinc-600">
            선택 {store.selectedCount}개 / 전체 {store.items.length}개
          </p>
        </section>

        <ReactionTable
          items={store.items}
          selectedIds={store.selectedIds}
          allSelected={store.allSelected}
          onToggleAll={store.toggleAll}
          onToggleSelected={store.toggleSelected}
          onUpdateItem={store.updateItem}
          onMoveItem={store.moveItem}
        />
      </div>
    </main>
  );
}
