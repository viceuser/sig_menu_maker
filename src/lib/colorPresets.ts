import type { TextPaint } from "./types";

export interface PaintPreset {
  id: string;
  label: string;
  paint: TextPaint;
}

export interface StylePreset {
  id: string;
  label: string;
  countColor: TextPaint;
  textColor: TextPaint;
}

export const PAINT_PRESETS: PaintPreset[] = [
  { id: "solid-coral", label: "코랄", paint: { mode: "solid", color: "#f97671" } },
  { id: "solid-white", label: "화이트", paint: { mode: "solid", color: "#ffffff" } },
  { id: "solid-mint", label: "민트", paint: { mode: "solid", color: "#44d7b6" } },
  { id: "solid-gold", label: "골드", paint: { mode: "solid", color: "#ffd700" } },
  { id: "grad-pink", label: "핑크", paint: { mode: "gradient", from: "#ff8abf", to: "#ff4fd8", direction: "horizontal" } },
  { id: "grad-sky", label: "하늘", paint: { mode: "gradient", from: "#7fd8ff", to: "#2979ff", direction: "horizontal" } },
  { id: "grad-lime", label: "라임", paint: { mode: "gradient", from: "#f8ff7a", to: "#00c853", direction: "vertical" } },
  { id: "grad-violet", label: "보라", paint: { mode: "gradient", from: "#d6a4ff", to: "#7c4dff", direction: "horizontal" } },
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "broadcast-default",
    label: "기본 방송형",
    countColor: { mode: "solid", color: "#f97671" },
    textColor: { mode: "solid", color: "#ffffff" },
  },
  {
    id: "pink-pop",
    label: "핑크 팝",
    countColor: { mode: "gradient", from: "#ffd2f0", to: "#ff6cc2", direction: "vertical" },
    textColor: { mode: "solid", color: "#ffffff" },
  },
  {
    id: "mint-fresh",
    label: "민트 프레시",
    countColor: { mode: "gradient", from: "#d8fff1", to: "#00c9a7", direction: "vertical" },
    textColor: { mode: "solid", color: "#ffffff" },
  },
  {
    id: "gold-stage",
    label: "골드 스테이지",
    countColor: { mode: "gradient", from: "#fff3a8", to: "#ffb800", direction: "vertical" },
    textColor: { mode: "solid", color: "#fff8dd" },
  },
  {
    id: "sky-neon",
    label: "스카이 네온",
    countColor: { mode: "gradient", from: "#d9f2ff", to: "#5ac8fa", direction: "horizontal" },
    textColor: { mode: "gradient", from: "#ffffff", to: "#8be9ff", direction: "horizontal" },
  },
];
