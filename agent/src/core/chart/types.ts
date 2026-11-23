import type { Element, ElementRelation } from "../calendar/five-elements.js";
import type { LunarDate, SolarDate } from "../calendar/lunar.js";
import type { Bureau, Nayin } from "../calendar/nayin.js";
import type { StemBranch } from "../calendar/stem-branch.js";
import type { TimezoneSetting } from "../calendar/vietnam-calendar.js";

export type Gender = "nam" | "nữ";

export type LeapMonthRule = "next-month" | "split-at-15";
export type SourceVariant = "TVTH" | "MLTC";

export interface ChartOptions {
  readonly leapMonthRule: LeapMonthRule;
  readonly lateRatHourNextDay: boolean;
  readonly khoiVietForCanh: SourceVariant | "NP1";
  readonly khoiVietForTan: "TVTH" | "NP1";
  readonly transformationsForCanh: SourceVariant;
  readonly khoaStarForNham: "Tả Phụ" | "Thiên Phủ";
  readonly hoaLinhForTyDauSuu: "TVTH" | "Tống";
  readonly timezone: TimezoneSetting;
}

export const DEFAULT_CHART_OPTIONS: ChartOptions = {
  leapMonthRule: "next-month",
  lateRatHourNextDay: false,
  khoiVietForCanh: "TVTH",
  khoiVietForTan: "TVTH",
  transformationsForCanh: "TVTH",
  khoaStarForNham: "Tả Phụ",
  hoaLinhForTyDauSuu: "TVTH",
  timezone: "historical",
};

export interface LunarBirth {
  readonly lunar: LunarDate;
  readonly hourBranch: number;
  readonly gender: Gender;
  readonly solar?: SolarDate;
  readonly clock?: string;
  readonly notes: readonly string[];
}

export interface ChartParameters {
  readonly year: StemBranch;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly gender: Gender;
  readonly forward: boolean;
  readonly lifePalace: number;
  readonly bodyPalace: number;
  readonly bureau: Bureau;
}

export type StarGroup = "chính tinh" | "phụ tinh" | "vòng Bác Sĩ" | "vòng Tràng Sinh" | "vòng Thái Tuế" | "Tuần Triệt";
export type Transformation = "Hóa Lộc" | "Hóa Quyền" | "Hóa Khoa" | "Hóa Kỵ";
export type Brightness = "Miếu" | "Vượng" | "Đắc" | "Lợi" | "Bình" | "Hãm";

export interface PlacedStar {
  readonly name: string;
  readonly group: StarGroup;
  readonly palace: number;
  readonly brightness?: Brightness;
  readonly transformation?: Transformation;
}

export interface Palace {
  readonly branch: number;
  readonly stem: number;
  readonly role: string;
  readonly isBodyPalace: boolean;
  readonly majorPeriodStartAge: number;
  readonly minorPeriodYearBranch: number;
  readonly stars: readonly PlacedStar[];
}

export interface Chart {
  readonly birth: LunarBirth;
  readonly options: ChartOptions;
  readonly parameters: ChartParameters;
  readonly polarityLabel: string;
  readonly natalNayin: Nayin;
  readonly bureauVersusNatal: ElementRelation;
  readonly bodyPalaceRole: string;
  readonly palaces: readonly Palace[];
  readonly notes: readonly string[];
}

export type { Element };
