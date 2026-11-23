import { branchName, stemBranchName, stemName } from "../calendar/stem-branch.js";
import type { YearView } from "./periods.js";
import type { Chart, Palace, PlacedStar } from "./types.js";

const SHORT_TRANSFORMATION: Readonly<Record<string, string>> = {
  "Hóa Lộc": "Lộc",
  "Hóa Quyền": "Quyền",
  "Hóa Khoa": "Khoa",
  "Hóa Kỵ": "Kỵ",
};

export const formatStar = (star: PlacedStar): string => {
  const details = [star.brightness, star.transformation ? `Hóa ${SHORT_TRANSFORMATION[star.transformation]}` : undefined].filter(Boolean);
  return details.length ? `${star.name} (${details.join(", ")})` : star.name;
};

const starsOfGroup = (palace: Palace, groups: readonly string[]): string =>
  palace.stars.filter((star) => groups.includes(star.group)).map(formatStar).join(", ") || "—";

const palaceLabel = (palace: Palace): string =>
  `${palace.role}${palace.isBodyPalace ? " (Thân)" : ""} · ${stemName(palace.stem)} ${branchName(palace.branch)}`;

export type ChartRenderDetail = "brief" | "full";

export const SHA_STARS: readonly string[] = ["Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp"];

export function renderChart(chart: Chart, detail: ChartRenderDetail = "full"): string {
  const { parameters: p, birth } = chart;
  const lunar = birth.lunar;
  const solarText = birth.solar ? `${birth.solar.day}/${birth.solar.month}/${birth.solar.year}` : "—";
  const header = [
    `# Lá số Tử Vi`,
    `- Dương lịch: ${solarText}${birth.clock ? ` lúc ${birth.clock}` : ""}`,
    `- Âm lịch: ngày ${lunar.day} tháng ${lunar.month}${lunar.isLeapMonth ? " (nhuận)" : ""} năm ${stemBranchName(p.year)} (${lunar.year}), giờ ${branchName(p.hour)}`,
    `- ${chart.polarityLabel}: các vòng Bác Sĩ, Tràng Sinh, đại hạn đi ${p.forward ? "thuận" : "nghịch"}`,
    `- Bản mệnh: ${chart.natalNayin.name} · Cục: ${p.bureau.name} · ${chart.bureauVersusNatal.description}`,
    `- Mệnh ở ${branchName(p.lifePalace)}, Thân cư ${chart.bodyPalaceRole} (${branchName(p.bodyPalace)})`,
  ];
  const ordered = Array.from({ length: 12 }, (_, i) => chart.palaces[(p.lifePalace + i) % 12]!);
  const notes = chart.notes.length ? ["", "## Ghi chú và dị bản", ...chart.notes.map((note) => `- ${note}`)] : [];
  if (detail === "brief") {
    const briefTable = [
      "| Cung | Chính tinh | Tứ Hóa / Tuần Triệt | Sát tinh |",
      "|---|---|---|---|",
      ...ordered.map((palace) => {
        const transformed = palace.stars.filter((star) => star.transformation && star.group !== "chính tinh").map(formatStar);
        const voids = palace.stars.filter((star) => star.group === "Tuần Triệt").map((star) => star.name);
        const sha = palace.stars.filter((star) => SHA_STARS.includes(star.name)).map((star) => star.name);
        return `| ${[palaceLabel(palace), starsOfGroup(palace, ["chính tinh"]), [...transformed, ...voids].join(", ") || "—", sha.join(", ") || "—"].join(" | ")} |`;
      }),
    ];
    return [...header, "", ...briefTable, ...notes].join("\n");
  }
  const table = [
    "| Cung | Đại hạn | Tiểu hạn | Chính tinh | Tứ Hóa / Tuần Triệt | Phụ tinh | Vòng sao |",
    "|---|---|---|---|---|---|---|",
    ...ordered.map((palace) => {
      const transformed = palace.stars.filter((star) => star.transformation && star.group !== "chính tinh").map(formatStar);
      const voids = palace.stars.filter((star) => star.group === "Tuần Triệt").map((star) => star.name);
      return [
        palaceLabel(palace),
        String(palace.majorPeriodStartAge),
        branchName(palace.minorPeriodYearBranch),
        starsOfGroup(palace, ["chính tinh"]),
        [...transformed, ...voids].join(", ") || "—",
        starsOfGroup(palace, ["phụ tinh"]),
        starsOfGroup(palace, ["vòng Bác Sĩ", "vòng Tràng Sinh", "vòng Thái Tuế"]),
      ].join(" | ");
    }).map((row) => `| ${row} |`),
  ];
  return [...header, "", ...table, ...notes].join("\n");
}

export function renderYearView(chart: Chart, view: YearView, detail: ChartRenderDetail = "full"): string {
  const flowingByPalace = new Map<number, string[]>();
  for (const star of view.flowingStars) {
    flowingByPalace.set(star.palace, [...(flowingByPalace.get(star.palace) ?? []), star.name]);
  }
  const describe = (palace: Palace): string => `${palace.role} (${branchName(palace.branch)})`;
  const sortedFlowing = [...flowingByPalace.entries()].sort(([a], [b]) => a - b);
  const flowingTable = [
    "",
    "| Cung | Sao lưu niên |",
    "|---|---|",
    ...sortedFlowing.map(([branch, names]) => `| ${describe(chart.palaces[branch]!)} | ${names.join(", ")} |`),
  ];
  return [
    `# Vận hạn năm ${stemBranchName(view.viewYearStemBranch)} (${view.viewYear}) · ${view.age} tuổi âm`,
    view.majorPeriod
      ? `- Đại hạn: cung ${describe(view.majorPeriod.palace)}, từ ${view.majorPeriod.fromAge} đến ${view.majorPeriod.toAge} tuổi`
      : `- Chưa vào đại hạn đầu (đại hạn đầu bắt đầu từ ${chart.parameters.bureau.number} tuổi)`,
    `- Tiểu hạn: cung ${describe(view.minorPeriodPalace)}`,
    ...(view.childhoodPeriodPalace ? [`- Đồng hạn (1–12 tuổi): cung ${describe(view.childhoodPeriodPalace)}`] : []),
    `- Tháng Giêng lưu nguyệt ở cung ${describe(view.firstMonthPalace)}; các tháng sau đếm thuận (MLTC tr.845, TVTH tr.137)`,
    `- Tứ Hóa lưu niên (can ${stemName(view.viewYearStemBranch.stem)}): ${view.flowingTransformations
      .map((item) => `${item.star} ${item.transformation}${item.palace === null ? "" : ` tại ${describe(chart.palaces[item.palace]!)}`}`)
      .join(" · ")}`,
    ...(detail === "brief"
      ? [`- Sao lưu niên: ${sortedFlowing.map(([branch, names]) => `${branchName(branch)}: ${names.join(", ")}`).join(" · ")}`]
      : flowingTable),
  ].join("\n");
}
