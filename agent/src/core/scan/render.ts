import { CERTAINTY_LABEL, type Certainty } from "../analysis/finding.js";
import { branchName, stemBranchName } from "../calendar/stem-branch.js";
import type { Chart } from "../chart/types.js";
import { CHILDHOOD_END_AGE } from "./context.js";
import { GOAL_PRESETS } from "./presets.js";
import { SKIPPED_TRIGGERS } from "./skipped.js";
import { ADULT_TRIGGER_MIN_AGE } from "./triggers.js";
import type { CriterionInfo, RankedYear, ScanResult, YearScan } from "./types.js";

const RANK_LABEL = {
  net: "điểm = số tiêu chí tốt trừ số tiêu chí xấu; chỉ liệt kê năm điểm dương",
  count: "điểm = số tiêu chí tốt; năm chỉ có tiêu chí xấu nằm ở mục năm cần lưu ý",
} as const;

const MIXED_CERTAINTY = "chắc chắn hoặc theo cách hiểu tùy năm";

function certaintyLabel(criterion: CriterionInfo, seen: ReadonlySet<Certainty> | undefined): string {
  if (!seen || !seen.size) return CERTAINTY_LABEL[criterion.certainty];
  return seen.size > 1 ? MIXED_CERTAINTY : CERTAINTY_LABEL[[...seen][0]!];
}

export function renderYearScan(chart: Chart, result: ScanResult): string {
  const code = new Map(result.criteria.map((criterion, i) => [criterion.id, `C${i + 1}`]));
  const byId = new Map(result.criteria.map((criterion) => [criterion.id, criterion]));
  const seenCertainty = new Map<string, Set<Certainty>>();
  for (const hit of result.years.flatMap((year) => year.hits)) {
    seenCertainty.set(hit.criterionId, (seenCertainty.get(hit.criterionId) ?? new Set<Certainty>()).add(hit.certainty));
  }
  const palace = (branch: number | null): string => (branch === null ? "—" : `${branchName(branch)} (${chart.palaces[branch]!.role})`);
  const minorCell = (year: YearScan): string =>
    year.childhoodPalace === null ? palace(year.minorPalace) : `đồng hạn ${palace(year.childhoodPalace)}`;
  const header = [
    `## Quét vận hạn ${result.fromYear}–${result.toYear}${result.goal ? `: ${result.goal}` : ""}`,
    result.goal ? GOAL_PRESETS[result.goal].description : "",
  ];
  const table = [
    "| Năm | Can chi | Tuổi | Đại hạn | Tiểu hạn | Khớp |",
    "|---|---|---|---|---|---|",
    ...result.years.map(
      (year) =>
        `| ${year.year} | ${stemBranchName(year.stemBranch)} | ${year.age} | ${palace(year.majorPalace)} | ${minorCell(year)} | ${
          year.hits.map((hit) => (hit.decade ? `(${code.get(hit.criterionId)})` : code.get(hit.criterionId))).join(" ") || "—"
        } |`,
    ),
    "",
    "Mã trong ngoặc là tiêu chí cấp đại hạn: ghi một lần ở mục ghi chú theo đại hạn, không cộng điểm từng năm.",
    ...(result.years.some((year) => year.age < CHILDHOOD_END_AGE)
      ? [
          `Dưới ${CHILDHOOD_END_AGE} tuổi kho xem đồng hạn thay tiểu hạn (NP2 tr.10-12): không xét tiêu chí neo vào cung tiểu hạn; trigger hôn nhân, con cái, tài lộc, công danh chỉ xét từ ${ADULT_TRIGGER_MIN_AGE} tuổi.`,
        ]
      : []),
  ];
  const assumptionCode = new Map([...new Set(result.criteria.flatMap((criterion) => criterion.assumptions))].map((text, i) => [text, `G${i + 1}`]));
  const legend = [
    "### Tiêu chí",
    ...result.criteria.map(
      (criterion) =>
        `- **${code.get(criterion.id)}** ${criterion.name} (${criterion.polarity}, ${certaintyLabel(criterion, seenCertainty.get(criterion.id))}) [${criterion.source}]${
          criterion.assumptions.length ? ` · cách hiểu ${criterion.assumptions.map((text) => assumptionCode.get(text)).join(", ")}` : ""
        }`,
    ),
    ...(assumptionCode.size ? ["", "Cách hiểu đã dùng:", ...[...assumptionCode].map(([text, key]) => `- ${key}: ${text}`)] : []),
  ];
  const yearEntry = (ranked: RankedYear, i: number, scoreText: string): string => {
    const year = result.years.find((item) => item.year === ranked.year)!;
    const hits = year.hits
      .filter((hit) => !hit.decade)
      .map((hit) => {
        const criterion = byId.get(hit.criterionId)!;
        return `  - ${code.get(hit.criterionId)} ${criterion.name} (${CERTAINTY_LABEL[hit.certainty]}): ${hit.details.join("; ")} [${criterion.source}]`;
      });
    return [`${i + 1}. **${year.year} ${stemBranchName(year.stemBranch)}** (tuổi ${year.age}): ${scoreText}`, ...hits].join("\n");
  };
  const ranking = [
    `### Xếp hạng (${RANK_LABEL[result.rankBy]})`,
    ...(result.ranking.length
      ? result.ranking.map((ranked, i) =>
          yearEntry(ranked, i, `điểm ${ranked.score} — tốt ${ranked.favourable}, trung tính ${ranked.neutral}, xấu ${ranked.unfavourable}`),
        )
      : ["Không năm nào có điểm dương."]),
  ];
  const caution = result.caution.length
    ? ["### Năm cần lưu ý (nhiều tiêu chí xấu)", ...result.caution.map((ranked, i) => yearEntry(ranked, i, `xấu ${ranked.unfavourable}, tốt ${ranked.favourable}`))]
    : [];
  const decades = result.decadeNotes.length
    ? [
        "### Ghi chú theo đại hạn (không tính điểm từng năm)",
        ...result.decadeNotes.map((note) => {
          const criterion = byId.get(note.criterionId)!;
          return `- Đại hạn ${palace(note.majorPalace)}, năm ${note.fromYear}–${note.toYear}: ${code.get(note.criterionId)} ${criterion.name} (${CERTAINTY_LABEL[note.certainty]}): ${note.details.join("; ")} [${criterion.source}]`;
        }),
      ]
    : [];
  const skipped = result.goal ? SKIPPED_TRIGGERS.filter((item) => item.topic.includes(result.goal!)) : [];
  const skippedBlock = skipped.length
    ? [`### Chưa tính (${skipped.length} quy tắc)`, ...skipped.map((item) => `- ${item.rule} [${item.source}]: ${item.reason}`)]
    : [];
  return [
    header.filter(Boolean).join("\n"),
    table.join("\n"),
    legend.join("\n"),
    ranking.join("\n"),
    ...[caution, decades, skippedBlock].filter((block) => block.length).map((block) => block.join("\n")),
    "Kết quả là điều kiện theo sách cổ, không phải dự báo chắc chắn; khi luận phải nêu nguồn và cách hiểu.",
  ].join("\n\n");
}
