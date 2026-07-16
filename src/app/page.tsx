"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { BadgeEditor } from "@/components/BadgeEditor";
import { BadgeFloatingPanel } from "@/components/BadgeFloatingPanel";
import { ColorInput } from "@/components/ColorInput";
import { Dialog } from "@/components/Dialog";
import { PreviewDock, loadPreviewDockOpen, savePreviewDockOpen } from "@/components/PreviewDock";
import { ReactionTable } from "@/components/ReactionTable";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createReactionItem, useReactionStore } from "@/hooks/useReactionStore";
import { STYLE_PRESETS } from "@/lib/colorPresets";
import {
  createReactionCsv,
  createReactionCsvExample,
  createUtf8BomCsvBlob,
  parseReactionCsv,
  readReactionCsvFile,
  type ParsedReactionCsvRow,
} from "@/lib/csv";
import { FONT_PRESETS } from "@/lib/fonts";
import { SUPPORT_URL } from "@/lib/links";
import { encodeOverlayConfig } from "@/lib/overlay";
import { renderFullMenuPng, renderReactionDataUrls } from "@/lib/renderer";
import { savePreviewData } from "@/lib/storage";
import {
  DEFAULT_COUNT_COLOR,
  DEFAULT_TEXT_COLOR,
  type BadgeConfig,
  type ReactionItem,
  type TextPaint,
} from "@/lib/types";

const UI = {
  previewBuilding: "미리보기를 생성하는 중입니다...",
  previewOpened: "새 창 미리보기를 열었습니다.",
  deleted: "선택한 항목을 삭제했습니다.",
  fontChanged: "출력 폰트를 변경했습니다.",
  alignLeft: "1번 왼쪽 정렬로 변경했습니다.",
  alignRight: "2번 오른쪽 정렬로 변경했습니다.",
  exampleDownloaded: "예시 CSV를 내려받았습니다.",
  listDownloaded: "현재 목록 CSV를 내려받았습니다.",
  loading: "불러오는 중...",
  title: "리액션 메뉴판 생성기",
  subtitle:
    "정렬, 배지, 색상, 간격, 폰트 크기를 조절하면 오른쪽 미리보기에 바로 반영됩니다. 모든 변경은 자동 저장됩니다.",
  support: "문의",
  saving: "저장 중...",
  saved: "자동 저장됨",
  pageItems: "페이지 표시 개수",
  fadeInterval: "전환 간격(초)",
  outputFont: "출력 폰트",
  fontSize: "폰트 크기",
  align: "정렬",
  align1: "1번 왼쪽 정렬",
  align2: "2번 오른쪽 정렬",
  stroke: "Stroke 굵기",
  baseGap: "기본 간격",
  rowHeight: "행 높이",
  openPreview: "새 창 미리보기 · GIF/PNG 저장",
  previewDock: "실시간 미리보기",
  obsOverlay: "OBS 오버레이 링크 복사",
  collapse: "접기",
  expand: "펼치기",
  outputSettings: "출력 설정",
  detailSettings: "상세 설정",
  detailHint: "* 웬만하면 건들지 마세요",
  minGap: "최소 간격",
  maxGap: "최대 간격",
  verticalPadding: "상하 여백",
  csvTitle: "CSV 업로드 / 다운로드",
  csvHint: "count,text 두 컬럼만 있으면 됩니다.",
  csvTopHint: "(CSV 형식으로 한번에 업로드 가능)",
  csvUpload: "CSV 업로드",
  csvDownloadCurrent: "현재 목록 CSV 다운로드",
  csvExampleDownload: "예시 CSV 다운로드",
  csvGuide: "업로드 방식",
  csvGuideReplace: "- CSV 업로드는 현재 목록을 지우고 CSV 내용으로 전체 교체합니다.",
  csvGuideHeader: "- 헤더는 있어도 되고 없어도 됩니다.",
  csvExampleTitle: "CSV 예시",
  csvExampleFormat: "형식: count,text",
  csvConfirmTitle: "현재 목록을 교체할까요?",
  csvConfirmDescription: "CSV 업로드는 지금 편집 중인 목록을 지우고 파일 내용으로 전체 교체합니다.",
  csvConfirmApply: "전체 교체",
  csvConfirmCancel: "취소",
  bulkTitle: "일괄 적용",
  bulkCount: "개수 색상",
  bulkText: "텍스트 색상",
  bulkCountApply: "개수만 적용",
  bulkTextApply: "텍스트만 적용",
  bulkBothApply: "둘 다 적용",
  bulkHint: "* 숫자는 세로, 리액션은 가로 그라데이션이 예쁨",
  noSelectionSuffix: " / 선택이 없으면 전체 적용",
  add: "+ 추가",
  addCenterText: "가운데 문구 추가",
  remove: "삭제",
  duplicate: "선택 복제",
  undo: "실행 취소",
  redo: "다시 실행",
  search: "리액션 검색",
  noSearchResults: "검색 결과가 없습니다.",
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

const SURFACE_CLASS = "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";
const MUTED_CLASS = "text-zinc-500 dark:text-zinc-400";
const INPUT_CLASS =
  "border-zinc-300 bg-white text-zinc-950 focus:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white";

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

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    return copied;
  }
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

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "px",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm font-bold">
      <span className="flex items-baseline justify-between gap-2">
        <span>{label}</span>
        <span className={`font-mono text-xs font-medium ${MUTED_CLASS}`}>
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full"
      />
    </label>
  );
}

function cloneBadges(badges: BadgeConfig[]) {
  return badges.map((badge) => ({
    ...badge,
    fill: badge.fill.mode === "solid" ? { ...badge.fill } : { ...badge.fill },
  }));
}

function clonePaint(paint: TextPaint): TextPaint {
  return paint.mode === "solid" ? { ...paint } : { ...paint };
}

type ToastState = {
  id: number;
  message: string;
};

export default function Home() {
  const store = useReactionStore();
  const { canRedo, canUndo, redo, undo } = store;
  const headerRef = useRef<HTMLElement>(null);
  const toolbarRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(64);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [bulkCountColor, setBulkCountColor] = useState<TextPaint>(DEFAULT_COUNT_COLOR);
  const [bulkTextColor, setBulkTextColor] = useState<TextPaint>(DEFAULT_TEXT_COLOR);
  const [bulkBadges, setBulkBadges] = useState<BadgeConfig[]>([]);
  const [bulkApplyOpen, setBulkApplyOpen] = useState(false);
  const [activeBadgeItemId, setActiveBadgeItemId] = useState<string | null>(null);
  const [previewDockOpen, setPreviewDockOpen] = useState(() => loadPreviewDockOpen());
  const [centerTextModalOpen, setCenterTextModalOpen] = useState(false);
  const [centerTextDraft, setCenterTextDraft] = useState("");
  const [pendingCsvRows, setPendingCsvRows] = useState<ParsedReactionCsvRow[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCopyingObsLink, setIsCopyingObsLink] = useState(false);
  const [obsOverlayUrl, setObsOverlayUrl] = useState<string | null>(null);

  useEffect(() => {
    savePreviewDockOpen(previewDockOpen);
  }, [previewDockOpen]);

  useEffect(() => {
    const header = headerRef.current;
    const toolbar = toolbarRef.current;
    if (!header || !toolbar) return;

    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const height = Math.ceil(entry.target.getBoundingClientRect().height);
        if (entry.target === header) setHeaderHeight(height);
        if (entry.target === toolbar) setToolbarHeight(height);
      });
    });
    resizeObserver.observe(header);
    resizeObserver.observe(toolbar);
    return () => resizeObserver.disconnect();
  }, [store.isLoaded]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const pagesCount = useMemo(
    () => Math.max(1, Math.ceil(store.items.length / Math.max(1, store.itemsPerPage))),
    [store.items.length, store.itemsPerPage],
  );

  const csvExample = useMemo(() => createReactionCsvExample(), []);

  const itemNumberById = useMemo(
    () => new Map(store.items.map((item, index) => [item.id, index + 1])),
    [store.items],
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("ko");
    if (!query) return store.items;

    return store.items.filter((item) => {
      const badgeText = item.badges.map((badge) => `${badge.icon} ${badge.label}`).join(" ");
      return `${item.count ?? ""} ${item.text} ${badgeText}`.toLocaleLowerCase("ko").includes(query);
    });
  }, [searchQuery, store.items]);

  const filteredItemIds = useMemo(() => filteredItems.map((item) => item.id), [filteredItems]);
  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => store.selectedIds.has(item.id));

  const renderOptions = useMemo(
    () =>
      ({
        itemsPerPage: store.itemsPerPage,
        fontPreset: store.fontPreset,
        fontSize: store.fontSize,
        contentAlign: store.contentAlign,
        strokeWidth: store.strokeWidth,
        textEffect: store.textEffect,
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
      store.textEffect,
      store.verticalPadding,
    ],
  );

  const showNotice = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;

      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;

      const target = event.target as HTMLElement | null;
      const isEditable = target?.matches("input, textarea, [contenteditable='true']") ?? false;
      if (isEditable && !target?.closest("[data-reaction-history-scope]")) return;

      const shouldRedo = key === "y" || (key === "z" && event.shiftKey);
      if (shouldRedo) {
        if (!canRedo) return;
        event.preventDefault();
        redo();
        showNotice("다시 실행했습니다.");
        return;
      }

      if (!canUndo) return;
      event.preventDefault();
      undo();
      showNotice("실행을 취소했습니다.");
    };

    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, [canRedo, canUndo, redo, showNotice, undo]);

  const applyPatchByScope = (patch: Partial<ReactionItem>, doneMessage: string) => {
    if (store.selectedCount > 0) {
      store.applyToSelected(patch);
      showNotice(`${doneMessage} ${UI.selectedAppliedSuffix}`);
      return;
    }

    store.applyToAll(patch);
    showNotice(`${doneMessage} ${UI.allAppliedSuffix}`);
  };

  const openPreview = async () => {
    showNotice(UI.previewBuilding);
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
    showNotice(UI.previewOpened);
  };

  const copyObsOverlayLink = async () => {
    try {
      setIsCopyingObsLink(true);
      const token = await encodeOverlayConfig({
        items: store.items,
        itemsPerPage: store.itemsPerPage,
        fadeInterval: store.fadeInterval,
        fontPreset: store.fontPreset,
        fontSize: store.fontSize,
        contentAlign: store.contentAlign,
        strokeWidth: store.strokeWidth,
        textEffect: store.textEffect,
        gapMin: store.gapMin,
        gapBase: store.gapBase,
        gapMax: store.gapMax,
        rowHeight: store.rowHeight,
        verticalPadding: store.verticalPadding,
      });
      const url = `${window.location.origin}/overlay#${token}`;
      const copied = await copyText(url);
      setObsOverlayUrl(url);
      showNotice(copied ? "OBS 오버레이 링크를 복사했습니다." : "OBS 오버레이 링크를 생성했습니다.");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "OBS 오버레이 링크를 만들지 못했습니다.");
    } finally {
      setIsCopyingObsLink(false);
    }
  };

  const applyBulkCountColor = () => applyPatchByScope({ countColor: clonePaint(bulkCountColor) }, UI.countColorDone);
  const applyBulkTextColor = () => applyPatchByScope({ textColor: clonePaint(bulkTextColor) }, UI.textColorDone);
  const applyBulkBothColors = () =>
    applyPatchByScope({ countColor: clonePaint(bulkCountColor), textColor: clonePaint(bulkTextColor) }, UI.styleDone);
  const applyBulkBadges = () => applyPatchByScope({ badges: cloneBadges(bulkBadges) }, UI.badgeDone);

  const applyStylePreset = (presetId: string) => {
    const preset = STYLE_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    setBulkCountColor(preset.countColor);
    setBulkTextColor(preset.textColor);
    applyPatchByScope(
      { countColor: clonePaint(preset.countColor), textColor: clonePaint(preset.textColor) },
      `${preset.label} 스타일을`,
    );
  };

  const applyCsvRows = useCallback(
    (rows: ParsedReactionCsvRow[]) => {
      const importedItems = rows.map((row) => ({
        ...createReactionItem(),
        count: row.count,
        text: row.text,
      }));

      store.replaceItems(importedItems);
      showNotice(formatCountMessage(UI.replacedSuffix, rows.length));
    },
    [showNotice, store],
  );

  const handleCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await readReactionCsvFile(file);
      const rows = parseReactionCsv(text);

      // 기존 목록이 있으면 전체 교체 전에 한 번 확인한다.
      if (store.items.length > 0) {
        setPendingCsvRows(rows);
        return;
      }

      applyCsvRows(rows);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : UI.csvReadError);
    }
  };

  const downloadCsvExample = () => {
    downloadBlob(createUtf8BomCsvBlob(csvExample), "reaction_menu_example.csv");
    showNotice(UI.exampleDownloaded);
  };

  const downloadCurrentCsv = () => {
    const csv = createReactionCsv(store.items);
    downloadBlob(createUtf8BomCsvBlob(csv), "reaction_menu.csv");
    showNotice(UI.listDownloaded);
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
    showNotice("가운데 문구 행을 추가했습니다.");
  };

  const closeCenterTextModal = useCallback(() => {
    setCenterTextModalOpen(false);
    setCenterTextDraft("");
  }, []);

  const closeCsvConfirm = useCallback(() => {
    setPendingCsvRows(null);
  }, []);

  if (!store.isLoaded) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-50 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
        {UI.loading}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-zinc-200 bg-zinc-50/92 backdrop-blur supports-[backdrop-filter]:bg-opacity-80 dark:border-zinc-800 dark:bg-zinc-950/92"
      >
        <div className="mx-auto flex w-full max-w-[1700px] flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-accent">Reaction Menu Maker</p>
            <h1 className="text-xl font-black leading-tight">{UI.title}</h1>
          </div>
          <p className="rounded-md bg-zinc-950 px-3 py-1.5 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-950">
            리액션 {store.items.length}개 / {pagesCount}페이지
          </p>
          <span
            aria-live="polite"
            className={`text-xs font-bold ${store.saveState === "saving" ? "text-amber-600 dark:text-amber-400" : MUTED_CLASS}`}
          >
            {store.saveState === "saving" ? UI.saving : UI.saved}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <a href="/docs" className="button-secondary h-9 px-3 text-xs">
              <DocsIcon />
              Docs
            </a>
            <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="button-secondary h-9 px-3 text-xs">
              <HomeIcon />
              {UI.support}
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1700px] px-5 py-6">
        <section
              ref={toolbarRef}
              data-scroll-region="toolbar"
              className={`fixed left-5 right-5 z-30 mx-auto max-w-[1660px] space-y-3 overflow-y-auto rounded-md border p-3 shadow-lg ${bulkApplyOpen ? "overscroll-contain" : "overscroll-auto"} ${SURFACE_CLASS}`}
              style={{ top: headerHeight + 8, maxHeight: `calc(100vh - ${headerHeight + 16}px)` }}
            >
              <div className="flex items-center gap-2 overflow-x-auto pb-1 [&>button]:shrink-0 [&>button]:whitespace-nowrap">
                <button type="button" onClick={store.addItem} className="button-primary h-9 px-3 text-xs">
                  {UI.add}
                </button>
                <button
                  type="button"
                  onClick={() => setCenterTextModalOpen(true)}
                  className="button-secondary h-9 px-3 text-xs"
                >
                  {UI.addCenterText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const count = store.duplicateSelected();
                    if (count > 0) showNotice(`${count}개 행을 복제했습니다.`);
                  }}
                  disabled={store.selectedCount === 0}
                  className="button-secondary h-9 px-3 text-xs"
                >
                  {UI.duplicate}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    store.deleteSelected();
                    showNotice(UI.deleted);
                  }}
                  disabled={store.selectedCount === 0}
                  className="button-secondary h-9 px-3 text-xs"
                >
                  {UI.remove}
                </button>
                <span className="mx-1 hidden h-6 w-px shrink-0 bg-zinc-200 sm:block dark:bg-zinc-700" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => {
                    store.undo();
                    showNotice("실행을 취소했습니다.");
                  }}
                  disabled={!store.canUndo}
                  className="button-secondary h-9 px-3 text-xs"
                  title="Ctrl+Z"
                >
                  ↶ {UI.undo}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    store.redo();
                    showNotice("다시 실행했습니다.");
                  }}
                  disabled={!store.canRedo}
                  className="button-secondary h-9 px-3 text-xs"
                  title="Ctrl+Shift+Z"
                >
                  ↷ {UI.redo}
                </button>

                <div className="relative ml-auto min-w-[220px] flex-1 shrink-0 sm:max-w-xs">
                  <label htmlFor="reaction-search" className="sr-only">
                    {UI.search}
                  </label>
                  <input
                    id="reaction-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={`${UI.search} (개수·텍스트·배지)`}
                    className={`h-9 w-full rounded-md border px-3 pr-9 text-sm outline-none ${INPUT_CLASS}`}
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="검색어 지우기"
                      className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      ×
                    </button>
                  ) : null}
                </div>
                <span className={`shrink-0 text-xs font-bold ${MUTED_CLASS}`}>
                  {searchQuery ? `검색 ${filteredItems.length}개 / ` : ""}
                  {UI.selected} {store.selectedCount}개 / {UI.total} {store.items.length}개
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <label className="button-primary relative inline-flex h-9 items-center overflow-hidden px-3 text-xs">
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
                <button type="button" onClick={downloadCurrentCsv} className="button-secondary h-9 px-3 text-xs">
                  CSV 다운로드
                </button>
                <button type="button" onClick={downloadCsvExample} className="button-secondary h-9 px-3 text-xs">
                  예시 CSV
                </button>
                <span className={`text-xs font-medium ${MUTED_CLASS}`}>{UI.csvTopHint}</span>
                <details className="basis-full text-xs text-zinc-600 dark:text-zinc-300">
                  <summary className="w-fit cursor-pointer font-bold hover:text-zinc-950 dark:hover:text-white">
                    CSV 형식과 예시 보기
                  </summary>
                  <div className="mt-3 grid gap-3 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 md:grid-cols-[minmax(0,1fr)_320px] dark:border-zinc-700 dark:bg-zinc-950">
                    <ul className="space-y-1">
                      <li>{UI.csvGuideReplace}</li>
                      <li>{UI.csvGuideHeader}</li>
                      <li>{UI.csvHint}</li>
                    </ul>
                    <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 font-mono leading-5 text-zinc-100">
                      {csvExample}
                    </pre>
                  </div>
                </details>
              </div>

              <details
                open={bulkApplyOpen}
                onToggle={(event) => setBulkApplyOpen(event.currentTarget.open)}
                className="group border-t border-zinc-200 text-sm dark:border-zinc-800"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 pt-3 font-black [&::-webkit-details-marker]:hidden">
                  <span>{UI.bulkTitle}</span>
                  <span className={`font-medium ${MUTED_CLASS}`}>
                    {UI.selected} {store.selectedCount}개
                    {store.selectedCount === 0 ? UI.noSelectionSuffix : ""}
                  </span>
                  <span className={`ml-auto text-xs font-medium ${MUTED_CLASS}`}>
                    <span className="group-open:hidden">색상·배지·템플릿 펼치기</span>
                    <span className="hidden group-open:inline">일괄 적용 접기</span>
                  </span>
                </summary>

                <div className="pt-4">
                  <p className={`mb-4 ${MUTED_CLASS}`}>{UI.bulkHint}</p>

                  <div className="mb-4 grid gap-4 xl:grid-cols-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold">{UI.bulkCount}</span>
                      <ColorInput label={UI.bulkCountLabel} value={bulkCountColor} onChange={setBulkCountColor} />
                      <button type="button" onClick={applyBulkCountColor} className="button-secondary">
                        {UI.bulkCountApply}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold">{UI.bulkText}</span>
                      <ColorInput label={UI.bulkTextLabel} value={bulkTextColor} onChange={setBulkTextColor} />
                      <button type="button" onClick={applyBulkTextColor} className="button-secondary">
                        {UI.bulkTextApply}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap items-start gap-3">
                    <div className="flex min-w-[280px] flex-1 flex-wrap items-center gap-3">
                      <span className="font-bold">배지</span>
                      <BadgeEditor value={bulkBadges} onChange={setBulkBadges} />
                      <button type="button" onClick={applyBulkBadges} className="button-secondary">
                        배지 적용
                      </button>
                    </div>

                    <button type="button" onClick={applyBulkBothColors} className="button-primary">
                      {UI.bulkBothApply}
                    </button>
                  </div>

                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-bold">색상 템플릿</span>
                    <span className={`text-xs ${MUTED_CLASS}`}>숫자와 텍스트 색상을 함께 적용</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyStylePreset(preset.id)}
                        className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 font-bold text-zinc-800 hover:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-400"
                      >
                        <span className="flex gap-1" aria-hidden="true">
                          <span
                            className="h-5 w-5 rounded border border-zinc-300 dark:border-zinc-700"
                            style={{
                              background:
                                preset.countColor.mode === "solid"
                                  ? preset.countColor.color
                                  : `linear-gradient(${preset.countColor.direction === "vertical" ? "180deg" : "90deg"}, ${preset.countColor.from}, ${preset.countColor.to})`,
                            }}
                          />
                          <span
                            className="h-5 w-5 rounded border border-zinc-300 dark:border-zinc-700"
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
                </div>
              </details>
        </section>

        <div aria-hidden="true" style={{ height: toolbarHeight + 8 }} />

        <p className={`mb-5 mt-5 max-w-3xl text-sm leading-6 ${MUTED_CLASS}`}>
          {UI.subtitle} 버그 및 기능개선 의견은 문의 버튼을 눌러서 쪽지 주시면 감사하겠습니다.
        </p>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6">

            <ReactionTable
              items={filteredItems}
              itemNumberById={itemNumberById}
              emptyMessage={searchQuery ? UI.noSearchResults : undefined}
              selectedIds={store.selectedIds}
              allSelected={allFilteredSelected}
              activeBadgeItemId={activeBadgeItemId}
              onToggleAll={() => store.toggleSelectedIds(filteredItemIds)}
              onToggleSelected={store.toggleSelected}
              onUpdateItem={store.updateItem}
              onMoveItem={store.moveItem}
              onOpenBadgePanel={setActiveBadgeItemId}
            />

          </div>

          <aside
            data-scroll-region="settings-sidebar"
            className="settings-sidebar min-w-0 space-y-4"
            style={{ "--settings-sidebar-top": `${headerHeight + toolbarHeight + 24}px` } as CSSProperties}
          >
            <section className={`rounded-md border ${SURFACE_CLASS}`}>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <h2 className="text-sm font-black">{UI.previewDock}</h2>
                <button
                  type="button"
                  onClick={() => setPreviewDockOpen((prev) => !prev)}
                  className="button-ghost h-8 px-2 text-xs"
                >
                  {previewDockOpen ? UI.collapse : UI.expand}
                </button>
              </div>
              {previewDockOpen ? (
                <div className="px-4 pb-4">
                  <PreviewDock items={store.items} options={renderOptions} />
                </div>
              ) : null}
              <div className="space-y-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <button type="button" onClick={openPreview} className="button-primary w-full">
                  {UI.openPreview}
                </button>
                <button
                  type="button"
                  onClick={copyObsOverlayLink}
                  disabled={isCopyingObsLink || store.items.length === 0}
                  className="button-secondary w-full"
                >
                  {isCopyingObsLink ? "링크 생성 중..." : UI.obsOverlay}
                </button>
                <p className={`text-center text-[11px] leading-4 ${MUTED_CLASS}`}>
                  메뉴를 수정한 뒤에는 새 링크를 다시 복사해 OBS 소스 URL을 교체하세요.
                </p>
              </div>
            </section>

            <section className={`space-y-4 rounded-md border p-4 ${SURFACE_CLASS}`}>
              <h2 className="text-sm font-black">{UI.outputSettings}</h2>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-bold">
                  {UI.pageItems}
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={store.itemsPerPage}
                    onChange={(event) => store.setItemsPerPage(Math.max(1, Number(event.target.value)))}
                    className={`mt-1 h-10 w-full rounded-md border px-3 font-mono outline-none ${INPUT_CLASS}`}
                  />
                </label>

                <label className="block text-sm font-bold">
                  {UI.fadeInterval}
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={store.fadeInterval}
                    onChange={(event) => store.setFadeInterval(Math.max(1, Number(event.target.value)))}
                    className={`mt-1 h-10 w-full rounded-md border px-3 font-mono outline-none ${INPUT_CLASS}`}
                  />
                </label>
              </div>

              <label className="block text-sm font-bold">
                {UI.outputFont}
                <select
                  value={store.fontPreset}
                  onChange={(event) => {
                    store.setFontPreset(event.target.value as typeof store.fontPreset);
                    showNotice(UI.fontChanged);
                  }}
                  className={`mt-1 h-10 w-full rounded-md border px-3 text-sm outline-none ${INPUT_CLASS}`}
                >
                  {FONT_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label} / {preset.description}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-bold">
                {UI.align}
                <select
                  value={store.contentAlign}
                  onChange={(event) => {
                    store.setContentAlign(event.target.value as typeof store.contentAlign);
                    showNotice(event.target.value === "left" ? UI.alignLeft : UI.alignRight);
                  }}
                  className={`mt-1 h-10 w-full rounded-md border px-3 text-sm outline-none ${INPUT_CLASS}`}
                >
                  <option value="left">{UI.align1}</option>
                  <option value="right">{UI.align2}</option>
                </select>
              </label>

              <SliderField
                label={UI.fontSize}
                value={store.fontSize}
                min={18}
                max={44}
                onChange={(value) => store.setFontSize(value)}
              />
              <label className="block text-sm font-bold">
                글자 효과
                <select
                  value={store.textEffect}
                  onChange={(event) => store.setTextEffect(event.target.value as typeof store.textEffect)}
                  className={`mt-1 h-10 w-full rounded-md border px-3 text-sm outline-none ${INPUT_CLASS}`}
                >
                  <option value="none">없음</option>
                  <option value="shadow">그림자</option>
                  <option value="neon">네온 글로우</option>
                  <option value="double-outline">이중 외곽선</option>
                  <option value="extrude">입체 그림자</option>
                </select>
              </label>
              <SliderField
                label={UI.stroke}
                value={store.strokeWidth}
                min={0.5}
                max={8}
                step={0.1}
                onChange={(value) => store.setStrokeWidth(value)}
              />
              <SliderField
                label={UI.baseGap}
                value={store.gapBase}
                min={0}
                max={24}
                onChange={(value) => store.setGapBase(value)}
              />
              <SliderField
                label={UI.rowHeight}
                value={store.rowHeight}
                min={36}
                max={96}
                onChange={(value) => store.setRowHeight(value)}
              />
            </section>

            <details className={`rounded-md border ${SURFACE_CLASS}`} open={false}>
              <summary className="cursor-pointer px-4 py-3 text-sm font-bold">
                {UI.detailSettings} <span className={`ml-2 text-xs font-medium ${MUTED_CLASS}`}>{UI.detailHint}</span>
              </summary>
              <div className="space-y-4 border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
                <SliderField
                  label={UI.minGap}
                  value={store.gapMin}
                  min={0}
                  max={20}
                  onChange={(value) => store.setGapMin(value)}
                />
                <SliderField
                  label={UI.maxGap}
                  value={store.gapMax}
                  min={0}
                  max={32}
                  onChange={(value) => store.setGapMax(value)}
                />
                <SliderField
                  label={UI.verticalPadding}
                  value={store.verticalPadding}
                  min={0}
                  max={80}
                  onChange={(value) => store.setVerticalPadding(value)}
                />
              </div>
            </details>
          </aside>
        </div>
      </div>

      {activeBadgeItem ? (
        <BadgeFloatingPanel
          key={activeBadgeItem.id}
          title={
            activeBadgeItem.text.trim()
              ? activeBadgeItem.text
              : `리액션 #${store.items.findIndex((item) => item.id === activeBadgeItem.id) + 1}`
          }
          value={activeBadgeItem.badges}
          onChange={(badges) => store.updateItem(activeBadgeItem.id, { badges })}
          onClose={() => setActiveBadgeItemId(null)}
        />
      ) : null}

      {toast ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[1300] max-w-sm">
          <div className="rounded-md border border-zinc-200 bg-white/95 px-4 py-3 text-sm font-bold text-zinc-900 shadow-2xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-100">
            {toast.message}
          </div>
        </div>
      ) : null}

      {centerTextModalOpen ? (
        <Dialog
          title="가운데 문구 추가"
          description="count와 reaction text 영역을 함께 차지하는 가운데 정렬 문구 행을 추가합니다."
          onClose={closeCenterTextModal}
        >
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-200">
            문구
            <input
              data-autofocus
              value={centerTextDraft}
              onChange={(event) => setCenterTextDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addCenterTextRow();
              }}
              placeholder="예: ▶ 이벤트 안내 문구"
              className={`mt-2 h-10 w-full rounded-md border px-3 outline-none ${INPUT_CLASS}`}
            />
          </label>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={closeCenterTextModal} className="button-secondary">
              취소
            </button>
            <button type="button" onClick={addCenterTextRow} className="button-primary" disabled={!centerTextDraft.trim()}>
              추가
            </button>
          </div>
        </Dialog>
      ) : null}

      {pendingCsvRows ? (
        <Dialog title={UI.csvConfirmTitle} description={UI.csvConfirmDescription} onClose={closeCsvConfirm}>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            현재 <strong>{store.items.length}개</strong> 항목이 <strong>{pendingCsvRows.length}개</strong> CSV 항목으로
            바뀝니다. 계속할까요?
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={closeCsvConfirm} className="button-secondary" data-autofocus>
              {UI.csvConfirmCancel}
            </button>
            <button
              type="button"
              onClick={() => {
                applyCsvRows(pendingCsvRows);
                setPendingCsvRows(null);
              }}
              className="button-primary"
            >
              {UI.csvConfirmApply}
            </button>
          </div>
        </Dialog>
      ) : null}

      {obsOverlayUrl ? (
        <Dialog
          title="OBS 오버레이 링크"
          description="OBS 브라우저 소스의 URL 칸에 아래 주소를 넣어 주세요."
          onClose={() => setObsOverlayUrl(null)}
        >
          <label htmlFor="obs-overlay-url" className="block text-sm font-bold text-zinc-700 dark:text-zinc-200">
            OBS 오버레이 URL
          </label>
          <textarea
            id="obs-overlay-url"
            readOnly
            value={obsOverlayUrl}
            rows={4}
            className={`mt-2 w-full resize-none rounded-md border p-3 font-mono text-xs leading-5 outline-none ${INPUT_CLASS}`}
          />
          <p className={`mt-2 text-xs leading-5 ${MUTED_CLASS}`}>
            항목이나 출력 설정을 변경하면 이 창을 닫고 새 링크를 다시 생성해 주세요.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <a href={obsOverlayUrl} target="_blank" rel="noreferrer" className="button-secondary">
              새 탭에서 테스트
            </a>
            <button
              type="button"
              onClick={async () => {
                const copied = await copyText(obsOverlayUrl);
                showNotice(copied ? "OBS 오버레이 링크를 복사했습니다." : "주소를 직접 선택해 복사해 주세요.");
              }}
              className="button-primary"
            >
              링크 복사
            </button>
          </div>
        </Dialog>
      ) : null}
    </main>
  );
}
