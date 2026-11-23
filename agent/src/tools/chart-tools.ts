import { z } from "zod";
import { branchOfMinuteOfDay } from "../core/calendar/hours.js";
import { parseBranch } from "../core/calendar/stem-branch.js";
import { err, ok, type Result } from "../core/result.js";
import type { BirthInput } from "../core/chart/birth.js";
import { buildChart } from "../core/chart/build-chart.js";
import { yearView } from "../core/chart/periods.js";
import { renderChart, renderYearView } from "../core/chart/render.js";
import { DEFAULT_CHART_OPTIONS, type Chart, type ChartOptions } from "../core/chart/types.js";
import { defineTool, type ToolContext } from "./registry.js";
import { ToolInputError, unwrapOrThrow } from "./result-output.js";

const birthSchema = z
  .strictObject({
    calendar: z.enum(["solar", "lunar"]).describe("Ngày sinh theo dương lịch (solar) hay âm lịch (lunar)"),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    is_leap_month: z.boolean().optional().describe("Âm lịch: sinh trong tháng nhuận"),
    hour: z.number().int().min(0).max(23).optional().describe("Giờ đồng hồ 0–23 (bắt buộc với dương lịch)"),
    minute: z.number().int().min(0).max(59).optional(),
    hour_branch: z.string().optional().describe("Âm lịch: canh giờ địa chi, ví dụ 'Dần'. Có thể thay bằng hour/minute"),
    correction_minutes: z.number().int().optional().describe("Số phút trừ khỏi giờ đồng hồ (giờ hành chính lệch giờ mặt trời)"),
    gender: z.enum(["nam", "nữ"]),
  })
  .describe("Dữ kiện sinh");

const optionsSchema = z
  .strictObject({
    leap_month_rule: z.enum(["next-month", "split-at-15"]).optional().describe("Sinh tháng nhuận: tính sang tháng sau (mặc định) hay chia nửa tháng"),
    late_rat_hour_next_day: z.boolean().optional().describe("Dương lịch: sinh 23:00–24:00 thì tính sang ngày hôm sau (mặc định false, theo MLTC)"),
    khoi_viet_for_canh: z.enum(["TVTH", "MLTC"]).optional(),
    transformations_for_canh: z.enum(["TVTH", "MLTC"]).optional(),
    khoa_star_for_nham: z.enum(["Tả Phụ", "Thiên Phủ"]).optional(),
    hoa_linh_for_ty_dau_suu: z.enum(["TVTH", "Tống"]).optional(),
    timezone: z.number().min(-12).max(14).optional().describe("Múi giờ tính lịch âm; bỏ trống để dùng UTC+8 trước 1968, UTC+7 từ 1968"),
  })
  .optional()
  .describe("Lựa chọn dị bản; bỏ trống để dùng mặc định (TVTH)");

type RawBirth = z.infer<typeof birthSchema>;
type RawOptions = z.infer<typeof optionsSchema>;

export function toBirthInput(raw: RawBirth): Result<BirthInput> {
  if (raw.calendar === "solar") {
    if (raw.hour === undefined) return err("Lá số từ dương lịch cần giờ đồng hồ (hour, minute)");
    return ok({
      calendar: "solar",
      date: { year: raw.year, month: raw.month, day: raw.day },
      time: { hour: raw.hour, minute: raw.minute ?? 0 },
      gender: raw.gender,
      ...(raw.correction_minutes ? { correctionMinutes: raw.correction_minutes } : {}),
    });
  }
  const hourBranch = raw.hour_branch
    ? parseBranch(raw.hour_branch)
    : raw.hour !== undefined
      ? ok(branchOfMinuteOfDay(raw.hour * 60 + (raw.minute ?? 0)))
      : err<number>("Lá số từ âm lịch cần hour_branch (ví dụ 'Dần') hoặc hour");
  if (!hourBranch.ok) return hourBranch;
  return ok({
    calendar: "lunar",
    date: { year: raw.year, month: raw.month, day: raw.day, isLeapMonth: raw.is_leap_month ?? false },
    hourBranch: hourBranch.value,
    gender: raw.gender,
  });
}

export const toChartOptions = (raw: RawOptions): ChartOptions => ({
  leapMonthRule: raw?.leap_month_rule ?? DEFAULT_CHART_OPTIONS.leapMonthRule,
  lateRatHourNextDay: raw?.late_rat_hour_next_day ?? DEFAULT_CHART_OPTIONS.lateRatHourNextDay,
  khoiVietForCanh: raw?.khoi_viet_for_canh ?? DEFAULT_CHART_OPTIONS.khoiVietForCanh,
  transformationsForCanh: raw?.transformations_for_canh ?? DEFAULT_CHART_OPTIONS.transformationsForCanh,
  khoaStarForNham: raw?.khoa_star_for_nham ?? DEFAULT_CHART_OPTIONS.khoaStarForNham,
  hoaLinhForTyDauSuu: raw?.hoa_linh_for_ty_dau_suu ?? DEFAULT_CHART_OPTIONS.hoaLinhForTyDauSuu,
  timezone: raw?.timezone ?? DEFAULT_CHART_OPTIONS.timezone,
});

export const chartReferenceFields = {
  chart_id: z.string().optional().describe("Mã lá số do build_chart trả về; dùng thay cho birth để không phải gửi lại dữ kiện"),
  birth: birthSchema.optional(),
  options: optionsSchema,
};

export interface ResolvedChart {
  readonly id: string | null;
  readonly chart: Chart;
  readonly cached: boolean;
}

export function resolveChart(
  reference: { chart_id?: string | undefined; birth?: RawBirth | undefined; options?: RawOptions },
  ctx: ToolContext,
): ResolvedChart {
  if (reference.chart_id) {
    if (reference.birth || reference.options) {
      throw new ToolInputError("Chỉ truyền chart_id hoặc birth/options, không truyền cả hai; muốn đổi dị bản thì gọi lại với birth và options.");
    }
    const stored = ctx.charts?.get(reference.chart_id);
    if (!stored) throw new ToolInputError(`Không còn lá số ${reference.chart_id} trong bộ nhớ; gọi lại với birth để lập lại.`);
    return { id: reference.chart_id, chart: stored, cached: true };
  }
  if (!reference.birth) throw new ToolInputError("Cần chart_id hoặc birth");
  const input = unwrapOrThrow(toBirthInput(reference.birth));
  const options = toChartOptions(reference.options);
  const build = () => unwrapOrThrow(buildChart(input, options));
  if (!ctx.charts) return { id: null, chart: build(), cached: false };
  return ctx.charts.remember(input, options, build);
}

const chartHeader = (resolved: ResolvedChart): string =>
  resolved.id ? `chart_id: ${resolved.id}${resolved.cached ? " (lấy từ bộ nhớ)" : ""}\n\n` : "";

export const buildChartTool = defineTool({
  name: "build_chart",
  description:
    "Lập lá số Tử Vi Nam Phái theo quy tắc an sao của TVTH Phần I (đối chiếu MLTC Ch.1 mục 7): Mệnh, Thân, 12 cung, can cung, Cục, " +
    "14 chính tinh kèm miếu/hãm, khoảng 60 phụ tinh, vòng Bác Sĩ, Tràng Sinh, Thái Tuế, Tứ Hóa, Tuần, Triệt, đại hạn và tiểu hạn. " +
    "Nhận ngày dương lịch (tự đổi sang âm lịch) hoặc âm lịch. Trả về chart_id: các tool phân tích sau chỉ cần chart_id. " +
    "Kết quả có mục ghi chú dị bản; khi luận phải nêu các dị bản đó.",
  schema: z.strictObject({ birth: birthSchema, options: optionsSchema }),
  async run({ birth, options }, ctx) {
    const resolved = resolveChart({ birth, options }, ctx);
    return chartHeader(resolved) + renderChart(resolved.chart);
  },
});

export const yearForecastTool = defineTool({
  name: "year_forecast",
  description:
    "Xem vận hạn một năm cho một lá số (chart_id hoặc birth): tuổi âm, cung đại hạn, cung tiểu hạn, đồng hạn (dưới 13 tuổi), " +
    "cung tháng Giêng lưu nguyệt (MLTC tr.845), Tứ Hóa lưu niên và các sao lưu niên (Thái Tuế, Tang Môn, Bạch Hổ, Lộc Tồn, Kình, Đà, Mã, " +
    "Khốc, Hư, Tuần, Triệt) theo TVTH tr.135–137.",
  schema: z.strictObject({
    ...chartReferenceFields,
    view_year: z.number().int().describe("Năm âm lịch muốn xem, ví dụ 2026"),
  }),
  async run({ view_year, ...reference }, ctx) {
    const resolved = resolveChart(reference, ctx);
    return chartHeader(resolved) + renderYearView(resolved.chart, unwrapOrThrow(yearView(resolved.chart, view_year)));
  },
});

export const CHART_TOOLS = [buildChartTool, yearForecastTool];
