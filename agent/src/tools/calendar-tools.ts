import { z } from "zod";
import { branchElement, elementRelation, parseElement, stemElement } from "../core/calendar/five-elements.js";
import { doubleHourOf, subtractMinutes } from "../core/calendar/hours.js";
import {
  daysInLunarMonth,
  julianDayFromSolar,
  leapMonthOfYear,
  validateSolarDate,
  type LunarDate,
  type SolarDate,
} from "../core/calendar/lunar.js";
import { nayin } from "../core/calendar/nayin.js";
import { lunarToSolarVietnam, solarToLunarVietnam, timezoneNotes } from "../core/calendar/vietnam-calendar.js";
import {
  branchRelations,
  clashPartner,
  describeStemCombination,
  fourClash,
  sixCombinationPartner,
  sixHarmPartner,
  threeSidesFourSquares,
  trine,
} from "../core/calendar/relations.js";
import {
  branchName,
  branchPolarity,
  dayStemBranch,
  hourStemBranch,
  monthStemBranch,
  parseBranch,
  parseStem,
  parseStemBranch,
  stemBranchName,
  stemPolarity,
  tuanVoidBranches,
  yearStemBranch,
  type StemBranch,
} from "../core/calendar/stem-branch.js";
import { bureauOf, palaceStem } from "../core/chart/palaces.js";
import { defineTool } from "./registry.js";
import { unwrapOrThrow } from "./result-output.js";

const timezoneField = z
  .number()
  .min(-12)
  .max(14)
  .optional()
  .describe("Múi giờ tính lịch âm. Bỏ trống để theo lịch Việt Nam từng thời kỳ: UTC+8 trước 1968, UTC+7 từ 1968");

const lines = (...parts: ReadonlyArray<string | false | undefined>): string => parts.filter(Boolean).join("\n");

function describeLunarDay(lunar: LunarDate, solar: SolarDate, timezone: number, setting: number | "historical"): string {
  const year = yearStemBranch(lunar.year);
  const leapMonth = unwrapOrThrow(leapMonthOfYear(lunar.year, timezone));
  const monthLength = unwrapOrThrow(daysInLunarMonth(lunar.year, lunar.month, lunar.isLeapMonth, timezone));
  return lines(
    `Dương lịch: ${solar.day}/${solar.month}/${solar.year}`,
    `Âm lịch: ngày ${lunar.day} tháng ${lunar.month}${lunar.isLeapMonth ? " nhuận" : ""} năm ${lunar.year}`,
    `Can chi: năm ${stemBranchName(year)} · tháng ${stemBranchName(monthStemBranch(year.stem, lunar.month))}${lunar.isLeapMonth ? " (tháng nhuận dùng can chi của tháng chính)" : ""} · ngày ${stemBranchName(dayStemBranch(julianDayFromSolar(solar)))}`,
    `Tháng ${lunar.month}${lunar.isLeapMonth ? " nhuận" : ""} có ${monthLength} ngày · ${leapMonth ? `năm âm ${lunar.year} nhuận tháng ${leapMonth}` : `năm âm ${lunar.year} không có tháng nhuận`}`,
    ...timezoneNotes(solar, timezone, setting),
  );
}

export const convertCalendarTool = defineTool({
  name: "convert_calendar",
  description:
    "Đổi ngày dương lịch sang âm lịch Việt Nam hoặc ngược lại (thuật toán thiên văn Hồ Ngọc Đức, hỗ trợ năm 1800–2199; " +
    "mặc định dùng UTC+8 cho ngày trước 1968 như lịch Việt Nam thời đó). " +
    "Trả về ngày âm/dương, tháng nhuận, can chi năm/tháng/ngày, số ngày của tháng âm. Dùng trước khi lập lá số từ ngày dương lịch.",
  schema: z.strictObject({
    direction: z.enum(["solar_to_lunar", "lunar_to_solar"]),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    is_leap_month: z.boolean().optional().describe("Chỉ dùng khi direction = lunar_to_solar: ngày thuộc tháng nhuận"),
    timezone: timezoneField,
  }),
  async run({ direction, year, month, day, is_leap_month, timezone }) {
    const setting = timezone ?? "historical";
    if (direction === "solar_to_lunar") {
      const solar = { year, month, day };
      const converted = unwrapOrThrow(solarToLunarVietnam(solar, setting));
      return describeLunarDay(converted.lunar, solar, converted.timezone, setting);
    }
    const lunar = { year, month, day, isLeapMonth: is_leap_month ?? false };
    const converted = unwrapOrThrow(lunarToSolarVietnam(lunar, setting));
    return describeLunarDay(lunar, converted.solar, converted.timezone, setting);
  },
});

export const convertHourTool = defineTool({
  name: "convert_hour",
  description:
    "Đổi giờ đồng hồ sang canh giờ địa chi (Tý 23:00–1:00 … Hợi 21:00–23:00, bảng MLTC mục 7.1). " +
    "Có thể trừ số phút hiệu chỉnh giờ hành chính, báo khi giờ sinh gần ranh giới canh giờ, và tính can giờ nếu biết ngày dương lịch.",
  schema: z.strictObject({
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59).optional(),
    correction_minutes: z.number().int().optional().describe("Số phút cần trừ khỏi giờ đồng hồ, ví dụ 60 nếu giờ hành chính nhanh 1 giờ"),
    solar_date: z
      .strictObject({ year: z.number().int(), month: z.number().int(), day: z.number().int() })
      .optional()
      .describe("Ngày dương lịch, để tính can của giờ"),
  }),
  async run({ hour, minute, correction_minutes, solar_date }) {
    const corrected = unwrapOrThrow(subtractMinutes({ hour, minute: minute ?? 0 }, correction_minutes ?? 0));
    const doubleHour = unwrapOrThrow(doubleHourOf(corrected.time));
    const clock = `${String(corrected.time.hour).padStart(2, "0")}:${String(corrected.time.minute).padStart(2, "0")}`;
    const hourStem = solar_date
      ? stemBranchName(
          hourStemBranch(dayStemBranch(julianDayFromSolar(unwrapOrThrow(validateSolarDate(solar_date))) + corrected.dayShift).stem, doubleHour.branch),
        )
      : undefined;
    return lines(
      correction_minutes ? `Giờ sau hiệu chỉnh: ${clock}${corrected.dayShift ? ` (lệch ${corrected.dayShift} ngày)` : ""}` : undefined,
      `Canh giờ: ${branchName(doubleHour.branch)} (${doubleHour.start}–${doubleHour.end})`,
      hourStem && `Can chi giờ: ${hourStem}`,
      doubleHour.nearBoundary &&
        `Lưu ý: cách ranh giới canh giờ ${doubleHour.minutesToNearestBoundary} phút, nên soát lại giờ sinh (MLTC, TVTH đều coi giờ sinh là dữ kiện quyết định).`,
      "Theo MLTC mục 7.1, sinh 23:00–24:00 vẫn là giờ Tý của ngày hôm đó, không chuyển sang ngày sau.",
    );
  },
});

function resolveStemBranch(input: { year?: number | undefined; stem_branch?: string | undefined }): StemBranch {
  if (input.stem_branch) return unwrapOrThrow(parseStemBranch(input.stem_branch));
  if (input.year !== undefined) return yearStemBranch(input.year);
  throw new Error("Cần year hoặc stem_branch");
}

export const stemBranchInfoTool = defineTool({
  name: "stem_branch_info",
  description:
    "Tra một can chi (theo năm âm lịch hoặc chữ, ví dụ 'Kỷ Mùi'): âm dương, ngũ hành của can và chi, nạp âm (bản mệnh), " +
    "Tuần không, can hợp, bộ tam hợp, nhị hợp, xung, hại.",
  schema: z.strictObject({
    year: z.number().int().optional().describe("Năm âm lịch, ví dụ 1979"),
    stem_branch: z.string().optional().describe("Can chi viết đủ dấu, ví dụ 'Giáp Tý'"),
  }),
  async run(input) {
    const value = resolveStemBranch(input);
    const { stem, branch } = value;
    const natal = nayin(value);
    const tuan = tuanVoidBranches(value);
    const group = trine(branch);
    return lines(
      `${stemBranchName(value)}${input.year !== undefined ? ` (năm ${input.year})` : ""}`,
      `Can ${stemBranchName(value).split(" ")[0]}: ${stemPolarity(stem)} ${stemElement(stem)} · Chi ${branchName(branch)}: ${branchPolarity(branch)} ${branchElement(branch)}`,
      `Nạp âm: ${natal.name} (hành ${natal.element})`,
      `Tuần không: ${tuan.map(branchName).join(" ")}`,
      `Can hợp: ${describeStemCombination(stem)}`,
      `Tam hợp: ${group.branches.map(branchName).join(" ")} (hóa ${group.element}) · Nhị hợp: ${branchName(sixCombinationPartner(branch))} · Xung: ${branchName(clashPartner(branch))} · Hại: ${branchName(sixHarmPartner(branch))} · ${fourClash(branch).name}`,
    );
  },
});

export const branchRelationsTool = defineTool({
  name: "branch_relations",
  description:
    "Xét quan hệ giữa các địa chi hoặc cung: tam hợp, lục hợp, lục xung, lục hại, tứ hành xung. Một chi thì trả về đủ bộ " +
    "tam hợp, nhị hợp, xung, hại và tam phương tứ chính của cung đó. Từ hai chi trở lên thì xét từng cặp.",
  schema: z.strictObject({
    branches: z.array(z.string()).min(1).max(12).describe("Danh sách địa chi, ví dụ ['Dần', 'Ngọ', 'Thân']"),
  }),
  async run({ branches }) {
    const parsed = branches.map((text) => unwrapOrThrow(parseBranch(text)));
    if (parsed.length === 1) {
      const branch = parsed[0]!;
      const squares = threeSidesFourSquares(branch);
      return lines(
        `Chi ${branchName(branch)}:`,
        `- Tam hợp: ${trine(branch).branches.map(branchName).join(" ")} (hóa ${trine(branch).element})`,
        `- Nhị hợp: ${branchName(sixCombinationPartner(branch))} · Lục xung: ${branchName(clashPartner(branch))} · Lục hại: ${branchName(sixHarmPartner(branch))} (NP1, OCR)`,
        `- ${fourClash(branch).name}`,
        `- Tam phương tứ chính khi coi đây là một cung: ${branchName(squares.self)}, tam hợp ${squares.trines.map(branchName).join(" ")}, xung chiếu ${branchName(squares.opposite)}`,
      );
    }
    const pairs = parsed.flatMap((a, i) => parsed.slice(i + 1).map((b) => [a, b] as const));
    return pairs
      .map(([a, b]) => {
        const found = branchRelations(a, b);
        const text = found.length ? found.map((r) => `${r.description}${r.source ? ` (${r.source})` : ""}`).join("; ") : "không hợp, không xung";
        return `- ${branchName(a)} – ${branchName(b)}: ${text}`;
      })
      .join("\n");
  },
});

export const elementRelationTool = defineTool({
  name: "element_relation",
  description: "Xét sinh khắc ngũ hành giữa hai hành, nhìn từ phía hành thứ nhất (ví dụ cục so với bản mệnh, sao so với cung).",
  schema: z.strictObject({
    subject: z.string().describe("Hành chủ thể: Kim, Thủy, Mộc, Hỏa, Thổ"),
    other: z.string().describe("Hành còn lại"),
  }),
  async run({ subject, other }) {
    return elementRelation(unwrapOrThrow(parseElement(subject)), unwrapOrThrow(parseElement(other))).description;
  },
});

export const determineBureauTool = defineTool({
  name: "determine_bureau",
  description:
    "Xác định Cục từ can năm sinh và địa chi cung Mệnh: can của cung Mệnh theo Ngũ hổ độn, nạp âm của can chi cung Mệnh ra Cục " +
    "(TVTH tr.10–11, MLTC bảng 6–7). Nếu chưa biết cung Mệnh thì dùng build_chart.",
  schema: z.strictObject({
    year_stem: z.string().optional().describe("Can năm sinh, ví dụ 'Kỷ'"),
    year: z.number().int().optional().describe("Hoặc năm âm lịch, ví dụ 1979"),
    life_palace: z.string().describe("Địa chi cung Mệnh, ví dụ 'Thìn'"),
  }),
  async run({ year_stem, year, life_palace }) {
    const stem = year_stem ? unwrapOrThrow(parseStem(year_stem)) : year !== undefined ? yearStemBranch(year).stem : undefined;
    if (stem === undefined) throw new Error("Cần year_stem hoặc year");
    const palace = unwrapOrThrow(parseBranch(life_palace));
    const palaceStemBranch = { stem: palaceStem(stem, palace), branch: palace };
    const bureau = bureauOf(stem, palace);
    return lines(
      `Can cung Mệnh: ${stemBranchName(palaceStemBranch)}`,
      `Nạp âm: ${nayin(palaceStemBranch).name}`,
      `Cục: ${bureau.name} (số ${bureau.number}, dùng để an Tử Vi và khởi đại hạn)`,
    );
  },
});

export const CALENDAR_TOOLS = [
  convertCalendarTool,
  convertHourTool,
  stemBranchInfoTool,
  branchRelationsTool,
  elementRelationTool,
  determineBureauTool,
];
