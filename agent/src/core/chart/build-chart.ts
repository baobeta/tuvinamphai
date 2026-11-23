import { elementRelation } from "../calendar/five-elements.js";
import { trineGroup } from "../calendar/relations.js";
import { nayin } from "../calendar/nayin.js";
import { mod, yearStemBranch } from "../calendar/stem-branch.js";
import { flatMapResult, ok, type Result } from "../result.js";
import { effectiveMonth, resolveBirth, type BirthInput } from "./birth.js";
import { placeMainStars } from "./main-stars.js";
import { placeMinorStars, placeTuanTriet } from "./minor-stars.js";
import {
  bodyPalaceOf,
  bureauOf,
  isForward,
  lifePalaceOf,
  palaceStem,
  polarityLabel,
  roleOfPalace,
} from "./palaces.js";
import { majorPeriodStartAge, minorPeriodYearBranch } from "./periods.js";
import { placeRings } from "./rings.js";
import { applyTransformations } from "./transformations.js";
import {
  DEFAULT_CHART_OPTIONS,
  type Chart,
  type ChartOptions,
  type ChartParameters,
  type LunarBirth,
  type Palace,
  type PlacedStar,
} from "./types.js";

export function chartParameters(birth: LunarBirth, month: number): ChartParameters {
  const year = yearStemBranch(birth.lunar.year);
  const lifePalace = lifePalaceOf(month, birth.hourBranch);
  return {
    year,
    month,
    day: birth.lunar.day,
    hour: birth.hourBranch,
    gender: birth.gender,
    forward: isForward(year.stem, birth.gender),
    lifePalace,
    bodyPalace: bodyPalaceOf(month, birth.hourBranch),
    bureau: bureauOf(year.stem, lifePalace),
  };
}

function variantNotes(params: ChartParameters, options: ChartOptions): readonly string[] {
  const stem = mod(params.year.stem, 10);
  return [
    ...(stem === 6
      ? [
          `Tuổi Canh: Khôi Việt theo ${options.khoiVietForCanh} (TVTH: Khôi Ngọ, Việt Dần; MLTC: Sửu–Mùi; NP1: Khôi Dần, Việt Ngọ).`,
          `Tuổi Canh: Tứ Hóa theo ${options.transformationsForCanh} (TVTH: Đồng Khoa, Âm Kỵ; MLTC Ch.3: Âm Khoa, Đồng Kỵ).`,
        ]
      : []),
    ...(stem === 8 ? [`Tuổi Nhâm: Hóa Khoa là ${options.khoaStarForNham} (bài thơ TVTH in Thiên Phủ; phần lớn sách ghi Tả Phụ).`] : []),
    ...(stem === 4 ? ["Tuổi Mậu: Hóa Khoa an ở Hữu Bật theo TVTH; MLTC có chỗ ghi Tả Phù."] : []),
    ...(stem === 7
      ? [
          "Tuổi Tân: Hóa Lộc ở Cự Môn; bài thơ TVTH tr.14 in \"Vũ\" là lỗi in.",
          `Tuổi Tân: Khôi Việt theo ${options.khoiVietForTan} (TVTH: Khôi Ngọ, Việt Dần; NP1: Khôi Dần, Việt Ngọ).`,
        ]
      : []),
    ...(trineGroup(params.year.branch) === 1
      ? [`Tuổi Tỵ Dậu Sửu: Hỏa Linh theo ${options.hoaLinhForTyDauSuu} (TVTH: Hỏa khởi Mão, Linh khởi Tuất; bản đời Tống trong MLTC: Hỏa Tuất, Linh Mão).`]
      : []),
    "Thiên Mã an theo chi năm (TVTH); MLTC bảng 13 có cách an theo tháng sinh.",
  ];
}

function assemblePalaces(params: ChartParameters, stars: readonly PlacedStar[]): readonly Palace[] {
  return Array.from({ length: 12 }, (_, branch): Palace => ({
    branch,
    stem: palaceStem(params.year.stem, branch),
    role: roleOfPalace(params.lifePalace, branch),
    isBodyPalace: branch === params.bodyPalace,
    majorPeriodStartAge: majorPeriodStartAge(params, branch),
    minorPeriodYearBranch: minorPeriodYearBranch(params, branch),
    stars: stars.filter((placed) => placed.palace === branch),
  }));
}

export function buildChartFromLunarBirth(birth: LunarBirth, options: ChartOptions = DEFAULT_CHART_OPTIONS): Chart {
  const month = effectiveMonth(birth.lunar, options.leapMonthRule);
  const params = chartParameters(birth, month.month);
  const stars = applyTransformations(
    [
      ...placeMainStars(params.bureau.number, params.day),
      ...placeMinorStars(params, options),
      ...placeRings(params),
      ...placeTuanTriet(params),
    ],
    params.year.stem,
    options,
  );
  const natalNayin = nayin(params.year);
  return {
    birth,
    options,
    parameters: params,
    polarityLabel: polarityLabel(params.year.stem, params.gender),
    natalNayin,
    bureauVersusNatal: elementRelation(params.bureau.element, natalNayin.element),
    bodyPalaceRole: roleOfPalace(params.lifePalace, params.bodyPalace),
    palaces: assemblePalaces(params, stars),
    notes: [...birth.notes, ...(month.note ? [month.note] : []), ...variantNotes(params, options)],
  };
}

export const buildChart = (input: BirthInput, options: ChartOptions = DEFAULT_CHART_OPTIONS): Result<Chart> =>
  flatMapResult(resolveBirth(input, options), (birth) => ok(buildChartFromLunarBirth(birth, options)));
