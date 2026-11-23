import { foldVi, normalizeVi } from "../../kb/normalize.js";

export interface ReadingKbDocument {
  readonly path: string;
  readonly title: string;
  readonly sources: string;
  readonly keywords: readonly string[];
  readonly body: string;
}

export interface IndexedLine {
  readonly text: string;
  readonly canon: string;
  readonly label?: string;
  readonly heading: string;
  readonly headingCanon: string;
  readonly tableHeader?: string;
  readonly isHeading: boolean;
  readonly isTableRow: boolean;
}

export interface IndexedDoc {
  readonly doc: ReadingKbDocument;
  readonly folder: string;
  readonly fileSlug: string;
  readonly titleCanon: string;
  readonly lines: readonly IndexedLine[];
  readonly summary: string;
}

const TONE_PLACEMENT: readonly (readonly [RegExp, string])[] = [
  [/oá/g, "óa"],
  [/oà/g, "òa"],
  [/oả/g, "ỏa"],
  [/oã/g, "õa"],
  [/oạ/g, "ọa"],
  [/uỳ/g, "ùy"],
  [/uý/g, "úy"],
  [/uỷ/g, "ủy"],
  [/uỹ/g, "ũy"],
  [/uỵ/g, "ụy"],
];

export const canon = (text: string): string =>
  TONE_PLACEMENT.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), normalizeVi(text));

export const slugOf = (name: string): string => foldVi(name).replace(/\s+/g, "-");

interface NamePattern {
  readonly key: string;
  readonly regex: RegExp;
}

const namePatternCache = new Map<string, NamePattern>();

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const namePattern = (name: string): NamePattern => {
  const cached = namePatternCache.get(name);
  if (cached) return cached;
  const key = canon(name);
  const created = { key, regex: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(key)}(?![\\p{L}\\p{N}])`, "u") };
  namePatternCache.set(name, created);
  return created;
};

export function containsName(canonText: string, name: string): boolean {
  const pattern = namePattern(name);
  return canonText.includes(pattern.key) && pattern.regex.test(canonText);
}

export const containsAnyName = (canonText: string, names: readonly string[]): boolean =>
  names.some((name) => containsName(canonText, name));

const BOLD_LEAD = /^(?:[-*]\s+|\d+\.\s+)?\*\*([^*]+)\*\*/;
const COLON_LEAD = /^(?:[-*]\s+|\d+\.\s+)([^:*[\]]{1,40}):/;
const TABLE_SEPARATOR = /^\|[\s|:-]+\|$/;
const FULL_BOLD = /^\*\*[^*]+\*\*[.:]?$/;
const SHORT_CELL_LENGTH = 40;

const tableCells = (line: string): readonly string[] =>
  line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

const labelOf = (line: string, isTableRow: boolean): string | undefined => {
  if (isTableRow) {
    const [first = "", second = ""] = tableCells(line);
    return second && second.length <= SHORT_CELL_LENGTH ? `${first} | ${second}` : first;
  }
  return BOLD_LEAD.exec(line)?.[1]?.trim() ?? COLON_LEAD.exec(line)?.[1]?.trim();
};

const headingText = (line: string): string | undefined => {
  const markdown = /^#{1,6}\s+(.+)$/.exec(line)?.[1];
  if (markdown) return markdown.trim();
  if (FULL_BOLD.test(line)) return line.replace(/\*\*/g, "").replace(/[.:]$/, "").trim();
  return undefined;
};

export function indexLines(body: string): readonly IndexedLine[] {
  const lines: IndexedLine[] = [];
  let heading = "";
  let tableHeader: string | undefined;
  let previousWasTable = false;
  for (const raw of body.split("\n")) {
    const text = raw.trim();
    if (!text) {
      previousWasTable = false;
      continue;
    }
    const isTableRow = text.startsWith("|");
    if (isTableRow && TABLE_SEPARATOR.test(text)) continue;
    if (isTableRow && !previousWasTable) {
      tableHeader = text;
      previousWasTable = true;
      continue;
    }
    previousWasTable = isTableRow;
    const headingValue = isTableRow ? undefined : headingText(text);
    if (headingValue !== undefined) heading = headingValue;
    const label = labelOf(text, isTableRow);
    lines.push({
      text,
      canon: canon(text),
      ...(label ? { label: canon(label) } : {}),
      heading,
      headingCanon: canon(heading),
      ...(isTableRow && tableHeader ? { tableHeader } : {}),
      isHeading: headingValue !== undefined,
      isTableRow,
    });
  }
  return lines;
}

const summaryOf = (lines: readonly IndexedLine[]): string =>
  lines.find((line) => !line.isHeading && line.headingCanon === "tóm tắt")?.text ?? "";

export function indexDocument(doc: ReadingKbDocument): IndexedDoc {
  const parts = doc.path.split("/");
  const lines = indexLines(doc.body);
  return {
    doc,
    folder: parts.slice(0, -1).join("/"),
    fileSlug: (parts[parts.length - 1] ?? "").replace(/\.md$/, ""),
    titleCanon: canon(doc.title),
    lines,
    summary: summaryOf(lines),
  };
}

const SKIPPED_SECTIONS = new Set(["liên quan"]);

export const isContentLine = (line: IndexedLine): boolean =>
  !line.isHeading && !SKIPPED_SECTIONS.has(line.headingCanon) && line.headingCanon !== "tóm tắt";

const INLINE_CITATION = /\(((?:MLTC|TVTH|NP1|NP2)\b[^()]*)\)/g;

export function inlineCitations(text: string): readonly string[] {
  return [...text.matchAll(INLINE_CITATION)].map((match) => match[1]!.trim());
}

const MAX_EXCERPT_LENGTH = 600;

export const excerptText = (line: IndexedLine): string => {
  const text = line.text.length > MAX_EXCERPT_LENGTH ? `${line.text.slice(0, MAX_EXCERPT_LENGTH)}…` : line.text;
  return line.isTableRow && line.tableHeader ? `${line.tableHeader} → ${text}` : text;
};
