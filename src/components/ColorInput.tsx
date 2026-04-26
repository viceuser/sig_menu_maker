"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { addRecentColor, getRecentColors, normalizeHex } from "@/lib/recentColors";

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

interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function ColorInput({ value, onChange, label }: ColorInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [alignRight, setAlignRight] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(wrapperRef, () => setIsOpen(false));

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isOpen) setRecentColors(getRecentColors());
  }, [isOpen]);

  const commitColor = useCallback(
    (color: string) => {
      const normalized = normalizeHex(color);
      if (!normalized) return;

      onChange(normalized);
      addRecentColor(normalized);
      setRecentColors(getRecentColors());
      setIsOpen(false);
    },
    [onChange],
  );

  const openPalette = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    setAlignRight(Boolean(rect && rect.right + 320 > window.innerWidth));
    setIsOpen((open) => !open);
  };

  const activeColor = normalizeHex(draft) ?? value;

  return (
    <div ref={wrapperRef} className="relative flex min-w-36 items-center gap-2">
      <input
        aria-label={label}
        value={draft}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          const normalized = normalizeHex(next);
          if (normalized) onChange(normalized);
        }}
        onBlur={() => {
          const normalized = normalizeHex(draft);
          if (normalized) addRecentColor(normalized);
          else setDraft(value);
        }}
        className="h-9 w-28 rounded-md border border-zinc-300 bg-white px-2 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-950"
      />
      <button
        ref={buttonRef}
        type="button"
        aria-label={`${label} 팔레트 열기`}
        onClick={openPalette}
        className="h-7 w-7 rounded-md border border-zinc-300 transition hover:scale-110 hover:border-zinc-900"
        style={{ backgroundColor: activeColor }}
      />
      {isOpen ? (
        <div
          className={[
            "absolute top-11 z-40 w-80 rounded-md border border-zinc-200 bg-white p-4 text-zinc-950 shadow-xl",
            alignRight ? "right-0" : "left-0",
          ].join(" ")}
        >
          <PaletteSection title="최근 사용 색상">
            {recentColors.length ? (
              recentColors.map((color) => (
                <Swatch key={color} color={color} active={color === activeColor} onClick={commitColor} />
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
                  active={color === activeColor}
                  onClick={commitColor}
                />
              ))}
            </div>
          </PaletteSection>

          <div className="mt-4 border-t border-zinc-200 pt-4">
            <p className="mb-2 text-xs font-bold text-zinc-600">직접 입력</p>
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="h-9 flex-1 rounded-md border border-zinc-300 px-2 font-mono text-sm outline-none focus:border-zinc-950"
              />
              <input
                type="color"
                value={activeColor}
                onChange={(event) => {
                  setDraft(event.target.value);
                  commitColor(event.target.value);
                }}
                className="h-9 w-12 rounded-md border border-zinc-300 bg-white"
              />
              <button
                type="button"
                onClick={() => commitColor(draft)}
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

function PaletteSection({ title, children }: { title: string; children: React.ReactNode }) {
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
        <span className="absolute inset-0 grid place-items-center text-xs font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
          ✓
        </span>
      ) : null}
    </button>
  );
}
