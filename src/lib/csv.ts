import type { ReactionItem } from "./types";

export interface ParsedReactionCsvRow {
  count: number | null;
  text: string;
}

function parseDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const next = line[index + 1];
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function encodeCsvCell(value: string | number) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function isHeaderRow(cells: string[]) {
  return cells[0]?.trim().toLowerCase() === "count" && cells[1]?.trim().toLowerCase() === "text";
}

function looksMojibake(text: string) {
  return /[�좎럡닻넫琉우뵰源껊궚얩낅쐞⑤갭踰�]/.test(text);
}

function decodeBytes(bytes: Uint8Array, encoding: string, fatal = false) {
  return new TextDecoder(encoding, { fatal }).decode(bytes);
}

function stripBom(text: string) {
  return text.replace(/^\uFEFF/, "");
}

function detectDelimiter(lines: string[]) {
  const sample = lines.find((line) => line.trim().length > 0) ?? "";
  const candidates = [",", ";", "\t"];

  let best = ",";
  let bestScore = -1;

  for (const delimiter of candidates) {
    const count = sample.split(delimiter).length - 1;
    if (count > bestScore) {
      best = delimiter;
      bestScore = count;
    }
  }

  return best;
}

export async function readReactionCsvFile(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return stripBom(decodeBytes(bytes, "utf-8"));
  }

  try {
    const utf8 = stripBom(decodeBytes(bytes, "utf-8", true));
    if (!looksMojibake(utf8)) {
      return utf8;
    }
  } catch {
    // fall through to cp949/euc-kr
  }

  try {
    return stripBom(decodeBytes(bytes, "euc-kr", true));
  } catch {
    return stripBom(decodeBytes(bytes, "utf-8"));
  }
}

export function parseReactionCsv(rawText: string): ParsedReactionCsvRow[] {
  const text = stripBom(rawText);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\r/g, ""))
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error("CSV 파일이 비어 있습니다.");
  }

  const delimiter = detectDelimiter(lines);
  const rows: ParsedReactionCsvRow[] = [];
  const firstCells = parseDelimitedLine(lines[0], delimiter);
  const startIndex = isHeaderRow(firstCells) ? 1 : 0;

  for (let lineIndex = startIndex; lineIndex < lines.length; lineIndex += 1) {
    const cells = parseDelimitedLine(lines[lineIndex], delimiter);

    if (cells.length === 0 || cells.every((cell) => cell === "")) {
      continue;
    }

    if (cells.length === 1) {
      const textValue = cells[0].trim();
      if (!textValue) continue;
      rows.push({ count: null, text: textValue });
      continue;
    }

    const countCell = cells[0].trim().replace(/,/g, "");
    const count = countCell === "" ? null : Number(countCell);
    const textValue = cells.slice(1).join(delimiter).trim();

    if (count !== null && !Number.isFinite(count)) {
      throw new Error(`${lineIndex + 1}번째 줄의 count 값이 숫자가 아닙니다.`);
    }

    if (!textValue) {
      continue;
    }

    rows.push({ count, text: textValue });
  }

  if (rows.length === 0) {
    throw new Error("가져올 항목이 없습니다.");
  }

  return rows;
}

export function createReactionCsvExample() {
  return ["count,text", "100,살아있네", "105,POSE", "110,HOLD UP"].join("\n");
}

export function createReactionCsv(items: ReactionItem[]) {
  return [
    "count,text",
    ...items.map((item) => `${encodeCsvCell(item.count ?? "")},${encodeCsvCell(item.text)}`),
  ].join("\n");
}

export function createUtf8BomCsvBlob(text: string) {
  return new Blob(["\uFEFF", text], { type: "text/csv;charset=utf-8" });
}
