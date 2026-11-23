import type { Finding } from "../analysis/finding.js";
import type { Chart, Palace } from "../chart/types.js";

export type Book = "TVTH" | "MLTC" | "NP1" | "NP2";
export type BookPreference = "any" | "TVTH" | "MLTC";
export type PatternPolarity = "tốt" | "xấu";
export type Scope = "đồng cung" | "tam hợp" | "xung chiếu" | "tam phương tứ chính";

export interface PatternOptions {
  readonly book: BookPreference;
  readonly minLuckyCount: number;
  readonly minCourtStars: number;
  readonly manyMaleficThreshold: number;
  readonly strongIncludesDac: boolean;
  readonly daytimeHours: readonly number[];
  readonly thienKhongReading: "Địa Không" | "Thiên Không";
  readonly khongVongIncludesThienKhong: boolean;
  readonly thienLuongHamTable: "TVTH" | "MLTC";
  readonly thaiAmHamTable: "TVTH" | "MLTC";
  readonly vanKhucHamTable: "TVTH" | "MLTC";
  readonly tuanTrietBreaks: boolean;
  readonly soloKinhReading: "vô chính diệu" | "không sát tinh khác";
  readonly linhXuongDaVuFourthStar: "Đà La" | "Hỏa Tinh";
  readonly allFourMaleficsForVoDao: boolean;
}

export const DEFAULT_PATTERN_OPTIONS: PatternOptions = {
  book: "any",
  minLuckyCount: 2,
  minCourtStars: 3,
  manyMaleficThreshold: 2,
  strongIncludesDac: false,
  daytimeHours: [3, 4, 5, 6, 7, 8],
  thienKhongReading: "Địa Không",
  khongVongIncludesThienKhong: false,
  thienLuongHamTable: "TVTH",
  thaiAmHamTable: "TVTH",
  vanKhucHamTable: "TVTH",
  tuanTrietBreaks: true,
  soloKinhReading: "vô chính diệu",
  linhXuongDaVuFourthStar: "Đà La",
  allFourMaleficsForVoDao: true,
};

export interface Condition {
  readonly label: string;
  readonly met: boolean;
  readonly assumption?: string;
}

export interface Variant {
  readonly book: Book;
  readonly cite: string;
  readonly label: string;
  readonly required: readonly Condition[];
  readonly grade?: readonly Condition[];
  readonly strengtheners?: readonly Condition[];
  readonly breakers?: readonly Condition[];
  readonly assumptions?: readonly string[];
}

export interface PatternContext {
  readonly chart: Chart;
  readonly options: PatternOptions;
  readonly life: Palace;
  readonly body: Palace;
}

export interface PatternEvaluation {
  readonly matched: boolean;
  readonly finding: Finding;
}

export interface PatternRule {
  readonly id: string;
  readonly name: string;
  readonly polarity: PatternPolarity;
  readonly source: string;
  readonly kbFile: string;
  readonly evaluate: (chart: Chart, options: PatternOptions) => PatternEvaluation | null;
}

export interface PatternDefinition {
  readonly id: string;
  readonly name: string;
  readonly polarity: PatternPolarity;
  readonly source: string;
  readonly kbFile: string;
  readonly variants: (ctx: PatternContext) => readonly Variant[];
  readonly commonBreakers?: (ctx: PatternContext) => readonly Condition[];
  readonly notes?: readonly string[];
}
