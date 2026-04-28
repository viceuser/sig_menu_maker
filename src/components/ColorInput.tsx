"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { addRecentColor, getRecentColors, normalizeHex } from "@/lib/recentColors";
import type { GradientDirection, TextPaint } from "@/lib/types";

const PRESET_COLORS = [
  "#ffffff", "#000000", "#1a1a1a", "#333333", "#666666",
  "#999999", "#cccccc", "#f5f5f5", "#2c2c2c", "#444444",
  "#f97671", "#ff0000", "#e53935", "#c62828", "#ff5252",
  "#ff1744", "#d50000", "#ff8a80", "#ff6b6b", "#ff4757",
  "#f48fb1", "#f06292", "#e91e63", "#c2185b", "#ff80ab",
  "#ff4081", "#f50057", "#fce4ec", "#f8bbd0", "#ff69b4",
  "#ff8a65", "#ff7043", "#f4511e", "#bf360c", "#ffab91",
  "#ff6d00", "#ff9100", "#ffccbc", "#ff8c00", "#ffa07a",
  "#ffe082", "#ffca28", "#ffc107", "#ff8f00", "#fff176",
  "#ffee58", "#ffd600", "#fffde7", "#ffff00", "#ffd700",
  "#c8e6c9", "#69f0ae", "#00c853", "#43a047", "#1b5e20",
  "#00e676", "#76ff03", "#b9f6ca", "#00e676", "#39d353",
  "#b3e5fc", "#4fc3f7", "#0288d1", "#01579b", "#2979ff",
  "#2196f3", "#1565c0", "#82b1ff", "#448aff", "#00b0ff",
  "#e1bee7", "#ce93d8", "#9c27b0", "#6a1b9a", "#ea80fc",
  "#d500f9", "#aa00ff", "#e040fb", "#7c4dff", "#651fff",
  "#b2ebf2", "#4dd0e1", "#00bcd4", "#00838f", "#a7ffeb",
  "#1de9b6", "#00bfa5", "#64ffda", "#00e5ff", "#18ffff",
  "#f97671", "#ff6b9d", "#c44dff", "#44d7b6", "#f8e71c",
  "#ff9500", "#ff3b30", "#4cd964", "#5ac8fa", "#007aff",
];

const PALETTE_WIDTH = 360;
const PALETTE_MIN_HEIGHT = 380;
const VIEWPORT_MARGIN = 12;

interface ColorInputProps {
  value: TextPaint;
  onChange: (value: TextPaint) => void;
  label: string;
}

function createPaintPreviewStyle(paint: TextPaint): CSSProperties {
  if (paint.mode === "solid") {
    return {
      backgroundColor: paint.color,
      backgroundImage:
        "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 45%), linear-gradient(315deg, rgba(0,0,0,0.18), rgba(0,0,0,0) 55%)",
    };
  }

  const direction = paint.direction === "vertical" ? "180deg" : "90deg";
  return {
    backgroundImage: `linear-gradient(${direction}, ${paint.from}, ${paint.to})`,
  };
}

function normalizePaint(paint: TextPaint): TextPaint {
  if (paint.mode === "solid") {
    return { mode: "solid", color: normalizeHex(paint.color) ?? "#ffffff" };
  }

  return {
    mode: "gradient",
    from: normalizeHex(paint.from) ?? "#ffffff",
    to: normalizeHex(paint.to) ?? "#000000",
    direction: paint.direction,
  };
}

function getPalettePosition(button: HTMLButtonElement | null) {
  if (!button) {
    return {
      position: "fixed" as const,
      left: VIEWPORT_MARGIN,
      top: VIEWPORT_MARGIN,
      width: PALETTE_WIDTH,
      maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
    };
  }

  const rect = button.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const left = Math.min(
    Math.max(VIEWPORT_MARGIN, rect.left),
    Math.max(VIEWPORT_MARGIN, viewportWidth - PALETTE_WIDTH - VIEWPORT_MARGIN),
  );

  const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_MARGIN;
  const spaceAbove = rect.top - VIEWPORT_MARGIN;
  const openAbove = spaceBelow < PALETTE_MIN_HEIGHT && spaceAbove > spaceBelow;
  const top = openAbove
    ? Math.max(VIEWPORT_MARGIN, rect.top - PALETTE_MIN_HEIGHT)
    : Math.min(rect.bottom + 8, viewportHeight - PALETTE_MIN_HEIGHT - VIEWPORT_MARGIN);

  const maxHeight = openAbove
    ? Math.max(220, rect.top - VIEWPORT_MARGIN - 8)
    : Math.max(220, viewportHeight - rect.bottom - VIEWPORT_MARGIN - 8);

  return {
    position: "fixed" as const,
    left,
    top,
    width: PALETTE_WIDTH,
    maxHeight,
  };
}

export function ColorInput({ value, onChange, label }: ColorInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<TextPaint>(normalizePaint(value));
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [gradientTarget, setGradientTarget] = useState<"from" | "to">("from");
  const [paletteStyle, setPaletteStyle] = useState<CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(wrapperRef, () => setIsOpen(false));

  useEffect(() => {
    setDraft(normalizePaint(value));
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const syncPalette = () => {
      setRecentColors(getRecentColors());
      setPaletteStyle(getPalettePosition(buttonRef.current));
    };

    syncPalette();
    window.addEventListener("resize", syncPalette);
    window.addEventListener("scroll", syncPalette, true);
    return () => {
      window.removeEventListener("resize", syncPalette);
      window.removeEventListener("scroll", syncPalette, true);
    };
  }, [isOpen]);

  const activeSolidColor = useMemo(() => {
    if (draft.mode === "solid") return draft.color;
    return gradientTarget === "from" ? draft.from : draft.to;
  }, [draft, gradientTarget]);

  const persistRecentColors = useCallback((paint: TextPaint) => {
    if (paint.mode === "solid") {
      addRecentColor(paint.color);
    } else {
      addRecentColor(paint.from);
      addRecentColor(paint.to);
    }

    setRecentColors(getRecentColors());
  }, []);

  const commitPaint = useCallback(
    (next: TextPaint, close = false) => {
      const normalized = normalizePaint(next);
      onChange(normalized);
      persistRecentColors(normalized);
      setDraft(normalized);
      if (close) setIsOpen(false);
    },
    [onChange, persistRecentColors],
  );

  const applyPresetColor = useCallback(
    (color: string) => {
      const normalized = normalizeHex(color);
      if (!normalized) return;

      if (draft.mode === "solid") {
        commitPaint({ mode: "solid", color: normalized }, true);
        return;
      }

      commitPaint(
        {
          ...draft,
          [gradientTarget]: normalized,
        },
        true,
      );
    },
    [commitPaint, draft, gradientTarget],
  );

  const applyDraftAndClose = useCallback(() => {
    if (draft.mode === "solid") {
      const normalized = normalizeHex(draft.color);
      if (!normalized) return;
      commitPaint({ mode: "solid", color: normalized }, true);
      return;
    }

    const from = normalizeHex(draft.from);
    const to = normalizeHex(draft.to);
    if (!from || !to) return;

    commitPaint(
      {
        mode: "gradient",
        from,
        to,
        direction: draft.direction,
      },
      true,
    );
  }, [commitPaint, draft]);

  const updateDraftColor = useCallback((next: string) => {
    setDraft((prev) =>
      prev.mode === "solid" ? { mode: "solid", color: next } : { ...prev, [gradientTarget]: next },
    );
  }, [gradientTarget]);

  const openPalette = () => {
    setPaletteStyle(getPalettePosition(buttonRef.current));
    setIsOpen((open) => !open);
  };

  return (
    <div ref={wrapperRef} className="relative flex min-w-48 items-center gap-2">
      <select
        aria-label={`${label} 모드`}
        value={draft.mode}
        onChange={(event) => {
          const mode = event.target.value as TextPaint["mode"];
          if (mode === "solid") {
            setDraft({ mode: "solid", color: activeSolidColor });
            return;
          }

          setDraft({
            mode: "gradient",
            from: value.mode === "gradient" ? value.from : activeSolidColor,
            to: value.mode === "gradient" ? value.to : "#ffffff",
            direction: value.mode === "gradient" ? value.direction : "horizontal",
          });
        }}
        className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm outline-none focus:border-zinc-950"
      >
        <option value="solid">단색</option>
        <option value="gradient">그라데이션</option>
      </select>

      <input
        aria-label={label}
        value={activeSolidColor}
        onChange={(event) => updateDraftColor(event.target.value)}
        className="h-9 w-28 rounded-md border border-zinc-300 bg-white px-2 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-950"
      />

      <button
        ref={buttonRef}
        type="button"
        aria-label={`${label} 팔레트 열기`}
        onClick={openPalette}
        className="h-7 w-7 rounded-md border border-zinc-300 transition hover:scale-110 hover:border-zinc-900"
        style={createPaintPreviewStyle(draft)}
      />

      {isOpen ? (
        <div
          className="z-50 overflow-y-auto rounded-md border border-zinc-200 bg-white p-4 text-zinc-950 shadow-xl"
          style={paletteStyle}
        >
          {draft.mode === "gradient" ? (
            <div className="mb-4 rounded-md border border-zinc-200 p-3">
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGradientTarget("from")}
                  className={`rounded-md px-2 py-1 text-xs font-bold ${gradientTarget === "from" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-700"}`}
                >
                  시작색
                </button>
                <button
                  type="button"
                  onClick={() => setGradientTarget("to")}
                  className={`rounded-md px-2 py-1 text-xs font-bold ${gradientTarget === "to" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-700"}`}
                >
                  끝색
                </button>
                <select
                  value={draft.direction}
                  onChange={(event) =>
                    setDraft((prev) =>
                      prev.mode === "gradient"
                        ? { ...prev, direction: event.target.value as GradientDirection }
                        : prev,
                    )
                  }
                  className="ml-auto h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs outline-none focus:border-zinc-950"
                >
                  <option value="horizontal">가로</option>
                  <option value="vertical">세로</option>
                </select>
              </div>
              <div className="h-10 rounded-md border border-zinc-200" style={createPaintPreviewStyle(draft)} />
            </div>
          ) : null}

          <PaletteSection title="최근 사용 색상">
            {recentColors.length ? (
              recentColors.map((color) => (
                <Swatch key={color} color={color} active={color === activeSolidColor} onClick={applyPresetColor} />
              ))
            ) : (
              <p className="text-xs text-zinc-500">아직 선택한 색상이 없습니다.</p>
            )}
          </PaletteSection>

          <PaletteSection title="프리셋 팔레트">
            <div className="grid grid-cols-10 gap-2">
              {PRESET_COLORS.map((color, index) => (
                <Swatch
                  key={`${color}-${index}`}
                  color={color}
                  active={color === activeSolidColor}
                  onClick={applyPresetColor}
                />
              ))}
            </div>
          </PaletteSection>

          <div className="mt-4 border-t border-zinc-200 pt-4">
            <p className="mb-2 text-xs font-bold text-zinc-600">직접 입력</p>
            <div className="flex items-center gap-2">
              <input
                value={activeSolidColor}
                onChange={(event) => updateDraftColor(event.target.value)}
                className="h-9 flex-1 rounded-md border border-zinc-300 px-2 font-mono text-sm outline-none focus:border-zinc-950"
              />
              <input
                type="color"
                value={normalizeHex(activeSolidColor) ?? "#ffffff"}
                onChange={(event) => updateDraftColor(event.target.value)}
                className="h-9 w-12 rounded-md border border-zinc-300 bg-white"
              />
              <button
                type="button"
                onClick={applyDraftAndClose}
                className="h-9 rounded-md bg-zinc-950 px-3 text-sm font-bold text-white"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PaletteSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-1">
      <p className="mb-2 text-xs font-bold text-zinc-600">{title}</p>
      <div className="mb-4 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Swatch({
  color,
  active,
  onClick,
}: {
  color: string;
  active: boolean;
  onClick: (color: string) => void;
}) {
  return (
    <button
      type="button"
      title={color}
      onClick={() => onClick(color)}
      className="relative h-[22px] w-[22px] rounded border border-zinc-300 transition hover:scale-[1.2] hover:border-zinc-950"
      style={{ backgroundColor: color }}
    >
      {active ? (
        <span className="absolute inset-0 grid place-items-center text-[10px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
          ✓
        </span>
      ) : null}
    </button>
  );
}
