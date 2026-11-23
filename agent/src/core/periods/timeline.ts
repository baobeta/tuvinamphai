import { mod, yearStemBranch } from "../calendar/stem-branch.js";
import { finding, type Finding } from "../analysis/finding.js";
import { yearView } from "../chart/periods.js";
import type { Chart } from "../chart/types.js";
import {
  agePalace,
  isAgeYearReturn,
  isMajorMinorCoincidence,
  majorPeriodAtAge,
  minorPeriodAtAge,
  tabooRow,
  yearAtAge,
} from "./rules.js";

export interface TimelineOptions {
  readonly maxAge: number;
}

export const DEFAULT_TIMELINE_OPTIONS: TimelineOptions = { maxAge: 100 };

export interface TimelineMajorPeriod {
  readonly palace: number;
  readonly role: string;
  readonly fromAge: number;
  readonly toAge: number;
  readonly fromYear: number;
  readonly toYear: number;
}

export interface TimelineAgeEntry {
  readonly age: number;
  readonly year: number;
  readonly palace: number;
}

export interface TimelineChildhoodEntry extends TimelineAgeEntry {
  readonly role: string;
}

export interface TimelineAgeYearEntry extends TimelineAgeEntry {
  readonly majorAtAgePalace: boolean;
  readonly coincidence: boolean;
}

export interface TimelineTabooEntry {
  readonly age: number;
  readonly year: number;
  readonly yearBranch: number;
}

export interface LifetimeTimeline {
  readonly maxAge: number;
  readonly agePalace: number;
  readonly majorPeriods: readonly TimelineMajorPeriod[];
  readonly childhood: readonly TimelineChildhoodEntry[];
  readonly coincidences: readonly TimelineAgeEntry[];
  readonly ageYearReturns: readonly TimelineAgeYearEntry[];
  readonly tabooYears: readonly TimelineTabooEntry[];
  readonly findings: readonly Finding[];
}

export function lifetimeTimeline(chart: Chart, options: Partial<TimelineOptions> = {}): LifetimeTimeline {
  const maxAge = Math.max(1, Math.min(Math.floor(options.maxAge ?? DEFAULT_TIMELINE_OPTIONS.maxAge), 120));
  const ages = Array.from({ length: maxAge }, (_, i) => i + 1);
  const cungTuoi = agePalace(chart);
  const taboo = tabooRow(chart.parameters.year.branch);
  const majorPeriods = [...chart.palaces]
    .filter((palace) => palace.majorPeriodStartAge <= maxAge)
    .sort((a, b) => a.majorPeriodStartAge - b.majorPeriodStartAge)
    .map((palace) => ({
      palace: palace.branch,
      role: palace.role,
      fromAge: palace.majorPeriodStartAge,
      toAge: palace.majorPeriodStartAge + 9,
      fromYear: yearAtAge(chart, palace.majorPeriodStartAge),
      toYear: yearAtAge(chart, palace.majorPeriodStartAge + 9),
    }));
  const childhood = ages
    .filter((age) => age <= 12)
    .flatMap((age) => {
      const view = yearView(chart, yearAtAge(chart, age));
      const palace = view.ok ? view.value.childhoodPeriodPalace : null;
      return palace ? [{ age, year: yearAtAge(chart, age), palace: palace.branch, role: palace.role }] : [];
    });
  const coincidences = ages
    .filter((age) => isMajorMinorCoincidence(chart, age))
    .map((age) => ({ age, year: yearAtAge(chart, age), palace: minorPeriodAtAge(chart, age) }));
  const ageYearReturns = ages
    .filter(isAgeYearReturn)
    .map((age) => ({
      age,
      year: yearAtAge(chart, age),
      palace: cungTuoi,
      majorAtAgePalace: majorPeriodAtAge(chart, age)?.branch === cungTuoi,
      coincidence: isMajorMinorCoincidence(chart, age),
    }));
  const tabooYears = ages
    .map((age) => ({ age, year: yearAtAge(chart, age), yearBranch: mod(yearStemBranch(yearAtAge(chart, age)).branch, 12) }))
    .filter((entry) => taboo.years.includes(entry.yearBranch));
  const findings: readonly Finding[] = [
    finding({
      id: "PH-TRUNG-PHUNG-TIMELINE",
      name: "Các tuổi đại tiểu hạn trùng phùng",
      polarity: "trung tính",
      certainty: "exact",
      summary: coincidences.length ? coincidences.map((entry) => `${entry.age} (${entry.year})`).join(", ") : "không có trong khoảng tuổi xem",
      assumptions: ["Chỉ tính từ 13 tuổi; dưới 13 tuổi xem đồng hạn."],
      source: "TVTH tr.143",
      kbFile: "10_Van-han/03_Trung-phung/01_Dai-tieu-han-trung-phung.md",
    }),
    finding({
      id: "PH-CUNG-TUOI-TIMELINE",
      name: "Các năm tiểu hạn về cung tuổi",
      polarity: "trung tính",
      certainty: "interpretive",
      summary: ageYearReturns.map((entry) => `${entry.age} (${entry.year})`).join(", "),
      assumptions: ["Cung tuổi lấy là cung tiểu hạn 1 tuổi (A-THIENBAN)."],
      source: "TVTH tr.143; NP2 tr.281-284",
      kbFile: "10_Van-han/03_Trung-phung/02_Han-gap-cung-tuoi.md",
    }),
    finding({
      id: "PH-TUOI-KY-TIMELINE",
      name: "Các năm tuổi kỵ",
      polarity: "xấu",
      certainty: taboo.jointRow ? "interpretive" : "exact",
      summary: tabooYears.map((entry) => `${entry.year} (${entry.age} tuổi)`).join(", "),
      assumptions: taboo.jointRow ? ["Sách ghi chung một dòng cho hai tuổi; tách máy móc."] : [],
      source: "TVTH tr.142-143",
      kbFile: "10_Van-han/02_Tieu-han/03_Tuoi-ky-nam-ky.md",
    }),
  ];
  return { maxAge, agePalace: cungTuoi, majorPeriods, childhood, coincidences, ageYearReturns, tabooYears, findings };
}
