import { BUREAU_AVOIDED_BRANCHES as AVOIDED_BRANCHES_BY_ELEMENT } from "../analysis/natal-tables.js";
import type { Element } from "../calendar/five-elements.js";
import { BRANCHES } from "../calendar/stem-branch.js";
import { mod } from "../calendar/stem-branch.js";
import { PALACE_ROLES, type PalaceRole } from "../chart/palaces.js";
import { minorPeriodPalaceAtAge, minorPeriodStartPalace } from "../chart/periods.js";
import { TRANSFORMATION_ORDER, transformationStars } from "../chart/transformations.js";
import type { Chart, Palace, Transformation } from "../chart/types.js";

export interface PalaceAssignment {
  readonly branch: number;
  readonly role: PalaceRole;
}

export const layerRoles = (layerLifeBranch: number): readonly PalaceAssignment[] =>
  PALACE_ROLES.map((role, offset) => ({ branch: mod(layerLifeBranch + offset, 12), role }));

export const ageInYear = (chart: Chart, viewYear: number): number => viewYear - chart.birth.lunar.year + 1;
export const yearAtAge = (chart: Chart, age: number): number => chart.birth.lunar.year + age - 1;

export const majorPeriodAtAge = (chart: Chart, age: number): Palace | undefined =>
  chart.palaces.find((palace) => age >= palace.majorPeriodStartAge && age <= palace.majorPeriodStartAge + 9);

export const minorPeriodAtAge = (chart: Chart, age: number): number => minorPeriodPalaceAtAge(chart.parameters, age);

export const COINCIDENCE_MIN_AGE = 13;

export function isMajorMinorCoincidence(chart: Chart, age: number): boolean {
  const major = majorPeriodAtAge(chart, age);
  return age >= COINCIDENCE_MIN_AGE && major !== undefined && major.branch === minorPeriodAtAge(chart, age);
}

export const agePalace = (chart: Chart): number => minorPeriodStartPalace(chart.parameters.year.branch);

export const isAgeYearReturn = (age: number): boolean => age >= 1 && mod(age - 1, 12) === 0;

export const FLOWING_MAJOR_LAST_STEP_IN_BOOK = 7;

export function flowingMajorPeriodPalace(majorPalace: number, startAge: number, forward: boolean, age: number): number | null {
  const step = age - startAge;
  if (!Number.isInteger(step) || step < 0 || step > 9) return null;
  const direction = forward ? 1 : -1;
  const opposite = mod(majorPalace + 6, 12);
  if (step === 0) return mod(majorPalace, 12);
  if (step === 1 || step === 3) return opposite;
  if (step === 2) return mod(opposite - direction, 12);
  return mod(opposite + direction * (step - 3), 12);
}

export const ringDistance = (a: number, b: number): number => Math.min(mod(a - b, 12), mod(b - a, 12));

export function largestPeriodSideStep(opposite: number, largestPeriodPalace: number, forward: boolean): number {
  const direction = forward ? 1 : -1;
  const against = mod(opposite - direction, 12);
  const along = mod(opposite + direction, 12);
  return ringDistance(along, largestPeriodPalace) < ringDistance(against, largestPeriodPalace) ? along : against;
}

const BUREAU_ELEMENT_BY_NUMBER: Readonly<Record<number, Element>> = { 2: "Thủy", 3: "Mộc", 4: "Kim", 5: "Thổ", 6: "Hỏa" };

export const BUREAU_AVOIDED_BRANCHES: Readonly<Record<number, readonly number[]>> = Object.fromEntries(
  Object.entries(BUREAU_ELEMENT_BY_NUMBER).map(([bureauNumber, element]) => [
    Number(bureauNumber),
    AVOIDED_BRANCHES_BY_ELEMENT[element].map((name) => BRANCHES.indexOf(name)),
  ]),
);

export const BUREAU_AVOIDANCE_UNCERTAIN: readonly number[] = [3, 4];

export const fixedMonthPalace = (month: number): number => mod(2 + month - 1, 12);
export const flowingMonthPalace = (firstMonth: number, month: number): number => mod(firstMonth + month - 1, 12);
export const flowingDayPalace = (monthPalace: number, day: number): number => mod(monthPalace + day - 1, 12);
export const flowingHourPalace = (dayPalace: number, hourBranch: number): number => mod(dayPalace + hourBranch, 12);

export interface TabooRow {
  readonly years: readonly number[];
  readonly periodPalaces: readonly number[];
  readonly stars: readonly string[];
  readonly jointRow: boolean;
}

const row = (years: readonly number[], stars: readonly string[] = [], periodPalaces: readonly number[] = [], jointRow = false): TabooRow => ({
  years,
  periodPalaces,
  stars,
  jointRow,
});

export const TABOO_BY_BIRTH_BRANCH: readonly TabooRow[] = [
  row([2, 8, 0, 6]),
  row([1, 6], ["Thất Sát"], [], true),
  row([5, 11, 3, 9], [], [], true),
  row([5, 11, 3, 9], [], [], true),
  row([4], [], [4, 10]),
  row([5], [], [5]),
  row([1, 6], ["Thất Sát"], [], true),
  row([9, 11], ["Kình Dương"]),
  row([2, 6], ["Linh Tinh", "Hỏa Tinh"]),
  row([3, 2], ["Kình Dương", "Đà La"]),
  row([5, 4, 10], ["Kình Dương", "Đà La"]),
  row([5], ["Kình Dương", "Đà La"]),
];

export const tabooRow = (birthBranch: number): TabooRow => TABOO_BY_BIRTH_BRANCH[mod(birthBranch, 12)]!;

export type DipperGroup = "Nam đẩu" | "Bắc đẩu" | "cả hai" | "chưa phân loại";

export const NORTHERN_DIPPER = [
  "Cự Môn", "Văn Xương", "Lộc Tồn", "Kình Dương", "Đà La", "Tả Phụ",
  "Hữu Bật", "Thái Âm", "Liêm Trinh", "Vũ Khúc", "Phá Quân", "Tham Lang",
] as const;
export const SOUTHERN_DIPPER = ["Thái Dương", "Văn Khúc", "Thiên Tướng", "Thiên Đồng", "Hỏa Tinh", "Linh Tinh"] as const;
export const SOUTHERN_DIPPER_NP1_ONLY = ["Thiên Cơ"] as const;
export const BOTH_DIPPERS = ["Tử Vi"] as const;
export const UNCLASSIFIED_DIPPER = ["Thiên Phủ", "Thiên Lương", "Thất Sát"] as const;

export function dipperGroupOf(star: string): { readonly group: DipperGroup; readonly np1Only: boolean } | null {
  if ((NORTHERN_DIPPER as readonly string[]).includes(star)) return { group: "Bắc đẩu", np1Only: false };
  if ((SOUTHERN_DIPPER as readonly string[]).includes(star)) return { group: "Nam đẩu", np1Only: false };
  if ((SOUTHERN_DIPPER_NP1_ONLY as readonly string[]).includes(star)) return { group: "Nam đẩu", np1Only: true };
  if ((BOTH_DIPPERS as readonly string[]).includes(star)) return { group: "cả hai", np1Only: false };
  if ((UNCLASSIFIED_DIPPER as readonly string[]).includes(star)) return { group: "chưa phân loại", np1Only: false };
  return null;
}

export const favourableDipper = (chart: Chart): "Nam đẩu" | "Bắc đẩu" => (chart.parameters.forward ? "Nam đẩu" : "Bắc đẩu");

export const emphasisDipper = (stepInDecade: number): "Nam đẩu" | "Bắc đẩu" => (stepInDecade <= 4 ? "Bắc đẩu" : "Nam đẩu");

export interface StemTransformation {
  readonly star: string;
  readonly transformation: Transformation;
  readonly palace: number | null;
}

export function transformationsForStem(chart: Chart, stem: number): readonly StemTransformation[] {
  return transformationStars(stem, chart.options).map((star, i) => ({
    star,
    transformation: TRANSFORMATION_ORDER[i]!,
    palace: chart.palaces.find((palace) => palace.stars.some((placed) => placed.name === star))?.branch ?? null,
  }));
}

export function transformationVariants(stem: number, chart: Chart): readonly string[] {
  const normalized = mod(stem, 10);
  if (normalized === 6) {
    return [`Can Canh: đang dùng ${chart.options.transformationsForCanh}; TVTH Đồng Khoa, Âm Kỵ; MLTC Ch.3 Âm Khoa, Đồng Kỵ.`];
  }
  if (normalized === 7) return ["Can Tân: bài thơ TVTH \"Tân Vũ Dương Khúc Xương\" (Vũ Khúc Lộc); các chỗ khác, kể cả TVTH tr.196, là Cự Môn Lộc."];
  if (normalized === 8) return [`Can Nhâm: đang dùng ${chart.options.khoaStarForNham} Khoa; TVTH in Thiên Phủ Khoa, nhiều sách ghi Tả Phụ.`];
  if (normalized === 4) return ["Can Mậu: Hữu Bật Khoa theo TVTH; MLTC có chỗ ghi Tả Phù."];
  return [];
}
