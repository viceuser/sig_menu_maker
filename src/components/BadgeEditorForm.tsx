"use client";

import type { CSSProperties } from "react";
import { createCustomBadge, createPresetBadge, cloneBadgeConfig } from "@/lib/badges";
import { normalizeHex } from "@/lib/recentColors";
import type { BadgeConfig, BadgeShape, BadgeSize, BadgeStyleTone, TextPaint } from "@/lib/types";
import { ColorInput } from "./ColorInput";

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type BadgeTemplate = {
  id: string;
  label: string;
  create: () => BadgeConfig;
};

const SHAPE_OPTIONS: SelectOption<BadgeShape>[] = [
  { value: "pill", label: "pill" },
  { value: "rectangle", label: "rectangle" },
  { value: "outline", label: "outline" },
  { value: "ribbon", label: "ribbon" },
];

const SIZE_OPTIONS: SelectOption<BadgeSize>[] = [
  { value: "sm", label: "small" },
  { value: "md", label: "medium" },
  { value: "lg", label: "large" },
];

const TONE_OPTIONS: SelectOption<BadgeStyleTone>[] = [
  { value: "normal", label: "normal" },
  { value: "neon", label: "neon glow" },
  { value: "retro", label: "retro 8-bit" },
];

const BADGE_TEMPLATES: BadgeTemplate[] = [
  { id: "new", label: "NEW", create: () => createPresetBadge("new") },
  { id: "hot", label: "HOT", create: () => createPresetBadge("hot") },
  {
    id: "one-plus-one",
    label: "1+1",
    create: () => ({
      ...createCustomBadge(),
      label: "1+1",
      icon: "",
      fill: { mode: "gradient", from: "#fff59d", to: "#ff8f00", direction: "horizontal" },
      textColor: "#ffffff",
      borderColor: "#ff8f00",
    }),
  },
  {
    id: "event",
    label: "EVENT",
    create: () => ({ ...createCustomBadge(), icon: "" }),
  },
  {
    id: "solid-new",
    label: "Solid NEW",
    create: () => ({
      ...createCustomBadge(),
      label: "NEW",
      icon: "",
      fill: { mode: "solid", color: "#ef4444" },
      textColor: "#ffffff",
      borderColor: "#ef4444",
    }),
  },
  {
    id: "solid-hot",
    label: "Solid HOT",
    create: () => ({
      ...createCustomBadge(),
      label: "HOT",
      icon: "",
      fill: { mode: "solid", color: "#f97316" },
      textColor: "#ffffff",
      borderColor: "#f97316",
    }),
  },
  {
    id: "gradient-hot",
    label: "Gradient HOT",
    create: () => ({
      ...createCustomBadge(),
      label: "HOT",
      icon: "",
      fill: { mode: "gradient", from: "#ef4444", to: "#fbbf24", direction: "horizontal" },
      textColor: "#ffffff",
      borderColor: "#ef4444",
    }),
  },
  {
    id: "gradient-new",
    label: "Gradient NEW",
    create: () => ({
      ...createCustomBadge(),
      label: "NEW",
      icon: "",
      fill: { mode: "gradient", from: "#06b6d4", to: "#8b5cf6", direction: "horizontal" },
      textColor: "#ffffff",
      borderColor: "#06b6d4",
    }),
  },
  {
    id: "gradient-event",
    label: "Gradient EVENT",
    create: () => ({
      ...createCustomBadge(),
      label: "EVENT",
      icon: "",
      fill: { mode: "gradient", from: "#ec4899", to: "#8b5cf6", direction: "horizontal" },
      textColor: "#ffffff",
      borderColor: "#ec4899",
    }),
  },
  {
    id: "outline-only",
    label: "Outline Only",
    create: () => ({
      ...createCustomBadge(),
      label: "MINI",
      icon: "",
      fill: { mode: "solid", color: "#ffffff" },
      textColor: "#3b82f6",
      borderColor: "#3b82f6",
      shape: "outline",
    }),
  },
  {
    id: "ribbon-best",
    label: "Ribbon BEST",
    create: () => ({
      ...createCustomBadge(),
      label: "BEST",
      icon: "★",
      fill: { mode: "solid", color: "#f59e0b" },
      textColor: "#ffffff",
      borderColor: "#d97706",
      shape: "ribbon",
    }),
  },
  {
    id: "neon-on-air",
    label: "Neon ON AIR",
    create: () => ({
      ...createCustomBadge(),
      label: "ON AIR",
      icon: "🔴",
      fill: { mode: "solid", color: "#7f1d1d" },
      textColor: "#fef2f2",
      borderColor: "#ef4444",
      tone: "neon",
    }),
  },
  {
    id: "retro-first",
    label: "Retro 1ST",
    create: () => ({
      ...createCustomBadge(),
      label: "1ST",
      icon: "",
      fill: { mode: "solid", color: "#fde047" },
      textColor: "#111111",
      borderColor: "#111111",
      shape: "rectangle",
      tone: "retro",
    }),
  },
];

function SelectField<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function createPaintPreviewStyle(paint: TextPaint): CSSProperties {
  if (paint.mode === "solid") {
    return { backgroundColor: paint.color };
  }

  return {
    backgroundImage: `linear-gradient(${paint.direction === "vertical" ? "180deg" : "90deg"}, ${paint.from}, ${paint.to})`,
  };
}

function getPreviewMetrics(size: BadgeSize) {
  if (size === "sm") return { fontSize: 11, height: 20, paddingX: 7 };
  if (size === "lg") return { fontSize: 15, height: 28, paddingX: 11 };
  return { fontSize: 13, height: 24, paddingX: 9 };
}

function BadgePreview({ badge }: { badge: BadgeConfig }) {
  const metrics = getPreviewMetrics(badge.size);
  const backgroundStyle =
    badge.shape === "outline" ? { backgroundColor: "transparent" } : createPaintPreviewStyle(badge.fill);
  const previewShadow =
    badge.tone === "neon"
      ? `0 0 8px ${badge.borderColor}`
      : badge.tone === "retro"
        ? "2px 2px 0 #000000"
        : "0 1px 2px rgba(0,0,0,0.18)";

  return (
    <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950">
      <p className="mb-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">Preview</p>
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center whitespace-nowrap font-black shadow-sm"
          style={{
            ...backgroundStyle,
            color: badge.textColor,
            border: `1.5px solid ${badge.borderColor}`,
            fontSize: `${metrics.fontSize}px`,
            minHeight: `${metrics.height}px`,
            paddingInline: `${metrics.paddingX}px`,
            borderRadius:
              badge.shape === "pill"
                ? "999px"
                : badge.shape === "rectangle"
                  ? "4px"
                  : badge.shape === "outline"
                    ? "6px"
                    : "2px 10px 10px 2px",
            clipPath:
              badge.shape === "ribbon"
                ? "polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%)"
                : undefined,
            boxShadow: previewShadow,
            fontFamily: badge.tone === "retro" ? 'ui-monospace, "Noto Sans KR", monospace' : undefined,
            letterSpacing: badge.tone === "retro" ? "0.02em" : undefined,
          }}
        >
          {(badge.icon.trim() ? `${badge.icon.trim()} ` : "") + badge.label}
        </span>
      </div>
    </div>
  );
}

function HexColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const normalized = normalizeHex(value) ?? "#ffffff";

  return (
    <div className="space-y-1 text-xs font-bold text-zinc-600 dark:text-zinc-300">
      <p>{label}</p>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 min-w-0 flex-1 rounded-md border border-zinc-300 px-2 font-mono text-sm outline-none focus:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300"
        />
        <input
          type="color"
          value={normalized}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-12 rounded-md border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
    </div>
  );
}

export function normalizeWorkingBadge(source: BadgeConfig | null): BadgeConfig {
  return source ? cloneBadgeConfig(source) : createCustomBadge();
}

export function BadgeEditorForm({
  enabled,
  value,
  onEnabledChange,
  onChange,
  onCancel,
  onApply,
}: {
  enabled: boolean;
  value: BadgeConfig;
  onEnabledChange: (enabled: boolean) => void;
  onChange: (badge: BadgeConfig) => void;
  onCancel?: () => void;
  onApply?: () => void;
}) {
  const applyTemplate = (templateId: string) => {
    const template = BADGE_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    onEnabledChange(true);
    onChange(template.create());
  };

  return (
    <div className="space-y-4">
      <section className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-black">Custom Badge</p>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Custom badge on/off"
            onClick={() => onEnabledChange(!enabled)}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs font-bold text-zinc-700 transition hover:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-300"
          >
            <span
              className={[
                "relative h-5 w-9 rounded-full transition",
                enabled ? "bg-zinc-950 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-700",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition dark:bg-zinc-950",
                  enabled ? "left-4" : "left-0.5",
                ].join(" ")}
              />
            </span>
            <span>{enabled ? "On" : "Off"}</span>
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">Templates</p>
          <div className="flex flex-wrap gap-2">
            {BADGE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template.id)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-300"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        {enabled ? (
          <div className="space-y-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Label
                <input
                  value={value.label}
                  onChange={(event) => onChange({ ...value, label: event.target.value })}
                  className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300"
                />
              </label>
              <label className="space-y-1 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Icon
                <input
                  value={value.icon}
                  onChange={(event) => onChange({ ...value, icon: event.target.value })}
                  className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm outline-none focus:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Shape
                <SelectField value={value.shape} onChange={(shape) => onChange({ ...value, shape })} options={SHAPE_OPTIONS} />
              </label>
              <label className="space-y-1 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Size
                <SelectField value={value.size} onChange={(size) => onChange({ ...value, size })} options={SIZE_OPTIONS} />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Tone
                <SelectField value={value.tone} onChange={(tone) => onChange({ ...value, tone })} options={TONE_OPTIONS} />
              </label>
              <div />
            </div>

            <BadgePreview badge={value} />

            <div className="space-y-1 text-xs font-bold text-zinc-600 dark:text-zinc-300">
              Fill
              <ColorInput label="Custom badge fill" value={value.fill} onChange={(fill) => onChange({ ...value, fill })} />
            </div>

            <HexColorField label="Text Color" value={value.textColor} onChange={(textColor) => onChange({ ...value, textColor })} />

            <HexColorField
              label="Border Color"
              value={value.borderColor}
              onChange={(borderColor) => onChange({ ...value, borderColor })}
            />
          </div>
        ) : null}
      </section>

      {onApply || onCancel ? (
        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Cancel
            </button>
          ) : null}
          {onApply ? (
            <button
              type="button"
              onClick={onApply}
              className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-950"
            >
              Apply
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
