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
import type { ReactNode } from "react";
import type { ReactionItem } from "@/lib/types";
import { BadgeToggle } from "./BadgeToggle";
import { ColorInput } from "./ColorInput";

interface ReactionTableProps {
  items: ReactionItem[];
  selectedIds: Set<string>;
  allSelected: boolean;
  onToggleAll: () => void;
  onToggleSelected: (id: string) => void;
  onUpdateItem: (id: string, patch: Partial<ReactionItem>) => void;
  onMoveItem: (activeId: string, overId: string) => void;
}

export function ReactionTable({
  items,
  selectedIds,
  allSelected,
  onToggleAll,
  onToggleSelected,
  onUpdateItem,
  onMoveItem,
}: ReactionTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) onMoveItem(String(active.id), String(over.id));
  };

  return (
    <div className="overflow-x-auto border-y border-zinc-200">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
          <thead className="bg-zinc-100 text-xs font-bold uppercase text-zinc-600">
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
              <Th className="w-36">리액션 개수</Th>
              <Th>리액션 텍스트</Th>
              <Th className="w-24 text-center">NEW</Th>
              <Th className="w-24 text-center">UPDATE</Th>
              <Th className="w-24 text-center">HOT</Th>
              <Th className="w-[280px]">개수 색상</Th>
              <Th className="w-[280px]">텍스트 색상</Th>
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
                  onToggleSelected={onToggleSelected}
                  onUpdateItem={onUpdateItem}
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>

      {items.length === 0 ? (
        <div className="grid min-h-40 place-items-center bg-white text-sm text-zinc-500">
          + 추가로 첫 리액션을 만들어 주세요.
        </div>
      ) : null}
    </div>
  );
}

function ReactionRow({
  item,
  index,
  selected,
  onToggleSelected,
  onUpdateItem,
}: {
  item: ReactionItem;
  index: number;
  selected: boolean;
  onToggleSelected: (id: string) => void;
  onUpdateItem: (id: string, patch: Partial<ReactionItem>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={[
        "border-t border-zinc-200 bg-white align-middle",
        isDragging ? "relative z-20 shadow-lg" : "",
      ].join(" ")}
    >
      <Td className="text-center">
        <button
          type="button"
          aria-label="행 순서 이동"
          className="cursor-grab rounded-md px-2 py-1 text-lg text-zinc-500 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ≡
        </button>
      </Td>
      <Td className="text-center font-mono text-zinc-500">{index + 1}</Td>
      <Td className="text-center">
        <input
          aria-label={`${index + 1}번 선택`}
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
          value={item.count}
          onChange={(event) => onUpdateItem(item.id, { count: Number(event.target.value) })}
          className="h-9 w-28 rounded-md border border-zinc-300 px-2 font-mono outline-none focus:border-zinc-950"
        />
      </Td>
      <Td>
        <input
          value={item.text}
          onChange={(event) => onUpdateItem(item.id, { text: event.target.value })}
          placeholder="리액션 이름"
          className="h-9 w-full min-w-48 rounded-md border border-zinc-300 px-3 outline-none focus:border-zinc-950"
        />
      </Td>
      <Td className="text-center">
        <BadgeToggle label="NEW" checked={item.isNew} onChange={(isNew) => onUpdateItem(item.id, { isNew })} />
      </Td>
      <Td className="text-center">
        <BadgeToggle
          label="UPDATE"
          checked={item.isUpdate}
          onChange={(isUpdate) => onUpdateItem(item.id, { isUpdate })}
        />
      </Td>
      <Td className="text-center">
        <BadgeToggle label="HOT" checked={item.isHot} onChange={(isHot) => onUpdateItem(item.id, { isHot })} />
      </Td>
      <Td>
        <ColorInput
          label="리액션 개수 색상"
          value={item.countColor}
          onChange={(countColor) => onUpdateItem(item.id, { countColor })}
        />
      </Td>
      <Td>
        <ColorInput
          label="리액션 텍스트 색상"
          value={item.textColor}
          onChange={(textColor) => onUpdateItem(item.id, { textColor })}
        />
      </Td>
    </tr>
  );
}

function Th({ className = "", children }: { className?: string; children: ReactNode }) {
  return <th className={`border-r border-zinc-200 px-3 py-3 last:border-r-0 ${className}`}>{children}</th>;
}

function Td({ className = "", children }: { className?: string; children: ReactNode }) {
  return <td className={`border-r border-zinc-100 px-3 py-3 last:border-r-0 ${className}`}>{children}</td>;
}
