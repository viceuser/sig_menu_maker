import { normalizeMenuConfigValue } from "./storage";
import type { MenuConfig } from "./types";

const GZIP_PREFIX = "g.";
const PLAIN_PREFIX = "p.";

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function compress(bytes: Uint8Array) {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompress(bytes: Uint8Array) {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encodeOverlayConfig(config: MenuConfig) {
  const raw = new TextEncoder().encode(JSON.stringify(config));

  if (typeof CompressionStream !== "undefined") {
    try {
      const compressed = await compress(raw);
      if (compressed.length < raw.length) return `${GZIP_PREFIX}${bytesToBase64Url(compressed)}`;
    } catch {
      // Older embedded browsers can use the uncompressed token.
    }
  }

  return `${PLAIN_PREFIX}${bytesToBase64Url(raw)}`;
}

export async function decodeOverlayConfig(token: string) {
  const isGzip = token.startsWith(GZIP_PREFIX);
  const isPlain = token.startsWith(PLAIN_PREFIX);
  if (!isGzip && !isPlain) throw new Error("올바른 OBS 오버레이 링크가 아닙니다.");

  const encoded = token.slice(2);
  const bytes = base64UrlToBytes(encoded);
  const decoded = isGzip ? await decompress(bytes) : bytes;
  const parsed: unknown = JSON.parse(new TextDecoder().decode(decoded));
  const config = normalizeMenuConfigValue(parsed);

  if (!config || config.items.length === 0) {
    throw new Error("오버레이에 표시할 메뉴 항목이 없습니다.");
  }

  return config;
}
