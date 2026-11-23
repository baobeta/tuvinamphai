import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BRANCHES, parseBranch } from "../../src/core/calendar/stem-branch.js";
import type { BirthInput } from "../../src/core/chart/birth.js";
import { buildChart } from "../../src/core/chart/build-chart.js";
import { DEFAULT_CHART_OPTIONS, type Chart, type ChartOptions, type Gender } from "../../src/core/chart/types.js";
import { detectPatterns } from "../../src/core/patterns/index.js";
import type { Result } from "../../src/core/result.js";

type LunarFixtureBirth = {
  readonly calendar: "lunar";
  readonly yearCanChi: string;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly isLeapMonth: boolean;
  readonly hourBranch: string;
  readonly gender: Gender;
};

type SolarFixtureBirth = {
  readonly calendar: "solar";
  readonly yearCanChi: string;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly gender: Gender;
};

interface KnownDiscrepancy {
  readonly kind: string;
  readonly star?: string;
  readonly transformation?: string;
  readonly pattern?: string;
  readonly palace?: string;
  readonly bookBranch?: string;
  readonly engineBranch?: string;
  readonly reason: string;
  readonly source: string;
}

interface SuspectedEngineBug {
  readonly star?: string;
  readonly pattern?: string;
  readonly bookBranch?: string;
  readonly reason: string;
  readonly source: string;
}

interface SampleChartFixture {
  readonly id: string;
  readonly title: string;
  readonly kbFile: string;
  readonly bookSource: string;
  readonly bookPage: string;
  readonly confidence: "high" | "low";
  readonly birth: LunarFixtureBirth | SolarFixtureBirth;
  readonly yearChoice: string;
  readonly options: Readonly<Record<string, string>>;
  readonly expected: {
    readonly polarity?: string;
    readonly lifeBranch: string;
    readonly bodyBranch?: string;
    readonly bureau?: string;
    readonly nayin?: string;
    readonly palaces: Readonly<Record<string, string>>;
    readonly stars: Readonly<Record<string, readonly string[]>>;
    readonly transformations: Readonly<Record<string, readonly string[]>>;
    readonly patterns: readonly string[];
  };
  readonly knownDiscrepancies: readonly KnownDiscrepancy[];
  readonly suspectedEngineBugs: readonly SuspectedEngineBug[];
}

const REPO_ROOT = path.join(import.meta.dirname, "../../..");
const FIXTURE_DIR = path.join(import.meta.dirname, "../fixtures/sample-charts");
const KB_SAMPLE_DIR = path.join(REPO_ROOT, "Kien-thuc-Tu-Vi-Nam-Phai/13_La-so-mau");

const fixtures: readonly SampleChartFixture[] = fs
  .readdirSync(FIXTURE_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, file), "utf8")) as SampleChartFixture);

const unwrap = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const branchIndex = (name: string): number => unwrap(parseBranch(name));

function chartOptions(overrides: Readonly<Record<string, string>>): ChartOptions {
  const unknown = Object.keys(overrides).filter((key) => !(key in DEFAULT_CHART_OPTIONS));
  if (unknown.length) throw new Error(`Tùy chọn không tồn tại: ${unknown.join(", ")}`);
  return { ...DEFAULT_CHART_OPTIONS, ...overrides } as ChartOptions;
}

function birthInput(birth: LunarFixtureBirth | SolarFixtureBirth): BirthInput {
  if (birth.calendar === "lunar") {
    return {
      calendar: "lunar",
      date: { year: birth.year, month: birth.month, day: birth.day, isLeapMonth: birth.isLeapMonth },
      hourBranch: branchIndex(birth.hourBranch),
      gender: birth.gender,
    };
  }
  return {
    calendar: "solar",
    date: { year: birth.year, month: birth.month, day: birth.day },
    time: { hour: birth.hour, minute: birth.minute },
    gender: birth.gender,
  };
}

const branchesOfStar = (chart: Chart, name: string): string[] =>
  chart.palaces.filter((palace) => palace.stars.some((star) => star.name === name)).map((palace) => BRANCHES[palace.branch]!);

const transformationsAt = (chart: Chart, branch: string): string[] =>
  chart.palaces[branchIndex(branch)]!.stars.flatMap((star) => (star.transformation ? [star.transformation] : []));

const roleBranch = (chart: Chart, role: string): string | undefined => {
  const palace = chart.palaces.find((item) => item.role === role);
  return palace ? BRANCHES[palace.branch] : undefined;
};

const describeDiscrepancy = (item: KnownDiscrepancy): string =>
  `${item.kind}: ${item.star ?? item.transformation ?? item.pattern ?? item.palace} sách ${item.bookBranch ?? "-"}, engine ${item.engineBranch ?? "-"}`;

const describeBug = (item: SuspectedEngineBug): string => `${item.star ?? item.pattern} ${item.bookBranch ?? ""}`.trim();

describe("bộ lá số mẫu", () => {
  it("mỗi file lá số mẫu trong kho tri thức có đúng một fixture", () => {
    const kbFiles = fs
      .readdirSync(KB_SAMPLE_DIR)
      .filter((file) => file.endsWith(".md") && !file.startsWith("00_"))
      .map((file) => `Kien-thuc-Tu-Vi-Nam-Phai/13_La-so-mau/${file}`)
      .sort();
    expect(fixtures.map((fixture) => fixture.kbFile).sort()).toEqual(kbFiles);
  });

  it("can chi năm của fixture khớp năm đã chọn", () => {
    for (const fixture of fixtures) {
      const chart = unwrap(buildChart(birthInput(fixture.birth), chartOptions(fixture.options)));
      const [stem, branch] = fixture.birth.yearCanChi.split(" ");
      expect(BRANCHES[chart.parameters.year.branch], fixture.id).toBe(branch);
      expect(chart.parameters.year.stem, fixture.id).toBe(["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"].indexOf(stem!));
    }
  });
});

describe.each(fixtures.map((fixture) => [`${fixture.id} · ${fixture.title} (${fixture.bookPage})`, fixture] as const))("%s", (_, fixture) => {
  const chart = unwrap(buildChart(birthInput(fixture.birth), chartOptions(fixture.options)));
  const { expected } = fixture;
  const detected = detectPatterns(chart).map((finding) => finding.id);
  const starPairs = Object.entries(expected.stars).flatMap(([branch, names]) => names.map((name) => [name, branch] as const));
  const transformationPairs = Object.entries(expected.transformations).flatMap(([branch, names]) => names.map((name) => [name, branch] as const));

  it("âm dương, Mệnh, Thân, cục, nạp âm", () => {
    expect(BRANCHES[chart.parameters.lifePalace]).toBe(expected.lifeBranch);
    if (expected.polarity) expect(chart.polarityLabel).toBe(expected.polarity);
    if (expected.bodyBranch) expect(BRANCHES[chart.parameters.bodyPalace]).toBe(expected.bodyBranch);
    if (expected.bureau) expect(chart.parameters.bureau.name).toBe(expected.bureau);
    if (expected.nayin) expect(chart.natalNayin.name).toBe(expected.nayin);
  });

  it("12 cung chức đúng địa chi", () => {
    expect(Object.fromEntries(chart.palaces.map((palace) => [palace.role, BRANCHES[palace.branch]]))).toEqual(expected.palaces);
  });

  it.each(starPairs)("%s ở %s", (name, branch) => {
    expect(branchesOfStar(chart, name)).toContain(branch);
  });

  if (transformationPairs.length) {
    it.each(transformationPairs)("%s ở %s", (name, branch) => {
      expect(transformationsAt(chart, branch)).toContain(name);
    });
  }

  if (expected.patterns.length) {
    it.each(expected.patterns)("nhận ra cách %s", (id) => {
      expect(detected).toContain(id);
    });
  }

  if (fixture.knownDiscrepancies.length) {
    it.each(fixture.knownDiscrepancies.map((item) => [describeDiscrepancy(item), item] as const))("lệch đã biết %s", (_, item) => {
      expect(item.reason.length).toBeGreaterThan(0);
      expect(item.source.length).toBeGreaterThan(0);
      if (item.star) {
        const actual = branchesOfStar(chart, item.star);
        expect(actual).not.toContain(item.bookBranch);
        expect(actual).toContain(item.engineBranch);
      }
      if (item.transformation) {
        expect(transformationsAt(chart, item.bookBranch!)).not.toContain(item.transformation);
        expect(transformationsAt(chart, item.engineBranch!)).toContain(item.transformation);
      }
      if (item.palace) {
        expect(roleBranch(chart, item.palace)).toBe(item.engineBranch);
        expect(roleBranch(chart, item.palace)).not.toBe(item.bookBranch);
      }
      if (item.pattern) expect(detected).not.toContain(item.pattern);
    });
  }

  for (const bug of fixture.suspectedEngineBugs) {
    it.fails(`nghi lỗi engine: ${describeBug(bug)}`, () => {
      if (bug.star) expect(branchesOfStar(chart, bug.star)).toContain(bug.bookBranch);
      if (bug.pattern) expect(detected).toContain(bug.pattern);
    });
  }
});
