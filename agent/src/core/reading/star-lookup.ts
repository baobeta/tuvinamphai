import { SIX_LUCKY_STARS, SIX_MALEFIC_STARS, palaceAt } from "../analysis/chart-query.js";
import { branchName, stemName } from "../calendar/stem-branch.js";
import type { PalaceRole } from "../chart/palaces.js";
import type { Brightness, Chart, Gender, PlacedStar } from "../chart/types.js";
import { err, ok, type Result } from "../result.js";
import {
  GENDER_HEADINGS,
  isMainStar,
  labelMentionsRole,
  labelMentionsStar,
  resolveBranchName,
  resolveBrightness,
  resolveRole,
  resolveStarName,
  starsInTitle,
  textMentionsBranch,
  textMentionsBrightness,
  textMentionsRole,
  textMentionsStar,
} from "./names.js";
import { buildStarKbIndex, lineInStarSection, linesAboutBranch, linesAboutRole, type MainStarDocKind, type StarKbIndex } from "./star-index.js";
import { excerptText, inlineCitations, isContentLine, type IndexedDoc, type IndexedLine, type ReadingKbDocument } from "./text.js";

export interface StarQuery {
  readonly star: string;
  readonly palace?: string | undefined;
  readonly branch?: string | number | undefined;
  readonly brightness?: string | undefined;
  readonly gender?: Gender | undefined;
}

export interface ResolvedStarQuery {
  readonly star: string;
  readonly role?: PalaceRole;
  readonly branch?: number;
  readonly brightness?: Brightness;
  readonly gender?: Gender;
}

export type ReferenceKind =
  | MainStarDocKind
  | "brightness-table"
  | "minor-star"
  | "minor-star-section"
  | "palace-star-entry"
  | "palace-mention";

export interface StarReference {
  readonly path: string;
  readonly title: string;
  readonly kind: ReferenceKind;
  readonly reason: string;
  readonly score: number;
  readonly excerpts: readonly string[];
  readonly citations: readonly string[];
  readonly sources: string;
}

export interface StarLookup {
  readonly query: ResolvedStarQuery;
  readonly references: readonly StarReference[];
  readonly notes: readonly string[];
}

const MAX_EXCERPTS = 6;
const DISCLAIMED_SCORE = 30;

export const REFERENCE_KIND_LABEL: Readonly<Record<ReferenceKind, string>> = {
  nature: "tính chất sao",
  positions: "miếu hãm, Mệnh ở 12 cung",
  combinations: "đồng cung, hội sao, cách cục",
  gender: "nam mệnh, nữ mệnh",
  "other-palaces": "sao ở các cung ngoài Mệnh",
  periods: "sao nhập hạn",
  patterns: "cách cục liên quan",
  general: "tổng quát",
  "brightness-table": "bảng miếu hãm 14 sao",
  "minor-star": "file riêng của sao",
  "minor-star-section": "mục về sao trong file khác",
  "palace-star-entry": "mục của sao trong thư mục cung",
  "palace-mention": "câu nhắc sao trong thư mục cung",
};

function resolveOptional<T>(value: string | number | undefined, parse: (text: string) => Result<T>): Result<T | undefined> {
  if (value === undefined || value === "") return ok(undefined);
  return typeof value === "number" ? (ok(value as T) as Result<T | undefined>) : parse(value);
}

export function resolveStarQuery(query: StarQuery): Result<ResolvedStarQuery> {
  const star = resolveStarName(query.star);
  if (!star.ok) return star;
  const role = resolveOptional(query.palace, resolveRole);
  if (!role.ok) return role;
  const branch = resolveOptional(query.branch, resolveBranchName);
  if (!branch.ok) return branch;
  if (branch.value !== undefined && (!Number.isInteger(branch.value) || branch.value < 0 || branch.value > 11)) {
    return err(`Địa chi phải là 0–11 hoặc tên chi; nhận được ${query.branch}`);
  }
  const brightness = resolveOptional(query.brightness, resolveBrightness);
  if (!brightness.ok) return brightness;
  return ok({
    star: star.value,
    ...(role.value ? { role: role.value } : {}),
    ...(branch.value !== undefined ? { branch: branch.value } : {}),
    ...(brightness.value ? { brightness: brightness.value } : {}),
    ...(query.gender ? { gender: query.gender } : {}),
  });
}

const reference = (
  indexed: IndexedDoc,
  kind: ReferenceKind,
  reason: string,
  score: number,
  lines: readonly IndexedLine[],
  fallbackSummary = false,
): StarReference[] => {
  const excerpts = lines.length ? lines.slice(0, MAX_EXCERPTS).map(excerptText) : fallbackSummary && indexed.summary ? [indexed.summary] : [];
  if (!excerpts.length) return [];
  const citations = [...new Set(lines.slice(0, MAX_EXCERPTS).flatMap((line) => inlineCitations(line.text)))];
  return [{ path: indexed.doc.path, title: indexed.doc.title, kind, reason, score, excerpts, citations, sources: indexed.doc.sources }];
};

const conditionScore = (line: IndexedLine, query: ResolvedStarQuery): number =>
  (query.role && (labelMentionsRole(line.label, query.role) || textMentionsRole(line.canon, query.role)) ? 4 : 0) +
  (query.branch !== undefined && textMentionsBranch(line.canon, query.branch) ? 2 : 0) +
  (query.brightness && textMentionsBrightness(line.canon, query.brightness) ? 1 : 0);

const byConditions = (lines: readonly IndexedLine[], query: ResolvedStarQuery): readonly IndexedLine[] =>
  lines
    .map((line, order) => ({ line, order, score: conditionScore(line, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((item) => item.line);

const preferConditions = (lines: readonly IndexedLine[], query: ResolvedStarQuery): readonly IndexedLine[] => {
  const ranked = byConditions(lines, query);
  return ranked.length ? [...ranked, ...lines.filter((line) => !ranked.includes(line))] : lines;
};


const isLifeOrUnset = (query: ResolvedStarQuery): boolean => query.role === undefined || query.role === "Mệnh";

function mainStarReferences(index: StarKbIndex, query: ResolvedStarQuery): readonly StarReference[] {
  const docs = index.mainStarDocs.get(query.star) ?? [];
  return docs.flatMap(({ indexed, kind }) => {
    switch (kind) {
      case "positions": {
        if (query.branch !== undefined) {
          const lines = linesAboutBranch(indexed, query.branch);
          if (lines.length) return reference(indexed, kind, `${query.star} ở ${branchName(query.branch)} (mục theo địa chi)`, 100, preferConditions(lines, query));
        }
        return isLifeOrUnset(query) ? reference(indexed, kind, "tóm tắt miếu hãm, Mệnh ở 12 cung", 60, [], true) : [];
      }
      case "other-palaces": {
        if (query.role === undefined || query.role === "Mệnh") return reference(indexed, kind, "tóm tắt sao ở các cung ngoài Mệnh", 25, [], true);
        const lines = linesAboutRole(indexed, query.role);
        return reference(indexed, kind, `${query.star} ở cung ${query.role} (mục theo cung chức)`, 95, lines);
      }
      case "gender": {
        if (!isLifeOrUnset(query)) return [];
        if (!query.gender) return reference(indexed, kind, "tóm tắt nam mệnh, nữ mệnh", 50, [], true);
        const heading = GENDER_HEADINGS[query.gender];
        const lines = indexed.lines.filter((line) => isContentLine(line) && line.headingCanon.includes(heading));
        return reference(indexed, kind, `${query.star} tọa Mệnh, mục ${heading}`, 80, preferConditions(lines, query), true);
      }
      case "combinations": {
        const lines = query.branch !== undefined ? indexed.lines.filter((line) => isContentLine(line) && textMentionsBranch(line.canon, query.branch!)) : [];
        return reference(indexed, kind, lines.length ? `câu nhắc ${branchName(query.branch!)} trong file đồng cung, cách cục` : "tóm tắt đồng cung, cách cục", 50, lines.slice(0, 3), true);
      }
      case "nature":
        return reference(indexed, kind, "tóm tắt tính chất sao", 55, [], true);
      case "patterns":
        return reference(indexed, kind, "tóm tắt cách cục liên quan", 45, [], true);
      case "periods":
        return reference(indexed, kind, "tóm tắt sao nhập hạn", 30, [], true);
      case "general":
        return reference(indexed, kind, "tóm tắt", 20, [], true);
    }
  });
}

function brightnessTableReferences(index: StarKbIndex, query: ResolvedStarQuery): readonly StarReference[] {
  if (!index.brightnessTable || !isMainStar(query.star) || (query.branch === undefined && !query.brightness)) return [];
  const lines = index.brightnessTable.lines.filter((line) => isContentLine(line) && labelMentionsStar(line.label, query.star));
  return reference(index.brightnessTable, "brightness-table", "dòng của sao trong bảng miếu hãm", 40, lines);
}

function minorStarReferences(index: StarKbIndex, query: ResolvedStarQuery): readonly StarReference[] {
  const entries = index.minorStarDocs.get(query.star) ?? [];
  return entries.flatMap(({ indexed, match, titleStarCount, disclaimed }) => {
    const starLines =
      match === "title" && titleStarCount === 1
        ? indexed.lines.filter(isContentLine)
        : indexed.lines.filter(
            (line) => lineInStarSection(line, query.star, indexed.doc.path) || (isContentLine(line) && textMentionsStar(line.canon, query.star)),
          );
    const narrowed = byConditions(starLines, query);
    if (match === "title") {
      const dedicated = titleStarCount === 1;
      const lines = narrowed.length ? narrowed : dedicated ? [] : starLines.slice(0, 3);
      const reason = narrowed.length ? "file riêng của sao, câu khớp cung/chi/độ sáng" : "file riêng của sao";
      const score = disclaimed ? DISCLAIMED_SCORE : dedicated ? 90 : 85;
      return reference(indexed, "minor-star", disclaimed ? `${reason}; file ghi rõ không phải sao ${query.star}` : reason, score, lines, true);
    }
    const lines = narrowed.length ? narrowed : starLines.slice(0, 3);
    return reference(indexed, "minor-star-section", narrowed.length ? "mục về sao, câu khớp cung/chi/độ sáng" : "mục về sao", narrowed.length ? 70 : 35, lines);
  });
}

const PRIMARY_PALACE_FILE: Readonly<Record<"main" | "minor", RegExp>> = {
  main: /Chinh-tinh/i,
  minor: /Phu-tinh/i,
};

function palaceFolderReferences(index: StarKbIndex, query: ResolvedStarQuery): readonly StarReference[] {
  if (!query.role) return [];
  const docs = index.palaceDocs.get(query.role) ?? [];
  const primaryPattern = PRIMARY_PALACE_FILE[isMainStar(query.star) ? "main" : "minor"];
  return docs.flatMap((indexed) => {
    const primary = primaryPattern.test(indexed.fileSlug);
    const entryLines = indexed.lines.filter((line) => lineInStarSection(line, query.star, indexed.doc.path));
    if (entryLines.length) {
      return reference(indexed, "palace-star-entry", `mục ${query.star} trong thư mục cung ${query.role}`, primary ? 90 : 75, preferConditions(entryLines, query));
    }
    const mentionLines = indexed.lines.filter((line) => isContentLine(line) && textMentionsStar(line.canon, query.star));
    return reference(indexed, "palace-mention", `câu nhắc ${query.star} trong thư mục cung ${query.role}`, primary ? 60 : 55, preferConditions(mentionLines, query));
  });
}

export function lookupStar(index: StarKbIndex, query: ResolvedStarQuery): StarLookup {
  const references = [
    ...(isMainStar(query.star) ? mainStarReferences(index, query) : minorStarReferences(index, query)),
    ...brightnessTableReferences(index, query),
    ...palaceFolderReferences(index, query),
  ].sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  const notes = [
    ...(references.length ? [] : [`Kho không có file hay mục nào gắn với sao ${query.star} theo cấu trúc thư mục và tiêu đề; thử search_kb.`]),
    ...(query.role === "Mệnh" && isMainStar(query.star) ? ["Với cung Mệnh, file 02_Mieu-ham-va-12-vi-tri luận Mệnh theo địa chi và file 04_Nam-menh-nu-menh luận sao tọa Mệnh."] : []),
    ...(query.branch !== undefined && isMainStar(query.star) && !references.some((item) => item.kind === "positions" && item.score === 100)
      ? [`File miếu hãm của ${query.star} không có mục riêng cho ${branchName(query.branch)}.`]
      : []),
  ];
  return { query, references, notes };
}

const asIndex = (source: StarKbIndex | readonly ReadingKbDocument[]): StarKbIndex =>
  "mainStarDocs" in source ? source : buildStarKbIndex(source as readonly ReadingKbDocument[]);

export function kbFilesForStar(source: StarKbIndex | readonly ReadingKbDocument[], query: StarQuery): Result<StarLookup> {
  const resolved = resolveStarQuery(query);
  return resolved.ok ? ok(lookupStar(asIndex(source), resolved.value)) : resolved;
}

export interface RenderLimits {
  readonly maxReferences: number;
  readonly maxExcerpts: number;
  readonly maxExcerptChars: number;
}

export const BRIEF_LIMITS: RenderLimits = { maxReferences: 2, maxExcerpts: 1, maxExcerptChars: 240 };
export const FULL_LIMITS: RenderLimits = { maxReferences: 12, maxExcerpts: MAX_EXCERPTS, maxExcerptChars: 600 };

export const clip = (text: string, maxChars: number): string => (text.length > maxChars ? `${text.slice(0, maxChars)}…` : text);

export const describeQuery = (query: ResolvedStarQuery): string =>
  [
    query.star,
    query.role ? `cung ${query.role}` : "",
    query.branch !== undefined ? `tại ${branchName(query.branch)}` : "",
    query.brightness ?? "",
    query.gender ? `(${query.gender})` : "",
  ]
    .filter(Boolean)
    .join(" ");

export function renderReference(item: StarReference, limits: RenderLimits): string {
  const citation = item.citations.length ? ` · trong câu: ${item.citations.join("; ")}` : "";
  return [
    `- \`${item.path}\` — ${item.title} [${REFERENCE_KIND_LABEL[item.kind]}; ${item.reason}]`,
    `  Nguồn chính: ${item.sources || "không ghi"}${citation}`,
    ...item.excerpts.slice(0, limits.maxExcerpts).map((line) => `  > ${clip(line, limits.maxExcerptChars)}`),
  ].join("\n");
}

export function renderStarLookup(lookup: StarLookup, limits: RenderLimits = FULL_LIMITS): string {
  const shown = lookup.references.slice(0, limits.maxReferences);
  const more = lookup.references.length - shown.length;
  return [
    `### ${describeQuery(lookup.query)}`,
    ...shown.map((item) => renderReference(item, limits)),
    more > 0 ? `- … còn ${more} file khác (gọi lại với detail "full" để xem)` : "",
    ...lookup.notes.map((note) => `- Ghi chú: ${note}`),
  ]
    .filter(Boolean)
    .join("\n");
}

export const KEY_MINOR_STARS: readonly string[] = [
  ...SIX_LUCKY_STARS,
  ...SIX_MALEFIC_STARS,
  "Lộc Tồn", "Thiên Mã", "Đào Hoa", "Hồng Loan", "Thiên Hỷ", "Thiên Diêu", "Thiên Hình", "Cô Thần", "Quả Tú",
  "Thiên Khốc", "Thiên Hư", "Long Trì", "Phượng Các", "Ân Quang", "Thiên Quý", "Hoa Cái", "Thiên Không", "Kiếp Sát",
  "Tuần", "Triệt",
];

const BRANCH_INDEPENDENT_STARS: ReadonlySet<string> = new Set(["Tuần", "Triệt"]);

export type MinorStarScope = "none" | "key" | "all";

export interface PalaceStarReferences {
  readonly branch: number;
  readonly role: string;
  readonly stemBranch: string;
  readonly isBodyPalace: boolean;
  readonly entries: readonly { readonly label: string; readonly lookup: StarLookup }[];
  readonly skipped: readonly string[];
}

const starLabel = (star: PlacedStar): string =>
  [star.name, star.brightness ? `(${star.brightness})` : "", star.transformation ? `[${star.transformation}]` : ""].filter(Boolean).join(" ");

export function chartStarReferences(
  index: StarKbIndex,
  chart: Chart,
  branch: number,
  minorStars: MinorStarScope = "key",
): PalaceStarReferences {
  const palace = palaceAt(chart, branch);
  const role = palace.role as PalaceRole;
  const gender = chart.parameters.gender;
  const isWanted = (star: PlacedStar): boolean =>
    star.group === "chính tinh" ||
    (minorStars === "key" && KEY_MINOR_STARS.includes(star.name)) ||
    (minorStars === "all" && (KEY_MINOR_STARS.includes(star.name) || index.minorStarDocs.has(star.name)));
  const wanted = palace.stars.filter(isWanted);
  const transformations = palace.stars.flatMap((star) => (star.transformation ? [{ name: star.transformation, carrier: star.name }] : []));
  const baseQuery = { role, branch: palace.branch, gender };
  const entries = [
    ...wanted.map((star) => ({
      label: starLabel(star),
      lookup: lookupStar(index, {
        ...(BRANCH_INDEPENDENT_STARS.has(star.name) ? { role, gender } : baseQuery),
        star: star.name,
        ...(star.brightness ? { brightness: star.brightness } : {}),
      }),
    })),
    ...transformations.map((item) => ({ label: `${item.name} (trên ${item.carrier})`, lookup: lookupStar(index, { role, gender, star: item.name }) })),
  ];
  return {
    branch: palace.branch,
    role,
    stemBranch: `${stemName(palace.stem)} ${branchName(palace.branch)}`,
    isBodyPalace: palace.isBodyPalace,
    entries,
    skipped: palace.stars.filter((star) => !isWanted(star)).map((star) => star.name),
  };
}

export function renderChartStarReferences(result: PalaceStarReferences, limits: RenderLimits): string {
  return [
    `## Tra kho cho các sao ở cung ${result.role} (${result.stemBranch})${result.isBodyPalace ? ", cung an Thân" : ""}`,
    "Vị trí sao lấy từ lá số (chắc chắn). Mỗi dòng trích là nguyên văn kho, kèm nguồn; tool không tự kết luận.",
    ...result.entries.map((entry) => renderStarLookup(entry.lookup, limits).replace(/^### .*/, `### ${entry.label}`)),
    result.skipped.length ? `Không tra ở đây (dùng chart_star_references, all_minor_stars=true để tra): ${result.skipped.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export const BRIEF_REFERENCE_COUNT = 5;
const BRIEF_EXCERPT_CHARS = 150;
const BRIEF_SOURCE_CHARS = 70;

export const FULL_DETAIL_HINT = 'Bản rút gọn; gọi lại với detail "full" để xem đủ file, câu trích và phân tích.';

export function topReferences(lookups: readonly StarLookup[], count: number = BRIEF_REFERENCE_COUNT): readonly StarReference[] {
  const perLookup = lookups.map((item) => item.references);
  const picked: StarReference[] = [];
  for (let rank = 0; picked.length < count && perLookup.some((refs) => refs.length > rank); rank++) {
    for (const refs of perLookup) {
      const candidate = refs[rank];
      if (candidate && picked.length < count && !picked.some((item) => item.path === candidate.path)) picked.push(candidate);
    }
  }
  return picked;
}

export const renderBriefReference = (item: StarReference): string =>
  `- \`${item.path}\`: ${clip((item.excerpts[0] ?? "").replace(/\s+/g, " "), BRIEF_EXCERPT_CHARS)} [Nguồn chính: ${clip(item.sources || "không ghi", BRIEF_SOURCE_CHARS)}]`;

export function renderChartStarReferencesBrief(result: PalaceStarReferences): string {
  return [
    `## ${result.role} (${result.stemBranch})${result.isBodyPalace ? ", cung an Thân" : ""}: ${result.entries.map((entry) => entry.label).join(", ") || "không có sao cần tra"}`,
    "File kho (trích nguyên văn, vị trí sao chắc chắn từ lá số):",
    ...topReferences(result.entries.map((entry) => entry.lookup)).map(renderBriefReference),
    FULL_DETAIL_HINT,
  ].join("\n");
}
