import { z } from "zod";
import { PALACE_ROLES } from "../core/chart/palaces.js";
import { FLOWING_STAR_NAMES, GOALS, MAX_SCAN_YEARS, renderYearScan, scanYears, SKIPPED_TRIGGERS, TRIGGERS } from "../core/scan/index.js";
import { chartReferenceFields, resolveChart } from "./chart-tools.js";
import { defineTool } from "./registry.js";
import { unwrapOrThrow } from "./result-output.js";

const palaceTargetSchema = z
  .strictObject({
    frame: z
      .enum(["natal", "major", "yearly", "minor"])
      .describe("Tầng đếm cung chức: natal = bản mệnh, major = 12 cung đại hạn, yearly = 12 cung lưu niên (Mệnh = chi năm xem), minor = cung tiểu hạn"),
    role: z.enum(PALACE_ROLES).optional().describe("Cung chức; bỏ trống = Mệnh (với major/yearly là chính cung hạn). minor chỉ nhận Mệnh"),
  })
  .describe("Một cung, ví dụ {frame:'natal', role:'Phu Thê'}");

const targetsField = z.array(palaceTargetSchema).optional().describe("Các cung cần xét; bỏ trống thì dùng palaces chung");
const scopeField = z
  .enum(["self", "trine", "three-sides"])
  .optional()
  .describe("self = tại cung (mặc định), trine = tam hợp, three-sides = tam phương tứ chính");
const labelField = z.string().optional().describe("Tên hiển thị cho tiêu chí");

const leafCriterionSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("transformation"),
    transformation: z.enum(["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"]),
    stem: z.enum(["view-year", "major-palace"]).optional().describe("Can kích hoạt: view-year = can năm xem (mặc định), major-palace = can cung đại hạn"),
    targets: targetsField,
    scope: scopeField,
    label: labelField,
  }),
  z.strictObject({
    kind: z.literal("flowing-star"),
    stars: z.array(z.enum(FLOWING_STAR_NAMES)).min(1).describe("Sao lưu niên; khớp khi có ít nhất một sao"),
    targets: targetsField,
    scope: scopeField,
    label: labelField,
  }),
  z.strictObject({
    kind: z.literal("period-palace"),
    layer: z.enum(["major", "minor", "yearly"]).describe("Cung đại hạn, tiểu hạn hay cung Lưu niên"),
    targets: targetsField,
    label: labelField,
  }),
  z.strictObject({ kind: z.literal("coincidence"), label: labelField }).describe("Đại tiểu hạn trùng phùng"),
  z.strictObject({ kind: z.literal("age-year"), label: labelField }).describe("Năm tuổi"),
  z.strictObject({ kind: z.literal("taboo"), label: labelField }).describe("Tuổi kỵ năm / hạn"),
  z.strictObject({ kind: z.literal("bureau-avoidance"), label: labelField }).describe("Hạn vào cung cục kỵ hành"),
  z.strictObject({ kind: z.literal("trigger"), id: z.string().describe("Mã trigger theo sự việc, xem mô tả tool"), label: labelField }),
]);

const criterionSchema = z.union([
  leafCriterionSchema,
  z.strictObject({
    kind: z.enum(["all", "any"]).describe("all = mọi tiêu chí con đều khớp, any = ít nhất một"),
    of: z.array(leafCriterionSchema).min(1),
    label: labelField,
  }),
]);

export const scanYearsTool = defineTool({
  name: "scan_years",
  description:
    `Quét nhiều năm (tối đa ${MAX_SCAN_YEARS}) trong MỘT lần gọi cho một lá số (chart_id hoặc birth): mỗi năm xét các tiêu chí rồi trả bảng năm × tiêu chí khớp ` +
    "và danh sách năm xếp hạng theo mục tiêu, mỗi tiêu chí kèm nguồn sách và mức chắc chắn. " +
    `goal là bộ tiêu chí soạn sẵn từ kho (10_Van-han/07_Han-theo-su-viec): ${GOALS.join(", ")}. ` +
    "criteria thêm tiêu chí tùy chọn: transformation (Tứ Hóa can năm xem hoặc can cung đại hạn vào/tam phương cung), flowing-star (Lộc Tồn, Mã, Thái Tuế, Tang, Hổ, Kình, Đà, Khốc, Hư, Tuần, Triệt lưu), " +
    "period-palace (đại hạn/tiểu hạn/lưu niên ở cung), coincidence, age-year, taboo, bureau-avoidance, trigger, và all/any để ghép. " +
    `Trigger: ${TRIGGERS.map((trigger) => trigger.id).join(", ")}. ` +
    "Bộ sao của TVTH xét trong tam phương tứ chính cung hạn (ví dụ trong kho chỉ dùng tam hợp, nhưng các cặp luôn xung chiếu như Hồng Loan – Thiên Hỷ, Đế Vượng – Thai thì không bao giờ đủ). " +
    "Tiêu chí cấp đại hạn ghi một lần mỗi đại hạn, không cộng điểm từng năm; dưới 13 tuổi không xét tiểu hạn. " +
    `Có ${SKIPPED_TRIGGERS.length} quy tắc hạn theo sự việc chưa tính (được liệt kê trong kết quả khi chọn goal).`,
  schema: z.strictObject({
    ...chartReferenceFields,
    from_year: z.number().int().describe("Năm âm lịch bắt đầu"),
    to_year: z.number().int().describe(`Năm âm lịch kết thúc (gồm cả năm này; tối đa ${MAX_SCAN_YEARS} năm)`),
    goal: z.enum(GOALS).optional().describe("Bộ tiêu chí soạn sẵn theo mục tiêu"),
    criteria: z.array(criterionSchema).optional().describe("Tiêu chí tùy chọn, cộng thêm vào goal"),
    palaces: z.array(palaceTargetSchema).optional().describe("Cung mặc định cho tiêu chí không ghi targets"),
    top: z.number().int().min(1).max(20).optional().describe("Số năm trong danh sách xếp hạng (mặc định 5)"),
  }),
  async run({ from_year, to_year, goal, criteria, palaces, top, ...reference }, ctx) {
    const resolved = resolveChart(reference, ctx);
    const result = unwrapOrThrow(
      scanYears(resolved.chart, { fromYear: from_year, toYear: to_year, criteria: criteria ?? [], goal, palaces, top }),
    );
    return (resolved.id ? `chart_id: ${resolved.id}\n\n` : "") + renderYearScan(resolved.chart, result);
  },
});

export const SCAN_TOOLS = [scanYearsTool];
