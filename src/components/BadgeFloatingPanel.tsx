"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cloneBadgeConfig, getBadgeDisplayText } from "@/lib/badges";
import type { BadgeConfig } from "@/lib/types";
import { BadgeEditorForm, normalizeWorkingBadge } from "./BadgeEditorForm";

const PANEL_POSITION_KEY = "badge_panel_position";
const PANEL_WIDTH = 420;
const PANEL_HEIGHT_GUARD = 560;
const PANEL_MARGIN = 12;

type PanelPosition = {
  x: number;
  y: number;
};

function clampPosition(position: PanelPosition) {
  if (typeof window === "undefined") return position;

  return {
    x: Math.min(window.innerWidth - PANEL_WIDTH - PANEL_MARGIN, Math.max(PANEL_MARGIN, position.x)),
    y: Math.min(window.innerHeight - PANEL_HEIGHT_GUARD - PANEL_MARGIN, Math.max(PANEL_MARGIN, position.y)),
  };
}

function loadPanelPosition() {
  if (typeof window === "undefined") return { x: 24, y: 24 };

  try {
    const raw = window.localStorage.getItem(PANEL_POSITION_KEY);
    if (!raw) return { x: 24, y: 24 };
    const parsed = JSON.parse(raw) as Partial<PanelPosition>;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return { x: 24, y: 24 };
    return clampPosition({ x: parsed.x, y: parsed.y });
  } catch {
    return { x: 24, y: 24 };
  }
}

function savePanelPosition(position: PanelPosition) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PANEL_POSITION_KEY, JSON.stringify(position));
}

export function BadgeFloatingPanel({
  title,
  value,
  onChange,
  onClose,
}: {
  title: string;
  value: BadgeConfig[];
  onChange: (value: BadgeConfig[]) => void;
  onClose: () => void;
}) {
  const sourceBadge = value[0] ?? null;
  const [enabled, setEnabled] = useState(() => Boolean(sourceBadge));
  const [draft, setDraft] = useState<BadgeConfig>(() => normalizeWorkingBadge(sourceBadge));
  const [position, setPosition] = useState<PanelPosition>(() => loadPanelPosition());
  const [minimized, setMinimized] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; panelX: number; panelY: number } | null>(null);
  const positionRef = useRef(position);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    setEnabled(Boolean(sourceBadge));
    setDraft(normalizeWorkingBadge(sourceBadge));
  }, [sourceBadge]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => {
        const next = clampPosition(current);
        savePanelPosition(next);
        return next;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const summary = useMemo(() => {
    if (!enabled) return "Off";
    return draft.label || getBadgeDisplayText(draft);
  }, [draft, enabled]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      panelX: position.x,
      panelY: position.y,
    };

    const handleMove = (moveEvent: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) return;

      const next = clampPosition({
        x: start.panelX + (moveEvent.clientX - start.mouseX),
        y: start.panelY + (moveEvent.clientY - start.mouseY),
      });
      setPosition(next);
    };

    const handleUp = () => {
      savePanelPosition(positionRef.current);
      dragStartRef.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const apply = () => {
    onChange(enabled ? [cloneBadgeConfig(draft)] : []);
    onClose();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{ left: position.x, top: position.y, width: PANEL_WIDTH }}
      className="fixed z-[1000] rounded-lg border border-zinc-300 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div
        onPointerDown={handlePointerDown}
        className="flex cursor-move items-center justify-between gap-3 rounded-t-lg border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950"
      >
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Badge Panel</p>
          <p className="truncate text-sm font-black text-zinc-950 dark:text-zinc-50">{title}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMinimized((current) => !current)}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            {minimized ? "열기" : "최소화"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            닫기
          </button>
        </div>
      </div>

      {!minimized ? (
        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto p-4">
          <BadgeEditorForm
            enabled={enabled}
            value={draft}
            onEnabledChange={setEnabled}
            onChange={setDraft}
            onCancel={() => {
              setEnabled(Boolean(sourceBadge));
              setDraft(normalizeWorkingBadge(sourceBadge));
              onClose();
            }}
            onApply={apply}
          />
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
