"use client";

interface BadgeToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function BadgeToggle({ label, checked, onChange }: BadgeToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={[
        "inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-bold leading-none transition",
        checked
          ? "border-transparent bg-zinc-950 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
