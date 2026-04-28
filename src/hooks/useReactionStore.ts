"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_FONT_PRESET, type FontPresetId } from "@/lib/fonts";
import {
  DEFAULT_CONTENT_ALIGN,
  DEFAULT_COUNT_COLOR,
  DEFAULT_FADE_INTERVAL,
  DEFAULT_GAP_BASE,
  DEFAULT_GAP_MAX,
  DEFAULT_GAP_MIN,
  DEFAULT_ITEMS_PER_PAGE,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_TEXT_COLOR,
  DEFAULT_VERTICAL_PADDING,
  type ContentAlign,
  type ReactionItem,
} from "@/lib/types";
import { loadMenuConfig, saveConfig, saveItems, saveMenuConfig } from "@/lib/storage";

function createItem(): ReactionItem {
  return {
    id: uuidv4(),
    count: 0,
    text: "",
    countColor: DEFAULT_COUNT_COLOR,
    textColor: DEFAULT_TEXT_COLOR,
    isNew: false,
    isUpdate: false,
    isHot: false,
  };
}

function createSamples(): ReactionItem[] {
  return [
    { ...createItem(), count: 1000, text: "샘플 리액션 1" },
    { ...createItem(), count: 3000, text: "샘플 리액션 2" },
    { ...createItem(), count: 5000, text: "샘플 리액션 3" },
  ];
}

export function useReactionStore() {
  const [items, setItems] = useState<ReactionItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [fadeInterval, setFadeInterval] = useState(DEFAULT_FADE_INTERVAL);
  const [fontPreset, setFontPreset] = useState<FontPresetId>(DEFAULT_FONT_PRESET);
  const [contentAlign, setContentAlign] = useState<ContentAlign>(DEFAULT_CONTENT_ALIGN);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
  const [gapMin, setGapMin] = useState(DEFAULT_GAP_MIN);
  const [gapBase, setGapBase] = useState(DEFAULT_GAP_BASE);
  const [gapMax, setGapMax] = useState(DEFAULT_GAP_MAX);
  const [rowHeight, setRowHeight] = useState(DEFAULT_ROW_HEIGHT);
  const [verticalPadding, setVerticalPadding] = useState(DEFAULT_VERTICAL_PADDING);
  const [isLoaded, setIsLoaded] = useState(false);

  const reload = useCallback(() => {
    const config = loadMenuConfig();
    const loadedItems = config.items.length ? config.items : createSamples();
    setItems(loadedItems);
    setItemsPerPage(config.itemsPerPage || DEFAULT_ITEMS_PER_PAGE);
    setFadeInterval(config.fadeInterval || DEFAULT_FADE_INTERVAL);
    setFontPreset(config.fontPreset as FontPresetId);
    setContentAlign(config.contentAlign);
    setStrokeWidth(config.strokeWidth || DEFAULT_STROKE_WIDTH);
    setGapMin(config.gapMin || DEFAULT_GAP_MIN);
    setGapBase(config.gapBase || DEFAULT_GAP_BASE);
    setGapMax(config.gapMax || DEFAULT_GAP_MAX);
    setRowHeight(config.rowHeight || DEFAULT_ROW_HEIGHT);
    setVerticalPadding(config.verticalPadding || DEFAULT_VERTICAL_PADDING);
    setSelectedIds(new Set());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // The store hydrates from localStorage after the client mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createItem()]);
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<ReactionItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const applyToSelected = useCallback((patch: Partial<ReactionItem>) => {
    if (selectedIds.size === 0) return;
    setItems((prev) => prev.map((item) => (selectedIds.has(item.id) ? { ...item, ...patch } : item)));
  }, [selectedIds]);

  const applyToAll = useCallback((patch: Partial<ReactionItem>) => {
    setItems((prev) => prev.map((item) => ({ ...item, ...patch })));
  }, []);

  const deleteSelected = useCallback(() => {
    setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

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

  const moveItem = useCallback((activeId: string, overId: string) => {
    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === activeId);
      const newIndex = prev.findIndex((item) => item.id === overId);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const saveAll = useCallback(() => {
    saveMenuConfig({
      items,
      itemsPerPage,
      fadeInterval,
      fontPreset,
      contentAlign,
      strokeWidth,
      gapMin,
      gapBase,
      gapMax,
      rowHeight,
      verticalPadding,
    });
  }, [contentAlign, fadeInterval, fontPreset, gapBase, gapMax, gapMin, items, itemsPerPage, rowHeight, strokeWidth, verticalPadding]);

  const saveSettings = useCallback(() => {
    saveConfig({
      itemsPerPage,
      fadeInterval,
      fontPreset,
      contentAlign,
      strokeWidth,
      gapMin,
      gapBase,
      gapMax,
      rowHeight,
      verticalPadding,
    });
  }, [contentAlign, fadeInterval, fontPreset, gapBase, gapMax, gapMin, itemsPerPage, rowHeight, strokeWidth, verticalPadding]);

  const saveOnlyItems = useCallback(() => {
    saveItems(items);
  }, [items]);

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  return useMemo(
    () => ({
      items,
      selectedIds,
      itemsPerPage,
      fadeInterval,
      fontPreset,
      contentAlign,
      strokeWidth,
      gapMin,
      gapBase,
      gapMax,
      rowHeight,
      verticalPadding,
      isLoaded,
      selectedCount: selectedIds.size,
      allSelected,
      setItemsPerPage,
      setFadeInterval,
      setFontPreset,
      setContentAlign,
      setStrokeWidth,
      setGapMin,
      setGapBase,
      setGapMax,
      setRowHeight,
      setVerticalPadding,
      addItem,
      updateItem,
      applyToSelected,
      applyToAll,
      deleteSelected,
      toggleSelected,
      toggleAll,
      moveItem,
      saveAll,
      saveSettings,
      saveOnlyItems,
      reload,
    }),
    [
      addItem,
      allSelected,
      contentAlign,
      deleteSelected,
      fadeInterval,
      fontPreset,
      gapBase,
      gapMax,
      gapMin,
      isLoaded,
      items,
      itemsPerPage,
      rowHeight,
      moveItem,
      reload,
      saveAll,
      saveOnlyItems,
      saveSettings,
      selectedIds,
      strokeWidth,
      toggleAll,
      toggleSelected,
      updateItem,
      applyToSelected,
      applyToAll,
      verticalPadding,
    ],
  );
}
