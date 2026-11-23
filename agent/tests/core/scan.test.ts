import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildChart } from "../../src/core/chart/build-chart.js";
import { yearView } from "../../src/core/chart/periods.js";
import { DEFAULT_CHART_OPTIONS, type Chart } from "../../src/core/chart/types.js";
import { periodLayers } from "../../src/core/periods/index.js";
import type { Result } from "../../src/core/result.js";
import {
  compileCriterion,
  GOAL_PRESETS,
  GOALS,
  renderYearScan,
  scanYears,
  SKIPPED_TRIGGERS,
  TRIGGERS,
  type CriterionSpec,
  type ScanResult,
  type YearScan,
} from "../../src/core/scan/index.js";

const KB_ROOT = path.join(import.meta.dirname, "..", "..", "..", "Kien-thuc-Tu-Vi-Nam-Phai");

const unwrap = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const chart: Chart = unwrap(
  buildChart({ calendar: "lunar", date: { year: 1974, month: 3, day: 7, isLeapMonth: false }, hourBranch: 2, gender: "nữ" }, DEFAULT_CHART_OPTIONS),
);

const scan = (fromYear: number, toYear: number, criteria: readonly CriterionSpec[]): ScanResult => unwrap(scanYears(chart, { fromYear, toYear, criteria }));
const yearOf = (result: ScanResult, year: number): YearScan => result.years.find((item) => item.year === year)!;
const hitIds = (result: ScanResult, year: number): readonly string[] => yearOf(result, year).hits.map((hit) => hit.criterionId);

const DAN = 2;
const NGO = 6;

describe("scanYears: đối chiếu tay với yearView / periodLayers", () => {
  it("lá số mẫu: Mệnh ở Dần, nữ Giáp Dần nên tiểu hạn 1 tuổi ở Thìn đi nghịch", () => {
    expect(chart.parameters.lifePalace).toBe(DAN);
    expect(chart.palaces[NGO]!.role).toBe("Quan Lộc");
  });

  it.each([1996, 2011, 2026])("năm %i: cung đại hạn, tiểu hạn, lưu niên khớp yearView", (year) => {
    const view = unwrap(yearView(chart, year));
    const result = scan(year, year, [{ kind: "coincidence" }]);
    const row = yearOf(result, year);
    expect(row.age).toBe(view.age);
    expect(row.majorPalace).toBe(view.majorPeriod?.palace.branch ?? null);
    expect(row.minorPalace).toBe(view.minorPeriodPalace.branch);
    expect(row.yearlyPalace).toBe(view.viewYearStemBranch.branch);
    expect(row.hits.length > 0).toBe(unwrap(periodLayers(chart, { year })).coincidence.majorMinor);
  });

  it("1996 Bính Tý (tuổi 23): tính tay sao lưu và tứ hóa", () => {
    const result = scan(1996, 1996, [
      { kind: "flowing-star", stars: ["Thái Tuế"], targets: [{ frame: "natal", role: "Phu Thê" }] },
      { kind: "flowing-star", stars: ["Bạch Hổ"], targets: [{ frame: "natal", role: "Thiên Di" }] },
      { kind: "flowing-star", stars: ["Lộc Tồn"], targets: [{ frame: "natal", role: "Điền Trạch" }] },
      { kind: "flowing-star", stars: ["Thiên Mã"], targets: [{ frame: "natal", role: "Mệnh" }] },
      { kind: "flowing-star", stars: ["Tang Môn"], targets: [{ frame: "natal", role: "Phu Thê" }] },
      { kind: "transformation", transformation: "Hóa Kỵ", targets: [{ frame: "natal", role: "Mệnh" }] },
      { kind: "period-palace", layer: "minor", targets: [{ frame: "natal", role: "Quan Lộc" }] },
      { kind: "period-palace", layer: "major", targets: [{ frame: "natal", role: "Huynh Đệ" }] },
    ]);
    const row = yearOf(result, 1996);
    expect(row.age).toBe(23);
    expect(row.minorPalace).toBe(NGO);
    expect(row.hits.map((hit) => hit.criterionId)).toEqual([
      "L.Thái Tuế@natal.Phu Thê~self",
      "L.Bạch Hổ@natal.Thiên Di~self",
      "L.Lộc Tồn@natal.Điền Trạch~self",
      "L.Thiên Mã@natal.Mệnh~self",
      "Hóa Kỵ/view-year@natal.Mệnh~self",
      "minor=natal.Quan Lộc",
      "major=natal.Huynh Đệ",
    ]);
    expect(row.hits.find((hit) => hit.criterionId.startsWith("Hóa Kỵ"))!.details[0]).toContain("Liêm Trinh");
  });

  it("2011 Tân Mão (tuổi 38): Thái Tuế ở Phụ Mẫu, Lộc Tồn ở Tật Ách, Mã ở Điền Trạch, tiểu hạn ở Mão", () => {
    const result = scan(2011, 2011, [
      { kind: "flowing-star", stars: ["Thái Tuế"], targets: [{ frame: "natal", role: "Phụ Mẫu" }] },
      { kind: "flowing-star", stars: ["Lộc Tồn"], targets: [{ frame: "natal", role: "Tật Ách" }] },
      { kind: "flowing-star", stars: ["Kình Dương"], targets: [{ frame: "natal", role: "Tài Bạch" }] },
      { kind: "flowing-star", stars: ["Thiên Mã"], targets: [{ frame: "natal", role: "Điền Trạch" }] },
      { kind: "period-palace", layer: "minor", targets: [{ frame: "natal", role: "Phụ Mẫu" }] },
      { kind: "transformation", transformation: "Hóa Khoa", targets: [{ frame: "natal", role: "Quan Lộc" }] },
    ]);
    expect(hitIds(result, 2011)).toHaveLength(6);
    const view = unwrap(yearView(chart, 2011));
    expect(view.flowingTransformations.find((item) => item.transformation === "Hóa Khoa")!.star).toBe("Văn Khúc");
  });

  it("2026 Bính Ngọ (tuổi 53): Hổ lưu ở Mệnh, tiểu hạn ở Tý; tam phương tứ chính khác cùng cung", () => {
    const view = unwrap(yearView(chart, 2026));
    const ky = view.flowingTransformations.find((item) => item.transformation === "Hóa Kỵ")!;
    const opposite = chart.palaces[(ky.palace! + 6) % 12]!.role as "Mệnh";
    const result = scan(2026, 2026, [
      { kind: "flowing-star", stars: ["Bạch Hổ"], targets: [{ frame: "natal", role: "Mệnh" }] },
      { kind: "flowing-star", stars: ["Thái Tuế"], targets: [{ frame: "yearly" }] },
      { kind: "period-palace", layer: "minor", targets: [{ frame: "natal", role: "Phu Thê" }] },
      { kind: "transformation", transformation: "Hóa Kỵ", targets: [{ frame: "natal", role: opposite }], scope: "three-sides", label: "Kỵ xung" },
      { kind: "transformation", transformation: "Hóa Kỵ", targets: [{ frame: "natal", role: opposite }], scope: "trine", label: "Kỵ tam hợp" },
    ]);
    expect(yearOf(result, 2026).age).toBe(53);
    expect(hitIds(result, 2026)).toEqual([
      "L.Bạch Hổ@natal.Mệnh~self",
      "L.Thái Tuế@yearly.Mệnh~self",
      "minor=natal.Phu Thê",
      `Hóa Kỵ/view-year@natal.${opposite}~three-sides`,
    ]);
  });

  it("tuổi kỵ, cục kỵ hành, năm tuổi theo periodLayers cho mọi năm", () => {
    const result = scan(1990, 2049, [{ kind: "taboo" }, { kind: "bureau-avoidance" }, { kind: "age-year" }]);
    for (const row of result.years) {
      const layers = unwrap(periodLayers(chart, { year: row.year }));
      const ids = row.hits.map((hit) => hit.criterionId);
      expect(ids.includes("tuoi-ky")).toBe(layers.findings.some((item) => item.id === "PH-TUOI-KY-NAM"));
      expect(ids.includes("cuc-ky-hanh")).toBe(layers.findings.some((item) => item.id === "PH-CUC-KY-HANH"));
      expect(ids.includes("nam-tuoi")).toBe(row.stemBranch.branch === chart.parameters.year.branch);
    }
  });

  it("all / any ghép tiêu chí", () => {
    const thaiTue = { kind: "flowing-star", stars: ["Thái Tuế"], targets: [{ frame: "natal", role: "Phu Thê" }] } as const;
    const loc = { kind: "flowing-star", stars: ["Lộc Tồn"], targets: [{ frame: "natal", role: "Mệnh" }] } as const;
    const result = scan(1996, 1996, [
      { kind: "all", of: [thaiTue, loc], label: "cả hai" },
      { kind: "any", of: [thaiTue, loc], label: "một trong hai" },
    ]);
    expect(yearOf(result, 1996).hits).toHaveLength(1);
    expect(result.criteria.find((item) => item.id === yearOf(result, 1996).hits[0]!.criterionId)!.name).toBe("một trong hai");
  });
});

describe("goal preset", () => {
  it("mọi preset dẫn nguồn sách và file kho có thật", () => {
    for (const goal of GOALS) {
      const preset = GOAL_PRESETS[goal];
      expect(preset.criteria.length).toBeGreaterThan(0);
      for (const spec of preset.criteria) {
        const criterion = unwrap(compileCriterion(spec));
        expect(criterion.source).toMatch(/TVTH|MLTC|NP1|NP2/);
        expect(criterion.kbFile, criterion.id).toBeDefined();
        expect(existsSync(path.join(KB_ROOT, criterion.kbFile!)), criterion.kbFile).toBe(true);
      }
    }
  });

  it("trigger theo sự việc thuộc đúng file 07_Han-theo-su-viec hoặc 04_Luu-nien, có trong preset, cách hiểu thì có giả định", () => {
    const presetIds = new Set(GOALS.flatMap((goal) => GOAL_PRESETS[goal].criteria.flatMap((spec) => (spec.kind === "trigger" ? [spec.id] : []))));
    for (const trigger of TRIGGERS) {
      expect(trigger.kbFile).toMatch(/^10_Van-han\/(07_Han-theo-su-viec|04_Luu-nien)\//);
      expect(presetIds.has(trigger.id), trigger.id).toBe(true);
      if (trigger.certainty === "interpretive") expect(trigger.assumptions.length, trigger.id).toBeGreaterThan(0);
    }
    expect(GOAL_PRESETS["hôn nhân"].criteria).toContainEqual({ kind: "trigger", id: "HN-MLTC-HONG-LOAN-NHAP-HAN" });
    expect(GOAL_PRESETS["sức khỏe"].criteria).toContainEqual({ kind: "taboo" });
  });

  it("SKIPPED_TRIGGERS có lý do và không trùng trigger đã làm", () => {
    const implemented = new Set(TRIGGERS.map((trigger) => trigger.id));
    const ids = SKIPPED_TRIGGERS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of SKIPPED_TRIGGERS) {
      expect(implemented.has(item.id)).toBe(false);
      expect(item.reason.length).toBeGreaterThan(10);
      expect(item.source).toMatch(/TVTH|MLTC|NP1|NP2/);
    }
  });

  it("goal kết hợp criteria tùy chọn, bảng và xếp hạng có nguồn", () => {
    const result = unwrap(
      scanYears(chart, { fromYear: 1996, toYear: 2025, goal: "hôn nhân", criteria: [{ kind: "coincidence" }], top: 3 }),
    );
    expect(result.criteria.at(-1)!.id).toBe("trung-phung");
    expect(result.ranking.length).toBeLessThanOrEqual(3);
    expect(result.ranking.map((item) => item.score)).toEqual([...result.ranking.map((item) => item.score)].sort((a, b) => b - a));
    const text = renderYearScan(chart, result);
    expect(text).toContain("| Năm | Can chi | Tuổi | Đại hạn | Tiểu hạn | Khớp |");
    expect(text).toContain("### Xếp hạng");
    expect(text).toContain("[MLTC tr.903-944");
    expect(text).toContain("### Chưa tính");
  });
});

describe("hiệu năng", () => {
  it("30 năm với mọi trigger dưới 50 ms", () => {
    const criteria: readonly CriterionSpec[] = [...TRIGGERS.map((trigger) => ({ kind: "trigger" as const, id: trigger.id })), { kind: "taboo" }, { kind: "bureau-avoidance" }];
    scanYears(chart, { fromYear: 1990, toYear: 2019, criteria });
    const runs = Array.from({ length: 5 }, () => {
      const started = performance.now();
      unwrap(scanYears(chart, { fromYear: 1990, toYear: 2019, criteria }));
      return performance.now() - started;
    });
    expect(Math.min(...runs)).toBeLessThan(50);
  });
});

describe("đầu vào sai trả lỗi", () => {
  it.each<[string, Parameters<typeof scanYears>[1]]>([
    ["fromYear > toYear", { fromYear: 2010, toYear: 2000, criteria: [{ kind: "taboo" }] }],
    ["quá 60 năm", { fromYear: 1980, toYear: 2040, criteria: [{ kind: "taboo" }] }],
    ["năm không nguyên", { fromYear: 2000.5, toYear: 2001, criteria: [{ kind: "taboo" }] }],
    ["trước năm sinh", { fromYear: 1970, toYear: 1980, criteria: [{ kind: "taboo" }] }],
    ["không có tiêu chí", { fromYear: 2000, toYear: 2001, criteria: [] }],
    ["trigger không tồn tại", { fromYear: 2000, toYear: 2001, criteria: [{ kind: "trigger", id: "XYZ" }] }],
    ["thiếu cung", { fromYear: 2000, toYear: 2001, criteria: [{ kind: "flowing-star", stars: ["Bạch Hổ"] }] }],
    ["tiểu hạn không có cung chức", { fromYear: 2000, toYear: 2001, criteria: [{ kind: "period-palace", layer: "major", targets: [{ frame: "minor", role: "Tài Bạch" }] }] }],
    ["all rỗng", { fromYear: 2000, toYear: 2001, criteria: [{ kind: "all", of: [] }] }],
    ["top âm", { fromYear: 2000, toYear: 2001, criteria: [{ kind: "taboo" }], top: 0 }],
  ])("%s", (_, request) => {
    const result = scanYears(chart, request);
    expect(result.ok).toBe(false);
  });

  it("palaces chung làm cung mặc định", () => {
    const result = unwrap(
      scanYears(chart, { fromYear: 1996, toYear: 1996, criteria: [{ kind: "flowing-star", stars: ["Thái Tuế"] }], palaces: [{ frame: "natal", role: "Phu Thê" }] }),
    );
    expect(result.years[0]!.hits).toHaveLength(1);
  });
});

describe("xếp hạng, tiêu chí cấp đại hạn, tuổi nhỏ", () => {
  it("net: chỉ liệt kê năm điểm dương; trung tính không cộng điểm", () => {
    const result = unwrap(scanYears(chart, { fromYear: 1990, toYear: 2049, criteria: [], goal: "hôn nhân", top: 20 }));
    expect(result.ranking.every((item) => item.score > 0 && item.score === item.favourable - item.unfavourable)).toBe(true);
    const neutralOnly = scan(1990, 2049, [{ kind: "flowing-star", stars: ["Thái Tuế"], targets: [{ frame: "natal", role: "Mệnh" }] }]);
    expect(neutralOnly.years.some((year) => year.hits.length)).toBe(true);
    expect(neutralOnly.ranking).toEqual([]);
  });

  it("count: năm chỉ có tiêu chí xấu không vào xếp hạng mà vào năm cần lưu ý", () => {
    const result = unwrap(scanYears(chart, { fromYear: 1990, toYear: 2049, criteria: [], goal: "sức khỏe" }));
    expect(result.ranking.every((item) => item.favourable > 0)).toBe(true);
    expect(result.caution.length).toBeGreaterThan(0);
    expect(result.caution.every((item) => item.unfavourable > 0)).toBe(true);
    const text = renderYearScan(chart, result);
    expect(text).toContain("### Năm cần lưu ý");
  });

  it("HN-MLTC-CAN-PHU-THE-KY-DAI-HAN chỉ ghi một lần mỗi đại hạn, không cộng điểm từng năm", () => {
    const id = "HN-MLTC-CAN-PHU-THE-KY-DAI-HAN";
    const result = unwrap(scanYears(chart, { fromYear: 2019, toYear: 2028, criteria: [{ kind: "trigger", id }] }));
    const hits = result.years.flatMap((year) => year.hits);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.decade)).toBe(true);
    expect(result.ranking).toEqual([]);
    const notes = result.decadeNotes.filter((note) => note.criterionId === id);
    expect(notes).toHaveLength(new Set(result.years.filter((year) => year.hits.length).map((year) => year.majorPalace)).size);
    expect(renderYearScan(chart, result)).toContain("### Ghi chú theo đại hạn");
  });

  it("dưới 13 tuổi: không có hit hôn nhân, không neo cung tiểu hạn", () => {
    const result = unwrap(scanYears(chart, { fromYear: 1974, toYear: 1986, criteria: [{ kind: "period-palace", layer: "minor", targets: [{ frame: "natal", role: "Mệnh" }] }], goal: "hôn nhân" }));
    const row1992 = unwrap(scanYears(chart, { fromYear: 1976, toYear: 1976, criteria: [], goal: "hôn nhân" })).years[0]!;
    expect(row1992.age).toBe(3);
    expect(row1992.hits).toEqual([]);
    for (const year of result.years.filter((item) => item.age < 13)) expect(year.hits, String(year.year)).toEqual([]);
    expect(result.years.find((year) => year.age === 3)!.childhoodPalace).not.toBeNull();
    expect(renderYearScan(chart, result)).toContain("đồng hạn");
  });

  it("chú giải ghi mức chắc chắn theo các hit thực tế", () => {
    const id = "CD-MLTC-CAN-DAI-HAN-QUYEN";
    const result = unwrap(scanYears(chart, { fromYear: 1990, toYear: 2049, criteria: [{ kind: "trigger", id }] }));
    const seen = new Set(result.years.flatMap((year) => year.hits.map((hit) => hit.certainty)));
    expect(seen.size).toBeGreaterThan(0);
    const line = renderYearScan(chart, result).split("\n").find((text) => text.startsWith("- **C1**"))!;
    const expected = seen.size > 1 ? "chắc chắn hoặc theo cách hiểu tùy năm" : seen.has("exact") ? "khớp chắc chắn" : "khớp theo cách hiểu";
    expect(line).toContain(expected);
  });
});
