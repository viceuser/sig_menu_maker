import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { DocsToc } from "@/components/DocsToc";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createReactionCsvExample } from "@/lib/csv";
import { SUPPORT_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Reaction Menu Maker 사용자 가이드",
  description:
    "리액션 메뉴판 생성기의 전체 기능, CSV 업로드, 배지 설정, 미리보기, GIF/PNG 저장 방법을 정리한 사용자 매뉴얼입니다.",
};

// 섹션 번호는 배열 순서에서 자동으로 계산된다. 섹션을 끼워 넣어도 번호를 손볼 필요가 없다.
const NAV_BASE: { id: string; label: string; numbered: boolean }[] = [
  { id: "quick-start", label: "빠른 시작", numbered: false },
  { id: "outputs", label: "출력 종류", numbered: false },
  { id: "settings", label: "출력 설정", numbered: true },
  { id: "detail-settings", label: "상세 설정", numbered: true },
  { id: "table", label: "테이블 편집", numbered: true },
  { id: "colors", label: "색상과 그라데이션", numbered: true },
  { id: "badges", label: "배지 설정", numbered: true },
  { id: "bulk", label: "일괄 적용", numbered: true },
  { id: "csv", label: "CSV 업로드 / 다운로드", numbered: true },
  { id: "preview", label: "미리보기와 저장", numbered: true },
  { id: "obs", label: "OBS 오버레이", numbered: true },
  { id: "storage", label: "저장 방식", numbered: true },
  { id: "faq", label: "자주 묻는 질문", numbered: true },
];

let sectionNumber = 0;
const NAV = NAV_BASE.map((item) =>
  item.numbered ? { id: item.id, label: `${++sectionNumber}. ${item.label}` } : { id: item.id, label: item.label },
);

const SECTION_TITLES = Object.fromEntries(NAV.map((item) => [item.id, item.label])) as Record<string, string>;

// 앱과 동일한 예시를 그대로 사용해 문서와 실제 다운로드 파일이 어긋나지 않게 한다.
const csvExample = createReactionCsvExample();

function Section({
  id,
  lead,
  children,
}: {
  id: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-t border-zinc-200 py-10 first:border-t-0 first:pt-0 dark:border-zinc-800"
    >
      <h2 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">{SECTION_TITLES[id]}</h2>
      {lead ? <p className="mt-2 text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">{lead}</p> : null}
      <div className="mt-5 space-y-4 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">{children}</div>
    </section>
  );
}

function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "tip";
  title?: string;
  children: ReactNode;
}) {
  const palette = {
    info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100",
    warn: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
    tip: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  }[tone];
  const icon = { info: "안내", warn: "주의", tip: "팁" }[tone];
  return (
    <div className={`rounded-md border px-4 py-3 text-sm leading-6 ${palette}`}>
      {title ? (
        <p className="mb-1 font-black">
          <span className="mr-2">{icon}</span>
          {title}
        </p>
      ) : null}
      <div>{children}</div>
    </div>
  );
}

function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <span className="text-[11px] font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</span>
      <div className="text-sm text-zinc-800 dark:text-zinc-200">{children}</div>
    </div>
  );
}

function BadgeSwatch({
  label,
  bg,
  fg = "#ffffff",
  shape = "pill",
  border,
  icon,
}: {
  label: string;
  bg: string;
  fg?: string;
  shape?: "pill" | "rect" | "outline" | "ribbon";
  border?: string;
  icon?: string;
}) {
  const shapeClass =
    shape === "pill"
      ? "rounded-full"
      : shape === "rect"
        ? "rounded-md"
        : shape === "outline"
          ? "rounded-full border-2 bg-transparent"
          : "rounded-r-md";
  const style: React.CSSProperties =
    shape === "outline"
      ? { color: bg, borderColor: bg }
      : { background: bg, color: fg, borderColor: border ?? "transparent" };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black leading-none ${shapeClass}`}
      style={style}
    >
      {icon ? <span>{icon}</span> : null}
      {label}
    </span>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-5 w-5 rounded border border-zinc-300 dark:border-zinc-700"
        style={{ background: color }}
        aria-hidden="true"
      />
      <code className="text-xs text-zinc-600 dark:text-zinc-400">{label}</code>
    </div>
  );
}

function GradientSwatch({ from, to, dir = "to right" }: { from: string; to: string; dir?: string }) {
  return (
    <div
      className="h-6 w-32 rounded border border-zinc-300 dark:border-zinc-700"
      style={{ background: `linear-gradient(${dir}, ${from}, ${to})` }}
      aria-label={`${from}에서 ${to}로 이어지는 그라데이션`}
    />
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-black text-white">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function FaqItem({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group rounded-md border border-zinc-200 bg-white p-4 open:shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <summary className="cursor-pointer list-none text-sm font-black text-zinc-950 marker:hidden dark:text-zinc-50">
        <span className="mr-2 inline-block transition-transform group-open:rotate-90">▶</span>
        {q}
      </summary>
      <div className="mt-3 pl-5 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{children}</div>
    </details>
  );
}

export default function DocsPage() {
  return (
    <main id="top" className="min-h-screen scroll-smooth bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-zinc-50/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-baseline gap-3">
            <p className="text-xs font-black uppercase tracking-wider text-accent">Docs</p>
            <h1 className="text-base font-black sm:text-lg">리액션 메뉴판 생성기 사용자 가이드</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="button-secondary h-9 px-3 text-xs">
              생성기로 돌아가기
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-10 max-w-3xl">
          <h2 className="text-3xl font-black sm:text-4xl">사용자 매뉴얼</h2>
          <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
            처음 써도 빠르게 익힐 수 있도록, 리액션 메뉴판 생성기의 핵심 기능과 실제 사용 순서를 한 번에 정리했습니다.
          </p>
        </div>

        <details className="mb-8 rounded-md border border-zinc-200 bg-white p-4 lg:hidden dark:border-zinc-800 dark:bg-zinc-900">
          <summary className="cursor-pointer text-sm font-black">문서 목차 펼치기</summary>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {NAV.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="block rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </details>

        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          <aside className="hidden lg:block">
            <DocsToc items={NAV} />
          </aside>

          <article className="min-w-0">
            <section
              id="quick-start"
              className="scroll-mt-24 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">시작</span>
                <h2 className="text-lg font-black">빠른 시작</h2>
              </div>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                <Step n={1}>
                  왼쪽 테이블에 <strong>count</strong>와 <strong>text</strong>를 입력합니다. count를 비우면 텍스트 전용
                  줄로 쓸 수 있습니다.
                </Step>
                <Step n={2}>
                  오른쪽 <strong>출력 설정</strong>에서 페이지 표시 개수, 전환 간격, 폰트, 슬라이더(폰트 크기·Stroke·간격·행
                  높이)를 조절합니다. 바꾸는 즉시 위의 <strong>실시간 미리보기</strong>에 반영됩니다.
                </Step>
                <Step n={3}>
                  색상, 배지, 정렬을 다듬고 필요하면 <strong>일괄 적용</strong>으로 여러 줄에 한 번에 반영합니다.
                </Step>
                <Step n={4}>
                  <strong>새 창 미리보기</strong>로 결과를 확인한 뒤, 미리보기 창에서 <strong>GIF 저장</strong> 또는{" "}
                  <strong>PNG 저장</strong>을 누릅니다.
                </Step>
              </ol>
              <div className="mt-4">
                <Callout tone="tip" title="자동 저장">
                  모든 변경은 자동으로 저장됩니다. 화면 상단의 <strong>자동 저장됨</strong> 표시로 저장 상태를 확인할 수
                  있고, 별도의 저장 버튼은 없습니다.
                </Callout>
              </div>
              <figure className="mt-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/docs/editor-overview.png"
                  alt="편집 화면: 왼쪽에 리액션 테이블, 오른쪽에 실시간 미리보기와 출력 설정 사이드바"
                  className="w-full rounded-md border border-zinc-200 dark:border-zinc-800"
                />
                <figcaption className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  편집 화면 — 왼쪽에서 항목을 편집하고, 오른쪽 실시간 미리보기와 출력 설정으로 결과를 바로 확인합니다.
                </figcaption>
              </figure>
            </section>

            <Section
              id="outputs"
              lead="이 서비스는 방송용 메뉴판 작업에 맞춰 세 가지 결과물을 제공합니다."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <KeyValue label="GIF">페이지 단위로 넘어가는 애니메이션 메뉴판입니다. 배경은 투명하게 저장됩니다.</KeyValue>
                <KeyValue label="PNG 전체 저장">전체 리스트를 컬럼 형태로 한 장에 정리해서 저장합니다.</KeyValue>
                <KeyValue label="새 창 미리보기">실제 출력에 가까운 상태를 바로 확인하는 테스트 창입니다.</KeyValue>
              </div>
              <p>
                편집 화면 오른쪽에는 <strong>실시간 미리보기</strong>가 항상 함께 표시되어, 저장 전에 결과를 바로 확인할 수
                있습니다.
              </p>
            </Section>

            <Section
              id="settings"
              lead="편집 화면 오른쪽 사이드바에서 메뉴판 전체 분위기와 출력 규칙을 정합니다."
            >
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>페이지 표시 개수</strong>: 한 페이지에 몇 줄을 보여줄지 정합니다.
                </li>
                <li>
                  <strong>전환 간격(초)</strong>: GIF와 미리보기에서 다음 페이지로 넘어가는 시간을 정합니다.
                </li>
                <li>
                  <strong>출력 폰트</strong>: 숫자와 텍스트에 함께 적용됩니다.
                </li>
                <li>
                  <strong>정렬</strong>: 1번은 왼쪽 정렬, 2번은 오른쪽 정렬입니다.
                </li>
                <li>
                  <strong>글자 효과</strong>: 없음, 그림자, 네온 글로우, 이중 외곽선, 입체 그림자 중 하나를 선택할 수
                  있으며 숫자와 리액션 텍스트에 함께 적용됩니다.
                </li>
                <li>
                  <strong>폰트 크기 / Stroke / 기본 간격 / 행 높이</strong>: 슬라이더로 조절하며, 실시간 미리보기로 결과를
                  보면서 맞추면 됩니다.
                </li>
              </ul>
              <Callout tone="info" title="설정 저장 위치">
                설정은 서버가 아니라 현재 브라우저의 localStorage에 자동 저장됩니다.
              </Callout>
            </Section>

            <Section
              id="detail-settings"
              lead="기본값만으로 부족할 때만 만지는 세부 조정 영역입니다."
            >
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>최소 간격 / 최대 간격</strong>: 숫자와 텍스트 사이 자동 간격이 움직일 수 있는 범위입니다.
                </li>
                <li>
                  <strong>상하 여백</strong>: 페이지 위아래 여백을 조절합니다.
                </li>
              </ul>
              <Callout tone="warn">
                정렬이 이미 만족스럽다면 상세 설정은 건드리지 않는 편이 더 편합니다.
              </Callout>
            </Section>

            <Section
              id="table"
              lead="실제 리액션 항목을 넣고 다듬는 작업 영역입니다. 상단 작업 도구는 목록을 내려도 화면에 고정됩니다."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <KeyValue label="+ 추가">빈 행을 추가합니다. 행을 선택한 상태라면 그 아래에 추가됩니다.</KeyValue>
                <KeyValue label="가운데 문구 추가">
                  count와 text 영역을 함께 차지하는 가운데 정렬 문구 행을 추가합니다. 구분선이나 안내 문구에 좋습니다.
                </KeyValue>
                <KeyValue label="삭제">체크한 행만 지웁니다.</KeyValue>
                <KeyValue label="선택 복제">체크한 행의 텍스트, 색상, 배지를 그대로 복제해 바로 아래에 추가합니다.</KeyValue>
                <KeyValue label="드래그">왼쪽 핸들로 순서를 바꿀 수 있습니다.</KeyValue>
                <KeyValue label="검색">개수, 리액션 텍스트, 배지 이름으로 원하는 행만 빠르게 찾습니다.</KeyValue>
                <KeyValue label="실행 취소 / 다시 실행">
                  삭제, 복제, CSV 교체, 일괄 적용, 순서 변경을 버튼이나 Ctrl+Z / Ctrl+Shift+Z로 되돌립니다.
                </KeyValue>
              </div>
              <Callout tone="tip" title="텍스트 전용 줄">
                count를 비우고 text만 넣으면 소제목이나 안내 문구처럼 사용할 수 있습니다. 완전한 가운데 정렬이 필요하면{" "}
                <strong>가운데 문구 추가</strong>를 사용하세요.
              </Callout>
            </Section>

            <Section
              id="colors"
              lead="숫자와 텍스트는 각각 단색 또는 그라데이션으로 설정할 수 있습니다."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-xs font-black uppercase text-zinc-500">단색 예시</p>
                  <ColorSwatch label="#f97671" color="#f97671" />
                  <ColorSwatch label="#ffffff" color="#ffffff" />
                  <ColorSwatch label="#1e293b" color="#1e293b" />
                </div>
                <div className="space-y-2 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-xs font-black uppercase text-zinc-500">그라데이션 예시</p>
                  <GradientSwatch from="#06b6d4" to="#8b5cf6" />
                  <GradientSwatch from="#fbbf24" to="#ef4444" />
                  <GradientSwatch from="#22c55e" to="#0ea5e9" dir="to bottom" />
                </div>
              </div>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>숫자</strong>는 세로 그라데이션이 잘 보이는 편입니다.
                </li>
                <li>
                  <strong>리액션 텍스트</strong>는 가로 그라데이션이 자연스럽습니다.
                </li>
                <li>
                  <strong>최근 사용 색상</strong>과 기본 팔레트를 함께 쓸 수 있습니다.
                </li>
              </ul>
            </Section>

            <Section
              id="badges"
              lead="각 행의 Badge Setting 버튼에서 배지를 켜고, 템플릿을 불러오고, 직접 편집할 수 있습니다."
            >
              <div className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="mb-3 text-xs font-black uppercase text-zinc-500">배지 예시</p>
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeSwatch label="NEW" bg="#ef4444" />
                  <BadgeSwatch label="HOT" bg="#f97316" />
                  <BadgeSwatch label="EVENT" bg="#8b5cf6" />
                  <BadgeSwatch label="SALE" bg="#3b82f6" shape="rect" />
                  <BadgeSwatch label="LIVE" bg="#ef4444" shape="outline" />
                  <BadgeSwatch label="1ST" bg="#fbbf24" fg="#1e293b" shape="ribbon" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <KeyValue label="템플릿">NEW, HOT, 1+1, EVENT, Outline, Ribbon 같은 기본형을 바로 불러올 수 있습니다.</KeyValue>
                <KeyValue label="CUSTOM">라벨, 아이콘, 색상, 테두리, 모양, 크기를 직접 바꿀 수 있습니다.</KeyValue>
                <KeyValue label="Shape">pill, rectangle, outline, ribbon 형태를 지원합니다.</KeyValue>
                <KeyValue label="Preview">설정 창 안에서 배지가 어떻게 보일지 바로 확인할 수 있습니다.</KeyValue>
              </div>
            </Section>

            <Section
              id="bulk"
              lead="상단 고정 작업 도구에서 일괄 적용을 펼치면 여러 줄에 같은 스타일을 빠르게 넣을 수 있습니다."
            >
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>개수 색상 적용</strong>, <strong>텍스트 색상 적용</strong>, <strong>둘 다 적용</strong>을 지원합니다.
                </li>
                <li>
                  <strong>배지 적용</strong>으로 같은 배지를 여러 줄에 한 번에 복사할 수 있습니다.
                </li>
                <li>
                  체크된 행이 있으면 선택 항목에만, 없으면 전체 항목에 적용됩니다.
                </li>
                <li>
                  아래 색상 템플릿 버튼으로 기본 방송형, 핑크, 민트, 골드, 스카이, 방송 블루, 선셋, 퍼플 네온 조합을
                  바로 넣을 수 있습니다.
                </li>
              </ul>
            </Section>

            <Section
              id="csv"
              lead="화면 상단에서 CSV 형식으로 전체 목록을 한 번에 업로드하거나 내려받을 수 있습니다."
            >
              <div className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
                <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
                  <span className="text-xs font-black uppercase text-zinc-400">예시</span>
                  <span className="text-[10px] text-zinc-500">count는 비워둘 수 있음</span>
                </div>
                <pre className="overflow-x-auto px-4 py-3 font-mono text-xs leading-6 text-zinc-100">{csvExample}</pre>
              </div>

              <ul className="list-disc space-y-2 pl-5">
                <li>
                  CSV 버튼은 테이블 위 행 도구에 있으며, <strong>CSV 형식과 예시 보기</strong>를 펼치면 입력 형식을 바로
                  확인할 수 있습니다.
                </li>
                <li>
                  <strong>CSV 업로드</strong>는 현재 목록을 지우고 CSV 내용으로 전체 교체합니다. 기존 목록이 있으면 교체
                  전에 확인 창이 뜹니다.
                </li>
                <li>
                  <strong>현재 목록 CSV 다운로드</strong>는 작업 중인 목록을 그대로 파일로 내려받습니다.
                </li>
                <li>
                  <strong>예시 CSV 다운로드</strong>로 형식을 먼저 받아본 뒤 수정해서 올리면 가장 안전합니다.
                </li>
                <li>
                  헤더 <code>count,text</code>는 있어도 되고 없어도 됩니다.
                </li>
              </ul>

              <Callout tone="warn" title="CSV에 담기는 것">
                CSV에는 <strong>count와 text만</strong> 담깁니다. 색상, 그라데이션, 배지, 가운데 문구 여부는 CSV로
                내보내거나 불러올 수 없으니, 스타일은 업로드 후 다시 적용해야 합니다.
              </Callout>

              <Callout tone="warn" title="업로드가 안 될 때">
                <ul className="list-disc space-y-1 pl-5">
                  <li>확장자가 진짜 CSV인지 확인해 주세요. xlsx는 바로 읽지 못합니다.</li>
                  <li>구분자가 쉼표인지 확인해 주세요.</li>
                  <li>text 칸이 비어 있는 줄은 형식 오류가 날 수 있습니다.</li>
                  <li>한글이 깨지면 UTF-8 CSV로 다시 저장해 보세요.</li>
                </ul>
              </Callout>
            </Section>

            <Section
              id="preview"
              lead="실시간 미리보기로 보면서 다듬고, 최종 저장은 새 창 미리보기에서 합니다."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <KeyValue label="실시간 미리보기">편집 화면 오른쪽에 항상 표시되는 미리보기입니다. 변경 즉시 갱신됩니다.</KeyValue>
                <KeyValue label="100% / 150% / 200%">작은 그라데이션, 외곽선, 글자 효과를 확대해서 확인합니다.</KeyValue>
                <KeyValue label="배경 테스트">투명 격자, 검정, 흰색 배경에서 실제 가독성을 비교합니다.</KeyValue>
                <KeyValue label="새 창 미리보기">현재 설정 기준으로 페이지 슬라이드쇼를 보여줍니다.</KeyValue>
                <KeyValue label="GIF / PNG 저장">새 창 미리보기 하단 버튼에서 투명 배경 GIF 또는 컬럼형 PNG를 저장합니다.</KeyValue>
              </div>
              <Callout tone="tip">
                실시간 미리보기는 편집용, 새 창 미리보기는 검수·저장용입니다.
              </Callout>
            </Section>

            <Section
              id="obs"
              lead="현재 메뉴를 투명한 웹 오버레이로 만들어 OBS 브라우저 소스에 넣을 수 있습니다."
            >
              <ol className="list-decimal space-y-2 pl-5">
                <li>오른쪽 미리보기 아래에서 <strong>OBS 오버레이 링크 복사</strong>를 누릅니다.</li>
                <li>OBS의 소스 추가에서 <strong>브라우저</strong>를 선택합니다.</li>
                <li>복사한 주소를 URL에 붙여 넣고 원하는 너비와 높이를 설정합니다.</li>
                <li>배경은 투명하게 유지되며, 여러 페이지는 설정한 전환 간격에 따라 반복됩니다.</li>
              </ol>
              <Callout tone="warn" title="메뉴를 수정했을 때">
                오버레이 데이터는 복사한 주소 안에 들어 있습니다. 항목이나 출력 설정을 바꾼 뒤에는 링크를 다시 복사해 OBS
                브라우저 소스의 URL을 교체해 주세요.
              </Callout>
            </Section>

            <Section
              id="storage"
              lead="이 서비스는 서버 저장형이 아니라 브라우저 저장형입니다."
            >
              <p>
                항목 목록, 출력 설정, 상세 설정, 최근 사용 색상, 미리보기용 임시 데이터는 모두 현재 브라우저의
                localStorage에 <strong>자동 저장</strong>됩니다. 같은 PC와 같은 브라우저에서는 유지되지만, 다른 브라우저나
                다른 PC에서는 자동으로 이어지지 않습니다.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <KeyValue label="저장되는 것">항목 목록, 폰트, 간격, 정렬, 최근 색상, 미리보기 데이터</KeyValue>
                <KeyValue label="옮기는 방법">
                  CSV 다운로드 후 다른 환경에서 다시 업로드하면 목록(count/text)을 옮길 수 있습니다. 색상과 배지는 함께
                  옮겨지지 않습니다.
                </KeyValue>
              </div>
            </Section>

            <Section id="faq">
              <div className="space-y-3">
                <FaqItem q="저장 버튼이 없는데 저장은 어떻게 되나요?">
                  모든 변경은 자동으로 현재 브라우저의 localStorage에 저장됩니다. 화면 상단의 <strong>자동 저장됨</strong>{" "}
                  표시로 상태를 확인할 수 있습니다. 서버 저장은 아닙니다.
                </FaqItem>
                <FaqItem q="count 없이 text만 입력해도 되나요?">
                  됩니다. 구분선, 소제목, 안내 문구처럼 쓸 때 유용합니다. 완전한 가운데 정렬이 필요하면 가운데 문구 추가를
                  사용하세요.
                </FaqItem>
                <FaqItem q="CSV 업로드가 실패해요.">
                  CSV인지, 쉼표 구분인지, text 칸이 비어 있지 않은지 먼저 확인해 주세요. 가장 쉬운 방법은 예시 CSV를
                  내려받아 같은 형식으로 맞추는 것입니다.
                </FaqItem>
                <FaqItem q="다른 PC에서도 같은 설정을 쓰고 싶어요.">
                  현재는 브라우저 저장 방식이라 자동 동기화는 없습니다. 목록(count/text)은 CSV로 옮길 수 있지만, 색상과
                  배지 스타일은 함께 옮겨지지 않아 다시 적용해야 합니다.
                </FaqItem>
                <FaqItem q="GIF와 PNG는 언제 생성되나요?">
                  새 창 미리보기 안에서 저장 버튼을 눌렀을 때 생성됩니다.
                </FaqItem>
                <FaqItem q="OBS 오버레이가 수정 전 상태로 보여요.">
                  메뉴 수정 후 OBS 오버레이 링크를 다시 복사하고, OBS 브라우저 소스의 URL을 새 주소로 교체해 주세요.
                </FaqItem>
              </div>
            </Section>

            <div className="mt-12 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              문의나 기능 제안은{" "}
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-accent underline underline-offset-2 hover:text-accent-strong"
              >
                문의 페이지
              </a>
              로 쪽지를 보내 주세요.
            </div>
          </article>
        </div>
      </div>

      <a
        href="#top"
        aria-label="맨 위로"
        className="fixed bottom-6 right-6 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-lg font-black text-zinc-700 shadow-lg transition hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-300 dark:hover:text-zinc-50"
      >
        ↑
      </a>
    </main>
  );
}
