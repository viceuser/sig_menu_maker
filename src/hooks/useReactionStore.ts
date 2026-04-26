"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_FONT_PRESET, type FontPresetId } from "@/lib/fonts";
import {
  DEFAULT_COUNT_COLOR,
  DEFAULT_FADE_INTERVAL,
  DEFAULT_ITEMS_PER_PAGE,
  DEFAULT_TEXT_COLOR,
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
    isYellow: false,
    isNew: false,
    isUpdate: false,
    isHot: false,
  };
}

function createSamples(): ReactionItem[] {
  return [
    { ...createItem(), count: 1000, text: "환호 리액션", isNew: true },
    { ...createItem(), count: 3000, text: "댄스 타임", isHot: true },
    { ...createItem(), count: 5000, text: "노래 한 소절", isUpdate: true },
  ];
}

export function useReactionStore() {
  const [items, setItems] = useState<ReactionItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [fadeInterval, setFadeInterval] = useState(DEFAULT_FADE_INTERVAL);
  const [fontPreset, setFontPreset] = useState<FontPresetId>(DEFAULT_FONT_PRESET);
  const [isLoaded, setIsLoaded] = useState(false);

  const reload = useCallback(() => {
    const config = loadMenuConfig();
    const loadedItems = config.items.length ? config.items : createSamples();
    setItems(loadedItems);
    setItemsPerPage(config.itemsPerPage || DEFAULT_ITEMS_PER_PAGE);
    setFadeInterval(config.fadeInterval || DEFAULT_FADE_INTERVAL);
    setFontPreset(config.fontPreset as FontPresetId);
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
    saveMenuConfig({ items, itemsPerPage, fadeInterval, fontPreset });
  }, [fadeInterval, fontPreset, items, itemsPerPage]);

  const saveSettings = useCallback(() => {
    saveConfig({ itemsPerPage, fadeInterval, fontPreset });
  }, [fadeInterval, fontPreset, itemsPerPage]);

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
      isLoaded,
      selectedCount: selectedIds.size,
      allSelected,
      setItemsPerPage,
      setFadeInterval,
      setFontPreset,
      addItem,
      updateItem,
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
      deleteSelected,
      fadeInterval,
      fontPreset,
      isLoaded,
      items,
      itemsPerPage,
      moveItem,
      reload,
      saveAll,
      saveOnlyItems,
      saveSettings,
      selectedIds,
      toggleAll,
      toggleSelected,
      updateItem,
    ],
  );
}
