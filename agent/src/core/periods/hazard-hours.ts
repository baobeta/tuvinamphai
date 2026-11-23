import { branchName, mod } from "../calendar/stem-branch.js";
import { finding, type Finding } from "../analysis/finding.js";
import type { Chart, Gender } from "../chart/types.js";
import { err, ok, type Result } from "../result.js";

export interface HazardHourInput {
  readonly yearBranch: number;
  readonly month: number;
  readonly day: number;
  readonly hourBranch: number;
  readonly gender?: Gender;
  readonly isLeapMonth?: boolean;
}

export type KimXaRule = "sex-specific" | "any-four-tombs";

export interface HazardHourOptions {
  readonly kimXaRule: KimXaRule;
}

export const DEFAULT_HAZARD_HOUR_OPTIONS: HazardHourOptions = { kimXaRule: "sex-specific" };

export type Season = "Xuân" | "Hạ" | "Thu" | "Đông";

export const SEASONS: readonly Season[] = ["Xuân", "Hạ", "Thu", "Đông"];

export const seasonOfMonth = (month: number): Season => SEASONS[Math.floor((month - 1) / 3)]!;

export interface SeasonalHourTable {
  readonly id: string;
  readonly name: string;
  readonly meaning: string;
  readonly hours: Readonly<Record<Season, readonly number[]>>;
}

export const SEASONAL_HOUR_TABLES: readonly SeasonalHourTable[] = [
  {
    id: "GX-TUONG-QUAN",
    name: "Giờ Tướng Quân",
    meaning: "trẻ hay khó ngủ; thường lên kinh, nhưng không có gì nguy đến tính mạng",
    hours: { Xuân: [4, 10, 9], Hạ: [0, 3, 7], Thu: [2, 6, 1], Đông: [8, 5, 11] },
  },
  {
    id: "GX-DIEM-VUONG",
    name: "Giờ Diêm Vương",
    meaning: "hay giật mình, nhất là ban đêm, có khi nổi kinh, trợn mắt; nhưng vẫn nuôi được yên ổn",
    hours: { Xuân: [1, 7], Hạ: [4, 10], Thu: [0, 6], Đông: [3, 9] },
  },
  {
    id: "GX-DA-DE",
    name: "Giờ Dạ Đề",
    meaning: "hay khóc đêm mà ngày thì ngủ yên",
    hours: { Xuân: [6], Hạ: [9], Thu: [0], Đông: [3] },
  },
];

export const quanSatHour = (month: number): number => mod(month + 4, 12);

export const FOUR_TOMBS: readonly number[] = [4, 10, 1, 7];
const MALE_TOMBS: readonly number[] = [4, 10];
const FEMALE_TOMBS: readonly number[] = [1, 7];

export interface KimXaSteps {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
}

export function kimXaSteps(input: HazardHourInput): KimXaSteps {
  const year = mod(10 + input.yearBranch, 12);
  const month = mod(year - (input.month - 1), 12);
  const day = mod(month + (input.day - 1), 12);
  return { year, month, day, hour: mod(day - input.hourBranch, 12) };
}

const isIntegerIn = (value: number, min: number, max: number): boolean => Number.isInteger(value) && value >= min && value <= max;

const isChart = (source: Chart | HazardHourInput): source is Chart => "palaces" in source;

export const hazardInputFromChart = (chart: Chart): HazardHourInput => ({
  yearBranch: chart.parameters.year.branch,
  month: chart.parameters.month,
  day: chart.parameters.day,
  hourBranch: chart.parameters.hour,
  gender: chart.parameters.gender,
  isLeapMonth: chart.birth.lunar.isLeapMonth,
});

function validate(input: HazardHourInput): Result<HazardHourInput> {
  if (!isIntegerIn(input.yearBranch, 0, 11)) return err(`Chi năm phải từ 0 (Tý) đến 11 (Hợi); nhận được ${input.yearBranch}`);
  if (!isIntegerIn(input.month, 1, 12)) return err(`Tháng âm phải từ 1 đến 12; nhận được ${input.month}`);
  if (!isIntegerIn(input.day, 1, 30)) return err(`Ngày âm phải từ 1 đến 30; nhận được ${input.day}`);
  if (!isIntegerIn(input.hourBranch, 0, 11)) return err(`Chi giờ phải từ 0 (Tý) đến 11 (Hợi); nhận được ${input.hourBranch}`);
  return ok(input);
}

const KB_FILE = "01_Du-lieu-lap-la-so/01_Gio-sinh/02_Soat-gio-sinh-va-gio-xau-tre-em.md";
const ANCIENT_NOTE = "Cổ thư: trình bày như sách chép, không phải kết luận; vẫn phải luận đủ cung Phúc, Mệnh, Thân.";

function kimXaFinding(input: HazardHourInput, options: HazardHourOptions, leapAssumptions: readonly string[]): Finding {
  const steps = kimXaSteps(input);
  const landing = steps.hour;
  const inTombs = FOUR_TOMBS.includes(landing);
  const sexTombs = input.gender === "nam" ? MALE_TOMBS : input.gender === "nữ" ? FEMALE_TOMBS : null;
  const sexSpecificHit = sexTombs !== null && sexTombs.includes(landing);
  const ambiguous = inTombs && !sexSpecificHit;
  const hit = options.kimXaRule === "any-four-tombs" ? inTombs : sexSpecificHit;
  const chain = `năm ${branchName(steps.year)} → tháng ${branchName(steps.month)} → ngày ${branchName(steps.day)} → giờ ${branchName(steps.hour)}`;
  return finding({
    id: "GX-KIM-XA-THIET-TOA",
    name: "Giờ Kim Xà Thiết Tỏa",
    polarity: hit ? "xấu" : "trung tính",
    certainty: ambiguous || leapAssumptions.length ? "interpretive" : "exact",
    summary: hit
      ? `Phạm: dừng ở ${branchName(landing)} (${chain}). Sách nói trẻ "tất khó nuôi", phải ngoài 12 tuổi mới chắc thoát nạn; cung Phúc có yếu tố cứu thì qua được.`
      : inTombs
        ? `Dừng ở ${branchName(landing)} thuộc Tứ Mộ nhưng không phải cung kỵ của giới tính đang xét (${chain}).`
        : `Không phạm: dừng ở ${branchName(landing)}, ngoài Thìn Tuất Sửu Mùi (${chain}).`,
    satisfied: inTombs ? [`dừng ở Tứ Mộ (${branchName(landing)})`] : [],
    missing: inTombs ? (sexSpecificHit ? [] : [input.gender === undefined ? "chưa biết giới tính" : `giới ${input.gender} không kỵ cung ${branchName(landing)}`]) : ["không dừng ở Tứ Mộ"],
    assumptions: [
      ...leapAssumptions,
      ...(ambiguous
        ? [
            options.kimXaRule === "any-four-tombs"
              ? "Đang tính phạm khi dừng ở bất kỳ cung Tứ Mộ nào (A-KIMXA-SEX)."
              : "Đang chỉ tính phạm khi dừng đúng cung kỵ theo giới tính: trai Thìn/Tuất, gái Sửu/Mùi (A-KIMXA-SEX).",
          ]
        : []),
    ],
    variants: ambiguous
      ? ["Sách nói trước: dừng ở 1 trong 4 cung Thìn Tuất Sửu Mùi là gặp giờ Kim Xà; sau mới hạn theo giới tính. Không rõ trai dừng Sửu/Mùi (gái dừng Thìn/Tuất) có tính là Kim Xà không."]
      : [],
    breakers: hit ? [ANCIENT_NOTE] : [],
    source: "TVTH tr.89-90",
    kbFile: KB_FILE,
  });
}

function quanSatFinding(input: HazardHourInput, leapAssumptions: readonly string[]): Finding {
  const hour = quanSatHour(input.month);
  const hit = input.hourBranch === hour;
  return finding({
    id: "GX-QUAN-SAT",
    name: "Giờ Quan Sát",
    polarity: hit ? "xấu" : "trung tính",
    certainty: leapAssumptions.length ? "interpretive" : "exact",
    summary: `${hit ? "Phạm" : "Không phạm"}: tháng ${input.month} giờ Quan Sát là ${branchName(hour)}${hit ? "; trẻ hay ốm yếu" : ""}.`,
    assumptions: leapAssumptions,
    source: "TVTH tr.89",
    kbFile: KB_FILE,
  });
}

function seasonalFinding(table: SeasonalHourTable, input: HazardHourInput, leapAssumptions: readonly string[]): Finding {
  const season = seasonOfMonth(input.month);
  const hours = table.hours[season];
  const hit = hours.includes(input.hourBranch);
  return finding({
    id: table.id,
    name: table.name,
    polarity: hit ? "xấu" : "trung tính",
    certainty: "interpretive",
    summary: `${hit ? "Phạm" : "Không phạm"}: mùa ${season}, giờ ${table.name.replace("Giờ ", "")} là ${hours.map(branchName).join(", ")}${hit ? `; ${table.meaning}` : ""}.`,
    assumptions: [
      ...leapAssumptions,
      "Sách không nói tháng nào thuộc mùa nào; dùng cách hiểu phổ thông tháng 1–3 xuân, 4–6 hạ, 7–9 thu, 10–12 đông (A-SEASON).",
    ],
    source: "TVTH tr.89-90",
    kbFile: KB_FILE,
  });
}

export function childHazardHours(source: Chart | HazardHourInput, options: HazardHourOptions = DEFAULT_HAZARD_HOUR_OPTIONS): Result<readonly Finding[]> {
  const input = isChart(source) ? hazardInputFromChart(source) : source;
  const valid = validate(input);
  if (!valid.ok) return valid;
  const leapAssumptions = input.isLeapMonth ? ["Sinh tháng nhuận: dùng tháng đã quy đổi khi an sao; sách không nói giờ xấu tính thế nào với tháng nhuận (A-LEAP)."] : [];
  return ok([
    kimXaFinding(input, options, leapAssumptions),
    quanSatFinding(input, leapAssumptions),
    ...SEASONAL_HOUR_TABLES.map((table) => seasonalFinding(table, input, leapAssumptions)),
  ]);
}
