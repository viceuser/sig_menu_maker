import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "리액션 메뉴판 생성기",
  description: "방송용 리액션 메뉴판을 관리하고 GIF와 PNG로 출력합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          // 페인트 전에 저장된 테마를 적용해 다크 사용자에게 라이트 화면이 번쩍이는 것을 막는다.
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("reaction_theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://unpkg.com/@kfonts/bm-hanna-pro/index.css" />
        <link rel="stylesheet" href="https://unpkg.com/@kfonts/bm-jua-otf/index.css" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
