import { branchName, stemBranchName, stemName } from "../calendar/stem-branch.js";
import { CERTAINTY_LABEL, renderFinding, renderFindingBrief, type Finding, type RenderDetail } from "../analysis/finding.js";
import type { Chart } from "../chart/types.js";
import type { BirthHourComparison } from "./birth-hour.js";
import type { LayerTransformationSet, PeriodLayers, TimeLayer } from "./layers.js";
import type { LifetimeTimeline } from "./timeline.js";

const SHORT: Readonly<Record<string, string>> = { "Hóa Lộc": "Lộc", "Hóa Quyền": "Quyền", "Hóa Khoa": "Khoa", "Hóa Kỵ": "Kỵ" };

const natal = (chart: Chart, branch: number): string => `${branchName(branch)} (gốc: ${chart.palaces[branch]!.role})`;

const renderFindings = (findings: readonly Finding[], detail: RenderDetail = "full"): string =>
  findings.length
    ? ["## Nhận định", ...findings.map((item) => (detail === "brief" ? renderFindingBrief(item) : `- ${renderFinding(item)}`))].join("\n")
    : "";

const briefExtras = (assumptions: readonly string[], variants: readonly string[]): readonly string[] => [
  ...(assumptions.length ? [`  - giả định: ${assumptions.length} mục`] : []),
  ...(variants.length ? [`  - Dị bản: ${variants.join("; ")}`] : []),
];

function renderLayer(chart: Chart, layer: TimeLayer, detail: RenderDetail = "full"): string {
  if (detail === "brief") {
    return [`- **${layer.name}**: ${natal(chart, layer.palace)} — ${CERTAINTY_LABEL[layer.certainty]} [${layer.source}]`, ...briefExtras(layer.assumptions, layer.variants)].join("\n");
  }
  const lines = [
    `- **${layer.name}**: ${natal(chart, layer.palace)} — ${CERTAINTY_LABEL[layer.certainty]} [${layer.source}]`,
    ...layer.assumptions.map((text) => `  - Cách hiểu: ${text}`),
    ...layer.variants.map((text) => `  - Dị bản: ${text}`),
  ];
  return lines.join("\n");
}

function renderRoles(layers: readonly TimeLayer[]): string {
  const withRoles = layers.filter((layer) => layer.roles !== null);
  if (!withRoles.length) return "";
  const header = `| Cung | ${withRoles.map((layer) => layer.name).join(" | ")} |`;
  const divider = `|---|${withRoles.map(() => "---").join("|")}|`;
  const rows = Array.from({ length: 12 }, (_, branch) => {
    const cells = withRoles.map((layer) => layer.roles!.find((item) => item.branch === branch)!.role);
    return `| ${branchName(branch)} | ${cells.join(" | ")} |`;
  });
  return ["## 12 cung theo từng lớp", header, divider, ...rows].join("\n");
}

function renderTransformation(set: LayerTransformationSet, detail: RenderDetail = "full"): string {
  const stars = set.stars
    .map((item) => `${item.star} ${SHORT[item.transformation]}${item.palace === null ? "" : ` (${branchName(item.palace)})`}`)
    .join(", ");
  if (detail === "brief") {
    return [
      `- **${set.stemSource}** — can ${stemName(set.stem)}${set.primary ? "" : " (phụ)"}: ${stars}. Phạm vi: ${set.scope}. ${CERTAINTY_LABEL[set.certainty]} [${set.source}]`,
      ...briefExtras(set.assumptions, set.variants),
    ].join("\n");
  }
  const lines = [
    `- **${set.stemSource}** — can ${stemName(set.stem)}${set.primary ? "" : " (phụ)"}: ${stars}. Phạm vi: ${set.scope}. ${CERTAINTY_LABEL[set.certainty]} [${set.source}]`,
    ...set.assumptions.map((text) => `  - Cách hiểu: ${text}`),
    ...set.variants.map((text) => `  - Dị bản: ${text}`),
  ];
  return lines.join("\n");
}

export function renderPeriodLayers(chart: Chart, layers: PeriodLayers, detail: RenderDetail = "full"): string {
  const view = layers.view;
  const when = [
    view.hourBranch !== undefined ? `giờ ${branchName(view.hourBranch)}` : "",
    view.day !== undefined ? `ngày ${view.day}` : "",
    view.month !== undefined ? `tháng ${view.month}` : "",
    `năm ${stemBranchName(layers.viewYear)} (${view.year})`,
  ]
    .filter(Boolean)
    .join(", ");
  const major = layers.majorPeriod;
  return [
    `# Vận hạn: ${when}`,
    `- Tuổi âm: ${layers.age}`,
    `- Đại hạn: ${major ? `${major.fromAge}–${major.toAge} ở ${natal(chart, major.palace)}` : "chưa vào đại hạn"}`,
    `- Trùng phùng đại tiểu hạn: ${layers.coincidence.majorMinor ? "có" : "không"}; đại hạn trùng cung Lưu niên: ${layers.coincidence.majorFlowingYear ? "có" : "không"}`,
    `- Cung tuổi: ${branchName(layers.ageYear.agePalace)}; tiểu hạn về cung tuổi: ${layers.ageYear.minorAtAgePalace ? "có" : "không"}; đại hạn ở cung tuổi: ${layers.ageYear.majorAtAgePalace ? "có" : "không"}`,
    `- Năm kỵ của tuổi: ${layers.taboo.tabooYearBranches.map(branchName).join(", ")}; năm này ${layers.taboo.yearHit ? "là năm kỵ" : "không phải năm kỵ"}`,
    "",
    "## Các lớp hạn",
    ...layers.layers.map((layer) => renderLayer(chart, layer, detail)),
    "",
    detail === "brief" ? "" : renderRoles(layers.layers),
    "",
    "## Tứ Hóa theo lớp",
    ...layers.transformations.map((set) => renderTransformation(set, detail)),
    "",
    "## Sao lưu niên",
    layers.flowingStars.map((star) => `${star.name} ${branchName(star.palace)}`).join(", "),
    "",
    renderFindings(layers.findings, detail),
  ]
    .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
    .join("\n")
    .trim();
}

export function renderLifetimeTimeline(chart: Chart, timeline: LifetimeTimeline, detail: RenderDetail = "full"): string {
  if (detail === "brief") {
    return [
      `# Dòng vận 1–${timeline.maxAge} tuổi`,
      `- Đại hạn: ${timeline.majorPeriods.map((item) => `${item.fromAge}–${item.toAge} ${item.role} (${branchName(item.palace)})`).join("; ")}`,
      `- Đồng hạn: ${timeline.childhood.map((item) => `${item.age} ${branchName(item.palace)}`).join(", ")}`,
      `- Trùng phùng: ${timeline.coincidences.length ? timeline.coincidences.map((item) => `${item.age} (${item.year})`).join(", ") : "không có"}`,
      `- Tiểu hạn về cung tuổi (${branchName(timeline.agePalace)}): ${timeline.ageYearReturns
        .map((item) => `${item.age} (${item.year})${item.majorAtAgePalace ? " cả đại hạn" : ""}${item.coincidence ? " trùng phùng" : ""}`)
        .join(", ")}`,
      `- Năm tuổi kỵ: ${timeline.tabooYears.map((item) => `${item.year} (${item.age})`).join(", ")}`,
      "",
      renderFindings(timeline.findings, detail),
    ]
      .join("\n")
      .trim();
  }
  return [
    `# Dòng vận 1–${timeline.maxAge} tuổi`,
    "## Đại hạn",
    "| Tuổi | Năm | Cung |",
    "|---|---|---|",
    ...timeline.majorPeriods.map((item) => `| ${item.fromAge}–${item.toAge} | ${item.fromYear}–${item.toYear} | ${item.role} (${branchName(item.palace)}) |`),
    "",
    "## Đồng hạn (dưới 13 tuổi)",
    timeline.childhood.map((item) => `${item.age}: ${item.role} (${branchName(item.palace)})`).join("; "),
    "",
    "## Trùng phùng",
    timeline.coincidences.length
      ? timeline.coincidences.map((item) => `${item.age} tuổi (${item.year}) ở ${natal(chart, item.palace)}`).join("; ")
      : "không có",
    "",
    `## Tiểu hạn về cung tuổi (${branchName(timeline.agePalace)})`,
    timeline.ageYearReturns
      .map((item) => `${item.age} (${item.year})${item.majorAtAgePalace ? ", đại hạn cũng ở cung tuổi" : ""}${item.coincidence ? ", trùng phùng" : ""}`)
      .join("; "),
    "",
    "## Năm tuổi kỵ",
    timeline.tabooYears.map((item) => `${item.year} ${branchName(item.yearBranch)} (${item.age} tuổi)`).join("; "),
    "",
    renderFindings(timeline.findings),
  ]
    .join("\n")
    .trim();
}

export const renderChildHazardHours = (findings: readonly Finding[]): string =>
  ["# Giờ xấu trẻ em (TVTH tr.89-90)", ...findings.map((item) => `- ${renderFinding(item)}`)].join("\n");

export function renderBirthHourCandidates(comparison: BirthHourComparison): string {
  const hourStarNames = comparison.candidates[0]?.hourStars.map((item) => item.star) ?? [];
  return [
    "# So sánh giờ sinh ứng viên",
    "## Điểm nhóm giờ (MLTC tr.987-988)",
    ...comparison.groupScores.map((score) => `- Nhóm ${score.group}: ${score.score}${score.matched.length ? ` (${score.matched.join("; ")})` : ""}`),
    "",
    "## Ứng viên",
    `| Giờ | Nhóm | Mệnh | Thân | Thân cư | Cục | Chính tinh Mệnh | ${hourStarNames.join(" | ")} |`,
    `|---|---|---|---|---|---|---|${hourStarNames.map(() => "---").join("|")}|`,
    ...comparison.candidates.map(
      (c) =>
        `| ${branchName(c.hourBranch)} | ${c.group} | ${branchName(c.lifePalace)} | ${branchName(c.bodyPalace)} | ${c.bodyPalaceRole} | ${c.bureau} | ${c.mainStarsInLife.join(", ") || "vô chính diệu"} | ${c.hourStars
          .map((item) => item.palaces.map(branchName).join(", ") || "—")
          .join(" | ")} |`,
    ),
    "",
    ...comparison.candidates.filter((c) => c.bodyPalaceTrait).map((c) => `- Giờ ${branchName(c.hourBranch)}: ${c.bodyPalaceTrait} (NP2 tr.57-59)`),
    "",
    renderFindings(comparison.findings),
  ]
    .join("\n")
    .trim();
}
