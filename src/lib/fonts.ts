export const FONT_PRESETS = [
  {
    id: "jalnan2",
    label: "여기어때 잘난체",
    description: "강한 타이틀형",
    cssFamily: "'Jalnan2', 'Noto Sans KR', sans-serif",
  },
  {
    id: "jalnan-gothic",
    label: "여기어때 잘난체 고딕",
    description: "가독성 중심 고딕형",
    cssFamily: "'JalnanGothic', 'Noto Sans KR', sans-serif",
  },
] as const;

export type FontPresetId = (typeof FONT_PRESETS)[number]["id"];

export const DEFAULT_FONT_PRESET: FontPresetId = "jalnan2";

export function isFontPresetId(value: string): value is FontPresetId {
  return FONT_PRESETS.some((preset) => preset.id === value);
}

export function getFontPreset(id: string) {
  return FONT_PRESETS.find((preset) => preset.id === id) ?? FONT_PRESETS[0];
}
