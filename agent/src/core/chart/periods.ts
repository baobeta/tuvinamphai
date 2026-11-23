import { trineGroup } from "../calendar/relations.js";
import { mod, tuanVoidBranches, yearStemBranch } from "../calendar/stem-branch.js";
import { err, ok, type Result } from "../result.js";
import { locTonPalace, thienMaPalace, trietPalaces } from "./minor-stars.js";
import { palaceOfRole, type PalaceRole } from "./palaces.js";
import { TRANSFORMATION_ORDER, transformationStars } from "./transformations.js";
import type { Chart, ChartParameters, Palace, Transformation } from "./types.js";

const MINOR_PERIOD_START_BY_TRINE: readonly [number, number, number, number] = [10, 7, 4, 1];

const CHILDHOOD_PERIOD_ROLES: readonly PalaceRole[] = [
  "Mệnh", "Tài Bạch", "Tật Ách", "Phu Thê", "Phúc Đức", "Quan Lộc",
  "Nô Bộc", "Thiên Di", "Tử Tức", "Huynh Đệ", "Phụ Mẫu", "Điền Trạch",
];

export const MAX_VIEW_AGE = 120;

export const majorPeriodStartAge = (params: ChartParameters, branch: number): number => {
  const steps = mod((branch - params.lifePalace) * (params.forward ? 1 : -1), 12);
  return params.bureau.number + 10 * steps;
};

export const minorPeriodStartPalace = (yearBranch: number): number => MINOR_PERIOD_START_BY_TRINE[trineGroup(yearBranch)]!;

const minorPeriodDirection = (params: ChartParameters): 1 | -1 => (params.gender === "nam" ? 1 : -1);

export const minorPeriodYearBranch = (params: ChartParameters, branch: number): number => {
  const steps = mod((branch - minorPeriodStartPalace(params.year.branch)) * minorPeriodDirection(params), 12);
  return mod(params.year.branch + steps, 12);
};

export const minorPeriodPalaceAtAge = (params: ChartParameters, age: number): number =>
  mod(minorPeriodStartPalace(params.year.branch) + minorPeriodDirection(params) * (age - 1), 12);

export const firstMonthPalace = (viewYearBranch: number, birthMonth: number, birthHour: number): number =>
  mod(viewYearBranch - (birthMonth - 1) + birthHour, 12);

export interface FlowingTransformation {
  readonly star: string;
  readonly transformation: Transformation;
  readonly palace: number | null;
}

export function flowingTransformations(chart: Chart, viewYear: number): readonly FlowingTransformation[] {
  const targets = transformationStars(yearStemBranch(viewYear).stem, chart.options);
  return targets.map((star, i) => ({
    star,
    transformation: TRANSFORMATION_ORDER[i]!,
    palace: chart.palaces.find((palace) => palace.stars.some((placed) => placed.name === star))?.branch ?? null,
  }));
}

export interface FlowingStar {
  readonly name: string;
  readonly palace: number;
}

export function flowingStars(viewYear: number): readonly FlowingStar[] {
  const year = yearStemBranch(viewYear);
  const locTon = locTonPalace(year.stem);
  const [tuanA, tuanB] = tuanVoidBranches(year);
  const [trietA, trietB] = trietPalaces(year.stem);
  return [
    { name: "L. Thái Tuế", palace: year.branch },
    { name: "L. Tang Môn", palace: mod(year.branch + 2, 12) },
    { name: "L. Bạch Hổ", palace: mod(year.branch + 8, 12) },
    { name: "L. Lộc Tồn", palace: locTon },
    { name: "L. Kình Dương", palace: mod(locTon + 1, 12) },
    { name: "L. Đà La", palace: mod(locTon - 1, 12) },
    { name: "L. Thiên Mã", palace: thienMaPalace(year.branch) },
    { name: "L. Thiên Khốc", palace: mod(6 - year.branch, 12) },
    { name: "L. Thiên Hư", palace: mod(6 + year.branch, 12) },
    { name: "L. Tuần", palace: tuanA },
    { name: "L. Tuần", palace: tuanB },
    { name: "L. Triệt", palace: mod(trietA, 12) },
    { name: "L. Triệt", palace: mod(trietB, 12) },
  ];
}

export interface YearView {
  readonly viewYear: number;
  readonly viewYearStemBranch: { readonly stem: number; readonly branch: number };
  readonly age: number;
  readonly majorPeriod: { readonly palace: Palace; readonly fromAge: number; readonly toAge: number } | null;
  readonly minorPeriodPalace: Palace;
  readonly childhoodPeriodPalace: Palace | null;
  readonly firstMonthPalace: Palace;
  readonly flowingStars: readonly FlowingStar[];
  readonly flowingTransformations: readonly FlowingTransformation[];
}

export function yearView(chart: Chart, viewYear: number): Result<YearView> {
  const age = viewYear - chart.birth.lunar.year + 1;
  if (!Number.isInteger(viewYear) || age < 1 || age > MAX_VIEW_AGE) {
    return err(`Năm xem phải từ ${chart.birth.lunar.year} đến ${chart.birth.lunar.year + MAX_VIEW_AGE - 1}; nhận được ${viewYear}`);
  }
  const params = chart.parameters;
  const palaceAt = (branch: number): Palace => chart.palaces[mod(branch, 12)]!;
  const majorPalace = chart.palaces.find((palace) => age >= palace.majorPeriodStartAge && age < palace.majorPeriodStartAge + 10);
  const minorPalace = minorPeriodPalaceAtAge(params, age);
  const viewYearBranch = yearStemBranch(viewYear).branch;
  const firstMonth = firstMonthPalace(viewYearBranch, params.month, params.hour);
  return ok({
    viewYear,
    viewYearStemBranch: yearStemBranch(viewYear),
    age,
    majorPeriod: majorPalace
      ? { palace: majorPalace, fromAge: majorPalace.majorPeriodStartAge, toAge: majorPalace.majorPeriodStartAge + 9 }
      : null,
    minorPeriodPalace: palaceAt(minorPalace),
    childhoodPeriodPalace: age <= 12 ? palaceAt(palaceOfRole(params.lifePalace, CHILDHOOD_PERIOD_ROLES[age - 1]!)) : null,
    firstMonthPalace: palaceAt(firstMonth),
    flowingStars: flowingStars(viewYear),
    flowingTransformations: flowingTransformations(chart, viewYear),
  });
}
