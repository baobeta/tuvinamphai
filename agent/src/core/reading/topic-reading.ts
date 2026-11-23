import { formatSummary, mainSummaries, type StarSummary } from "../analysis/analysis-helpers.js";
import { hasStarIn, palaceByRole, threeSidesOf } from "../analysis/chart-query.js";
import { CERTAINTY_LABEL, type Finding } from "../analysis/finding.js";
import { analyzePalaceAt } from "../analysis/palace-analysis.js";
import { branchName, stemName } from "../calendar/stem-branch.js";
import type { PalaceRole } from "../chart/palaces.js";
import type { Chart, Palace } from "../chart/types.js";
import { detectPatterns } from "../patterns/index.js";
import { ok, type Result } from "../result.js";
import { isTextAmbiguousStar, labelMentionsRole, labelMentionsStar, starsInKeyword, starsInLabel, textMentionsRole, textMentionsStar } from "./names.js";
import {
  BRIEF_LIMITS,
  chartStarReferences,
  clip,
  FULL_DETAIL_HINT,
  renderBriefReference,
  renderChartStarReferences,
  topReferences,
  type PalaceStarReferences,
  type RenderLimits,
} from "./star-lookup.js";
import type { StarKbIndex } from "./star-index.js";
import { excerptText, inlineCitations, isContentLine, type IndexedDoc, type IndexedLine } from "./text.js";
import { resolveTopic, type PalaceTier, type TopicDefinition } from "./topics.js";

export type ReadingDetail = "brief" | "full";

export interface KbQuote {
  readonly path: string;
  readonly text: string;
  readonly source: string;
  readonly aboutRole?: PalaceRole;
}

export interface SidePalaceFacts {
  readonly role: string;
  readonly branch: number;
  readonly mainStars: readonly StarSummary[];
}

export interface TopicPalaceFacts {
  readonly role: string;
  readonly tier: PalaceTier;
  readonly branch: number;
  readonly stemBranch: string;
  readonly isBodyPalace: boolean;
  readonly mainStars: readonly StarSummary[];
  readonly otherStars: readonly string[];
  readonly transformations: readonly string[];
  readonly hasTuan: boolean;
  readonly hasTriet: boolean;
  readonly trines: readonly SidePalaceFacts[];
  readonly opposite: SidePalaceFacts;
  readonly kbRole: readonly KbQuote[];
}

export interface TopicStarFact {
  readonly star: string;
  readonly positions: readonly { readonly role: string; readonly branch: number }[];
  readonly inTopicPalaces: readonly string[];
  readonly inPrimaryThreeSides: boolean;
  readonly listedIn: readonly string[];
  readonly rules: readonly KbQuote[];
}

export interface PatternRelevance {
  readonly finding: Finding;
  readonly roles: readonly string[];
}

export interface BodyPalaceNote {
  readonly role: string;
  readonly branch: number;
  readonly doc?: { readonly path: string; readonly title: string; readonly summary: string; readonly sources: string };
}

export interface TopicReading {
  readonly topic: TopicDefinition;
  readonly detail: ReadingDetail;
  readonly palaces: readonly TopicPalaceFacts[];
  readonly bodyPalace?: BodyPalaceNote;
  readonly topicStars: readonly TopicStarFact[];
  readonly absentTopicStars: readonly string[];
  readonly palaceFindings: readonly { readonly role: string; readonly findings: readonly Finding[] }[];
  readonly patterns: readonly PatternRelevance[];
  readonly topicFiles: readonly { readonly path: string; readonly title: string; readonly sources: string }[];
  readonly starReferences: readonly PalaceStarReferences[];
}

const TOPIC_BRANCH = "11_Chu-de-luan";

const topicDocs = (index: StarKbIndex, topic: TopicDefinition): readonly IndexedDoc[] =>
  index.docs.filter((indexed) => {
    const [branch, folder] = indexed.folder.split("/");
    return branch === TOPIC_BRANCH && folder?.replace(/^\d+_/, "") === topic.folderSlug;
  });

const quoteOf = (indexed: IndexedDoc, line: IndexedLine): KbQuote => {
  const citations = inlineCitations(line.text);
  return { path: indexed.doc.path, text: excerptText(line), source: citations.length ? citations.join("; ") : indexed.doc.sources };
};

const TIER_CELL = /^(chính|phụ)\b/;

const roleCellOf = (line: IndexedLine): string | undefined => {
  if (!line.label || !line.isTableRow) return line.label;
  const [first = "", second = ""] = line.label.split(" | ");
  return TIER_CELL.test(first) ? second : first;
};

const sideFacts = (palace: Palace): SidePalaceFacts => ({ role: palace.role, branch: palace.branch, mainStars: mainSummaries(palace) });

function palaceFacts(chart: Chart, palace: Palace, tier: PalaceTier, howToRead: IndexedDoc | undefined): TopicPalaceFacts {
  const group = threeSidesOf(chart, palace.branch);
  const role = palace.role as PalaceRole;
  const kbRole = howToRead
    ? [
        ...howToRead.lines.filter((line) => isContentLine(line) && labelMentionsRole(roleCellOf(line), role)),
        ...howToRead.lines.filter(
          (line) => isContentLine(line) && !labelMentionsRole(roleCellOf(line), role) && textMentionsRole(line.headingCanon, role),
        ),
      ].map((line) => quoteOf(howToRead, line))
    : [];
  return {
    role: palace.role,
    tier,
    branch: palace.branch,
    stemBranch: `${stemName(palace.stem)} ${branchName(palace.branch)}`,
    isBodyPalace: palace.isBodyPalace,
    mainStars: mainSummaries(palace),
    otherStars: palace.stars.filter((star) => star.group !== "chính tinh").map((star) => star.name),
    transformations: palace.stars.flatMap((star) => (star.transformation ? [`${star.transformation} (${star.name})`] : [])),
    hasTuan: hasStarIn(palace, "Tuần"),
    hasTriet: hasStarIn(palace, "Triệt"),
    trines: group.trines.map(sideFacts),
    opposite: sideFacts(group.opposite),
    kbRole,
  };
}

function collectTopicStars(index: StarKbIndex, docs: readonly IndexedDoc[], primaryRole: PalaceRole): ReadonlyMap<string, readonly string[]> {
  const listing = new Map<string, string[]>();
  const add = (star: string, path: string) => {
    if (isTextAmbiguousStar(star)) return;
    const paths = listing.get(star) ?? [];
    if (!paths.includes(path)) paths.push(path);
    listing.set(star, paths);
  };
  const starFiles = docs.filter((indexed) => /Bo-sao|Cach-xem/i.test(indexed.fileSlug));
  for (const indexed of starFiles) {
    for (const keyword of indexed.doc.keywords) for (const star of starsInKeyword(keyword)) add(star, indexed.doc.path);
    for (const line of indexed.lines) if (isContentLine(line) && line.label) for (const star of starsInLabel(line.label)) add(star, indexed.doc.path);
  }
  const palaceMinorFile = (index.palaceDocs.get(primaryRole) ?? []).find((indexed) => /Phu-tinh/i.test(indexed.fileSlug));
  if (palaceMinorFile) for (const keyword of palaceMinorFile.doc.keywords) for (const star of starsInKeyword(keyword)) add(star, palaceMinorFile.doc.path);
  return listing;
}

function rulesFor(
  star: string,
  roles: readonly PalaceRole[],
  sources: readonly IndexedDoc[],
  implicitDocs: ReadonlyMap<IndexedDoc, PalaceRole>,
  limit: number,
): readonly KbQuote[] {
  const aboutRole = (indexed: IndexedDoc, line: IndexedLine): PalaceRole | undefined =>
    roles.find((role) => textMentionsRole(line.canon, role) || textMentionsRole(line.headingCanon, role)) ??
    roles.find((role) => implicitDocs.get(indexed) === role);
  return sources
    .flatMap((indexed) =>
      indexed.lines
        .filter((line) => isContentLine(line) && (labelMentionsStar(line.label, star) || textMentionsStar(line.canon, star)))
        .flatMap((line) => {
          const role = aboutRole(indexed, line);
          return role ? [{ indexed, line, role }] : [];
        }),
    )
    .map((item, position) => ({ ...item, position, score: labelMentionsStar(item.line.label, star) ? 1 : 0 }))
    .sort((a, b) => b.score - a.score || a.position - b.position)
    .slice(0, limit)
    .map(({ indexed, line, role }) => ({ ...quoteOf(indexed, line), aboutRole: role }));
}

const roleTag = (role: string): string => `${role} (`;

const findingText = (item: Finding): string => [item.summary, ...item.satisfied, ...item.breakers].join(" ");

export function topicReading(index: StarKbIndex, chart: Chart, topicInput: string, detail: ReadingDetail = "brief"): Result<TopicReading> {
  const resolved = resolveTopic(topicInput);
  if (!resolved.ok) return resolved;
  const topic = resolved.value;
  const full = detail === "full";
  const docs = topicDocs(index, topic);
  const howToRead = docs.find((indexed) => /Cach-xem/i.test(indexed.fileSlug));
  const primaryRoles = topic.palaces.filter((entry) => entry.tier === "chính").map((entry) => entry.role);
  const shownPalaces = topic.palaces.filter((entry) => full || entry.tier === "chính" || entry.role === "Mệnh");
  const body = chart.palaces.find((palace) => palace.isBodyPalace)!;
  const bodyListed = topic.palaces.some((entry) => entry.role === body.role);
  const palaces = [
    ...shownPalaces.map((entry) => palaceFacts(chart, palaceByRole(chart, entry.role), entry.tier, howToRead)),
    ...(topic.usesBodyPalace && !shownPalaces.some((entry) => entry.role === body.role) ? [palaceFacts(chart, body, "phụ", howToRead)] : []),
  ];
  const bodyDoc = index.bodyPalaceDocs.get(body.role as PalaceRole);
  const bodyPalace: BodyPalaceNote | undefined =
    topic.usesBodyPalace || bodyListed
      ? {
          role: body.role,
          branch: body.branch,
          ...(bodyDoc ? { doc: { path: bodyDoc.doc.path, title: bodyDoc.doc.title, summary: bodyDoc.summary, sources: bodyDoc.doc.sources } } : {}),
        }
      : undefined;

  const topicRoles = topic.palaces.map((entry) => entry.role);
  const primaryPalace = palaceByRole(chart, primaryRoles[0]!);
  const primaryGroup = threeSidesOf(chart, primaryPalace.branch).all;
  const primaryFolderDocs = index.palaceDocs.get(primaryRoles[0]!) ?? [];
  const ruleSources = [...docs, ...primaryFolderDocs];
  const implicitDocs: ReadonlyMap<IndexedDoc, PalaceRole> = new Map(ruleSources.map((indexed) => [indexed, primaryRoles[0]!] as const));
  const listing = collectTopicStars(index, docs, primaryRoles[0]!);
  const facts = [...listing.entries()].map(([star, listedIn]): TopicStarFact => {
    const holders = chart.palaces.filter((palace) => hasStarIn(palace, star));
    const inTopicPalaces = holders.filter((palace) => topicRoles.includes(palace.role as PalaceRole)).map((palace) => palace.role);
    const holderRoles = holders.map((palace) => palace.role as PalaceRole);
    const relevantRoles = holderRoles.filter((role) => topicRoles.includes(role));
    return {
      star,
      positions: holders.map((palace) => ({ role: palace.role, branch: palace.branch })),
      inTopicPalaces,
      inPrimaryThreeSides: holders.some((palace) => primaryGroup.includes(palace)),
      listedIn,
      rules: relevantRoles.length ? rulesFor(star, relevantRoles, ruleSources, implicitDocs, full ? 2 : 1) : [],
    };
  });
  const present = facts.filter((fact) => fact.positions.length > 0);
  const shownRoles = palaces.map((facts) => facts.role);
  const topicStars = full
    ? present
    : present.filter((fact) => fact.inPrimaryThreeSides || fact.positions.some((position) => primaryRoles.includes(position.role as PalaceRole)));
  const absentTopicStars = facts.filter((fact) => fact.positions.length === 0).map((fact) => fact.star);

  const findingRoles = full ? topicRoles : primaryRoles;
  const palaceFindings = findingRoles.map((role) => ({ role, findings: analyzePalaceAt(chart, palaceByRole(chart, role).branch).findings }));
  const patternRoles = full ? topicRoles : shownRoles;
  const patterns = detectPatterns(chart)
    .map((finding) => ({ finding, roles: patternRoles.filter((role) => findingText(finding).includes(roleTag(role))) }))
    .filter((item) => item.roles.length > 0);

  const starRoles = full ? [...new Set([...primaryRoles, ...(bodyListed ? [body.role as PalaceRole] : [])])] : primaryRoles;
  const starReferences = starRoles.map((role) => chartStarReferences(index, chart, palaceByRole(chart, role).branch, full ? "key" : "none"));

  return ok({
    topic,
    detail,
    palaces,
    ...(bodyPalace ? { bodyPalace } : {}),
    topicStars,
    absentTopicStars,
    palaceFindings,
    patterns,
    topicFiles: [...docs, ...(bodyDoc ? [bodyDoc] : [])].map((indexed) => ({ path: indexed.doc.path, title: indexed.doc.title, sources: indexed.doc.sources })),
    starReferences,
  });
}

const sideLine = (label: string, side: SidePalaceFacts): string =>
  `${label} ${side.role} (${branchName(side.branch)}): ${side.mainStars.map(formatSummary).join(", ") || "vô chính diệu"}`;

const quoteLine = (quote: KbQuote, maxChars: number, indent = "  "): string =>
  `${indent}> ${quote.aboutRole ? `(về cung ${quote.aboutRole}) ` : ""}${clip(quote.text, maxChars)}\n${indent}  — \`${quote.path}\` [${quote.source}]`;

function renderPalaceFacts(facts: TopicPalaceFacts, detail: ReadingDetail, maxChars: number): string {
  const voids = [facts.hasTuan ? "Tuần" : "", facts.hasTriet ? "Triệt" : ""].filter(Boolean).join(", ");
  return [
    `- **${facts.role}** (cung ${facts.tier}) tại ${facts.stemBranch}${facts.isBodyPalace ? ", cung an Thân" : ""}: ` +
      `${facts.mainStars.map(formatSummary).join(", ") || "vô chính diệu"}`,
    facts.transformations.length ? `  - Tứ Hóa: ${facts.transformations.join(", ")}` : "",
    `  - Tuần/Triệt: ${voids || "không"}`,
    detail === "full" && facts.otherStars.length ? `  - Phụ tinh, sao vòng: ${facts.otherStars.join(", ")}` : "",
    `  - Tam phương: ${[...facts.trines.map((side) => sideLine("hợp", side)), sideLine("xung chiếu", facts.opposite)].join("; ")}`,
    ...facts.kbRole.slice(0, detail === "full" ? 3 : 1).map((quote) => `  - Vai trò theo kho:\n${quoteLine(quote, maxChars, "    ")}`),
  ]
    .filter(Boolean)
    .join("\n");
}

const renderFindingLine = (item: Finding): string =>
  `- ${item.name} (${item.polarity}, ${CERTAINTY_LABEL[item.certainty]}): ${item.summary} [${item.source}${item.kbFile ? `; \`${item.kbFile}\`` : ""}]`;

function renderTopicStar(fact: TopicStarFact, maxChars: number): string {
  const where = fact.positions.map((position) => `${position.role} (${branchName(position.branch)})`).join(", ");
  const tags = [
    fact.inTopicPalaces.length ? `nằm ở cung của chủ đề: ${fact.inTopicPalaces.join(", ")}` : "",
    fact.inPrimaryThreeSides ? "trong tam phương tứ chính cung chính" : "",
  ].filter(Boolean);
  return [`- **${fact.star}**: ${where}${tags.length ? ` — ${tags.join("; ")}` : ""}`, ...fact.rules.map((quote) => quoteLine(quote, maxChars))].join("\n");
}

const TOPIC_FULL_LIMITS: RenderLimits = { maxReferences: 5, maxExcerpts: 2, maxExcerptChars: 400 };

const briefPalaceLine = (facts: TopicPalaceFacts): string => {
  const voids = [facts.hasTuan ? "Tuần" : "", facts.hasTriet ? "Triệt" : ""].filter(Boolean).join(", ");
  return `- ${facts.role} (${facts.tier}${facts.isBodyPalace ? ", Thân" : ""}) ${branchName(facts.branch)}: ${
    facts.mainStars.map(formatSummary).join(", ") || "vô chính diệu"
  }${voids ? `; ${voids}` : ""}`;
};

const certaintyShort = (item: Finding): string => `${item.name} (${CERTAINTY_LABEL[item.certainty]})`;

function renderTopicReadingBrief(reading: TopicReading): string {
  const findings = reading.palaceFindings.flatMap((entry) => entry.findings.filter((item) => item.polarity !== "trung tính"));
  const howToRead = reading.topicFiles[0];
  const bodyDoc = reading.bodyPalace?.doc;
  const fixedPaths = [howToRead?.path, bodyDoc?.path].filter((item): item is string => Boolean(item));
  const references = topReferences(
    reading.starReferences.flatMap((result) => result.entries.map((entry) => entry.lookup)),
    5 - fixedPaths.length,
  ).filter((item) => !fixedPaths.includes(item.path));
  return [
    `# ${reading.topic.label} (tóm tắt)`,
    "Vị trí sao, cung tính từ lá số (chắc chắn); câu trích là nguyên văn kho.",
    ...reading.palaces.map(briefPalaceLine),
    reading.bodyPalace ? `Thân cư ${reading.bodyPalace.role} (${branchName(reading.bodyPalace.branch)}).` : "",
    `Sao kho nêu cho chủ đề có mặt: ${
      reading.topicStars.map((fact) => `${fact.star} (${fact.positions.map((position) => position.role).join(", ")})`).join(", ") || "không có"
    }`,
    `Phân tích cung: ${findings.map(certaintyShort).join("; ") || "không có kết luận tốt/xấu"}`,
    `Cách cục: ${reading.patterns.map((item) => certaintyShort(item.finding)).join("; ") || "không có"}`,
    "File kho:",
    ...(howToRead ? [`- \`${howToRead.path}\`: ${clip(howToRead.title, 150)} [Nguồn chính: ${clip(howToRead.sources, 70)}]`] : []),
    ...(bodyDoc ? [`- \`${bodyDoc.path}\`: ${clip(bodyDoc.summary.replace(/\s+/g, " "), 150)} [Nguồn chính: ${clip(bodyDoc.sources, 70)}]`] : []),
    ...references.map(renderBriefReference),
    FULL_DETAIL_HINT,
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderTopicReading(reading: TopicReading): string {
  if (reading.detail !== "full") return renderTopicReadingBrief(reading);
  const full = reading.detail === "full";
  const limits = full ? TOPIC_FULL_LIMITS : BRIEF_LIMITS;
  const nonEmptyFindings = reading.palaceFindings.filter((entry) => entry.findings.length > 0);
  return [
    `# Chủ đề: ${reading.topic.label} (${reading.detail === "full" ? "đầy đủ" : "tóm tắt"})`,
    "Cách đọc kết quả: vị trí sao, cung, Tứ Hóa, Tuần/Triệt tính từ lá số nên chắc chắn. Câu có dấu > là trích nguyên văn kho, kèm file và nguồn sách. " +
      "Kết luận của phân tích cung và cách cục ghi rõ 'khớp chắc chắn' hay 'khớp theo cách hiểu'. Tool không tự phán đoán ngoài những gì kho viết.",
    "## Cung cần xem",
    ...reading.palaces.map((facts) => renderPalaceFacts(facts, reading.detail, limits.maxExcerptChars)),
    reading.bodyPalace
      ? [
          `## Cung an Thân: Thân cư ${reading.bodyPalace.role} (${branchName(reading.bodyPalace.branch)})`,
          reading.bodyPalace.doc
            ? `> ${clip(reading.bodyPalace.doc.summary, limits.maxExcerptChars)}\n  — \`${reading.bodyPalace.doc.path}\` [${reading.bodyPalace.doc.sources}]`
            : "Kho không có file riêng cho trường hợp Thân cư cung này.",
        ].join("\n")
      : "",
    "## Sao kho nêu cho chủ đề có trên lá số",
    "Danh sách sao lấy từ từ khóa và đề mục của các file bộ sao trong chủ đề. Câu trích là điều kho viết về sao đó trong chủ đề (thường nói về cung chính); " +
      "tool không kiểm các điều kiện khác trong câu, cần đối chiếu trước khi dùng.",
    reading.topicStars.length ? reading.topicStars.map((fact) => renderTopicStar(fact, limits.maxExcerptChars)).join("\n") : "Không có sao nào trong danh sách của kho nằm ở các cung liên quan.",
    full && reading.absentTopicStars.length ? `Không có trên lá số: ${reading.absentTopicStars.join(", ")}` : "",
    "## Phân tích cung (palace analysis)",
    nonEmptyFindings.length
      ? nonEmptyFindings
          .map((entry) => [`### ${entry.role}`, ...entry.findings.filter((item) => full || item.polarity !== "trung tính").map(renderFindingLine)].join("\n"))
          .join("\n\n")
      : "Không có kết luận nào.",
    "## Cách cục liên quan các cung trên",
    reading.patterns.length
      ? [
          "Lọc theo cung được nêu trong điều kiện của cách (khớp theo cách hiểu về mức liên quan).",
          ...reading.patterns.map((item) => `${renderFindingLine(item.finding)} — cung nhắc tới: ${item.roles.join(", ")}`),
        ].join("\n")
      : "Không có cách cục nào nêu tới các cung này.",
    ...reading.starReferences.map((result) => renderChartStarReferences(result, limits)),
    "## File kho của chủ đề",
    ...reading.topicFiles.map((file) => `- \`${file.path}\` — ${file.title} [${file.sources}]`),
  ]
    .filter(Boolean)
    .join("\n\n");
}
