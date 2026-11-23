import { renderFinding, type Finding, type Polarity } from "../analysis/finding.js";
import type { ChartComparison, PersonSummary } from "./compare.js";

const GROUPS: ReadonlyArray<{ readonly polarity: Polarity; readonly heading: string }> = [
  { polarity: "tốt", heading: "Hợp" },
  { polarity: "xấu", heading: "Xung, khắc" },
  { polarity: "trung tính", heading: "Trung tính" },
];

const describePerson = (person: PersonSummary): string =>
  `- **${person.label}:** ${person.gender}, năm ${person.year} (${person.nayin}), Mệnh ở ${person.lifePalace}, ${person.bureau}`;

const renderGroup = (heading: string, items: readonly Finding[]): string =>
  `## ${heading}\n\n${items.length ? items.map(renderFinding).map((text) => `- ${text}`).join("\n") : "- (không có)"}`;

export function renderComparison(comparison: ChartComparison): string {
  const header = [
    "# So sánh hai lá số",
    "",
    ...comparison.people.map(describePerson),
    `- **Quan hệ xét:** ${comparison.relationship.label} (cung ${comparison.relationship.palace})`,
    "",
    "Không có điểm tổng hay kết luận chung: kho tri thức không có quy tắc cho điểm hợp tuổi. Các mục dưới đây chỉ là dữ kiện xếp theo nhóm.",
  ].join("\n");
  const groups = GROUPS.map(({ polarity, heading }) => renderGroup(heading, comparison.findings.filter((item) => item.polarity === polarity)));
  const notes = comparison.notes.length ? `## Ghi chú\n\n${comparison.notes.map((note) => `- ${note}`).join("\n")}` : "";
  const skipped = `## Quy tắc chưa áp dụng\n\n${comparison.skipped.map((item) => `- ${item.rule} [${item.source}]: ${item.reason}`).join("\n")}`;
  return [header, ...groups, notes, skipped].filter(Boolean).join("\n\n");
}
