import { leapMonthOfYear, lunarToSolar, type LunarDate } from "../calendar/lunar.js";
import { branchName } from "../calendar/stem-branch.js";
import { finding, type Finding } from "../analysis/finding.js";
import { lifePalace, mainStarsIn, palacesOfStar } from "../analysis/chart-query.js";
import { buildChartFromLunarBirth } from "../chart/build-chart.js";
import { DEFAULT_CHART_OPTIONS, type ChartOptions, type Gender } from "../chart/types.js";
import { err, ok, type Result } from "../result.js";

export type HourGroupId = "A" | "B" | "C";
export type SleepPosition = "nằm ngửa" | "nằm nghiêng" | "nằm sấp";
export type LittleFinger = "cao hơn" | "bằng" | "thấp hơn";

export interface HourGroup {
  readonly id: HourGroupId;
  readonly hours: readonly number[];
  readonly sleep: SleepPosition;
  readonly littleFinger: LittleFinger;
  readonly appearance: string;
  readonly birthOrderMale: readonly number[];
  readonly birthOrderFemale: readonly number[];
}

export const HOUR_GROUPS: readonly HourGroup[] = [
  {
    id: "A",
    hours: [0, 6, 3, 9],
    sleep: "nằm ngửa",
    littleFinger: "cao hơn",
    appearance: "xoáy tóc giữa đỉnh, mắt trong, giọng thanh, mặt và thân tròn",
    birthOrderMale: [1, 4, 7],
    birthOrderFemale: [2, 5, 8],
  },
  {
    id: "B",
    hours: [2, 8, 5, 11],
    sleep: "nằm nghiêng",
    littleFinger: "bằng",
    appearance: "xoáy lệch trái, thân bụ bẫm, giọng thô, mặt vuông",
    birthOrderMale: [3, 6, 9],
    birthOrderFemale: [1, 4, 7],
  },
  {
    id: "C",
    hours: [4, 10, 1, 7],
    sleep: "nằm sấp",
    littleFinger: "thấp hơn",
    appearance: "xoáy lệch phải hoặc hai xoáy, thân dài, tính hung hãn, giọng mạnh",
    birthOrderMale: [2, 5, 8],
    birthOrderFemale: [3, 6, 9],
  },
];

export const hourGroupOf = (hourBranch: number): HourGroup => HOUR_GROUPS.find((group) => group.hours.includes(hourBranch))!;

export interface HourObservations {
  readonly sleep?: SleepPosition;
  readonly littleFinger?: LittleFinger;
  readonly appearanceGroup?: HourGroupId;
  readonly birthOrder?: number;
}

export interface BirthHourFields {
  readonly lunar: LunarDate;
  readonly gender: Gender;
}

export interface BirthHourOptions {
  readonly chartOptions: ChartOptions;
  readonly observations: HourObservations;
}

export const DEFAULT_BIRTH_HOUR_OPTIONS: BirthHourOptions = { chartOptions: DEFAULT_CHART_OPTIONS, observations: {} };

export const HOUR_DEPENDENT_STARS = [
  "Văn Xương", "Văn Khúc", "Địa Không", "Địa Kiếp", "Hỏa Tinh", "Linh Tinh", "Thai Phụ", "Phong Cáo", "Đẩu Quân",
] as const;

const BODY_PALACE_TRAITS: Readonly<Record<string, string>> = {
  Mệnh: "Thân Mệnh đồng cung: cố chấp, bảo thủ",
  "Thiên Di": "Thân cư Di: thích ra ngoài, xa quê",
  "Phúc Đức": "Thân cư Phúc: coi trọng gia đình, dòng họ",
  "Tài Bạch": "Thân cư Tài: thực dụng",
  "Phu Thê": "Thân cư Phu Thê: đặt gia đình lên đầu",
  "Quan Lộc": "Thân cư Quan: đam mê công việc",
};

export interface BirthHourCandidate {
  readonly hourBranch: number;
  readonly group: HourGroupId;
  readonly groupScore: number;
  readonly lifePalace: number;
  readonly bodyPalace: number;
  readonly bodyPalaceRole: string;
  readonly bodyPalaceTrait: string;
  readonly bureau: string;
  readonly mainStarsInLife: readonly string[];
  readonly hourStars: readonly { readonly star: string; readonly palaces: readonly number[] }[];
}

export interface GroupScore {
  readonly group: HourGroupId;
  readonly score: number;
  readonly matched: readonly string[];
}

export interface BirthHourComparison {
  readonly candidates: readonly BirthHourCandidate[];
  readonly groupScores: readonly GroupScore[];
  readonly bestGroups: readonly HourGroupId[];
  readonly findings: readonly Finding[];
}

function scoreGroups(observations: HourObservations, gender: Gender): readonly GroupScore[] {
  return HOUR_GROUPS.map((group) => {
    const birthOrders = gender === "nam" ? group.birthOrderMale : group.birthOrderFemale;
    const matched = [
      ...(observations.sleep === group.sleep ? [`tư thế ngủ: ${group.sleep}`] : []),
      ...(observations.littleFinger === group.littleFinger ? [`ngón út ${group.littleFinger} nếp lằn`] : []),
      ...(observations.appearanceGroup === group.id ? [`ngoại hình: ${group.appearance}`] : []),
      ...(observations.birthOrder !== undefined && birthOrders.includes(observations.birthOrder) ? [`con thứ ${observations.birthOrder}`] : []),
    ];
    return { group: group.id, score: matched.length, matched };
  });
}

export function birthHourCandidates(
  fields: BirthHourFields,
  hourBranches: readonly number[],
  options: Partial<BirthHourOptions> = {},
): Result<BirthHourComparison> {
  const chartOptions = options.chartOptions ?? DEFAULT_CHART_OPTIONS;
  const observations = options.observations ?? {};
  if (hourBranches.length === 0) return err("Cần ít nhất một giờ ứng viên.");
  const invalid = hourBranches.find((hour) => !Number.isInteger(hour) || hour < 0 || hour > 11);
  if (invalid !== undefined) return err(`Chi giờ phải từ 0 (Tý) đến 11 (Hợi); nhận được ${invalid}`);
  if (new Set(hourBranches).size !== hourBranches.length) return err("Danh sách giờ ứng viên bị trùng.");
  const date = lunarToSolar(fields.lunar);
  if (!date.ok) return date;
  if (observations.birthOrder !== undefined && (!Number.isInteger(observations.birthOrder) || observations.birthOrder < 1)) {
    return err(`Thứ bậc con phải là số nguyên dương; nhận được ${observations.birthOrder}`);
  }

  const groupScores = scoreGroups(observations, fields.gender);
  const topScore = Math.max(...groupScores.map((score) => score.score));
  const bestGroups = topScore > 0 ? groupScores.filter((score) => score.score === topScore).map((score) => score.group) : [];

  const candidates = hourBranches.map((hourBranch): BirthHourCandidate => {
    const chart = buildChartFromLunarBirth({ lunar: fields.lunar, hourBranch, gender: fields.gender, notes: [] }, chartOptions);
    const group = hourGroupOf(hourBranch);
    return {
      hourBranch,
      group: group.id,
      groupScore: groupScores.find((score) => score.group === group.id)!.score,
      lifePalace: chart.parameters.lifePalace,
      bodyPalace: chart.parameters.bodyPalace,
      bodyPalaceRole: chart.bodyPalaceRole,
      bodyPalaceTrait: BODY_PALACE_TRAITS[chart.bodyPalaceRole] ?? "",
      bureau: chart.parameters.bureau.name,
      mainStarsInLife: mainStarsIn(lifePalace(chart)).map((star) => star.name),
      hourStars: HOUR_DEPENDENT_STARS.map((star) => ({ star, palaces: palacesOfStar(chart, star) })),
    };
  });

  const leapMonth = leapMonthOfYear(fields.lunar.year);
  const bornInLeapYear = leapMonth.ok && leapMonth.value !== null;
  const orderOutOfBook = observations.birthOrder !== undefined && observations.birthOrder > 9;
  const findings: readonly Finding[] = [
    finding({
      id: "GS-NHOM-GIO",
      name: "Thu hẹp nhóm giờ sinh",
      polarity: "trung tính",
      certainty: "interpretive",
      summary: bestGroups.length
        ? `Nhóm trùng nhiều dấu hiệu nhất: ${bestGroups
            .map((id) => `${id} (${HOUR_GROUPS.find((group) => group.id === id)!.hours.map(branchName).join(", ")})`)
            .join("; ")}.`
        : "Chưa có dấu hiệu quan sát nào khớp nhóm giờ.",
      satisfied: groupScores.flatMap((score) => score.matched.map((text) => `${score.group}: ${text}`)),
      assumptions: [
        "Các mẹo hình thể là kinh nghiệm dân gian, MLTC chỉ dùng chữ \"tham khảo\"; giờ cuối cùng phải nghiệm bằng tính cách và biến cố đã qua.",
        ...(bestGroups.length > 1 ? ["Nhiều nhóm bằng điểm; sách không có quy tắc phân xử."] : []),
        ...(orderOutOfBook ? ["Sách chỉ ghi thứ bậc con đến 9; không ngoại suy."] : []),
      ],
      source: "MLTC tr.987-988",
      kbFile: "01_Du-lieu-lap-la-so/01_Gio-sinh/03_Xac-dinh-lai-gio-sinh.md",
    }),
    finding({
      id: "GS-CANDIDATES",
      name: "Lập thử lá số theo từng giờ",
      polarity: "trung tính",
      certainty: "exact",
      summary: candidates
        .map((c) => `giờ ${branchName(c.hourBranch)}: Mệnh ${branchName(c.lifePalace)}, Thân ${branchName(c.bodyPalace)} (cư ${c.bodyPalaceRole}), ${c.bureau}`)
        .join("; "),
      assumptions: ["Cục chỉ đổi khi cung Mệnh mới có nạp âm khác hành.", ...(bornInLeapYear ? ["MLTC mục 7.2: người sinh năm nhuận thì độ chính xác khi suy đoán giảm đi đôi chút."] : [])],
      source: "MLTC tr.988 mục 5",
      kbFile: "01_Du-lieu-lap-la-so/01_Gio-sinh/03_Xac-dinh-lai-gio-sinh.md",
    }),
  ];
  return ok({ candidates, groupScores, bestGroups, findings });
}
