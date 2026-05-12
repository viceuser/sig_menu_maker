"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cloneBadgeConfig, getBadgeDisplayText } from "@/lib/badges";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { BadgeConfig } from "@/lib/types";
import { BadgeEditorForm, normalizeWorkingBadge } from "./BadgeEditorForm";

const PANEL_WIDTH = 420;
const VIEWPORT_MARGIN = 12;

function getPanelPosition(button: HTMLButtonElement | null): CSSProperties {
  if (!button) {
    return { position: "fixed", top: VIEWPORT_MARGIN, left: VIEWPORT_MARGIN, width: PANEL_WIDTH };
  }

  const rect = button.getBoundingClientRect();
  const left = Math.min(
    Math.max(VIEWPORT_MARGIN, rect.left),
    Math.max(VIEWPORT_MARGIN, window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN),
  );
  const top = Math.min(rect.bottom + 8, window.innerHeight - 520);

  return {
    position: "fixed",
    top: Math.max(VIEWPORT_MARGIN, top),
    left,
    width: PANEL_WIDTH,
    maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
  };
}

export function BadgeEditor({
  value,
  onChange,
}: {
  value: BadgeConfig[];
  onChange: (value: BadgeConfig[]) => void;
}) {
  const sourceBadge = value[0] ?? null;
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(Boolean(sourceBadge));
  const [draft, setDraft] = useState<BadgeConfig>(normalizeWorkingBadge(sourceBadge));
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(wrapperRef, () => setIsOpen(false));

  useEffect(() => {
    setEnabled(Boolean(sourceBadge));
    setDraft(normalizeWorkingBadge(sourceBadge));
  }, [sourceBadge]);

  useEffect(() => {
    if (!isOpen) return;

    const syncPosition = () => setPanelStyle(getPanelPosition(buttonRef.current));
    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);
    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [isOpen]);

  const badgeSummary = useMemo(() => {
    if (!enabled) return "Off";
    return draft.label || getBadgeDisplayText(draft);
  }, [draft, enabled]);

  const commitAndClose = () => {
    onChange(enabled ? [cloneBadgeConfig(draft)] : []);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={[
          "inline-flex min-w-44 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition",
          enabled
            ? "border-zinc-950 bg-zinc-950 text-white"
            : "border-zinc-300 bg-white text-zinc-900 hover:border-zinc-950",
        ].join(" ")}
      >
        <span className="flex items-center gap-2">
          <span
            className={[
              "inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-black",
              enabled ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-700",
            ].join(" ")}
          >
            B
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-black">Badge Setting</span>
            <span className={["block text-[11px] font-medium", enabled ? "text-zinc-300" : "text-zinc-500"].join(" ")}>
              {badgeSummary}
            </span>
          </span>
        </span>
      </button>

      {isOpen ? (
        <div
          className="z-50 overflow-y-auto rounded-md border border-zinc-200 bg-white p-4 text-zinc-950 shadow-xl"
          style={panelStyle}
        >
          <BadgeEditorForm
            enabled={enabled}
            value={draft}
            onEnabledChange={setEnabled}
            onChange={setDraft}
            onCancel={() => {
              setEnabled(Boolean(sourceBadge));
              setDraft(normalizeWorkingBadge(sourceBadge));
              setIsOpen(false);
            }}
            onApply={commitAndClose}
          />
        </div>
      ) : null}
    </div>
  );
}
