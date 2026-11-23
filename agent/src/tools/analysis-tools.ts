import { z } from "zod";
import { analyzePalace, renderPalaceAnalysis } from "../core/analysis/palace-analysis.js";
import { natalProfile, renderNatalProfile } from "../core/analysis/natal-profile.js";
import { parseBranch } from "../core/calendar/stem-branch.js";
import { solarToLunarVietnam } from "../core/calendar/vietnam-calendar.js";
import { PALACE_ROLES, palaceOfRole, type PalaceRole } from "../core/chart/palaces.js";
import type { Chart } from "../core/chart/types.js";
import { detectPatterns, evaluatePattern, PATTERN_CATALOG, renderPatterns } from "../core/patterns/index.js";
import {
  birthHourCandidates,
  childHazardHours,
  lifetimeTimeline,
  periodLayers,
  renderBirthHourCandidates,
  renderChildHazardHours,
  renderLifetimeTimeline,
  renderPeriodLayers,
} from "../core/periods/index.js";
import { renderFinding } from "../core/analysis/finding.js";
import { chartReferenceFields, resolveChart, toChartOptions, type ResolvedChart } from "./chart-tools.js";
import { defineTool } from "./registry.js";
import { ToolInputError, unwrapOrThrow } from "./result-output.js";

const header = (resolved: ResolvedChart): string => (resolved.id ? `chart_id: ${resolved.id}\n\n` : "");

const ROLE_ALIASES: Readonly<Record<string, PalaceRole>> = {
  "phụ": "Phụ Mẫu",
  "phúc": "Phúc Đức",
  "điền": "Điền Trạch",
  "quan": "Quan Lộc",
  "nô": "Nô Bộc",
  "bộc": "Nô Bộc",
  "di": "Thiên Di",
  "tật": "Tật Ách",
  "giải ách": "Tật Ách",
  "tài": "Tài Bạch",
  "tử": "Tử Tức",
  "phối": "Phu Thê",
  "thê": "Phu Thê",
  "bào": "Huynh Đệ",
  "huynh": "Huynh Đệ",
};

const BODY_PALACE_NAMES = new Set(["thân", "cung thân", "thân cư"]);
const BRANCH_PREFIX = /^(chi|địa chi)\s+/;

export interface ResolvedPalaceName {
  readonly branch: number;
  readonly reading: string;
}

export function resolvePalaceName(chart: Chart, text: string): ResolvedPalaceName {
  const normalized = text.trim().normalize("NFC").toLowerCase();
  const role = PALACE_ROLES.find((name) => name.toLowerCase() === normalized) ?? ROLE_ALIASES[normalized];
  if (role) return { branch: palaceOfRole(chart.parameters.lifePalace, role), reading: `cung chức ${role}` };
  if (BODY_PALACE_NAMES.has(normalized)) {
    return { branch: chart.parameters.bodyPalace, reading: "cung an Thân (muốn địa chi Thân thì ghi 'chi Thân')" };
  }
  const branch = parseBranch(normalized.replace(BRANCH_PREFIX, ""));
  if (!branch.ok) {
    throw new ToolInputError(
      `Không hiểu cung "${text}". Dùng tên cung chức (${PALACE_ROLES.join(", ")}), tên gọi tắt (Phúc, Quan, Tài, Di, Phối, Bào…), ` +
        "'Thân' cho cung an Thân, hoặc địa chi (ví dụ 'Ngọ', 'chi Thân').",
    );
  }
  return { branch: branch.value, reading: "địa chi" };
}

export const analyzeChartTool = defineTool({
  name: "analyze_chart",
  description:
    "Phân tích tổng hợp một lá số trong MỘT lần gọi: bản mệnh (chủ Mệnh/Thân, Thân cư, Cục với bản mệnh, sinh vượng bại tuyệt, " +
    "âm dương thuận/nghịch lý, vòng Thái Tuế, Tuần Triệt, vô chính diệu), các cách cục khớp, và phân tích cung Mệnh, cung Thân. " +
    "Dùng tool này đầu tiên khi luận một lá số, rồi mới gọi tool chi tiết. Mỗi kết luận ghi 'khớp chắc chắn' hoặc 'khớp theo cách hiểu' kèm giả định.",
  schema: z.strictObject({ ...chartReferenceFields }),
  async run(reference, ctx) {
    const resolved = resolveChart(reference, ctx);
    const chart = resolved.chart;
    const palaces = [...new Set([chart.parameters.lifePalace, chart.parameters.bodyPalace])];
    return [
      header(resolved) + renderNatalProfile(natalProfile(chart)),
      "## Cách cục",
      renderPatterns(detectPatterns(chart)),
      ...palaces.map((branch) => renderPalaceAnalysis(unwrapOrThrow(analyzePalace(chart, branch)))),
    ].join("\n\n");
  },
});

export const detectPatternsTool = defineTool({
  name: "detect_patterns",
  description:
    `Nhận diện cách cục trên lá số (${PATTERN_CATALOG.length} cách tốt/xấu theo kho 09_Cach-cuc), có điều kiện thỏa/chưa thỏa, phá cách, ` +
    "giả định và trang sách. Truyền pattern_id để giải thích vì sao một cách có hoặc không thành.",
  schema: z.strictObject({
    ...chartReferenceFields,
    pattern_id: z.string().optional().describe("Mã cách cục cần giải thích; bỏ trống để liệt kê mọi cách khớp"),
  }),
  async run({ pattern_id, ...reference }, ctx) {
    const resolved = resolveChart(reference, ctx);
    if (!pattern_id) return header(resolved) + renderPatterns(detectPatterns(resolved.chart));
    const evaluation = unwrapOrThrow(evaluatePattern(resolved.chart, pattern_id));
    return `${header(resolved)}${evaluation.matched ? "THÀNH CÁCH" : "KHÔNG THÀNH CÁCH"}\n${renderFinding(evaluation.finding)}`;
  },
});

export const listPatternsTool = defineTool({
  name: "list_patterns",
  description: "Liệt kê mã, tên, loại (tốt/xấu) và nguồn của mọi cách cục mà detect_patterns hỗ trợ.",
  schema: z.strictObject({}),
  async run() {
    return PATTERN_CATALOG.map((rule) => `- ${rule.id}: ${rule.name} (${rule.polarity}) [${rule.source}]`).join("\n");
  },
});

export const natalProfileTool = defineTool({
  name: "natal_profile",
  description:
    "Bản mệnh của lá số: sao chủ Mệnh, chủ Thân, Thân cư cung nào, Cục sinh khắc bản mệnh, cục kỵ hành, sinh vượng bại tuyệt địa, " +
    "mùa sinh và giờ sinh thuận/nghịch, âm dương thuận/nghịch lý theo từng cách tính, Mệnh trong vòng Thái Tuế, Tuần Triệt ở Mệnh/Thân, vô chính diệu.",
  schema: z.strictObject({ ...chartReferenceFields }),
  async run(reference, ctx) {
    const resolved = resolveChart(reference, ctx);
    return header(resolved) + renderNatalProfile(natalProfile(resolved.chart));
  },
});

export const analyzePalaceTool = defineTool({
  name: "analyze_palace",
  description:
    "Phân tích một cung: chính tinh và miếu hãm, ngũ hành sao với cung, tam phương tứ chính, giáp cung tốt/xấu, nhị hợp, lục hại, xung chiếu, " +
    "Tuần Triệt, vô chính diệu và sao mượn, sao vòng Tràng Sinh. palace là tên cung chức hoặc gọi tắt ('Phu Thê', 'Phúc', 'Quan'), 'Thân' cho cung an Thân, hoặc địa chi ('Ngọ', 'chi Thân').",
  schema: z.strictObject({
    ...chartReferenceFields,
    palace: z.string().describe("Tên cung chức hoặc địa chi"),
  }),
  async run({ palace, ...reference }, ctx) {
    const resolved = resolveChart(reference, ctx);
    const target = resolvePalaceName(resolved.chart, palace);
    return `${header(resolved)}Hiểu "${palace}" là ${target.reading}.\n\n${renderPalaceAnalysis(unwrapOrThrow(analyzePalace(resolved.chart, target.branch)))}`;
  },
});

export const periodLayersTool = defineTool({
  name: "period_layers",
  description:
    "Vận hạn chi tiết theo lớp cho một thời điểm: đại hạn, lưu đại hạn (TVTH), tiểu hạn, lưu niên, lưu nguyệt, lưu nhật, lưu thời; 12 cung chức " +
    "của mỗi lớp; Tứ Hóa theo can từng lớp; trùng phùng, năm tuổi, tuổi kỵ năm kỵ, Nam/Bắc đẩu. Chỉ cần year; month/day/hour_branch là tùy chọn.",
  schema: z.strictObject({
    ...chartReferenceFields,
    year: z.number().int().describe("Năm âm lịch muốn xem"),
    month: z.number().int().min(1).max(12).optional(),
    day: z.number().int().min(1).max(30).optional(),
    hour_branch: z.string().optional().describe("Địa chi giờ muốn xem"),
  }),
  async run({ year, month, day, hour_branch, ...reference }, ctx) {
    const resolved = resolveChart(reference, ctx);
    const view = {
      year,
      ...(month !== undefined ? { month } : {}),
      ...(day !== undefined ? { day } : {}),
      ...(hour_branch ? { hourBranch: unwrapOrThrow(parseBranch(hour_branch)) } : {}),
    };
    return header(resolved) + renderPeriodLayers(resolved.chart, unwrapOrThrow(periodLayers(resolved.chart, view)));
  },
});

export const lifetimeTimelineTool = defineTool({
  name: "lifetime_timeline",
  description:
    "Dòng thời gian cả đời của lá số: các đại hạn theo tuổi, đồng hạn, mọi tuổi trùng phùng đại tiểu hạn, các năm tuổi, các năm tuổi kỵ.",
  schema: z.strictObject({
    ...chartReferenceFields,
    max_age: z.number().int().min(13).max(120).optional().describe("Tuổi tối đa, mặc định 100"),
  }),
  async run({ max_age, ...reference }, ctx) {
    const resolved = resolveChart(reference, ctx);
    const timeline = lifetimeTimeline(resolved.chart, max_age ? { maxAge: max_age } : {});
    return header(resolved) + renderLifetimeTimeline(resolved.chart, timeline);
  },
});

export const childHazardHoursTool = defineTool({
  name: "child_hazard_hours",
  description:
    "Kiểm tra giờ xấu trẻ em của lá số: Kim Xà Thiết Tỏa, Quan Sát, Tướng Quân, Diêm Vương, Dạ Đề (bảng trong kho 01_Gio-sinh). " +
    "Chỉ là quan niệm dân gian trong sách; khi trả lời phải nói rõ như vậy.",
  schema: z.strictObject({ ...chartReferenceFields }),
  async run(reference, ctx) {
    const resolved = resolveChart(reference, ctx);
    return header(resolved) + renderChildHazardHours(unwrapOrThrow(childHazardHours(resolved.chart)));
  },
});

const observationsSchema = z
  .strictObject({
    sleep: z.enum(["nằm ngửa", "nằm nghiêng", "nằm sấp"]).optional(),
    little_finger: z.enum(["cao hơn", "bằng", "thấp hơn"]).optional(),
    birth_order: z.number().int().min(1).optional(),
  })
  .optional()
  .describe("Dấu hiệu quan sát dùng để soát giờ sinh theo kho 01_Gio-sinh/03");

export const birthHourCandidatesTool = defineTool({
  name: "birth_hour_candidates",
  description:
    "Soát giờ sinh khi không chắc: với ngày sinh và các giờ ứng viên, lập Mệnh, Thân, Cục và chính tinh ở Mệnh cho từng giờ, " +
    "kèm phép lọc nhóm giờ theo dấu hiệu quan sát, để so sánh với đặc điểm thật của người đó.",
  schema: z.strictObject({
    calendar: z.enum(["solar", "lunar"]),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    is_leap_month: z.boolean().optional(),
    gender: z.enum(["nam", "nữ"]),
    candidate_hours: z.array(z.string()).min(1).max(12).describe("Các địa chi giờ ứng viên, ví dụ ['Thìn', 'Tỵ']"),
    observations: observationsSchema,
    options: chartReferenceFields.options,
  }),
  async run({ calendar, year, month, day, is_leap_month, gender, candidate_hours, observations, options }) {
    const chartOptions = toChartOptions(options);
    const lunar =
      calendar === "lunar"
        ? { year, month, day, isLeapMonth: is_leap_month ?? false }
        : unwrapOrThrow(solarToLunarVietnam({ year, month, day }, chartOptions.timezone)).lunar;
    const hours = candidate_hours.map((text) => unwrapOrThrow(parseBranch(text)));
    if (new Set(hours).size !== hours.length) throw new ToolInputError("candidate_hours bị trùng");
    const comparison = unwrapOrThrow(
      birthHourCandidates({ lunar, gender }, hours, {
        chartOptions,
        observations: {
          ...(observations?.sleep ? { sleep: observations.sleep } : {}),
          ...(observations?.little_finger ? { littleFinger: observations.little_finger } : {}),
          ...(observations?.birth_order ? { birthOrder: observations.birth_order } : {}),
        },
      }),
    );
    return renderBirthHourCandidates(comparison);
  },
});

export const ANALYSIS_TOOLS = [
  analyzeChartTool,
  detectPatternsTool,
  listPatternsTool,
  natalProfileTool,
  analyzePalaceTool,
  periodLayersTool,
  lifetimeTimelineTool,
  childHazardHoursTool,
  birthHourCandidatesTool,
];
