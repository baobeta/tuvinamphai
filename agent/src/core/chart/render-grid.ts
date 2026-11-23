import { BODY_LORD_BY_YEAR_BRANCH, LIFE_LORD_BY_LIFE_BRANCH } from "../analysis/natal-tables.js";
import { branchName, stemName } from "../calendar/stem-branch.js";
import { formatStar } from "./render.js";
import type { Chart, Palace } from "./types.js";

export type GridFormat = "text" | "markdown";

export interface GridOptions {
  readonly cellWidth?: number;
  readonly format?: GridFormat;
  readonly name?: string;
}

export const DEFAULT_GRID_CELL_WIDTH = 26;
export const MIN_GRID_CELL_WIDTH = 12;

const CENTER = -1;

export const GRID_LAYOUT: readonly (readonly number[])[] = [
  [5, 6, 7, 8],
  [4, CENTER, CENTER, 9],
  [3, CENTER, CENTER, 10],
  [2, 1, 0, 11],
];

const graphemes = new Intl.Segmenter("vi", { granularity: "grapheme" });

const splitGraphemes = (text: string): readonly string[] => Array.from(graphemes.segment(text.normalize("NFC")), (part) => part.segment);

export const displayLength = (text: string): number => splitGraphemes(text).length;

export const padDisplay = (text: string, width: number): string => {
  const normalized = text.normalize("NFC");
  return normalized + " ".repeat(Math.max(0, width - displayLength(normalized)));
};

const hardSplit = (word: string, width: number): readonly string[] => {
  const parts = splitGraphemes(word);
  const chunks: string[] = [];
  for (let start = 0; start < parts.length; start += width) chunks.push(parts.slice(start, start + width).join(""));
  return chunks;
};

const wrapWords = (text: string, width: number): readonly string[] => {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/).filter(Boolean).flatMap((item) => hardSplit(item, width))) {
    if (!current) current = word;
    else if (displayLength(current) + 1 + displayLength(word) <= width) current = `${current} ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  return current ? [...lines, current] : lines;
};

export const wrapItems = (items: readonly string[], width: number): readonly string[] => {
  const lines: string[] = [];
  let current = "";
  items.forEach((item, index) => {
    const token = index < items.length - 1 ? `${item},` : item;
    if (current && displayLength(current) + 1 + displayLength(token) <= width) {
      current = `${current} ${token}`;
      return;
    }
    if (current) lines.push(current);
    const pieces = wrapWords(token, width);
    lines.push(...pieces.slice(0, -1));
    current = pieces[pieces.length - 1] ?? "";
  });
  return current ? [...lines, current] : lines;
};

const MAJOR_GROUP = "chính tinh";
const NO_MAJOR_STAR = "(vô chính diệu)";
const MINOR_GROUPS: readonly string[] = ["phụ tinh", "vòng Bác Sĩ", "vòng Tràng Sinh", "vòng Thái Tuế"];

const palaceHeading = (palace: Palace): string => {
  const voids = palace.stars.filter((star) => star.group === "Tuần Triệt").map((star) => star.name);
  return `${palace.role.toUpperCase()}${palace.isBodyPalace ? " · THÂN" : ""}${voids.length ? ` [${voids.join(", ")}]` : ""}`;
};

const palaceSubheading = (palace: Palace): string => `${stemName(palace.stem)} ${branchName(palace.branch)} · ĐH ${palace.majorPeriodStartAge}`;

const palaceSections = (palace: Palace): { readonly major: readonly string[]; readonly minor: readonly string[] } => ({
  major: palace.stars.filter((star) => star.group === MAJOR_GROUP).map(formatStar),
  minor: palace.stars.filter((star) => MINOR_GROUPS.includes(star.group)).map(formatStar),
});

const palaceLines = (palace: Palace, width: number): readonly string[] => {
  const { major, minor } = palaceSections(palace);
  return [
    ...wrapWords(palaceHeading(palace), width),
    ...wrapWords(palaceSubheading(palace), width),
    ...(major.length ? wrapItems(major, width) : wrapWords(NO_MAJOR_STAR, width)),
    "─".repeat(Math.min(width, 6)),
    ...wrapItems(minor, width),
  ];
};

const centerInfo = (chart: Chart, name: string | undefined): readonly string[] => {
  const { parameters: p, birth } = chart;
  const lunar = birth.lunar;
  const lifeBranch = branchName(p.lifePalace);
  const yearBranch = branchName(p.year.branch);
  return [
    name ? name.replace(/\s+/g, " ").trim() || "LÁ SỐ TỬ VI" : "LÁ SỐ TỬ VI",
    ...(birth.solar ? [`Dương lịch: ${birth.solar.day}/${birth.solar.month}/${birth.solar.year}${birth.clock ? ` lúc ${birth.clock}` : ""}`] : []),
    `Âm lịch: ${lunar.day}/${lunar.month}${lunar.isLeapMonth ? " (nhuận)" : ""} năm ${stemName(p.year.stem)} ${yearBranch} (${lunar.year})`,
    `Giờ ${branchName(p.hour)} · ${chart.polarityLabel}`,
    `Bản mệnh: ${chart.natalNayin.name}`,
    `Cục: ${p.bureau.name}`,
    chart.bureauVersusNatal.description,
    `Mệnh chủ: ${LIFE_LORD_BY_LIFE_BRANCH[lifeBranch]}`,
    `Thân chủ: ${BODY_LORD_BY_YEAR_BRANCH[yearBranch]}`,
    `Mệnh ${lifeBranch} · Thân cư ${chart.bodyPalaceRole}`,
  ];
};

const fillLines = (lines: readonly string[], height: number): readonly string[] => [
  ...lines,
  ...Array.from({ length: Math.max(0, height - lines.length) }, () => ""),
];

const centerVertically = (lines: readonly string[], height: number): readonly string[] => {
  const top = Math.max(0, Math.floor((height - lines.length) / 2));
  return fillLines([...Array.from({ length: top }, () => ""), ...lines], height);
};

const centerHorizontally = (text: string, width: number): string => {
  const left = Math.max(0, Math.floor((width - displayLength(text)) / 2));
  return padDisplay(" ".repeat(left) + text, width);
};

function renderTextGrid(chart: Chart, cellWidth: number, name: string | undefined): string {
  const textWidth = cellWidth - 2;
  const cell = (text: string): string => ` ${padDisplay(text, textWidth)} `;
  const linesOf = (branch: number): readonly string[] => palaceLines(chart.palaces[branch]!, textWidth);
  const heightOf = (branches: readonly number[]): number => Math.max(1, ...branches.map((branch) => linesOf(branch).length));
  const bar = "─".repeat(cellWidth);
  const border = (left: string, joints: readonly string[], right: string): string =>
    left + [bar, bar, bar, bar].map((segment, index) => (index === 0 ? segment : `${joints[index - 1]}${segment}`)).join("") + right;
  const renderRow = (branches: readonly number[]): readonly string[] => {
    const height = heightOf(branches);
    const columns = branches.map((branch) => fillLines(linesOf(branch), height));
    return Array.from({ length: height }, (_, line) => `│${columns.map((column) => cell(column[line]!)).join("│")}│`);
  };

  const [topRow, upperRow, lowerRow, bottomRow] = GRID_LAYOUT as [readonly number[], readonly number[], readonly number[], readonly number[]];
  const upperSides = [upperRow[0]!, upperRow[3]!];
  const lowerSides = [lowerRow[0]!, lowerRow[3]!];
  const centerWidth = cellWidth * 2 + 1;
  const centerText = centerInfo(chart, name).flatMap((line) => wrapWords(line, centerWidth - 2));
  const upperHeight = heightOf(upperSides);
  const lowerHeight = Math.max(heightOf(lowerSides), centerText.length - upperHeight - 1);
  const middleHeight = upperHeight + 1 + lowerHeight;
  const centerLines = centerVertically(centerText, middleHeight).map((line) => ` ${centerHorizontally(line, centerWidth - 2)} `);
  const upperLeft = fillLines(linesOf(upperSides[0]!), upperHeight);
  const upperRight = fillLines(linesOf(upperSides[1]!), upperHeight);
  const lowerLeft = fillLines(linesOf(lowerSides[0]!), lowerHeight);
  const lowerRight = fillLines(linesOf(lowerSides[1]!), lowerHeight);
  const middle = Array.from({ length: middleHeight }, (_, line) => {
    if (line === upperHeight) return `├${bar}┤${centerLines[line]}├${bar}┤`;
    const [left, right] = line < upperHeight ? [upperLeft[line]!, upperRight[line]!] : [lowerLeft[line - upperHeight - 1]!, lowerRight[line - upperHeight - 1]!];
    return `│${cell(left)}│${centerLines[line]}│${cell(right)}│`;
  });

  return [
    border("┌", ["┬", "┬", "┬"], "┐"),
    ...renderRow(topRow),
    border("├", ["┼", "┴", "┼"], "┤"),
    ...middle,
    border("├", ["┼", "┬", "┼"], "┤"),
    ...renderRow(bottomRow),
    border("└", ["┴", "┴", "┴"], "┘"),
  ].join("\n");
}

const escapeMarkdown = (text: string): string => text.replace(/\|/g, "\\|");

const markdownPalace = (palace: Palace): string => {
  const { major, minor } = palaceSections(palace);
  return [
    `**${palaceHeading(palace)}**`,
    palaceSubheading(palace),
    major.length ? `**${major.join(", ")}**` : NO_MAJOR_STAR,
    minor.join(", "),
  ]
    .filter(Boolean)
    .map(escapeMarkdown)
    .join("<br>");
};

function renderMarkdownGrid(chart: Chart, name: string | undefined): string {
  const info = centerInfo(chart, name).map(escapeMarkdown).join("<br>");
  const rows = GRID_LAYOUT.map((row, rowIndex) =>
    row.map((branch, columnIndex) => {
      if (branch !== CENTER) return markdownPalace(chart.palaces[branch]!);
      return rowIndex === 1 && columnIndex === 1 ? info : "";
    }),
  );
  const line = (cells: readonly string[]): string => `| ${cells.join(" | ")} |`;
  return [line(rows[0]!), "|---|---|---|---|", ...rows.slice(1).map(line)].join("\n");
}

export function renderChartGrid(chart: Chart, options: GridOptions = {}): string {
  if (options.format === "markdown") return renderMarkdownGrid(chart, options.name);
  const cellWidth = Math.max(MIN_GRID_CELL_WIDTH, Math.floor(options.cellWidth ?? DEFAULT_GRID_CELL_WIDTH));
  return renderTextGrid(chart, cellWidth, options.name);
}
