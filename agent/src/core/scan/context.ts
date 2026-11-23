import { branchName, mod, yearStemBranch, type StemBranch } from "../calendar/stem-branch.js";
import { ROLE_OFFSET, type PalaceRole } from "../chart/palaces.js";
import type { FlowingStar } from "../chart/periods.js";
import type { Chart, Transformation } from "../chart/types.js";
import type { PeriodLayers } from "../periods/layers.js";
import { transformationsForStem, type StemTransformation } from "../periods/rules.js";
import type { PalaceFrame, PalaceScope, PalaceTarget } from "./types.js";

export interface ChartIndex {
  readonly chart: Chart;
  readonly starPalaces: ReadonlyMap<string, readonly number[]>;
  readonly natalTransformations: ReadonlyMap<Transformation, readonly { readonly star: string; readonly palace: number }[]>;
  readonly transformationsByStem: (stem: number) => readonly StemTransformation[];
}

export function indexChart(chart: Chart): ChartIndex {
  const starPalaces = new Map<string, number[]>();
  const natalTransformations = new Map<Transformation, { star: string; palace: number }[]>();
  for (const palace of chart.palaces) {
    for (const star of palace.stars) {
      starPalaces.set(star.name, [...(starPalaces.get(star.name) ?? []), palace.branch]);
      if (star.transformation) {
        natalTransformations.set(star.transformation, [...(natalTransformations.get(star.transformation) ?? []), { star: star.name, palace: palace.branch }]);
      }
    }
  }
  const byStem = new Map<number, readonly StemTransformation[]>();
  const transformationsByStem = (stem: number): readonly StemTransformation[] => {
    const key = mod(stem, 10);
    const cached = byStem.get(key);
    if (cached) return cached;
    const computed = transformationsForStem(chart, key);
    byStem.set(key, computed);
    return computed;
  };
  return { chart, starPalaces, natalTransformations, transformationsByStem };
}

export const CHILDHOOD_END_AGE = 13;

export interface YearContext {
  readonly index: ChartIndex;
  readonly chart: Chart;
  readonly year: number;
  readonly stemBranch: StemBranch;
  readonly age: number;
  readonly layers: PeriodLayers;
  readonly majorPalace: number | null;
  readonly minorPalace: number | null;
  readonly minorPeriodPalace: number;
  readonly childhoodPalace: number | null;
  readonly yearlyPalace: number;
  readonly flowing: readonly FlowingStar[];
  readonly yearlyTransformations: readonly StemTransformation[];
  readonly majorTransformations: readonly StemTransformation[];
}

export function yearContext(index: ChartIndex, layers: PeriodLayers): YearContext {
  const stemBranch = yearStemBranch(layers.view.year);
  const minorPeriodPalace = layers.layers.find((layer) => layer.name === "Tiểu hạn")!.palace;
  const childhoodPalace = layers.layers.find((layer) => layer.name === "Đồng hạn")?.palace ?? null;
  const majorPalace = layers.majorPeriod?.palace ?? null;
  return {
    index,
    chart: index.chart,
    year: layers.view.year,
    stemBranch,
    age: layers.age,
    layers,
    majorPalace,
    minorPalace: layers.age >= CHILDHOOD_END_AGE ? minorPeriodPalace : null,
    minorPeriodPalace,
    childhoodPalace,
    yearlyPalace: stemBranch.branch,
    flowing: layers.flowingStars,
    yearlyTransformations: index.transformationsByStem(stemBranch.stem),
    majorTransformations: majorPalace === null ? [] : index.transformationsByStem(index.chart.palaces[majorPalace]!.stem),
  };
}

const frameAnchor = (ctx: YearContext, frame: PalaceFrame): number | null => {
  if (frame === "natal") return ctx.chart.parameters.lifePalace;
  if (frame === "major") return ctx.majorPalace;
  if (frame === "yearly") return ctx.yearlyPalace;
  return ctx.minorPalace;
};

export const resolveTarget = (ctx: YearContext, target: PalaceTarget): number | null => {
  const anchor = frameAnchor(ctx, target.frame);
  return anchor === null ? null : mod(anchor + ROLE_OFFSET[target.role ?? "Mệnh"], 12);
};

export const FRAME_LABEL: Readonly<Record<PalaceFrame, string>> = {
  natal: "bản mệnh",
  major: "đại hạn",
  yearly: "lưu niên",
  minor: "tiểu hạn",
};

export const targetLabel = (target: PalaceTarget): string => {
  const role: PalaceRole = target.role ?? "Mệnh";
  if (target.frame === "minor") return "cung tiểu hạn";
  if (role === "Mệnh" && target.frame === "major") return "cung đại hạn";
  if (role === "Mệnh" && target.frame === "yearly") return "cung Lưu niên";
  return `${role} ${FRAME_LABEL[target.frame]}`;
};

export const SCOPE_LABEL: Readonly<Record<PalaceScope, string>> = {
  self: "ở",
  trine: "trong tam hợp",
  "three-sides": "trong tam phương tứ chính",
};

export const scopePalaces = (branch: number, scope: PalaceScope): readonly number[] => {
  if (scope === "self") return [branch];
  const trine = [branch, mod(branch + 4, 12), mod(branch + 8, 12)];
  return scope === "trine" ? trine : [...trine, mod(branch + 6, 12)];
};

export const palaceText = (chart: Chart, branch: number): string => `${chart.palaces[branch]!.role} (${branchName(branch)})`;

export interface TokenPlacement {
  readonly label: string;
  readonly palace: number;
  readonly flowing: boolean;
}

const TRANSFORMATION_TOKENS: readonly Transformation[] = ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"];

export const FLOWING_COUNTERPARTS: ReadonlySet<string> = new Set([
  "Lộc Tồn", "Thiên Mã", "Kình Dương", "Đà La", "Thái Tuế", "Tang Môn", "Bạch Hổ", "Thiên Khốc", "Thiên Hư",
]);

export function tokenPlacements(ctx: YearContext, token: string, includeFlowing: boolean): readonly TokenPlacement[] {
  const transformation = TRANSFORMATION_TOKENS.find((name) => name === token);
  if (transformation) {
    const natal = (ctx.index.natalTransformations.get(transformation) ?? []).map((item) => ({
      label: `${transformation} gốc (${item.star})`,
      palace: item.palace,
      flowing: false,
    }));
    const flowing = includeFlowing
      ? ctx.yearlyTransformations
          .filter((item) => item.transformation === transformation && item.palace !== null)
          .map((item) => ({ label: `${transformation} lưu niên (${item.star})`, palace: item.palace!, flowing: true }))
      : [];
    return [...natal, ...flowing];
  }
  const natal = (ctx.index.starPalaces.get(token) ?? []).map((palace) => ({ label: token, palace, flowing: false }));
  const flowing =
    includeFlowing && FLOWING_COUNTERPARTS.has(token)
      ? ctx.flowing.filter((star) => star.name === `L. ${token}`).map((star) => ({ label: star.name, palace: star.palace, flowing: true }))
      : [];
  return [...natal, ...flowing];
}

export const placementText = (ctx: YearContext, placement: TokenPlacement): string => `${placement.label} ở ${palaceText(ctx.chart, placement.palace)}`;

export const hasMainStar = (ctx: YearContext, branch: number, names: readonly string[]): readonly string[] =>
  ctx.chart.palaces[branch]!.stars.filter((star) => star.group === "chính tinh" && names.includes(star.name)).map((star) => star.name);
