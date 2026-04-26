"use client";

const TRANSPARENT_GIF_COLOR = 0xff00ff;
const TRANSPARENT_GIF_RGB = { r: 255, g: 0, b: 255 };

declare global {
  interface Window {
    GIF?: new (options: {
      workers: number;
      quality: number;
      width: number;
      height: number;
      workerScript: string;
      transparent?: number;
    }) => {
      addFrame: (
        image: CanvasRenderingContext2D,
        options: { delay: number; copy: true },
      ) => void;
      on: (event: "finished", callback: (blob: Blob) => void) => void;
      render: () => void;
    };
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`${src} 로드에 실패했습니다.`));
    document.body.appendChild(script);
  });
}

async function imageFromDataUrl(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("프레임 이미지를 불러오지 못했습니다."));
    image.src = src;
  });
}

function makeTransparentGifFrame(image: HTMLImageElement, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 컨텍스트를 만들 수 없습니다.");

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0);

  const frame = ctx.getImageData(0, 0, width, height);
  for (let index = 0; index < frame.data.length; index += 4) {
    if (frame.data[index + 3] === 0) {
      frame.data[index] = TRANSPARENT_GIF_RGB.r;
      frame.data[index + 1] = TRANSPARENT_GIF_RGB.g;
      frame.data[index + 2] = TRANSPARENT_GIF_RGB.b;
      frame.data[index + 3] = 255;
    }
  }
  ctx.putImageData(frame, 0, 0);

  return ctx;
}

export async function exportGifFromDataUrls(
  pages: string[],
  fadeInterval: number,
  width: number,
  height: number,
) {
  await loadScript("/gif.js");

  if (!window.GIF) {
    throw new Error("GIF 라이브러리를 사용할 수 없습니다.");
  }

  const gif = new window.GIF({
    workers: 2,
    quality: 10,
    width,
    height,
    workerScript: "/gif.worker.js",
    transparent: TRANSPARENT_GIF_COLOR,
  });

  const images = await Promise.all(pages.map((page) => imageFromDataUrl(page)));
  images.forEach((image) => {
    const frame = makeTransparentGifFrame(image, width, height);
    gif.addFrame(frame, { delay: Math.max(1, fadeInterval) * 1000, copy: true });
  });

  gif.on("finished", (blob) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = "reaction_menu.gif";
    anchor.href = url;
    anchor.click();
    URL.revokeObjectURL(url);
  });

  gif.render();
}
