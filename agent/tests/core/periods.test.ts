import { describe, expect, it } from "vitest";
import { daysInLunarMonth } from "../../src/core/calendar/lunar.js";
import { BRANCHES, parseBranch } from "../../src/core/calendar/stem-branch.js";
import { buildChart } from "../../src/core/chart/build-chart.js";
import { DEFAULT_CHART_OPTIONS, type Chart } from "../../src/core/chart/types.js";
import type { Result } from "../../src/core/result.js";
import {
  birthHourCandidates,
  childHazardHours,
  dipperGroupOf,
  flowingDayPalace,
  flowingHourPalace,
  flowingMajorPeriodPalace,
  kimXaSteps,
  layerRoles,
  lifetimeTimeline,
  periodLayers,
  quanSatHour,
  renderBirthHourCandidates,
  renderChildHazardHours,
  renderLifetimeTimeline,
  renderPeriodLayers,
  SEASONAL_HOUR_TABLES,
  SKIPPED_RULES,
  type PeriodLayers,
  type LayerName,
} from "../../src/core/periods/index.js";

const unwrap = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const branch = (name: string): number => unwrap(parseBranch(name));
const name = (index: number | null | undefined): string | undefined => (index === null || index === undefined ? undefined : BRANCHES[index]);

const lunarChart = (year: number, month: number, day: number, hour: string, gender: "nam" | "nữ"): Chart =>
  unwrap(
    buildChart(
      { calendar: "lunar", date: { year, month, day, isLeapMonth: false }, hourBranch: branch(hour), gender },
      DEFAULT_CHART_OPTIONS,
    ),
  );

const layerPalace = (layers: PeriodLayers, layer: LayerName): string | undefined => name(layers.layers.find((item) => item.name === layer)?.palace);

const rolesByBranch = (lifeBranch: string): Record<string, string> =>
  Object.fromEntries(layerRoles(branch(lifeBranch)).map((item) => [BRANCHES[item.branch]!, item.role]));

const duongNuThuy2MenhDan = lunarChart(1988, 1, 1, "Tý", "nữ");
const namCanhNgoMenhTy = lunarChart(1990, 1, 15, "Dần", "nam");
const nuCanhNgoMenhTy = lunarChart(1990, 1, 15, "Dần", "nữ");
const namCanhNgoMenhTi = lunarChart(1990, 8, 15, "Thìn", "nam");

describe("lá số dùng trong ví dụ", () => {
  it("Dương Nữ Mậu Thìn, Mệnh Dần, Thủy nhị cục (khớp ví dụ TVTH tr.141)", () => {
    expect(duongNuThuy2MenhDan.polarityLabel).toBe("Dương Nữ");
    expect(name(duongNuThuy2MenhDan.parameters.lifePalace)).toBe("Dần");
    expect(duongNuThuy2MenhDan.parameters.bureau.name).toBe("Thủy nhị cục");
  });

  it("Nam Canh Ngọ 1990, Mệnh Tý, Hỏa lục cục (KB 03_Trung-phung/01)", () => {
    expect(namCanhNgoMenhTy.polarityLabel).toBe("Dương Nam");
    expect(name(namCanhNgoMenhTy.parameters.lifePalace)).toBe("Tý");
    expect(namCanhNgoMenhTy.parameters.bureau.name).toBe("Hỏa lục cục");
  });
});

describe("PH-LUU-DAI-HAN lưu đại hạn (TVTH tr.141)", () => {
  it.each([
    [32, "Hợi"],
    [33, "Tỵ"],
    [34, "Ngọ"],
    [35, "Tỵ"],
    [36, "Thìn"],
    [37, "Mão"],
    [38, "Dần"],
    [39, "Sửu"],
  ])("TVTH tr.141 Dương Nữ Thủy 2 Mệnh Dần, tuổi %i → %s", (age, expected) => {
    expect(name(flowingMajorPeriodPalace(branch("Hợi"), 32, false, age))).toBe(expected);
  });

  it("TVTH tr.141 ngoại suy theo công thức: 40 → Tý, 41 → Hợi; ngoài đại hạn → null", () => {
    expect(name(flowingMajorPeriodPalace(branch("Hợi"), 32, false, 40))).toBe("Tý");
    expect(name(flowingMajorPeriodPalace(branch("Hợi"), 32, false, 41))).toBe("Hợi");
    expect(flowingMajorPeriodPalace(branch("Hợi"), 32, false, 42)).toBeNull();
    expect(flowingMajorPeriodPalace(branch("Hợi"), 32, false, 31)).toBeNull();
  });

  it("TVTH tr.141 qua periodLayers: 39 tuổi (2026) lưu đại hạn ở Sửu (Huynh Đệ), chắc chắn", () => {
    const layers = unwrap(periodLayers(duongNuThuy2MenhDan, { year: 2026 }));
    expect(layers.age).toBe(39);
    expect(layers.majorPeriod).toEqual({ palace: branch("Hợi"), fromAge: 32, toAge: 41 });
    const flowing = layers.layers.find((layer) => layer.name === "Lưu đại hạn")!;
    expect(name(flowing.palace)).toBe("Sửu");
    expect(duongNuThuy2MenhDan.palaces[flowing.palace]!.role).toBe("Huynh Đệ");
    expect(flowing.certainty).toBe("exact");
  });

  it("TVTH tr.141 tuổi 40 ngoài phần sách ghi → cách hiểu", () => {
    const layers = unwrap(periodLayers(duongNuThuy2MenhDan, { year: 2027 }));
    expect(layers.layers.find((layer) => layer.name === "Lưu đại hạn")!.certainty).toBe("interpretive");
  });

  it("lá số thuận (A-LDH-DIR): Nam Canh Ngọ 38 tuổi, đại hạn Mão, bước 3 sang Thân và đánh dấu cách hiểu", () => {
    const layers = unwrap(periodLayers(namCanhNgoMenhTy, { year: 2027 }));
    const flowing = layers.layers.find((layer) => layer.name === "Lưu đại hạn")!;
    expect(name(flowing.palace)).toBe("Thân");
    expect(flowing.certainty).toBe("interpretive");
    expect(flowing.assumptions.join(" ")).toContain("A-LDH-DIR");
    const step1 = unwrap(periodLayers(namCanhNgoMenhTy, { year: 2026 })).layers.find((layer) => layer.name === "Lưu đại hạn")!;
    expect(name(step1.palace)).toBe("Dậu");
    expect(step1.certainty).toBe("exact");
  });
});

describe("review: lưu đại hạn ngoài ví dụ sách và cách đọc \"phía đại hạn lớn\" (KB 10_Van-han/01_Dai-van/04)", () => {
  const mauNgoNu = lunarChart(1978, 1, 5, "Tý", "nữ");

  it("KB 01_Dai-van/04 phản ví dụ Mậu Ngọ nữ Mệnh Dần Thủy 2, 4 tuổi: mặc định Dậu là cách hiểu, dị bản Mùi", () => {
    expect([mauNgoNu.polarityLabel, name(mauNgoNu.parameters.lifePalace), mauNgoNu.parameters.bureau.number]).toEqual(["Dương Nữ", "Dần", 2]);
    const flowing = unwrap(periodLayers(mauNgoNu, { year: 1981 })).layers.find((layer) => layer.name === "Lưu đại hạn")!;
    expect(name(flowing.palace)).toBe("Dậu");
    expect(flowing.certainty).toBe("interpretive");
    expect(flowing.assumptions.join(" ")).toContain("Ngoài ví dụ duy nhất");
    expect(flowing.variants.join(" ")).toContain("Mùi");
  });

  it("KB 01_Dai-van/04 tùy chọn toward-largest-period: 4 tuổi sang Mùi (phía đại hạn 72), dị bản Dậu", () => {
    const flowing = unwrap(periodLayers(mauNgoNu, { year: 1981 }, { flowingMajorThirdStep: "toward-largest-period" })).layers.find(
      (layer) => layer.name === "Lưu đại hạn",
    )!;
    expect(name(flowing.palace)).toBe("Mùi");
    expect(flowing.certainty).toBe("interpretive");
    expect(flowing.variants.join(" ")).toContain("Dậu");
  });

  it("TVTH tr.141 hai cách đọc trùng nhau ở ví dụ sách: 34 tuổi → Ngọ, chắc chắn", () => {
    for (const flowingMajorThirdStep of ["against-direction", "toward-largest-period"] as const) {
      const flowing = unwrap(periodLayers(duongNuThuy2MenhDan, { year: 2021 }, { flowingMajorThirdStep })).layers.find(
        (layer) => layer.name === "Lưu đại hạn",
      )!;
      expect(name(flowing.palace)).toBe("Ngọ");
      expect(flowing.certainty).toBe("exact");
    }
  });

  it("bước 0 và 1 (cung đại hạn, cung xung chiếu) chắc chắn ở mọi lá số; bước 2 trở đi ngoài ví dụ là cách hiểu", () => {
    const certainty = (year: number) => unwrap(periodLayers(mauNgoNu, { year })).layers.find((layer) => layer.name === "Lưu đại hạn")!.certainty;
    expect([certainty(1979), certainty(1980), certainty(1981), certainty(1982), certainty(1984)]).toEqual([
      "exact", "exact", "interpretive", "interpretive", "interpretive",
    ]);
  });
});

describe("DAI-HAN-START / TIEU-HAN-START / DONG-HAN (TVTH tr.22; NP2 tr.10-12)", () => {
  it("TVTH tr.22 Nam Canh Ngọ Mệnh Tý Hỏa 6: đại hạn đi thuận từ 6 tuổi", () => {
    const timeline = lifetimeTimeline(namCanhNgoMenhTy);
    expect(timeline.majorPeriods.slice(0, 8).map((item) => `${item.fromAge}-${item.toAge} ${BRANCHES[item.palace]}`)).toEqual([
      "6-15 Tý", "16-25 Sửu", "26-35 Dần", "36-45 Mão", "46-55 Thìn", "56-65 Tỵ", "66-75 Ngọ", "76-85 Mùi",
    ]);
  });

  it("TVTH tr.22 Dương Nữ cùng Mệnh, cục: đại hạn đi nghịch", () => {
    const timeline = lifetimeTimeline(nuCanhNgoMenhTy);
    expect(timeline.majorPeriods.slice(0, 4).map((item) => `${item.fromAge}-${item.toAge} ${BRANCHES[item.palace]}`)).toEqual([
      "6-15 Tý", "16-25 Hợi", "26-35 Tuất", "36-45 Dậu",
    ]);
  });

  it("TVTH tr.22 tiểu hạn: nam thuận 1 Thìn, 2 Tỵ, 37 Thìn; nữ nghịch 1 Thìn, 2 Mão, 3 Dần, 37 Thìn", () => {
    const minor = (chart: Chart, year: number) => layerPalace(unwrap(periodLayers(chart, { year })), "Tiểu hạn");
    expect([minor(namCanhNgoMenhTy, 1990), minor(namCanhNgoMenhTy, 1991), minor(namCanhNgoMenhTy, 2026)]).toEqual(["Thìn", "Tỵ", "Thìn"]);
    expect([minor(nuCanhNgoMenhTy, 1990), minor(nuCanhNgoMenhTy, 1991), minor(nuCanhNgoMenhTy, 1992), minor(nuCanhNgoMenhTy, 2026)]).toEqual([
      "Thìn", "Mão", "Dần", "Thìn",
    ]);
  });

  it("NP2 tr.10-12 đồng hạn 5 tuổi ở Phúc Đức, trước đại hạn đầu (cục 6)", () => {
    const layers = unwrap(periodLayers(namCanhNgoMenhTy, { year: 1994 }));
    expect(layers.majorPeriod).toBeNull();
    const childhood = layers.layers.find((layer) => layer.name === "Đồng hạn")!;
    expect(namCanhNgoMenhTy.palaces[childhood.palace]!.role).toBe("Phúc Đức");
    expect(layers.findings.map((item) => item.id)).toContain("PH-CHUA-VAO-DAI-HAN");
    expect(layers.layers.some((layer) => layer.name === "Lưu đại hạn")).toBe(false);
    expect(layers.dipper).toBeNull();
  });

  it("NP2 tr.10-12 tuổi 6–12 vừa có đồng hạn vừa có đại hạn → cách hiểu A-DONGHAN-OVERLAP", () => {
    const layers = unwrap(periodLayers(namCanhNgoMenhTy, { year: 1997 }));
    expect(layers.age).toBe(8);
    expect(layers.majorPeriod?.fromAge).toBe(6);
    const overlap = layers.findings.find((item) => item.id === "PH-DONG-HAN-TRUNG-DAI-HAN")!;
    expect(overlap.certainty).toBe("interpretive");
    expect(overlap.assumptions.join(" ")).toContain("A-DONGHAN-OVERLAP");
  });

  it("NP2 tr.10-12 bảng đồng hạn 1–12 tuổi", () => {
    const timeline = lifetimeTimeline(namCanhNgoMenhTy);
    expect(timeline.childhood.map((item) => item.role)).toEqual([
      "Mệnh", "Tài Bạch", "Tật Ách", "Phu Thê", "Phúc Đức", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tử Tức", "Huynh Đệ", "Phụ Mẫu", "Điền Trạch",
    ]);
  });

  it("đại hạn đầu cục 2: 1 tuổi chưa vào đại hạn, 2 tuổi đã vào", () => {
    expect(unwrap(periodLayers(duongNuThuy2MenhDan, { year: 1988 })).majorPeriod).toBeNull();
    expect(unwrap(periodLayers(duongNuThuy2MenhDan, { year: 1989 })).majorPeriod?.fromAge).toBe(2);
  });
});

describe("LUU-NGUYET / PH-LUU-NHAT / PH-LUU-THOI (MLTC tr.845; TVTH tr.137)", () => {
  it("KB 05_Nguyet-han-nhat-han/01 Ví dụ 2: Nam Canh Ngọ tháng 8 giờ Thìn, 2026: tháng 1 Mão, 4 Ngọ, 12 Dần", () => {
    const month = (m: number) => layerPalace(unwrap(periodLayers(namCanhNgoMenhTi, { year: 2026, month: m })), "Lưu nguyệt");
    expect([month(1), month(4), month(12)]).toEqual(["Mão", "Ngọ", "Dần"]);
  });

  it("KB 05/01 dị bản đọc theo cung tiểu hạn (Thìn): tháng Giêng ở Sửu, có ghi trong variants mặc định", () => {
    const variant = unwrap(periodLayers(namCanhNgoMenhTi, { year: 2026, month: 1 }, { firstMonthStart: "minor-period-palace", minorLayerStems: "calendar" }));
    expect(layerPalace(variant, "Lưu nguyệt")).toBe("Sửu");
    const fallback = unwrap(periodLayers(namCanhNgoMenhTi, { year: 2026, month: 1 }));
    expect(fallback.layers.find((layer) => layer.name === "Lưu nguyệt")!.variants.join(" ")).toContain("Sửu");
  });

  it("TVTH tr.136 tháng cố định: tháng Giêng Dần, tháng 4 Tỵ", () => {
    expect(layerPalace(unwrap(periodLayers(namCanhNgoMenhTi, { year: 2026, month: 1 })), "Tháng cố định")).toBe("Dần");
    expect(layerPalace(unwrap(periodLayers(namCanhNgoMenhTi, { year: 2026, month: 4 })), "Tháng cố định")).toBe("Tỵ");
  });

  it.each([
    [1, "Ngọ"], [2, "Mùi"], [3, "Thân"], [7, "Tý"], [12, "Tỵ"], [13, "Ngọ"], [15, "Thân"], [30, "Hợi"],
  ])("KB 05/02 lưu nhật từ tháng ở Ngọ: ngày %i → %s", (day, expected) => {
    expect(name(flowingDayPalace(branch("Ngọ"), day))).toBe(expected);
  });

  it.each(
    Object.entries({ Tý: "Thân", Sửu: "Dậu", Dần: "Tuất", Mão: "Hợi", Thìn: "Tý", Tỵ: "Sửu", Ngọ: "Dần", Mùi: "Mão", Thân: "Thìn", Dậu: "Tỵ", Tuất: "Ngọ", Hợi: "Mùi" }),
  )("KB 05/02 lưu thời từ ngày ở Thân: giờ %s → %s", (hour, expected) => {
    expect(name(flowingHourPalace(branch("Thân"), branch(hour)))).toBe(expected);
  });

  it("KB 05/02 15/4/2026 giờ Ngọ: lưu nhật Thân, lưu thời Dần; 12 cung lưu nhật", () => {
    const layers = unwrap(periodLayers(namCanhNgoMenhTi, { year: 2026, month: 4, day: 15, hourBranch: branch("Ngọ") }));
    expect(layerPalace(layers, "Lưu nguyệt")).toBe("Ngọ");
    expect(layerPalace(layers, "Lưu nhật")).toBe("Thân");
    expect(layerPalace(layers, "Lưu thời")).toBe("Dần");
    const dayRoles = layers.layers.find((layer) => layer.name === "Lưu nhật")!.roles!;
    expect(Object.fromEntries(dayRoles.map((item) => [BRANCHES[item.branch], item.role]))).toEqual(rolesByBranch("Thân"));
  });
});

describe("review: lưu nguyệt/nhật/thời là cách hiểu; Tứ Hóa can cung lớp nhỏ (MLTC tr.845, tr.862-864)", () => {
  const layers = unwrap(periodLayers(namCanhNgoMenhTi, { year: 2026, month: 4, day: 15, hourBranch: branch("Ngọ") }));

  it("KB 05/01: lưu nguyệt, lưu nhật, lưu thời đều cách hiểu; ghi xung đột TVTH và ví dụ TVTH tr.137", () => {
    for (const layerName of ["Lưu nguyệt", "Lưu nhật", "Lưu thời"] as const) {
      const layer = layers.layers.find((item) => item.name === layerName)!;
      expect(layer.certainty).toBe("interpretive");
      expect(layer.variants.join(" ")).toContain("TVTH");
    }
    expect(layers.layers.find((item) => item.name === "Lưu nguyệt")!.assumptions.join(" ")).toContain("ví dụ của chính TVTH tr.137");
  });

  it("KB 05/02: can cung Lưu nguyệt Ngọ (Nhâm), Lưu nhật Thân (Giáp), Lưu thời Dần (Mậu), có cả khi tắt can lịch", () => {
    const omitted = unwrap(
      periodLayers(namCanhNgoMenhTi, { year: 2026, month: 4, day: 15, hourBranch: branch("Ngọ") }, { minorLayerStems: "omit" }),
    );
    const stemOf = (prefix: string) => omitted.transformations.find((set) => set.stemSource.startsWith(prefix))!;
    expect([stemOf("Can cung Lưu nguyệt").stem, stemOf("Can cung Lưu nhật").stem, stemOf("Can cung Lưu thời").stem]).toEqual([8, 0, 4]);
    expect(stemOf("Can cung Lưu nhật").stars.map((item) => item.star)).toEqual(["Liêm Trinh", "Phá Quân", "Vũ Khúc", "Thái Dương"]);
    expect(stemOf("Can cung Lưu nguyệt").assumptions.join(" ")).toContain("áp dụng tương tự");
    expect(omitted.transformations.some((set) => set.stemSource.startsWith("Can Lưu nhật"))).toBe(false);
  });
});

describe("review: cục kỵ hành (MLTC tr.5-6, KB 04_Cuc/01 §6)", () => {
  it("Hỏa lục cục kỵ Tuất, Hợi: Nam Canh Ngọ Mệnh Tý, 7 tuổi tiểu hạn Tuất → chắc chắn", () => {
    const layers = unwrap(periodLayers(namCanhNgoMenhTy, { year: 1996 }));
    expect(layers.bureauAvoidance.avoidedBranches.map((b) => BRANCHES[b])).toEqual(["Tuất", "Hợi"]);
    expect(layers.bureauAvoidance.hits.map((hit) => `${hit.layer} ${BRANCHES[hit.palace]}`)).toEqual(["Tiểu hạn Tuất"]);
    const hit = layers.findings.find((item) => item.id === "PH-CUC-KY-HANH")!;
    expect(hit.certainty).toBe("exact");
    expect(unwrap(periodLayers(namCanhNgoMenhTy, { year: 2026 })).findings.some((item) => item.id === "PH-CUC-KY-HANH")).toBe(false);
  });

  it("Kim tứ cục kỵ Sửu, Dần (MLTC: cần nghiên cứu kỹ hơn): 10 tuổi tiểu hạn Sửu → cách hiểu", () => {
    const layers = unwrap(periodLayers(namCanhNgoMenhTi, { year: 1999 }));
    expect(layers.bureauAvoidance.hits.map((hit) => `${hit.layer} ${BRANCHES[hit.palace]}`)).toEqual(["Tiểu hạn Sửu"]);
    expect(layers.findings.find((item) => item.id === "PH-CUC-KY-HANH")!.certainty).toBe("interpretive");
  });

  it("Thủy nhị cục kỵ Thìn, Tỵ: đại hạn 92 tuổi ở Tỵ", () => {
    const layers = unwrap(periodLayers(duongNuThuy2MenhDan, { year: 2079 }));
    expect(layers.bureauAvoidance.hits.some((hit) => hit.layer === "Đại hạn" && BRANCHES[hit.palace] === "Tỵ")).toBe(true);
  });
});

describe("PH-LAYER-12-CUNG", () => {
  it("KB 01_Dai-van/02: đại hạn Mão", () => {
    expect(rolesByBranch("Mão")).toEqual({
      Mão: "Mệnh", Dần: "Huynh Đệ", Sửu: "Phu Thê", Tý: "Tử Tức", Hợi: "Tài Bạch", Tuất: "Tật Ách",
      Dậu: "Thiên Di", Thân: "Nô Bộc", Mùi: "Quan Lộc", Ngọ: "Điền Trạch", Tỵ: "Phúc Đức", Thìn: "Phụ Mẫu",
    });
  });

  it("KB 04_Luu-nien/08: lưu niên Bính Ngọ", () => {
    expect(rolesByBranch("Ngọ")).toEqual({
      Ngọ: "Mệnh", Tỵ: "Huynh Đệ", Thìn: "Phu Thê", Mão: "Tử Tức", Dần: "Tài Bạch", Sửu: "Tật Ách",
      Tý: "Thiên Di", Hợi: "Nô Bộc", Tuất: "Quan Lộc", Dậu: "Điền Trạch", Thân: "Phúc Đức", Mùi: "Phụ Mẫu",
    });
  });

  it("KB 05/02: lưu nhật Mệnh Thân", () => {
    expect(rolesByBranch("Thân")).toEqual({
      Thân: "Mệnh", Mùi: "Huynh Đệ", Ngọ: "Phu Thê", Tỵ: "Tử Tức", Thìn: "Tài Bạch", Mão: "Tật Ách",
      Dần: "Thiên Di", Sửu: "Nô Bộc", Tý: "Quan Lộc", Hợi: "Điền Trạch", Tuất: "Phúc Đức", Dậu: "Phụ Mẫu",
    });
  });

  it("periodLayers gắn 12 cung cho đại hạn và lưu niên", () => {
    const layers = unwrap(periodLayers(namCanhNgoMenhTy, { year: 2026 }));
    const roleAt = (layer: LayerName, b: string) => layers.layers.find((item) => item.name === layer)!.roles!.find((item) => item.branch === branch(b))!.role;
    expect(roleAt("Đại hạn", "Mão")).toBe("Mệnh");
    expect(roleAt("Lưu niên", "Sửu")).toBe("Tật Ách");
  });
});

describe("PH-TU-HOA-LAYERS (MLTC tr.846-847, tr.862-864)", () => {
  const layers = unwrap(periodLayers(namCanhNgoMenhTy, { year: 2026, month: 4, day: 15, hourBranch: branch("Ngọ") }));
  const starsOf = (prefix: string) => layers.transformations.find((set) => set.stemSource.startsWith(prefix))!;

  it("KB 04_Luu-nien/05: can Lưu niên Bính 2026", () => {
    expect(starsOf("Can Lưu niên").stars.map((item) => item.star)).toEqual(["Thiên Đồng", "Thiên Cơ", "Văn Xương", "Liêm Trinh"]);
  });

  it("KB 04_Luu-nien/08: can cung Lưu niên Ngọ là Nhâm (phụ)", () => {
    const set = starsOf("Can cung Lưu niên");
    expect(set.stem).toBe(8);
    expect(set.primary).toBe(false);
    expect(set.stars.map((item) => item.star)).toEqual(["Thiên Lương", "Tử Vi", "Tả Phụ", "Vũ Khúc"]);
  });

  it("KB 01_Dai-van/02: can cung đại hạn Mão là Kỷ", () => {
    const set = starsOf("Can cung Đại hạn");
    expect(set.stem).toBe(5);
    expect(set.stars.map((item) => item.star)).toEqual(["Vũ Khúc", "Tham Lang", "Thiên Lương", "Văn Khúc"]);
  });

  it("can năm sinh Canh có dị bản; can lưu nguyệt/nhật/thời là cách hiểu A-LUU-STEMS", () => {
    expect(starsOf("Can năm sinh").variants.join(" ")).toContain("Canh");
    for (const prefix of ["Can Lưu nguyệt", "Can Lưu nhật", "Can Lưu thời"]) {
      expect(starsOf(prefix).certainty).toBe("interpretive");
    }
    const omitted = unwrap(periodLayers(namCanhNgoMenhTy, { year: 2026, month: 4 }, { firstMonthStart: "view-year-branch", minorLayerStems: "omit" }));
    expect(omitted.transformations.some((set) => set.stemSource.startsWith("Can Lưu nguyệt"))).toBe(false);
  });
});

describe("PH-TRUNG-PHUNG và PH-CUNG-TUOI (TVTH tr.143)", () => {
  it("KB 03_Trung-phung/01 (đã sửa, thêm tuổi 76): Nam Canh Ngọ Mệnh Tý", () => {
    const timeline = lifetimeTimeline(namCanhNgoMenhTy);
    expect(timeline.coincidences.map((item) => `${item.age} ${BRANCHES[item.palace]}`)).toEqual([
      "22 Sửu", "35 Dần", "36 Mão", "49 Thìn", "62 Tỵ", "75 Ngọ", "76 Mùi", "89 Thân",
    ]);
    expect(timeline.coincidences.find((item) => item.age === 76)?.year).toBe(2065);
  });

  it("KB 03_Trung-phung/01: tuổi 9 trùng cung nhưng dưới 13 nên không tính", () => {
    expect(unwrap(periodLayers(namCanhNgoMenhTy, { year: 1998 })).coincidence.majorMinor).toBe(false);
  });

  it("KB 03_Trung-phung/02: cung tuổi Thìn, các năm 13→2002 … 73→2062", () => {
    const timeline = lifetimeTimeline(namCanhNgoMenhTy);
    expect(name(timeline.agePalace)).toBe("Thìn");
    expect(timeline.ageYearReturns.map((item) => [item.age, item.year])).toEqual([
      [1, 1990], [13, 2002], [25, 2014], [37, 2026], [49, 2038], [61, 2050], [73, 2062], [85, 2074], [97, 2086],
    ]);
  });

  it("KB 03_Trung-phung/02: 37 tuổi tiểu hạn về cung tuổi, đại hạn Mão thì không", () => {
    const layers = unwrap(periodLayers(namCanhNgoMenhTy, { year: 2026 }));
    expect(layers.ageYear).toEqual({ agePalace: branch("Thìn"), minorAtAgePalace: true, majorAtAgePalace: false });
    expect(layers.findings.find((item) => item.id === "PH-CUNG-TUOI")?.certainty).toBe("interpretive");
  });

  it("KB 03_Trung-phung/02: 49 tuổi cung tuổi + trùng phùng", () => {
    const layers = unwrap(periodLayers(namCanhNgoMenhTy, { year: 2038 }));
    expect(layers.ageYear.minorAtAgePalace && layers.ageYear.majorAtAgePalace).toBe(true);
    expect(layers.coincidence.majorMinor).toBe(true);
    expect(layers.findings.map((item) => item.id)).toEqual(expect.arrayContaining(["PH-TRUNG-PHUNG", "PH-CUNG-TUOI"]));
  });
});

describe("PH-TUOI-KY-NAM (TVTH tr.142-143)", () => {
  it("KB 02_Tieu-han/03: Canh Ngọ kỵ năm Ngọ 2002…2050, năm Sửu 2009, 2021, 2033", () => {
    const years = lifetimeTimeline(namCanhNgoMenhTy).tabooYears.map((item) => item.year);
    expect(years).toEqual(expect.arrayContaining([2002, 2014, 2026, 2038, 2050, 2009, 2021, 2033]));
    expect(years).not.toContain(2010);
  });

  it("KB 02_Tieu-han/03: 2026 là năm kỵ; dòng Sửu Ngọ ghi chung nên là cách hiểu", () => {
    const layers = unwrap(periodLayers(namCanhNgoMenhTy, { year: 2026 }));
    expect(layers.taboo.yearHit).toBe(true);
    const taboo = layers.findings.find((item) => item.id === "PH-TUOI-KY-NAM")!;
    expect(taboo.certainty).toBe("interpretive");
    expect(unwrap(periodLayers(namCanhNgoMenhTy, { year: 2027 })).taboo.yearHit).toBe(false);
  });
});

describe("PH-NAM-BAC-DAU (TVTH tr.137)", () => {
  it("KB 01_Dai-van/03: Nam Canh Ngọ đại hạn 36-45 Mão, Nam đẩu tốt; 41–45 nửa Nam đẩu", () => {
    const later = unwrap(periodLayers(namCanhNgoMenhTy, { year: 2030 })).dipper!;
    expect(later.favourable).toBe("Nam đẩu");
    expect(later.emphasis).toBe("Nam đẩu");
    expect([later.halfFromAge, later.halfToAge]).toEqual([41, 45]);
    const earlier = unwrap(periodLayers(namCanhNgoMenhTy, { year: 2025 })).dipper!;
    expect(earlier.emphasis).toBe("Bắc đẩu");
    expect([earlier.halfFromAge, earlier.halfToAge]).toEqual([36, 40]);
  });

  it("KB 01_Dai-van/03: Thái Dương Nam đẩu, Lộc Tồn Bắc đẩu, Thiên Cơ chỉ NP1, Thiên Phủ chưa phân loại", () => {
    expect(dipperGroupOf("Thái Dương")).toEqual({ group: "Nam đẩu", np1Only: false });
    expect(dipperGroupOf("Lộc Tồn")).toEqual({ group: "Bắc đẩu", np1Only: false });
    expect(dipperGroupOf("Thiên Cơ")).toEqual({ group: "Nam đẩu", np1Only: true });
    expect(dipperGroupOf("Thiên Phủ")?.group).toBe("chưa phân loại");
    expect(dipperGroupOf("Thiên Hình")).toBeNull();
  });

  it("Dương Nữ: hạn gặp Bắc đẩu thì tốt", () => {
    expect(unwrap(periodLayers(duongNuThuy2MenhDan, { year: 2026 })).dipper?.favourable).toBe("Bắc đẩu");
  });
});

describe("đầu vào không hợp lệ", () => {
  it("tháng, ngày, giờ sai hoặc thiếu bậc trên", () => {
    expect(periodLayers(namCanhNgoMenhTy, { year: 2026, month: 13 }).ok).toBe(false);
    expect(periodLayers(namCanhNgoMenhTy, { year: 2026, month: 0 }).ok).toBe(false);
    expect(periodLayers(namCanhNgoMenhTy, { year: 2026, month: 4, day: 31 }).ok).toBe(false);
    expect(periodLayers(namCanhNgoMenhTy, { year: 2026, month: 4, day: 0 }).ok).toBe(false);
    expect(periodLayers(namCanhNgoMenhTy, { year: 2026, day: 3 }).ok).toBe(false);
    expect(periodLayers(namCanhNgoMenhTy, { year: 2026, month: 4, hourBranch: 3 }).ok).toBe(false);
    expect(periodLayers(namCanhNgoMenhTy, { year: 2026, month: 4, day: 3, hourBranch: 12 }).ok).toBe(false);
    expect(periodLayers(namCanhNgoMenhTy, { year: 1980 }).ok).toBe(false);
  });

  it("ngày 30 của tháng thiếu bị từ chối", () => {
    const shortMonth = Array.from({ length: 12 }, (_, i) => i + 1).find((m) => unwrap(daysInLunarMonth(2026, m, false)) === 29)!;
    expect(periodLayers(namCanhNgoMenhTy, { year: 2026, month: shortMonth, day: 30 }).ok).toBe(false);
    expect(periodLayers(namCanhNgoMenhTy, { year: 2026, month: shortMonth, day: 29 }).ok).toBe(true);
  });
});

describe("GX giờ xấu trẻ em (TVTH tr.89-90)", () => {
  const LA_THAI_HAU = { yearBranch: branch("Dần"), month: 3, day: 7, hourBranch: branch("Dần"), gender: "nữ" as const };

  it("TVTH tr.159 lá số Lã Thái Hậu: chuỗi Kim Xà Tý → Tuất → Thìn → Dần, không phạm giờ nào", () => {
    const steps = kimXaSteps(LA_THAI_HAU);
    expect([steps.year, steps.month, steps.day, steps.hour].map((b) => BRANCHES[b])).toEqual(["Tý", "Tuất", "Thìn", "Dần"]);
    const findings = unwrap(childHazardHours(LA_THAI_HAU));
    expect(findings.map((item) => item.id)).toEqual(["GX-KIM-XA-THIET-TOA", "GX-QUAN-SAT", "GX-TUONG-QUAN", "GX-DIEM-VUONG", "GX-DA-DE"]);
    expect(findings.every((item) => item.polarity === "trung tính")).toBe(true);
    expect(findings[0]!.certainty).toBe("exact");
  });

  it("TVTH tr.159 cùng kết quả khi truyền lá số", () => {
    const chart = lunarChart(1974, 3, 7, "Dần", "nữ");
    expect(unwrap(childHazardHours(chart)).map((item) => item.polarity)).toEqual(unwrap(childHazardHours(LA_THAI_HAU)).map((item) => item.polarity));
  });

  it("KB 01_Gio-sinh/02 (tự dựng): bé trai năm Tý, tháng Giêng, mùng 1, giờ Tý dừng Tuất → phạm Kim Xà", () => {
    const input = { yearBranch: 0, month: 1, day: 1, hourBranch: 0, gender: "nam" as const };
    expect(BRANCHES[kimXaSteps(input).hour]).toBe("Tuất");
    const kimXa = unwrap(childHazardHours(input))[0]!;
    expect(kimXa.polarity).toBe("xấu");
    expect(kimXa.certainty).toBe("exact");
  });

  it("A-KIMXA-SEX: bé trai dừng Sửu → cách hiểu; tùy chọn any-four-tombs thì phạm", () => {
    const input = { yearBranch: 0, month: 1, day: 1, hourBranch: branch("Dậu"), gender: "nam" as const };
    expect(BRANCHES[kimXaSteps(input).hour]).toBe("Sửu");
    const strict = unwrap(childHazardHours(input))[0]!;
    expect(strict.certainty).toBe("interpretive");
    expect(strict.polarity).toBe("trung tính");
    expect(strict.assumptions.join(" ")).toContain("A-KIMXA-SEX");
    expect(unwrap(childHazardHours(input, { kimXaRule: "any-four-tombs" }))[0]!.polarity).toBe("xấu");
  });

  it("Kim Xà thiếu giới tính khi dừng Tứ Mộ → cách hiểu", () => {
    const kimXa = unwrap(childHazardHours({ yearBranch: 0, month: 1, day: 1, hourBranch: 0 }))[0]!;
    expect(kimXa.certainty).toBe("interpretive");
    expect(kimXa.missing).toContain("chưa biết giới tính");
  });

  it.each([
    [1, "Tỵ"], [2, "Ngọ"], [3, "Mùi"], [4, "Thân"], [5, "Dậu"], [6, "Tuất"],
    [7, "Hợi"], [8, "Tý"], [9, "Sửu"], [10, "Dần"], [11, "Mão"], [12, "Thìn"],
  ])("TVTH tr.89 giờ Quan Sát tháng %i là %s", (month, hour) => {
    expect(BRANCHES[quanSatHour(month)]).toBe(hour);
    const findings = unwrap(childHazardHours({ yearBranch: 0, month, day: 5, hourBranch: branch(hour), gender: "nữ" }));
    expect(findings.find((item) => item.id === "GX-QUAN-SAT")!.polarity).toBe("xấu");
  });

  const SEASON_MONTH = { Xuân: 2, Hạ: 5, Thu: 8, Đông: 11 } as const;
  const seasonalCells = SEASONAL_HOUR_TABLES.flatMap((table) =>
    (Object.keys(SEASON_MONTH) as (keyof typeof SEASON_MONTH)[]).flatMap((season) =>
      table.hours[season].map((hour) => [table.id, table.name, season, BRANCHES[hour]!] as const),
    ),
  );

  it("TVTH tr.89-90 bảng theo mùa đủ ô", () => {
    expect(seasonalCells.map(([, , season, hour]) => `${season} ${hour}`).filter((_, i) => seasonalCells[i]![0] === "GX-TUONG-QUAN")).toEqual([
      "Xuân Thìn", "Xuân Tuất", "Xuân Dậu", "Hạ Tý", "Hạ Mão", "Hạ Mùi", "Thu Dần", "Thu Ngọ", "Thu Sửu", "Đông Thân", "Đông Tỵ", "Đông Hợi",
    ]);
    expect(seasonalCells.filter(([id]) => id === "GX-DIEM-VUONG").map(([, , s, h]) => `${s} ${h}`)).toEqual([
      "Xuân Sửu", "Xuân Mùi", "Hạ Thìn", "Hạ Tuất", "Thu Tý", "Thu Ngọ", "Đông Mão", "Đông Dậu",
    ]);
    expect(seasonalCells.filter(([id]) => id === "GX-DA-DE").map(([, , s, h]) => `${s} ${h}`)).toEqual(["Xuân Ngọ", "Hạ Dậu", "Thu Tý", "Đông Mão"]);
  });

  it.each(seasonalCells)("TVTH tr.89-90 %s (%s) mùa %s giờ %s → phạm, cách hiểu A-SEASON", (id, _label, season, hour) => {
    const findings = unwrap(childHazardHours({ yearBranch: 0, month: SEASON_MONTH[season], day: 5, hourBranch: branch(hour), gender: "nam" }));
    const hit = findings.find((item) => item.id === id)!;
    expect(hit.polarity).toBe("xấu");
    expect(hit.certainty).toBe("interpretive");
  });

  it("đầu vào giờ xấu sai bị từ chối", () => {
    expect(childHazardHours({ yearBranch: 0, month: 13, day: 1, hourBranch: 0 }).ok).toBe(false);
    expect(childHazardHours({ yearBranch: 0, month: 1, day: 31, hourBranch: 0 }).ok).toBe(false);
    expect(childHazardHours({ yearBranch: 12, month: 1, day: 1, hourBranch: 0 }).ok).toBe(false);
  });
});

describe("GS xác định lại giờ sinh (MLTC tr.987-988)", () => {
  const fields = { lunar: { year: 1990, month: 5, day: 10, isLeapMonth: false }, gender: "nam" as const };

  it("KB 01_Gio-sinh/03 (tự dựng): tháng 5 nhóm B, Mệnh/Thân/Thân cư từng giờ", () => {
    const comparison = unwrap(
      birthHourCandidates(fields, ["Dần", "Thân", "Tỵ", "Hợi"].map(branch), {
        observations: { sleep: "nằm nghiêng", littleFinger: "bằng" },
      }),
    );
    expect(comparison.candidates.map((c) => [BRANCHES[c.hourBranch], BRANCHES[c.lifePalace], BRANCHES[c.bodyPalace], c.bodyPalaceRole])).toEqual([
      ["Dần", "Thìn", "Thân", "Quan Lộc"],
      ["Thân", "Tuất", "Dần", "Quan Lộc"],
      ["Tỵ", "Sửu", "Hợi", "Phu Thê"],
      ["Hợi", "Mùi", "Tỵ", "Phu Thê"],
    ]);
    expect(comparison.bestGroups).toEqual(["B"]);
    expect(comparison.candidates.every((c) => c.group === "B" && c.groupScore === 2)).toBe(true);
    expect(comparison.candidates[0]!.hourStars.map((item) => item.star)).toContain("Văn Xương");
    expect(comparison.candidates.every((c) => c.bureau.endsWith("cục"))).toBe(true);
  });

  it("MLTC tr.987-988 thứ bậc con: nữ con thứ 4 → nhóm B; hòa điểm ghi cách hiểu", () => {
    const female = unwrap(birthHourCandidates({ ...fields, gender: "nữ" }, [0], { observations: { birthOrder: 4 } }));
    expect(female.bestGroups).toEqual(["B"]);
    const tie = unwrap(birthHourCandidates(fields, [0], { observations: { sleep: "nằm ngửa", littleFinger: "thấp hơn" } }));
    expect(tie.bestGroups).toEqual(["A", "C"]);
    expect(tie.findings[0]!.assumptions.join(" ")).toContain("bằng điểm");
  });

  it("KB 01_Gio-sinh/03 MLTC mục 7.2: chỉ ghi giảm độ chính xác khi sinh năm nhuận", () => {
    const leapYear = unwrap(birthHourCandidates(fields, [0])).findings.find((item) => item.id === "GS-CANDIDATES")!;
    expect(leapYear.assumptions.join(" ")).toContain("người sinh năm nhuận");
    const plainYear = unwrap(birthHourCandidates({ ...fields, lunar: { ...fields.lunar, year: 1991 } }, [0])).findings.find(
      (item) => item.id === "GS-CANDIDATES",
    )!;
    expect(plainYear.assumptions.join(" ")).not.toContain("năm nhuận");
  });

  it("từ chối giờ sai, trùng, rỗng và ngày âm sai", () => {
    expect(birthHourCandidates(fields, []).ok).toBe(false);
    expect(birthHourCandidates(fields, [12]).ok).toBe(false);
    expect(birthHourCandidates(fields, [1, 1]).ok).toBe(false);
    expect(birthHourCandidates({ ...fields, lunar: { ...fields.lunar, day: 31 } }, [1]).ok).toBe(false);
  });
});

describe("render và danh sách bỏ qua", () => {
  it("render tiếng Việt", () => {
    const layers = unwrap(periodLayers(namCanhNgoMenhTi, { year: 2026, month: 4, day: 15, hourBranch: branch("Ngọ") }));
    const text = renderPeriodLayers(namCanhNgoMenhTi, layers);
    expect(text).toContain("# Vận hạn");
    expect(text).toContain("**Lưu nhật**: Thân");
    expect(text).toContain("12 cung theo từng lớp");
    expect(renderLifetimeTimeline(namCanhNgoMenhTy, lifetimeTimeline(namCanhNgoMenhTy))).toContain("76 tuổi (2065)");
    expect(renderChildHazardHours(unwrap(childHazardHours({ yearBranch: 0, month: 1, day: 1, hourBranch: 0, gender: "nam" })))).toContain("Kim Xà");
    expect(
      renderBirthHourCandidates(unwrap(birthHourCandidates({ lunar: { year: 1990, month: 5, day: 10, isLeapMonth: false }, gender: "nam" }, [2, 8]))),
    ).toContain("| Dần | B | Thìn | Thân | Quan Lộc |");
  });

  it("SKIPPED_RULES ghi rõ Bảng B và hạn theo sự việc", () => {
    expect(SKIPPED_RULES.map((rule) => rule.id)).toEqual(expect.arrayContaining(["PH-THAI-TUE-BANG-B", "PH-HAN-SU-VIEC-TRIGGERS"]));
    expect(SKIPPED_RULES.every((rule) => rule.reason.length > 20)).toBe(true);
  });
});
