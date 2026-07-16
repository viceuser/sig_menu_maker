"use client";

import { useEffect, useState } from "react";

export function DocsToc({ items }: { items: { id: string; label: string }[] }) {
  // 옵저버가 아직 안 붙었거나 페이지 최상단일 때도 목차가 비어 보이지 않게 첫 섹션을 기본값으로 둔다.
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // 화면 상단 20%~30% 지점을 지나는 섹션을 현재 위치로 본다.
      { rootMargin: "-20% 0px -70% 0px" },
    );

    for (const { id } of items) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 text-sm">
      <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">목차</p>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "true" : undefined}
                className={[
                  "block rounded-md border-l-2 px-3 py-1.5 transition",
                  isActive
                    ? "border-accent bg-white font-bold text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50"
                    : "border-transparent text-zinc-600 hover:border-accent hover:bg-white hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
                ].join(" ")}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
