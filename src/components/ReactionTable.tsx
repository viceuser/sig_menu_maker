"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getBadgeDisplayText } from "@/lib/badges";
import type { ReactionItem } from "@/lib/types";
import { ColorInput } from "./ColorInput";

interface ReactionTableProps {
  items: ReactionItem[];
  selectedIds: Set<string>;
  allSelected: boolean;
  activeBadgeItemId?: string | null;
  onToggleAll: () => void;
  onToggleSelected: (id: string) => void;
  onUpdateItem: (id: string, patch: Partial<ReactionItem>) => void;
  onMoveItem: (activeId: string, overId: string) => void;
  onOpenBadgePanel: (id: string) => void;
}

export function ReactionTable({
  items,
  selectedIds,
  allSelected,
  activeBadgeItemId,
  onToggleAll,
  onToggleSelected,
  onUpdateItem,
  onMoveItem,
  onOpenBadgePanel,
}: ReactionTableProps) {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(1100);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) onMoveItem(String(active.id), String(over.id));
  };

  useEffect(() => {
    const topScroll = topScrollRef.current;
    const tableScroll = tableScrollRef.current;
    if (!topScroll || !tableScroll) return;

    let syncing = false;
    const syncTop = () => {
      if (syncing) return;
      syncing = true;
      topScroll.scrollLeft = tableScroll.scrollLeft;
      syncing = false;
    };
    const syncTable = () => {
      if (syncing) return;
      syncing = true;
      tableScroll.scrollLeft = topScroll.scrollLeft;
      syncing = false;
    };
    const updateScrollWidth = () => setTableScrollWidth(tableScroll.scrollWidth);

    updateScrollWidth();
    topScroll.addEventListener("scroll", syncTable, { passive: true });
    tableScroll.addEventListener("scroll", syncTop, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollWidth);
    resizeObserver.observe(tableScroll);

    return () => {
      topScroll.removeEventListener("scroll", syncTable);
      tableScroll.removeEventListener("scroll", syncTop);
      resizeObserver.disconnect();
    };
  }, [items.length]);

  return (
    <div className="border-y border-zinc-200 dark:border-zinc-800">
      <div
        ref={topScrollRef}
        aria-label="Horizontal table scroll"
        className="sticky top-[65px] z-30 h-4 overflow-x-auto overflow-y-hidden border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="h-px" style={{ width: tableScrollWidth }} />
      </div>
      <div ref={tableScrollRef} className="overflow-x-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="w-full min-w-[1100px] table-fixed border-collapse text-left text-sm">
          <thead className="bg-zinc-100 text-xs font-bold uppercase text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <Th className="w-12 text-center">Drag</Th>
              <Th className="w-16 text-center">No.</Th>
              <Th className="w-12 text-center">
                <input
                  aria-label="전체 선택"
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="h-4 w-4 accent-zinc-950"
                />
              </Th>
              <Th className="w-28">Count</Th>
              <Th>Reaction Text</Th>
              <Th className="w-[200px]">Badge</Th>
              <Th className="w-[225px]">Count Color</Th>
              <Th className="w-[225px]">Text Color</Th>
            </tr>
          </thead>
          <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <tbody>
              {items.map((item, index) => (
                <ReactionRow
                  key={item.id}
                  item={item}
                  index={index}
                  selected={selectedIds.has(item.id)}
                  isBadgePanelOpen={activeBadgeItemId === item.id}
                  onToggleSelected={onToggleSelected}
                  onUpdateItem={onUpdateItem}
                  onOpenBadgePanel={onOpenBadgePanel}
                />
              ))}
            </tbody>
          </SortableContext>
          </table>
        </DndContext>

      {items.length === 0 ? (
        <div className="grid min-h-40 place-items-center bg-white text-sm text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
          행을 추가해서 리액션 메뉴판을 만들어보세요.
        </div>
        ) : null}
      </div>
    </div>
  );
}

function ReactionRow({
  item,
  index,
  selected,
  isBadgePanelOpen,
  onToggleSelected,
  onUpdateItem,
  onOpenBadgePanel,
}: {
  item: ReactionItem;
  index: number;
  selected: boolean;
  isBadgePanelOpen: boolean;
  onToggleSelected: (id: string) => void;
  onUpdateItem: (id: string, patch: Partial<ReactionItem>) => void;
  onOpenBadgePanel: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const badgeSummary = item.badges[0]
    ? item.badges[0].label || getBadgeDisplayText(item.badges[0])
    : "Off";
  const isCenterTextRow = item.rowType === "centerText";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={[
        "border-t border-zinc-200 bg-white align-middle dark:border-zinc-800 dark:bg-zinc-950",
        isDragging ? "relative z-20 shadow-lg" : "",
      ].join(" ")}
    >
      <Td className="text-center">
        <button
          type="button"
          aria-label="행 이동"
          className="cursor-grab rounded-md px-2 py-1 text-lg text-zinc-500 active:cursor-grabbing dark:text-zinc-400"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
      </Td>
      <Td className="text-center font-mono text-zinc-500 dark:text-zinc-400">{index + 1}</Td>
      <Td className="text-center">
        <input
          aria-label={`행 ${index + 1} 선택`}
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelected(item.id)}
          className="h-4 w-4 accent-zinc-950"
        />
      </Td>
      <Td>
        <input
          type="number"
          min={0}
          value={item.count ?? ""}
          disabled={isCenterTextRow}
          placeholder={isCenterTextRow ? "-" : undefined}
          onChange={(event) =>
            onUpdateItem(item.id, {
              count: event.target.value === "" ? null : Number(event.target.value),
            })
          }
          className="h-9 w-24 rounded-md border border-zinc-300 bg-white px-2 font-mono outline-none focus:border-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-white dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
        />
      </Td>
      <Td>
        <div className="space-y-2">
          {isCenterTextRow ? (
            <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              CENTER TEXT
            </span>
          ) : null}
          <input
            value={item.text}
            onChange={(event) => onUpdateItem(item.id, { text: event.target.value })}
            placeholder={isCenterTextRow ? "가운데 문구를 입력하세요" : "리액션 텍스트"}
            className="h-9 w-full min-w-44 rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-white"
          />
        </div>
      </Td>
      <Td>
        <button
          type="button"
          disabled={isCenterTextRow}
          onClick={() => onOpenBadgePanel(item.id)}
          className={[
            "inline-flex min-w-40 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition",
            isCenterTextRow
              ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600"
              : isBadgePanelOpen
                ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                : item.badges.length > 0
                  ? "border-zinc-950 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 dark:border-zinc-300 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
                  : "border-zinc-300 bg-white text-zinc-900 hover:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-300",
          ].join(" ")}
        >
          <span className="flex items-center gap-2">
            <span
              className={[
                "inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-black",
                isCenterTextRow
                  ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                  : item.badges.length > 0
                    ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
              ].join(" ")}
            >
              B
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-black">Badge Setting</span>
              <span
                className={[
                  "block text-[11px] font-medium",
                  isCenterTextRow ? "text-zinc-400" : isBadgePanelOpen ? "text-zinc-300" : "text-zinc-500",
                ].join(" ")}
              >
                {isCenterTextRow ? "Disabled for center text rows" : badgeSummary}
              </span>
            </span>
          </span>
        </button>
      </Td>
      <Td>
        {isCenterTextRow ? (
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Not used</span>
        ) : (
          <ColorInput
            label="Count color"
            value={item.countColor}
            onChange={(countColor) => onUpdateItem(item.id, { countColor })}
          />
        )}
      </Td>
      <Td>
        <ColorInput
          label="Text color"
          value={item.textColor}
          onChange={(textColor) => onUpdateItem(item.id, { textColor })}
        />
      </Td>
    </tr>
  );
}

function Th({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <th className={`border-r border-zinc-200 px-2 py-3 last:border-r-0 dark:border-zinc-800 ${className}`}>
      {children}
    </th>
  );
}

function Td({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <td className={`border-r border-zinc-100 px-2 py-3 last:border-r-0 dark:border-zinc-900 ${className}`}>
      {children}
    </td>
  );
}
