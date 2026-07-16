"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { createCustomBadge } from "@/lib/badges";
import { DEFAULT_FONT_PRESET, isFontPresetId, type FontPresetId } from "@/lib/fonts";
import {
  DEFAULT_CONTENT_ALIGN,
  DEFAULT_COUNT_COLOR,
  DEFAULT_FADE_INTERVAL,
  DEFAULT_FONT_SIZE,
  DEFAULT_GAP_BASE,
  DEFAULT_GAP_MAX,
  DEFAULT_GAP_MIN,
  DEFAULT_ITEMS_PER_PAGE,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_TEXT_EFFECT,
  DEFAULT_TEXT_COLOR,
  DEFAULT_VERTICAL_PADDING,
  type ContentAlign,
  type ReactionItem,
  type TextEffect,
} from "@/lib/types";
import { loadMenuConfig, saveMenuConfig } from "@/lib/storage";

export type SaveState = "saving" | "saved";

const AUTOSAVE_DEBOUNCE_MS = 600;
const HISTORY_LIMIT = 80;

type ItemsUpdater = ReactionItem[] | ((items: ReactionItem[]) => ReactionItem[]);

function cloneReactionItem(item: ReactionItem): ReactionItem {
  return {
    ...item,
    countColor: { ...item.countColor },
    textColor: { ...item.textColor },
    badges: item.badges.map((badge) => ({ ...badge, fill: { ...badge.fill } })),
  };
}

export function createReactionItem(): ReactionItem {
  return {
    id: uuidv4(),
    rowType: "normal",
    count: null,
    text: "",
    countColor: DEFAULT_COUNT_COLOR,
    textColor: DEFAULT_TEXT_COLOR,
    badges: [],
  };
}

export function createCenterTextItem(text = ""): ReactionItem {
  return {
    ...createReactionItem(),
    rowType: "centerText",
    text,
  };
}

function createSamples(): ReactionItem[] {
  return [
    { ...createReactionItem(), count: 1000, text: "Sample Reaction 1", badges: [createCustomBadge()] },
    { ...createReactionItem(), count: 3000, text: "Sample Reaction 2" },
    { ...createReactionItem(), count: 5000, text: "Sample Reaction 3" },
  ];
}

export function useReactionStore() {
  const [items, setItems] = useState<ReactionItem[]>([]);
  const itemsRef = useRef<ReactionItem[]>([]);
  const historyRef = useRef<{ past: ReactionItem[][]; future: ReactionItem[][] }>({ past: [], future: [] });
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [fadeInterval, setFadeInterval] = useState(DEFAULT_FADE_INTERVAL);
  const [fontPreset, setFontPreset] = useState<FontPresetId>(DEFAULT_FONT_PRESET);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [contentAlign, setContentAlign] = useState<ContentAlign>(DEFAULT_CONTENT_ALIGN);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
  const [textEffect, setTextEffect] = useState<TextEffect>(DEFAULT_TEXT_EFFECT);
  const [gapMin, setGapMin] = useState(DEFAULT_GAP_MIN);
  const [gapBase, setGapBase] = useState(DEFAULT_GAP_BASE);
  const [gapMax, setGapMax] = useState(DEFAULT_GAP_MAX);
  const [rowHeight, setRowHeight] = useState(DEFAULT_ROW_HEIGHT);
  const [verticalPadding, setVerticalPadding] = useState(DEFAULT_VERTICAL_PADDING);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const skipNextAutosaveRef = useRef(true);

  const updateHistoryState = useCallback(() => {
    setHistoryState({
      canUndo: historyRef.current.past.length > 0,
      canRedo: historyRef.current.future.length > 0,
    });
  }, []);

  const replaceItemsState = useCallback(
    (nextItems: ReactionItem[], recordHistory = true) => {
      const previous = itemsRef.current;
      if (nextItems === previous) return;

      if (recordHistory) {
        historyRef.current.past = [...historyRef.current.past, previous].slice(-HISTORY_LIMIT);
        historyRef.current.future = [];
      }

      itemsRef.current = nextItems;
      setItems(nextItems);
      updateHistoryState();
    },
    [updateHistoryState],
  );

  const commitItems = useCallback(
    (updater: ItemsUpdater) => {
      const previous = itemsRef.current;
      const nextItems = typeof updater === "function" ? updater(previous) : updater;
      if (nextItems === previous) return;
      replaceItemsState(nextItems, true);
    },
    [replaceItemsState],
  );

  const reload = useCallback(() => {
    const config = loadMenuConfig();
    const loadedItems = config.items.length ? config.items : createSamples();

    historyRef.current = { past: [], future: [] };
    itemsRef.current = loadedItems;
    setItems(loadedItems);
    updateHistoryState();
    setItemsPerPage(config.itemsPerPage || DEFAULT_ITEMS_PER_PAGE);
    setFadeInterval(config.fadeInterval || DEFAULT_FADE_INTERVAL);
    setFontPreset(isFontPresetId(config.fontPreset) ? config.fontPreset : DEFAULT_FONT_PRESET);
    setFontSize(config.fontSize || DEFAULT_FONT_SIZE);
    setContentAlign(config.contentAlign);
    setStrokeWidth(config.strokeWidth || DEFAULT_STROKE_WIDTH);
    setTextEffect(config.textEffect || DEFAULT_TEXT_EFFECT);
    setGapMin(config.gapMin || DEFAULT_GAP_MIN);
    setGapBase(config.gapBase || DEFAULT_GAP_BASE);
    setGapMax(config.gapMax || DEFAULT_GAP_MAX);
    setRowHeight(config.rowHeight || DEFAULT_ROW_HEIGHT);
    setVerticalPadding(config.verticalPadding || DEFAULT_VERTICAL_PADDING);
    setSelectedIds(new Set());
    skipNextAutosaveRef.current = true;
    setIsLoaded(true);
  }, [updateHistoryState]);

  useEffect(() => {
    // The store hydrates from localStorage after the client mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  useEffect(() => {
    if (!isLoaded) return;

    // 방금 localStorage에서 불러온 데이터를 다시 저장하는 낭비를 막는다.
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      saveMenuConfig({
        items,
        itemsPerPage,
        fadeInterval,
        fontPreset,
        fontSize,
        contentAlign,
        strokeWidth,
        textEffect,
        gapMin,
        gapBase,
        gapMax,
        rowHeight,
        verticalPadding,
      });
      setSaveState("saved");
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [
    contentAlign,
    fadeInterval,
    fontPreset,
    fontSize,
    gapBase,
    gapMax,
    gapMin,
    isLoaded,
    items,
    itemsPerPage,
    rowHeight,
    strokeWidth,
    textEffect,
    verticalPadding,
  ]);

  const insertItemNearSelection = useCallback(
    (nextItem: ReactionItem) => {
      commitItems((prev) => {
        if (selectedIds.size === 0) {
          return [...prev, nextItem];
        }

        let insertIndex = -1;
        prev.forEach((item, index) => {
          if (selectedIds.has(item.id)) {
            insertIndex = index;
          }
        });

        if (insertIndex < 0) {
          return [...prev, nextItem];
        }

        const next = [...prev];
        next.splice(insertIndex + 1, 0, nextItem);
        return next;
      });

      setSelectedIds(new Set([nextItem.id]));
    },
    [commitItems, selectedIds],
  );

  const addItem = useCallback(() => {
    insertItemNearSelection(createReactionItem());
  }, [insertItemNearSelection]);

  const addCenterTextItem = useCallback(
    (text = "") => {
      insertItemNearSelection(createCenterTextItem(text));
    },
    [insertItemNearSelection],
  );

  const updateItem = useCallback((id: string, patch: Partial<ReactionItem>) => {
    commitItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, [commitItems]);

  const applyToSelected = useCallback(
    (patch: Partial<ReactionItem>) => {
      if (selectedIds.size === 0) return;
      commitItems((prev) => prev.map((item) => (selectedIds.has(item.id) ? { ...item, ...patch } : item)));
    },
    [commitItems, selectedIds],
  );

  const applyToAll = useCallback((patch: Partial<ReactionItem>) => {
    commitItems((prev) => prev.map((item) => ({ ...item, ...patch })));
  }, [commitItems]);

  const deleteSelected = useCallback(() => {
    commitItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
  }, [commitItems, selectedIds]);

  const replaceItems = useCallback((nextItems: ReactionItem[]) => {
    commitItems(nextItems);
    setSelectedIds(new Set());
  }, [commitItems]);

  const appendItems = useCallback((nextItems: ReactionItem[]) => {
    commitItems((prev) => [...prev, ...nextItems]);
    setSelectedIds(new Set());
  }, [commitItems]);

  const duplicateSelected = useCallback(() => {
    if (selectedIds.size === 0) return 0;

    const duplicatedIds: string[] = [];
    const nextItems: ReactionItem[] = [];

    itemsRef.current.forEach((item) => {
      nextItems.push(item);
      if (!selectedIds.has(item.id)) return;

      const duplicate = { ...cloneReactionItem(item), id: uuidv4() };
      duplicatedIds.push(duplicate.id);
      nextItems.push(duplicate);
    });

    commitItems(nextItems);
    setSelectedIds(new Set(duplicatedIds));
    return duplicatedIds.length;
  }, [commitItems, selectedIds]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === items.length) return new Set();
      return new Set(items.map((item) => item.id));
    });
  }, [items]);

  const toggleSelectedIds = useCallback((ids: string[]) => {
    if (ids.length === 0) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      const shouldClear = ids.every((id) => next.has(id));
      ids.forEach((id) => {
        if (shouldClear) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  }, []);

  const moveItem = useCallback((activeId: string, overId: string) => {
    commitItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === activeId);
      const newIndex = prev.findIndex((item) => item.id === overId);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, [commitItems]);

  const undo = useCallback(() => {
    const previous = historyRef.current.past.at(-1);
    if (!previous) return;

    historyRef.current.past = historyRef.current.past.slice(0, -1);
    historyRef.current.future = [itemsRef.current, ...historyRef.current.future].slice(0, HISTORY_LIMIT);
    itemsRef.current = previous;
    setItems(previous);
    setSelectedIds((selected) => new Set([...selected].filter((id) => previous.some((item) => item.id === id))));
    updateHistoryState();
  }, [updateHistoryState]);

  const redo = useCallback(() => {
    const next = historyRef.current.future[0];
    if (!next) return;

    historyRef.current.future = historyRef.current.future.slice(1);
    historyRef.current.past = [...historyRef.current.past, itemsRef.current].slice(-HISTORY_LIMIT);
    itemsRef.current = next;
    setItems(next);
    setSelectedIds((selected) => new Set([...selected].filter((id) => next.some((item) => item.id === id))));
    updateHistoryState();
  }, [updateHistoryState]);

  const saveAll = useCallback(() => {
    saveMenuConfig({
      items,
      itemsPerPage,
      fadeInterval,
      fontPreset,
      fontSize,
      contentAlign,
      strokeWidth,
      textEffect,
      gapMin,
      gapBase,
      gapMax,
      rowHeight,
      verticalPadding,
    });
  }, [
    contentAlign,
    fadeInterval,
    fontPreset,
    fontSize,
    gapBase,
    gapMax,
    gapMin,
    items,
    itemsPerPage,
    rowHeight,
    strokeWidth,
    textEffect,
    verticalPadding,
  ]);

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  return useMemo(
    () => ({
      items,
      selectedIds,
      itemsPerPage,
      fadeInterval,
      fontPreset,
      fontSize,
      contentAlign,
      strokeWidth,
      textEffect,
      gapMin,
      gapBase,
      gapMax,
      rowHeight,
      verticalPadding,
      isLoaded,
      saveState,
      canUndo: historyState.canUndo,
      canRedo: historyState.canRedo,
      selectedCount: selectedIds.size,
      allSelected,
      setItemsPerPage,
      setFadeInterval,
      setFontPreset,
      setFontSize,
      setContentAlign,
      setStrokeWidth,
      setTextEffect,
      setGapMin,
      setGapBase,
      setGapMax,
      setRowHeight,
      setVerticalPadding,
      addItem,
      addCenterTextItem,
      updateItem,
      applyToSelected,
      applyToAll,
      deleteSelected,
      duplicateSelected,
      replaceItems,
      appendItems,
      toggleSelected,
      toggleAll,
      toggleSelectedIds,
      moveItem,
      undo,
      redo,
      saveAll,
      reload,
    }),
    [
      addItem,
      addCenterTextItem,
      allSelected,
      applyToAll,
      applyToSelected,
      appendItems,
      contentAlign,
      deleteSelected,
      duplicateSelected,
      fadeInterval,
      fontPreset,
      fontSize,
      gapBase,
      gapMax,
      gapMin,
      isLoaded,
      items,
      itemsPerPage,
      historyState.canRedo,
      historyState.canUndo,
      moveItem,
      reload,
      replaceItems,
      rowHeight,
      saveAll,
      saveState,
      selectedIds,
      strokeWidth,
      textEffect,
      toggleAll,
      toggleSelectedIds,
      toggleSelected,
      undo,
      updateItem,
      verticalPadding,
      redo,
    ],
  );
}
