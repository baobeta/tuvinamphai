import type { Certainty, Polarity } from "../analysis/finding.js";
import type { StemBranch } from "../calendar/stem-branch.js";
import type { PalaceRole } from "../chart/palaces.js";
import type { Transformation } from "../chart/types.js";

export type PalaceFrame = "natal" | "major" | "yearly" | "minor";

export interface PalaceTarget {
  readonly frame: PalaceFrame;
  readonly role?: PalaceRole | undefined;
}

export type PalaceScope = "self" | "trine" | "three-sides";

export const FLOWING_STAR_NAMES = [
  "Lộc Tồn", "Thiên Mã", "Thái Tuế", "Tang Môn", "Bạch Hổ", "Kình Dương", "Đà La", "Thiên Khốc", "Thiên Hư", "Tuần", "Triệt",
] as const;

export type FlowingStarName = (typeof FLOWING_STAR_NAMES)[number];

export type TransformationStem = "view-year" | "major-palace";

export type PeriodLayerKind = "major" | "minor" | "yearly";

export const GOALS = ["hôn nhân", "tài lộc", "công danh", "thi cử", "sức khỏe", "con cái"] as const;

export type Goal = (typeof GOALS)[number];

interface Labelled {
  readonly label?: string | undefined;
}

export type CriterionSpec =
  | (Labelled & {
      readonly kind: "transformation";
      readonly transformation: Transformation;
      readonly stem?: TransformationStem | undefined;
      readonly targets?: readonly PalaceTarget[] | undefined;
      readonly scope?: PalaceScope | undefined;
    })
  | (Labelled & {
      readonly kind: "flowing-star";
      readonly stars: readonly FlowingStarName[];
      readonly targets?: readonly PalaceTarget[] | undefined;
      readonly scope?: PalaceScope | undefined;
    })
  | (Labelled & { readonly kind: "period-palace"; readonly layer: PeriodLayerKind; readonly targets?: readonly PalaceTarget[] | undefined })
  | (Labelled & { readonly kind: "coincidence" })
  | (Labelled & { readonly kind: "age-year" })
  | (Labelled & { readonly kind: "taboo" })
  | (Labelled & { readonly kind: "bureau-avoidance" })
  | (Labelled & { readonly kind: "trigger"; readonly id: string })
  | (Labelled & { readonly kind: "all" | "any"; readonly of: readonly CriterionSpec[] });

export interface CriterionInfo {
  readonly id: string;
  readonly name: string;
  readonly polarity: Polarity;
  readonly certainty: Certainty;
  readonly assumptions: readonly string[];
  readonly source: string;
  readonly kbFile?: string | undefined;
}

export interface CriterionHit {
  readonly criterionId: string;
  readonly details: readonly string[];
  readonly certainty: Certainty;
  readonly decade: boolean;
}

export interface YearScan {
  readonly year: number;
  readonly stemBranch: StemBranch;
  readonly age: number;
  readonly majorPalace: number | null;
  readonly majorFromAge: number | null;
  readonly minorPalace: number;
  readonly childhoodPalace: number | null;
  readonly yearlyPalace: number;
  readonly hits: readonly CriterionHit[];
}

export type RankBy = "net" | "count";

export interface RankedYear {
  readonly year: number;
  readonly score: number;
  readonly favourable: number;
  readonly unfavourable: number;
  readonly neutral: number;
}

export interface DecadeNote {
  readonly majorPalace: number;
  readonly fromYear: number;
  readonly toYear: number;
  readonly criterionId: string;
  readonly details: readonly string[];
  readonly certainty: Certainty;
}

export interface ScanRequest {
  readonly fromYear: number;
  readonly toYear: number;
  readonly criteria: readonly CriterionSpec[];
  readonly goal?: Goal | undefined;
  readonly palaces?: readonly PalaceTarget[] | undefined;
  readonly top?: number | undefined;
}

export interface ScanResult {
  readonly fromYear: number;
  readonly toYear: number;
  readonly goal: Goal | null;
  readonly rankBy: RankBy;
  readonly criteria: readonly CriterionInfo[];
  readonly years: readonly YearScan[];
  readonly ranking: readonly RankedYear[];
  readonly caution: readonly RankedYear[];
  readonly decadeNotes: readonly DecadeNote[];
}
