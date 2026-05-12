"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { BadgeEditor } from "@/components/BadgeEditor";
import { BadgeFloatingPanel } from "@/components/BadgeFloatingPanel";
import { ColorInput } from "@/components/ColorInput";
import {
  RealtimePreviewPanel,
  loadRealtimePreviewPanelOpen,
  saveRealtimePreviewPanelOpen,
} from "@/components/RealtimePreviewPanel";
import { ReactionTable } from "@/components/ReactionTable";
import { createReactionItem, useReactionStore } from "@/hooks/useReactionStore";
import { STYLE_PRESETS } from "@/lib/colorPresets";
import {
  createReactionCsv,
  createReactionCsvExample,
  createUtf8BomCsvBlob,
  parseReactionCsv,
  readReactionCsvFile,
} from "@/lib/csv";
import { FONT_PRESETS } from "@/lib/fonts";
import { renderFullMenuPng, renderReactionDataUrls } from "@/lib/renderer";
import { savePreviewData } from "@/lib/storage";
import {
  DEFAULT_COUNT_COLOR,
  DEFAULT_TEXT_COLOR,
  type BadgeConfig,
  type ReactionItem,
  type TextPaint,
} from "@/lib/types";

const SUPPORT_URL = "https://www.sooplive.com/station/wjs8679";
const THEME_KEY = "reaction_theme";

const UI = {
  ready: "준비되었습니다.",
  previewBuilding: "미리보기를 생성하는 중입니다...",
  previewOpened: "새 창 미리보기를 열었습니다.",
  settingsSaved: "설정을 저장했습니다.",
  itemsSaved: "항목 데이터를 저장했습니다.",
  dataReloaded: "저장한 데이터를 다시 불러왔습니다.",
  deleted: "선택한 항목을 삭제했습니다.",
  fontChanged: "출력 폰트를 변경했습니다.",
  alignLeft: "1번 왼쪽 정렬로 변경했습니다.",
  alignRight: "2번 오른쪽 정렬로 변경했습니다.",
  exampleDownloaded: "예시 CSV를 내려받았습니다.",
  listDownloaded: "현재 목록 CSV를 내려받았습니다.",
  loading: "불러오는 중...",
  title: "리액션 메뉴판 생성기",
  subtitle:
    "정렬, 배지, 색상, 간격, 폰트 크기를 조절하면서 GIF 미리보기와 전체 PNG 출력을 바로 확인할 수 있습니다.",
  support: "문의",
  pageItems: "페이지 표시 개수",
  fadeInterval: "전환 간격(초)",
  outputFont: "출력 폰트",
  fontSize: "폰트 크기",
  fontSizeHint: "숫자와 텍스트가 함께 커짐",
  align: "정렬",
  align1: "1번 왼쪽 정렬",
  align2: "2번 오른쪽 정렬",
  stroke: "Stroke 굵기",
  baseGap: "기본 간격",
  rowHeight: "행 높이",
  saveSettings: "설정 저장",
  openPreview: "새 창 미리보기",
  lightMode: "라이트",
  darkMode: "다크",
  detailSettings: "상세 설정",
  detailHint: "* 웬만하면 건들지 마세요",
  minGap: "최소 간격",
  maxGap: "최대 간격",
  verticalPadding: "상하 여백",
  range0to24: "범위 0~24px",
  range36to96: "범위 36~96px",
  range0to20: "범위 0~20px",
  range0to32: "범위 0~32px",
  range0to80: "범위 0~80px",
  csvTitle: "CSV 업로드 / 다운로드",
  csvHint: "count,text 두 컬럼만 있으면 됩니다.",
  csvUpload: "CSV 업로드",
  csvDownloadCurrent: "현재 목록 CSV 다운로드",
  csvExampleDownload: "예시 CSV 다운로드",
  csvGuide: "업로드 방식",
  csvGuideReplace: "- CSV 업로드는 현재 목록을 지우고 CSV 내용으로 전체 교체합니다.",
  csvGuideHeader: "- 헤더는 있어도 되고 없어도 됩니다.",
  csvExampleTitle: "CSV 예시",
  csvExampleFormat: "형식: count,text",
  bulkTitle: "일괄 적용",
  bulkCount: "개수 색상",
  bulkText: "텍스트 색상",
  bulkCountApply: "개수만 적용",
  bulkTextApply: "텍스트만 적용",
  bulkBothApply: "둘 다 적용",
  bulkHint: "* 숫자는 세로, 리액션은 가로 그라데이션이 예쁨",
  noSelectionSuffix: " / 선택이 없으면 전체 적용",
  add: "+ 추가",
  remove: "삭제",
  save: "저장",
  refresh: "새로고침",
  selected: "선택",
  total: "전체",
  bulkCountLabel: "일괄 개수 색상",
  bulkTextLabel: "일괄 텍스트 색상",
  replacedSuffix: "CSV %d개 항목으로 전체 목록을 교체했습니다.",
  selectedAppliedSuffix: "선택 항목에 적용했습니다.",
  allAppliedSuffix: "전체 항목에 적용했습니다.",
  countColorDone: "개수 색상을",
  textColorDone: "텍스트 색상을",
  styleDone: "색상 세트를",
  badgeDone: "배지를",
  csvReadError: "CSV를 읽는 중 오류가 발생했습니다.",
} as const;

function formatCountMessage(template: string, count: number) {
  return template.replace("%d", String(count));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M10 21v-6h4v6" />
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
      <path d="M9 18h4" />
    </svg>
  );
}

function ThemeIcon({ darkMode }: { darkMode: boolean }) {
  if (darkMode) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function cloneBadges(badges: BadgeConfig[]) {
  return badges.map((badge) => ({
    ...badge,
    fill: badge.fill.mode === "solid" ? { ...badge.fill } : { ...badge.fill },
  }));
}

export default function Home() {
  const store = useReactionStore();
  const [status, setStatus] = useState<string>(UI.ready);
  const [bulkCountColor, setBulkCountColor] = useState<TextPaint>(DEFAULT_COUNT_COLOR);
  const [bulkTextColor, setBulkTextColor] = useState<TextPaint>(DEFAULT_TEXT_COLOR);
  const [bulkBadges, setBulkBadges] = useState<BadgeConfig[]>([]);
  const [activeBadgeItemId, setActiveBadgeItemId] = useState<string | null>(null);
  const [realtimePreviewOpen, setRealtimePreviewOpen] = useState(() => loadRealtimePreviewPanelOpen());
  const [darkMode, setDarkMode] = useState(false);
  const [centerTextModalOpen, setCenterTextModalOpen] = useState(false);
  const [centerTextDraft, setCenterTextDraft] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    // The theme hydrates from localStorage after the client mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDarkMode(saved === "dark");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    saveRealtimePreviewPanelOpen(realtimePreviewOpen);
  }, [realtimePreviewOpen]);

  const pagesCount = useMemo(
    () => Math.max(1, Math.ceil(store.items.length / Math.max(1, store.itemsPerPage))),
    [store.items.length, store.itemsPerPage],
  );

  const csvExample = useMemo(() => createReactionCsvExample(), []);

  const renderOptions = useMemo(
    () =>
      ({
        itemsPerPage: store.itemsPerPage,
        fontPreset: store.fontPreset,
        fontSize: store.fontSize,
        contentAlign: store.contentAlign,
        strokeWidth: store.strokeWidth,
        gapMin: store.gapMin,
        gapBase: store.gapBase,
        gapMax: store.gapMax,
        rowHeight: store.rowHeight,
        verticalPadding: store.verticalPadding,
      }) as const,
    [
      store.contentAlign,
      store.fontPreset,
      store.fontSize,
      store.gapBase,
      store.gapMax,
      store.gapMin,
      store.itemsPerPage,
      store.rowHeight,
      store.strokeWidth,
      store.verticalPadding,
    ],
  );

  const surfaceClass = darkMode ? "border-zinc-800 bg-zinc-900 text-zinc-100" : "border-zinc-200 bg-white text-zinc-950";
  const mutedClass = darkMode ? "text-zinc-400" : "text-zinc-500";
  const inputClass = darkMode
    ? "border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-white"
    : "border-zinc-300 bg-white text-zinc-950 focus:border-zinc-950";
  const subtlePanelClass = darkMode ? "border-zinc-800 bg-zinc-950 text-zinc-300" : "border-zinc-300 bg-zinc-50 text-zinc-600";

  const applyPatchByScope = (patch: Partial<ReactionItem>, doneMessage: string) => {
    if (store.selectedCount > 0) {
      store.applyToSelected(patch);
      setStatus(`${doneMessage} ${UI.selectedAppliedSuffix}`);
      return;
    }

    store.applyToAll(patch);
    setStatus(`${doneMessage} ${UI.allAppliedSuffix}`);
  };

  const openPreview = async () => {
    setStatus(UI.previewBuilding);
    store.saveAll();

    const [rendered, fullMenu] = await Promise.all([
      renderReactionDataUrls(store.items, { ...renderOptions, fadeIntervalMs: store.fadeInterval * 1000 }),
      renderFullMenuPng(store.items, renderOptions),
    ]);

    savePreviewData({
      pages: rendered.pages,
      frameDurationMs: rendered.frameDurationMs,
      width: rendered.width,
      height: rendered.height,
      pageCount: rendered.pageCount,
      fullMenuPage: fullMenu.page,
      fullMenuWidth: fullMenu.width,
      fullMenuHeight: fullMenu.height,
    });
    window.open("/preview", "reaction-preview", "width=920,height=760");
    setStatus(UI.previewOpened);
  };

  const applyBulkCountColor = () => applyPatchByScope({ countColor: bulkCountColor }, UI.countColorDone);
  const applyBulkTextColor = () => applyPatchByScope({ textColor: bulkTextColor }, UI.textColorDone);
  const applyBulkBothColors = () =>
    applyPatchByScope({ countColor: bulkCountColor, textColor: bulkTextColor }, UI.styleDone);
  const applyBulkBadges = () => applyPatchByScope({ badges: cloneBadges(bulkBadges) }, UI.badgeDone);

  const applyStylePreset = (presetId: string) => {
    const preset = STYLE_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    setBulkCountColor(preset.countColor);
    setBulkTextColor(preset.textColor);
    applyPatchByScope(
      { countColor: preset.countColor, textColor: preset.textColor },
      `${preset.label} 스타일을`,
    );
  };

  const handleCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await readReactionCsvFile(file);
      const rows = parseReactionCsv(text);
      const importedItems = rows.map((row) => ({
        ...createReactionItem(),
        count: row.count,
        text: row.text,
      }));

      store.replaceItems(importedItems);
      setStatus(formatCountMessage(UI.replacedSuffix, rows.length));
    } catch (error) {
      const message = error instanceof Error ? error.message : UI.csvReadError;
      window.alert(message);
      setStatus(message);
    }
  };

  const downloadCsvExample = () => {
    downloadBlob(createUtf8BomCsvBlob(csvExample), "reaction_menu_example.csv");
    setStatus(UI.exampleDownloaded);
  };

  const downloadCurrentCsv = () => {
    const csv = createReactionCsv(store.items);
    downloadBlob(createUtf8BomCsvBlob(csv), "reaction_menu.csv");
    setStatus(UI.listDownloaded);
  };

  const activeBadgeItem = useMemo(
    () => store.items.find((item) => item.id === activeBadgeItemId) ?? null,
    [activeBadgeItemId, store.items],
  );

  const addCenterTextRow = () => {
    const trimmed = centerTextDraft.trim();
    if (!trimmed) return;
    store.addCenterTextItem(trimmed);
    setCenterTextDraft("");
    setCenterTextModalOpen(false);
    setStatus("가운데 문구 행을 추가했습니다.");
  };

  if (!store.isLoaded) {
    return <main className="grid min-h-screen place-items-center bg-zinc-50 text-zinc-600">{UI.loading}</main>;
  }

  return (
    <main className={darkMode ? "min-h-screen bg-zinc-950 text-zinc-100" : "min-h-screen bg-zinc-50 text-zinc-950"}>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-5 py-6">
        <header className={darkMode ? "flex flex-col gap-3 border-b border-zinc-800 pb-5" : "flex flex-col gap-3 border-b border-zinc-200 pb-5"}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-sm font-bold text-[#f97671]">Reaction Menu Maker</p>
                <h1 className="text-3xl font-black">{UI.title}</h1>
              </div>
              <a
                href="/docs"
                className={darkMode
                  ? "inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-4 text-sm font-black text-zinc-100 hover:border-zinc-400"
                  : "inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-black text-zinc-900 hover:border-zinc-950"}
              >
                <DocsIcon />
                Docs
              </a>
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noreferrer"
                className={darkMode
                  ? "inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-4 text-sm font-black text-zinc-100 hover:border-zinc-400"
                  : "inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-black text-zinc-900 hover:border-zinc-950"}
              >
                <HomeIcon />
                {UI.support}
              </a>
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                className={darkMode
                  ? "inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-4 text-sm font-black text-zinc-100 hover:border-zinc-400"
                  : "inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-black text-zinc-900 hover:border-zinc-950"}
              >
                <ThemeIcon darkMode={darkMode} />
                {darkMode ? UI.lightMode : UI.darkMode}
              </button>
            </div>
            <p className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-bold text-white">
              리액션 {store.items.length}개 / {pagesCount}페이지
            </p>
          </div>
          <div className={`max-w-3xl space-y-1 text-sm leading-6 ${mutedClass}`}>
            <p>{UI.subtitle}</p>
            <p>버그 및 기능개선 및 좋은의견은 문의 버튼을 눌러서 쪽지 주시면 감사하겠습니다.</p>
          </div>
        </header>

        <section className={`flex flex-wrap items-center gap-3 rounded-md border p-4 ${surfaceClass}`}>
          <label className="flex items-center gap-2 text-sm font-bold">
            {UI.pageItems}
            <input
              type="number"
              min={1}
              max={60}
              value={store.itemsPerPage}
              onChange={(event) => store.setItemsPerPage(Math.max(1, Number(event.target.value)))}
              className={`h-10 w-24 rounded-md border px-3 font-mono outline-none ${inputClass}`}
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-bold">
            {UI.fadeInterval}
            <input
              type="number"
              min={1}
              max={120}
              value={store.fadeInterval}
              onChange={(event) => store.setFadeInterval(Math.max(1, Number(event.target.value)))}
              className={`h-10 w-24 rounded-md border px-3 font-mono outline-none ${inputClass}`}
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-bold">
            {UI.outputFont}
            <select
              value={store.fontPreset}
              onChange={(event) => {
                store.setFontPreset(event.target.value as typeof store.fontPreset);
                setStatus(UI.fontChanged);
              }}
              className={`h-10 min-w-52 rounded-md border px-3 text-sm outline-none ${inputClass}`}
            >
              {FONT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} / {preset.description}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-bold">
            {UI.fontSize}
            <input
              type="number"
              min={18}
              max={44}
              step={1}
              value={store.fontSize}
              onChange={(event) => store.setFontSize(Math.max(18, Math.min(44, Number(event.target.value) || 18)))}
              className={`h-10 w-20 rounded-md border px-3 font-mono outline-none ${inputClass}`}
            />
            <span className={`text-xs font-medium ${mutedClass}`}>{UI.fontSizeHint}</span>
          </label>

          <label className="flex items-center gap-2 text-sm font-bold">
            {UI.align}
            <select
              value={store.contentAlign}
              onChange={(event) => {
                store.setContentAlign(event.target.value as typeof store.contentAlign);
                setStatus(event.target.value === "left" ? UI.alignLeft : UI.alignRight);
              }}
              className={`h-10 min-w-44 rounded-md border px-3 text-sm outline-none ${inputClass}`}
            >
              <option value="left">{UI.align1}</option>
              <option value="right">{UI.align2}</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-bold">
            {UI.stroke}
            <input
              type="number"
              min={0.5}
              max={8}
              step={0.1}
              value={store.strokeWidth}
              onChange={(event) => store.setStrokeWidth(Math.max(0.5, Math.min(8, Number(event.target.value) || 0.5)))}
              className={`h-10 w-24 rounded-md border px-3 font-mono outline-none ${inputClass}`}
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-bold">
            {UI.baseGap}
            <input
              type="number"
              min={0}
              max={24}
              step={1}
              value={store.gapBase}
              onChange={(event) => store.setGapBase(Math.max(0, Math.min(24, Number(event.target.value) || 0)))}
              className={`h-10 w-20 rounded-md border px-3 font-mono outline-none ${inputClass}`}
            />
            <span className={`text-xs font-medium ${mutedClass}`}>{UI.range0to24}</span>
          </label>

          <label className="flex items-center gap-2 text-sm font-bold">
            {UI.rowHeight}
            <input
              type="number"
              min={36}
              max={96}
              step={1}
              value={store.rowHeight}
              onChange={(event) => store.setRowHeight(Math.max(36, Math.min(96, Number(event.target.value) || 36)))}
              className={`h-10 w-20 rounded-md border px-3 font-mono outline-none ${inputClass}`}
            />
            <span className={`text-xs font-medium ${mutedClass}`}>{UI.range36to96}</span>
          </label>

          <button
            type="button"
            onClick={() => {
              store.saveSettings();
              setStatus(UI.settingsSaved);
            }}
            className={darkMode ? "h-10 rounded-md border border-zinc-700 px-4 text-sm font-bold hover:border-zinc-400" : "h-10 rounded-md border border-zinc-300 px-4 text-sm font-bold hover:border-zinc-950"}
          >
            {UI.saveSettings}
          </button>

          <button
            type="button"
            onClick={openPreview}
            className="h-10 rounded-md bg-[#00c853] px-4 text-sm font-black text-white hover:bg-[#00a846]"
          >
            {UI.openPreview}
          </button>

          <button
            type="button"
            onClick={() => setRealtimePreviewOpen((prev) => !prev)}
            className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-bold hover:border-zinc-950 dark:border-zinc-700 dark:hover:border-zinc-300"
          >
            {realtimePreviewOpen ? "실시간 미리보기 닫기" : "실시간 미리보기"}
          </button>

          <span className={`ml-auto text-sm font-medium ${mutedClass}`}>{status}</span>
        </section>

        <details className={`rounded-md border ${surfaceClass}`} open={false}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold">
            {UI.detailSettings} <span className={`ml-2 text-xs font-medium ${mutedClass}`}>{UI.detailHint}</span>
          </summary>
          <div className={darkMode ? "flex flex-wrap items-center gap-3 border-t border-zinc-800 px-4 py-4" : "flex flex-wrap items-center gap-3 border-t border-zinc-200 px-4 py-4"}>
            <label className="flex items-center gap-2 text-sm font-bold">
              {UI.minGap}
              <input
                type="number"
                min={0}
                max={20}
                step={1}
                value={store.gapMin}
                onChange={(event) => store.setGapMin(Math.max(0, Math.min(20, Number(event.target.value) || 0)))}
                className={`h-10 w-20 rounded-md border px-3 font-mono outline-none ${inputClass}`}
              />
              <span className={`text-xs font-medium ${mutedClass}`}>{UI.range0to20}</span>
            </label>

            <label className="flex items-center gap-2 text-sm font-bold">
              {UI.maxGap}
              <input
                type="number"
                min={0}
                max={32}
                step={1}
                value={store.gapMax}
                onChange={(event) => store.setGapMax(Math.max(0, Math.min(32, Number(event.target.value) || 0)))}
                className={`h-10 w-20 rounded-md border px-3 font-mono outline-none ${inputClass}`}
              />
              <span className={`text-xs font-medium ${mutedClass}`}>{UI.range0to32}</span>
            </label>

            <label className="flex items-center gap-2 text-sm font-bold">
              {UI.verticalPadding}
              <input
                type="number"
                min={0}
                max={80}
                step={1}
                value={store.verticalPadding}
                onChange={(event) =>
                  store.setVerticalPadding(Math.max(0, Math.min(80, Number(event.target.value) || 0)))
                }
                className={`h-10 w-20 rounded-md border px-3 font-mono outline-none ${inputClass}`}
              />
              <span className={`text-xs font-medium ${mutedClass}`}>{UI.range0to80}</span>
            </label>
          </div>
        </details>

        <details className={`rounded-md border ${surfaceClass}`} open={false}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold">
            {UI.csvTitle} <span className={`ml-2 text-xs font-medium ${mutedClass}`}>{UI.csvHint}</span>
          </summary>
          <div className={darkMode ? "grid gap-4 border-t border-zinc-800 p-4 lg:grid-cols-[minmax(0,1fr)_360px]" : "grid gap-4 border-t border-zinc-200 p-4 lg:grid-cols-[minmax(0,1fr)_360px]"}>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="button-primary relative inline-flex items-center overflow-hidden">
                  <span>{UI.csvUpload}</span>
                  <input
                    id="reaction-csv-upload"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvImport}
                    aria-label="CSV 업로드"
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
                <button type="button" onClick={downloadCurrentCsv} className="button-secondary">
                  {UI.csvDownloadCurrent}
                </button>
                <button type="button" onClick={downloadCsvExample} className="button-secondary">
                  {UI.csvExampleDownload}
                </button>
              </div>

              <div className={`rounded-md border border-dashed p-4 text-sm ${subtlePanelClass}`}>
                <p className={darkMode ? "font-bold text-zinc-100" : "font-bold text-zinc-800"}>{UI.csvGuide}</p>
                <ul className="mt-2 space-y-1">
                  <li>{UI.csvGuideReplace}</li>
                  <li>{UI.csvGuideHeader}</li>
                </ul>
              </div>
            </div>

            <div className={darkMode ? "rounded-md border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-100" : "rounded-md border border-zinc-200 bg-zinc-950 p-4 text-sm text-zinc-100"}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-bold">{UI.csvExampleTitle}</p>
                <span className="text-xs text-zinc-400">{UI.csvExampleFormat}</span>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-black/40 p-3 font-mono text-xs leading-6">
                {csvExample}
              </pre>
            </div>
          </div>
        </details>

        <section className={`rounded-md border p-4 ${surfaceClass}`}>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-black">{UI.bulkTitle}</h2>
            <span className={`text-sm ${mutedClass}`}>
              {UI.selected} {store.selectedCount}개
              {store.selectedCount === 0 ? UI.noSelectionSuffix : ""}
            </span>
          </div>
          <p className={`mb-4 text-sm ${mutedClass}`}>{UI.bulkHint}</p>

          <div className="mb-4 grid gap-4 xl:grid-cols-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold">{UI.bulkCount}</span>
              <ColorInput label={UI.bulkCountLabel} value={bulkCountColor} onChange={setBulkCountColor} />
              <button type="button" onClick={applyBulkCountColor} className="button-secondary">
                {UI.bulkCountApply}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold">{UI.bulkText}</span>
              <ColorInput label={UI.bulkTextLabel} value={bulkTextColor} onChange={setBulkTextColor} />
              <button type="button" onClick={applyBulkTextColor} className="button-secondary">
                {UI.bulkTextApply}
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-start gap-3">
            <div className="flex min-w-[320px] flex-1 flex-wrap items-center gap-3">
              <span className="text-sm font-bold">배지</span>
              <BadgeEditor value={bulkBadges} onChange={setBulkBadges} />
              <button type="button" onClick={applyBulkBadges} className="button-secondary">
                배지 적용
              </button>
            </div>

            <div className="flex items-center">
              <button type="button" onClick={applyBulkBothColors} className="button-primary">
                {UI.bulkBothApply}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyStylePreset(preset.id)}
                className={darkMode
                  ? "flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-bold text-zinc-100 hover:border-zinc-400"
                  : "flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-zinc-800 hover:border-zinc-950"}
              >
                <span className="flex gap-1">
                  <span
                    className="h-5 w-5 rounded border border-zinc-300"
                    style={{
                      background:
                        preset.countColor.mode === "solid"
                          ? preset.countColor.color
                          : `linear-gradient(${preset.countColor.direction === "vertical" ? "180deg" : "90deg"}, ${preset.countColor.from}, ${preset.countColor.to})`,
                    }}
                  />
                  <span
                    className="h-5 w-5 rounded border border-zinc-300"
                    style={{
                      background:
                        preset.textColor.mode === "solid"
                          ? preset.textColor.color
                          : `linear-gradient(${preset.textColor.direction === "vertical" ? "180deg" : "90deg"}, ${preset.textColor.from}, ${preset.textColor.to})`,
                    }}
                  />
                </span>
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={store.addItem} className="button-primary">
            {UI.add}
          </button>
          <button
            type="button"
            onClick={() => setCenterTextModalOpen(true)}
            className="button-secondary"
          >
            가운데 문구 추가
          </button>
          <button
            type="button"
            onClick={() => {
              store.deleteSelected();
              setStatus(UI.deleted);
            }}
            disabled={store.selectedCount === 0}
            className="button-secondary disabled:cursor-not-allowed disabled:opacity-45"
          >
            {UI.remove}
          </button>
          <button
            type="button"
            onClick={() => {
              store.saveOnlyItems();
              setStatus(UI.itemsSaved);
            }}
            className="button-secondary"
          >
            {UI.save}
          </button>
          <button
            type="button"
            onClick={() => {
              store.reload();
              setStatus(UI.dataReloaded);
            }}
            className="button-secondary"
          >
            {UI.refresh}
          </button>
          <p className={`ml-auto text-sm font-bold ${mutedClass}`}>
            {UI.selected} {store.selectedCount}개 / {UI.total} {store.items.length}개
          </p>
        </section>

        <ReactionTable
          items={store.items}
          selectedIds={store.selectedIds}
          allSelected={store.allSelected}
          activeBadgeItemId={activeBadgeItemId}
          onToggleAll={store.toggleAll}
          onToggleSelected={store.toggleSelected}
          onUpdateItem={store.updateItem}
          onMoveItem={store.moveItem}
          onOpenBadgePanel={setActiveBadgeItemId}
        />
      </div>
      {activeBadgeItem ? (
        <BadgeFloatingPanel
          key={activeBadgeItem.id}
          title={activeBadgeItem.text.trim() ? activeBadgeItem.text : `리액션 #${store.items.findIndex((item) => item.id === activeBadgeItem.id) + 1}`}
          value={activeBadgeItem.badges}
          onChange={(badges) => store.updateItem(activeBadgeItem.id, { badges })}
          onClose={() => setActiveBadgeItemId(null)}
        />
      ) : null}
      {realtimePreviewOpen ? (
        <RealtimePreviewPanel
          items={store.items}
          options={renderOptions}
          onClose={() => setRealtimePreviewOpen(false)}
        />
      ) : null}
      {centerTextModalOpen ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-300 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-4">
              <h2 className="text-lg font-black text-zinc-950 dark:text-zinc-50">가운데 문구 추가</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                count와 reaction text 영역을 함께 차지하는 가운데 정렬 문구 행을 추가합니다.
              </p>
            </div>

            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-200">
              문구
              <input
                autoFocus
                value={centerTextDraft}
                onChange={(event) => setCenterTextDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addCenterTextRow();
                  if (event.key === "Escape") {
                    setCenterTextModalOpen(false);
                    setCenterTextDraft("");
                  }
                }}
                placeholder="예: ▶ 이벤트 안내 문구"
                className="mt-2 h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCenterTextModalOpen(false);
                  setCenterTextDraft("");
                }}
                className="button-secondary"
              >
                취소
              </button>
              <button
                type="button"
                onClick={addCenterTextRow}
                className="button-primary"
                disabled={!centerTextDraft.trim()}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
