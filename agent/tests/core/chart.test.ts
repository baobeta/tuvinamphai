import { describe, expect, it } from "vitest";
import { BRANCHES, parseBranch, parseStem } from "../../src/core/calendar/stem-branch.js";
import { buildChart } from "../../src/core/chart/build-chart.js";
import { effectiveMonth } from "../../src/core/chart/birth.js";
import { ziweiPalace } from "../../src/core/chart/main-stars.js";
import { bureauOf } from "../../src/core/chart/palaces.js";
import { firstMonthPalace, yearView } from "../../src/core/chart/periods.js";
import { transformationStars } from "../../src/core/chart/transformations.js";
import { renderChart, renderYearView } from "../../src/core/chart/render.js";
import { DEFAULT_CHART_OPTIONS, type Chart, type ChartOptions } from "../../src/core/chart/types.js";
import type { Result } from "../../src/core/result.js";

const unwrap = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const branch = (name: string): number => unwrap(parseBranch(name));

const lunarChart = (
  year: number,
  month: number,
  day: number,
  hour: string,
  gender: "nam" | "nữ",
  options: Partial<ChartOptions> = {},
): Chart =>
  unwrap(
    buildChart(
      { calendar: "lunar", date: { year, month, day, isLeapMonth: false }, hourBranch: branch(hour), gender },
      { ...DEFAULT_CHART_OPTIONS, ...options },
    ),
  );

const palaceOfStar = (chart: Chart, name: string): string[] =>
  chart.palaces.filter((p) => p.stars.some((s) => s.name === name)).map((p) => BRANCHES[p.branch]!);

const LA_THAI_HAU_TVTH_159: Readonly<Record<string, string>> = {
  Mệnh: "Dần",
  "Phụ Mẫu": "Mão",
  "Phúc Đức": "Thìn",
  "Điền Trạch": "Tỵ",
  "Quan Lộc": "Ngọ",
  "Nô Bộc": "Mùi",
  "Thiên Di": "Thân",
  "Tật Ách": "Dậu",
  "Tài Bạch": "Tuất",
  "Tử Tức": "Hợi",
  "Phu Thê": "Tý",
  "Huynh Đệ": "Sửu",
};

const LA_THAI_HAU_STARS: Readonly<Record<string, string>> = {
  "Tử Vi": "Tuất", "Thiên Cơ": "Dậu", "Thái Dương": "Mùi", "Vũ Khúc": "Ngọ", "Thiên Đồng": "Tỵ", "Liêm Trinh": "Dần",
  "Thiên Phủ": "Ngọ", "Thái Âm": "Mùi", "Tham Lang": "Thân", "Cự Môn": "Dậu", "Thiên Tướng": "Tuất", "Thiên Lương": "Hợi",
  "Thất Sát": "Tý", "Phá Quân": "Thìn",
  "Lộc Tồn": "Dần", "Kình Dương": "Mão", "Đà La": "Sửu", "Thiên Khôi": "Sửu", "Thiên Việt": "Mùi",
  "Thiên Quan": "Mùi", "Thiên Phúc": "Dậu", "Lưu Hà": "Dậu", "Thiên Trù": "Tỵ", "Quốc Ấn": "Tuất", "Đường Phù": "Mùi",
  "LN Văn Tinh": "Tỵ",
  "Thiên Mã": "Thân", "Đào Hoa": "Mão", "Hoa Cái": "Tuất", "Kiếp Sát": "Hợi", "Hồng Loan": "Sửu", "Thiên Hỷ": "Mùi",
  "Long Trì": "Ngọ", "Phượng Các": "Thân", "Giải Thần": "Thân", "Thiên Khốc": "Thìn", "Thiên Hư": "Thân",
  "Thiên Đức": "Hợi", "Nguyệt Đức": "Mùi", "Thiên Không": "Mão", "Cô Thần": "Tỵ", "Quả Tú": "Sửu", "Phá Toái": "Dậu",
  "Thiên Tài": "Thìn", "Thiên Thọ": "Thân",
  "Tả Phụ": "Ngọ", "Hữu Bật": "Thân", "Văn Xương": "Thân", "Văn Khúc": "Ngọ", "Thai Phụ": "Thân", "Phong Cáo": "Thìn",
  "Tam Thai": "Tý", "Bát Tọa": "Dần", "Ân Quang": "Sửu", "Thiên Quý": "Sửu", "Địa Kiếp": "Sửu", "Địa Không": "Dậu",
  "Hỏa Tinh": "Hợi", "Linh Tinh": "Tỵ", "Thiên Hình": "Hợi", "Thiên Diêu": "Mão", "Thiên Y": "Mão",
  "Thiên Giải": "Tuất", "Địa Giải": "Dậu", "Đẩu Quân": "Dần", "Thiên Khố": "Tý",
  "Thiên Thương": "Mùi", "Thiên Sứ": "Dậu", "Thiên La": "Thìn", "Địa Võng": "Tuất",
  "Bác Sĩ": "Dần", "Lực Sĩ": "Sửu", "Thanh Long": "Tý", "Tiểu Hao": "Hợi", "Tướng Quân": "Tuất", "Tấu Thư": "Dậu",
  "Phi Liêm": "Thân", "Hỷ Thần": "Mùi", "Bệnh Phù": "Ngọ", "Đại Hao": "Tỵ", "Phục Binh": "Thìn", "Quan Phủ": "Mão",
  "Tràng Sinh": "Dần", "Mộc Dục": "Sửu", "Quan Đới": "Tý", "Lâm Quan": "Hợi", "Đế Vượng": "Tuất", "Suy": "Dậu",
  "Bệnh": "Thân", "Tử": "Mùi", "Mộ": "Ngọ", "Tuyệt": "Tỵ", "Thai": "Thìn", "Dưỡng": "Mão",
  "Thái Tuế": "Dần", "Thiếu Dương": "Mão", "Tang Môn": "Thìn", "Thiếu Âm": "Tỵ", "Quan Phù": "Ngọ", "Tử Phù": "Mùi",
  "Tuế Phá": "Thân", "Long Đức": "Dậu", "Bạch Hổ": "Tuất", "Phúc Đức": "Hợi", "Điếu Khách": "Tý", "Trực Phù": "Sửu",
};

describe("lá số mẫu Lã Thái Hậu: Giáp Dần, tháng 3, ngày 7, giờ Dần, nữ (TVTH tr.159)", () => {
  const chart = lunarChart(1974, 3, 7, "Dần", "nữ");

  it("âm dương, Mệnh, Thân, cục, bản mệnh", () => {
    expect(chart.polarityLabel).toBe("Dương Nữ");
    expect(chart.parameters.forward).toBe(false);
    expect(BRANCHES[chart.parameters.lifePalace]).toBe("Dần");
    expect(BRANCHES[chart.parameters.bodyPalace]).toBe("Ngọ");
    expect(chart.bodyPalaceRole).toBe("Quan Lộc");
    expect(chart.parameters.bureau.name).toBe("Hỏa lục cục");
    expect(chart.natalNayin.name).toBe("Đại Khê Thủy");
  });

  it("12 cung chức đúng địa chi", () => {
    const actual = Object.fromEntries(chart.palaces.map((p) => [p.role, BRANCHES[p.branch]]));
    expect(actual).toEqual(LA_THAI_HAU_TVTH_159);
  });

  it.each(Object.entries(LA_THAI_HAU_STARS))("%s ở %s", (name, expected) => {
    expect(palaceOfStar(chart, name)).toEqual([expected]);
  });

  it("Tứ Hóa năm Giáp: Liêm Lộc, Phá Quyền, Vũ Khoa, Dương Kỵ", () => {
    const transformed = chart.palaces.flatMap((p) => p.stars).filter((s) => s.transformation);
    expect(Object.fromEntries(transformed.map((s) => [s.name, s.transformation]))).toEqual({
      "Liêm Trinh": "Hóa Lộc",
      "Phá Quân": "Hóa Quyền",
      "Vũ Khúc": "Hóa Khoa",
      "Thái Dương": "Hóa Kỵ",
    });
  });

  it("Tuần ở Tý Sửu, Triệt ở Thân Dậu", () => {
    expect(palaceOfStar(chart, "Tuần")).toEqual(["Tý", "Sửu"]);
    expect(palaceOfStar(chart, "Triệt")).toEqual(["Thân", "Dậu"]);
  });

  it("đại hạn Hỏa lục cục đi nghịch: Mệnh 6, Huynh 16, Phu Thê 26, Phụ Mẫu 116", () => {
    const startAge = (role: string) => chart.palaces.find((p) => p.role === role)!.majorPeriodStartAge;
    expect([startAge("Mệnh"), startAge("Huynh Đệ"), startAge("Phu Thê"), startAge("Phụ Mẫu")]).toEqual([6, 16, 26, 116]);
  });

  it("độ sáng chính tinh theo bảng TVTH", () => {
    const brightness = (name: string) => chart.palaces.flatMap((p) => p.stars).find((s) => s.name === name)?.brightness;
    expect(brightness("Liêm Trinh")).toBe("Miếu");
    expect(brightness("Thái Dương")).toBeUndefined();
    expect(brightness("Thiên Lương")).toBe("Hãm");
    expect(brightness("Tử Vi")).toBe("Vượng");
  });

  it("kiểm nhanh theo an-sao §8: Kình Đà kẹp Lộc Tồn, Tang Hổ đối nhau, hai Hao đối nhau", () => {
    const at = (name: string) => chart.palaces.find((p) => p.stars.some((s) => s.name === name))!.branch;
    expect((at("Kình Dương") - at("Lộc Tồn") + 12) % 12).toBe(1);
    expect((at("Lộc Tồn") - at("Đà La") + 12) % 12).toBe(1);
    expect((at("Bạch Hổ") - at("Tang Môn") + 12) % 12).toBe(6);
    expect((at("Đại Hao") - at("Tiểu Hao") + 12) % 12).toBe(6);
  });
});

describe("ví dụ Kỷ Mùi trong TVTH", () => {
  it("tháng 5, ngày 12, giờ Dần: Mệnh Thìn, Thân Thân, Mộc tam cục, Tử Vi ở Tỵ (tr.10–12)", () => {
    const chart = lunarChart(1979, 5, 12, "Dần", "nam");
    expect(BRANCHES[chart.parameters.lifePalace]).toBe("Thìn");
    expect(BRANCHES[chart.parameters.bodyPalace]).toBe("Thân");
    expect(chart.parameters.bureau.name).toBe("Mộc tam cục");
    const expected: Record<string, string[]> = {
      Dần: ["Thái Dương", "Cự Môn"], Mão: ["Thiên Tướng"], Thìn: ["Thiên Cơ", "Thiên Lương"], Tỵ: ["Tử Vi", "Thất Sát"],
      Dậu: ["Liêm Trinh", "Phá Quân"], Hợi: ["Thiên Phủ"], Tý: ["Thiên Đồng", "Thái Âm"], Sửu: ["Vũ Khúc", "Tham Lang"],
    };
    for (const [palace, stars] of Object.entries(expected)) {
      const main = chart.palaces[branch(palace)]!.stars.filter((s) => s.group === "chính tinh").map((s) => s.name);
      expect(main.sort()).toEqual([...stars].sort());
    }
    expect(palaceOfStar(chart, "Tả Phụ")).toEqual(["Thân"]);
    expect(palaceOfStar(chart, "Hồng Loan")).toEqual(["Thân"]);
    expect(palaceOfStar(chart, "Lộc Tồn")).toEqual(["Ngọ"]);
  });

  it("Âm nam tháng 8, ngày 23, giờ Dần: Mệnh Mùi, Thân cư Quan, Thổ ngũ cục, Tử Phủ ở Thân (tr.165)", () => {
    const chart = lunarChart(1979, 8, 23, "Dần", "nam");
    expect(chart.polarityLabel).toBe("Âm Nam");
    expect(BRANCHES[chart.parameters.lifePalace]).toBe("Mùi");
    expect(chart.bodyPalaceRole).toBe("Quan Lộc");
    expect(chart.parameters.bureau.name).toBe("Thổ ngũ cục");
    expect(palaceOfStar(chart, "Tử Vi")).toEqual(["Thân"]);
    expect(palaceOfStar(chart, "Thiên Phủ")).toEqual(["Thân"]);
  });
});

describe("bảng tra", () => {
  const MLTC_BANG_7: Readonly<Record<string, readonly number[]>> = {
    Giáp: [2, 2, 6, 6, 3, 3, 5, 5, 4, 4, 6, 6],
    Ất: [6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 5, 5],
    Bính: [5, 5, 3, 3, 2, 2, 4, 4, 6, 6, 3, 3],
    Đinh: [3, 3, 4, 4, 6, 6, 2, 2, 5, 5, 4, 4],
    Mậu: [4, 4, 2, 2, 5, 5, 6, 6, 3, 3, 2, 2],
  };

  it.each(Object.entries(MLTC_BANG_7))("cục theo can %s và 12 vị trí Mệnh (MLTC bảng 7)", (stemName, expected) => {
    const stem = unwrap(parseStem(stemName));
    expect(BRANCHES.map((_, palace) => bureauOf(stem, palace).number)).toEqual(expected);
    expect(BRANCHES.map((_, palace) => bureauOf(stem + 5, palace).number)).toEqual(expected);
  });

  const BANG_TU_VI: Readonly<Record<number, string>> = {
    2: "Sửu Dần Dần Mão Mão Thìn Thìn Tỵ Tỵ Ngọ Ngọ Mùi Mùi Thân Thân Dậu Dậu Tuất Tuất Hợi Hợi Tý Tý Sửu Sửu Dần Dần Mão Mão Thìn",
    3: "Thìn Sửu Dần Tỵ Dần Mão Ngọ Mão Thìn Mùi Thìn Tỵ Thân Tỵ Ngọ Dậu Ngọ Mùi Tuất Mùi Thân Hợi Thân Dậu Tý Dậu Tuất Sửu Tuất Hợi",
    4: "Hợi Thìn Sửu Dần Tý Tỵ Dần Mão Sửu Ngọ Mão Thìn Dần Mùi Thìn Tỵ Mão Thân Tỵ Ngọ Thìn Dậu Ngọ Mùi Tỵ Tuất Mùi Thân Ngọ Hợi",
    5: "Ngọ Hợi Thìn Sửu Dần Mùi Tý Tỵ Dần Mão Thân Sửu Ngọ Mão Thìn Dậu Dần Mùi Thìn Tỵ Tuất Mão Thân Tỵ Ngọ Hợi Thìn Dậu Ngọ Mùi",
    6: "Dậu Ngọ Hợi Thìn Sửu Dần Tuất Mùi Tý Tỵ Dần Mão Hợi Thân Sửu Ngọ Mão Thìn Tý Dậu Dần Mùi Thìn Tỵ Sửu Tuất Mão Thân Tỵ Ngọ",
  };

  it.each(Object.entries(BANG_TU_VI))("vị trí Tử Vi theo %s cục và 30 ngày", (bureau, row) => {
    const actual = Array.from({ length: 30 }, (_, i) => BRANCHES[ziweiPalace(Number(bureau), i + 1)]);
    expect(actual.join(" ")).toBe(row);
  });

});

describe("dị bản", () => {
  it("tuổi Canh: Khôi Việt và Tứ Hóa đổi theo lựa chọn sách", () => {
    const tvth = lunarChart(1980, 1, 1, "Tý", "nam");
    const mltc = lunarChart(1980, 1, 1, "Tý", "nam", { khoiVietForCanh: "MLTC", transformationsForCanh: "MLTC" });
    expect(palaceOfStar(tvth, "Thiên Khôi")).toEqual(["Ngọ"]);
    expect(palaceOfStar(mltc, "Thiên Khôi")).toEqual(["Sửu"]);
    const transformationOf = (chart: Chart, name: string) =>
      chart.palaces.flatMap((p) => p.stars).find((s) => s.name === name)?.transformation;
    expect([transformationOf(tvth, "Thiên Đồng"), transformationOf(tvth, "Thái Âm")]).toEqual(["Hóa Khoa", "Hóa Kỵ"]);
    expect([transformationOf(mltc, "Thiên Đồng"), transformationOf(mltc, "Thái Âm")]).toEqual(["Hóa Kỵ", "Hóa Khoa"]);
    expect(tvth.notes.some((note) => note.includes("Tuổi Canh"))).toBe(true);
  });

  it("tuổi Canh và Tân theo NP1: Khôi ở Dần, Việt ở Ngọ", () => {
    const canh = lunarChart(1980, 1, 1, "Tý", "nam", { khoiVietForCanh: "NP1" });
    const tan = lunarChart(1981, 1, 1, "Tý", "nam", { khoiVietForTan: "NP1" });
    const tanDefault = lunarChart(1981, 1, 1, "Tý", "nam");
    for (const chart of [canh, tan]) {
      expect([palaceOfStar(chart, "Thiên Khôi"), palaceOfStar(chart, "Thiên Việt")]).toEqual([["Dần"], ["Ngọ"]]);
    }
    expect([palaceOfStar(tanDefault, "Thiên Khôi"), palaceOfStar(tanDefault, "Thiên Việt")]).toEqual([["Ngọ"], ["Dần"]]);
  });

  it("tuổi Tỵ Dậu Sửu: Hỏa Linh theo TVTH hoặc bản đời Tống", () => {
    const tvth = lunarChart(1981, 1, 1, "Tý", "nữ");
    const song = lunarChart(1981, 1, 1, "Tý", "nữ", { hoaLinhForTyDauSuu: "Tống" });
    expect([palaceOfStar(tvth, "Hỏa Tinh"), palaceOfStar(tvth, "Linh Tinh")]).toEqual([["Mão"], ["Tuất"]]);
    expect([palaceOfStar(song, "Hỏa Tinh"), palaceOfStar(song, "Linh Tinh")]).toEqual([["Tuất"], ["Mão"]]);
  });

  it("Hỏa Linh Dương Nam tuổi Dần giờ Thìn: Hỏa Tỵ, Linh Hợi (an-sao §5)", () => {
    const chart = lunarChart(1974, 1, 1, "Thìn", "nam");
    expect([palaceOfStar(chart, "Hỏa Tinh"), palaceOfStar(chart, "Linh Tinh")]).toEqual([["Tỵ"], ["Hợi"]]);
  });

  it("tháng nhuận: hai cách của MLTC", () => {
    expect(effectiveMonth({ year: 2023, month: 2, day: 10, isLeapMonth: true }, "next-month").month).toBe(3);
    expect(effectiveMonth({ year: 2023, month: 2, day: 10, isLeapMonth: true }, "split-at-15").month).toBe(2);
    expect(effectiveMonth({ year: 2023, month: 2, day: 20, isLeapMonth: true }, "split-at-15").month).toBe(3);
    expect(effectiveMonth({ year: 2023, month: 2, day: 20, isLeapMonth: false }, "split-at-15")).toEqual({ month: 2 });
  });
});

describe("lập lá số từ dương lịch", () => {
  it("đổi ngày giờ dương sang âm rồi an sao", () => {
    const chart = unwrap(
      buildChart({ calendar: "solar", date: { year: 2024, month: 2, day: 10 }, time: { hour: 7, minute: 30 }, gender: "nam" }),
    );
    expect(chart.birth.lunar).toEqual({ year: 2024, month: 1, day: 1, isLeapMonth: false });
    expect(BRANCHES[chart.parameters.hour]).toBe("Thìn");
    expect(chart.polarityLabel).toBe("Dương Nam");
  });

  it("hiệu chỉnh giờ qua nửa đêm thì lùi về ngày hôm trước", () => {
    const chart = unwrap(
      buildChart({
        calendar: "solar",
        date: { year: 2024, month: 2, day: 10 },
        time: { hour: 0, minute: 30 },
        gender: "nữ",
        correctionMinutes: 60,
      }),
    );
    expect(chart.birth.lunar).toEqual({ year: 2023, month: 12, day: 30, isLeapMonth: false });
    expect(BRANCHES[chart.parameters.hour]).toBe("Tý");
    expect(chart.notes.join(" ")).toContain("đã trừ 60 phút");
  });

  it("trả lỗi thay vì ném ngoại lệ khi dữ liệu sai", () => {
    expect(buildChart({ calendar: "solar", date: { year: 2023, month: 2, day: 30 }, time: { hour: 1, minute: 0 }, gender: "nam" }).ok).toBe(false);
    expect(
      buildChart({ calendar: "lunar", date: { year: 2024, month: 5, day: 1, isLeapMonth: true }, hourBranch: 0, gender: "nam" }).ok,
    ).toBe(false);
  });
});

describe("vận hạn theo năm", () => {
  const chart = lunarChart(1974, 3, 7, "Dần", "nữ");

  it("tuổi âm, đại hạn, tiểu hạn, lưu Thái Tuế", () => {
    const view = unwrap(yearView(chart, 2000));
    expect(view.age).toBe(27);
    expect(view.majorPeriod?.palace.role).toBe("Phu Thê");
    expect(view.majorPeriod?.fromAge).toBe(26);
    expect(BRANCHES[view.minorPeriodPalace.branch]).toBe("Dần");
    expect(view.flowingStars.find((s) => s.name === "L. Thái Tuế")?.palace).toBe(branch("Thìn"));
  });

  it("tiểu hạn tuổi Dần khởi ở Thìn, nữ đi nghịch; đồng hạn 1 tuổi ở Mệnh", () => {
    const view = unwrap(yearView(chart, 1974));
    expect(BRANCHES[view.minorPeriodPalace.branch]).toBe("Thìn");
    expect(view.childhoodPeriodPalace?.role).toBe("Mệnh");
    expect(view.majorPeriod).toBeNull();
    expect(BRANCHES[unwrap(yearView(chart, 1975)).minorPeriodPalace.branch]).toBe("Mão");
  });

  it("lưu nguyệt: ví dụ TVTH tr.137, sinh tháng 4 giờ Sửu, năm xem Tuất thì tháng Giêng ở Thân", () => {
    expect(BRANCHES[firstMonthPalace(branch("Tuất"), 4, branch("Sửu"))]).toBe("Thân");
  });

  it("lưu nguyệt và Tứ Hóa lưu niên: nam Canh Ngọ tháng 8 giờ Thìn, xem 2026 thì tháng Giêng ở Mão", () => {
    const male = lunarChart(1990, 8, 15, "Thìn", "nam");
    const view = unwrap(yearView(male, 2026));
    expect(BRANCHES[view.firstMonthPalace.branch]).toBe("Mão");
    expect(view.flowingTransformations.map((item) => `${item.star} ${item.transformation}`)).toEqual([
      "Thiên Đồng Hóa Lộc",
      "Thiên Cơ Hóa Quyền",
      "Văn Xương Hóa Khoa",
      "Liêm Trinh Hóa Kỵ",
    ]);
  });

  it("từ chối năm xem trước năm sinh", () => {
    expect(yearView(chart, 1960).ok).toBe(false);
  });
});

describe("lá số Dương Nam đi thuận (Canh Ngọ, tháng 8, ngày 15, giờ Thìn)", () => {
  const chart = lunarChart(1990, 8, 15, "Thìn", "nam");

  it("Mệnh Tỵ, Thân Sửu, Kim tứ cục, đại hạn đi thuận", () => {
    expect(chart.polarityLabel).toBe("Dương Nam");
    expect([BRANCHES[chart.parameters.lifePalace], BRANCHES[chart.parameters.bodyPalace]]).toEqual(["Tỵ", "Sửu"]);
    expect(chart.parameters.bureau.name).toBe("Kim tứ cục");
    const startAge = (role: string) => chart.palaces.find((p) => p.role === role)!.majorPeriodStartAge;
    expect([startAge("Mệnh"), startAge("Phụ Mẫu"), startAge("Huynh Đệ")]).toEqual([4, 14, 114]);
  });

  it("vòng Bác Sĩ khởi Lộc Tồn Thân, Tràng Sinh Kim cục khởi Tỵ, cả hai đi thuận", () => {
    expect(palaceOfStar(chart, "Bác Sĩ")).toEqual(["Thân"]);
    expect(palaceOfStar(chart, "Lực Sĩ")).toEqual(["Dậu"]);
    expect(palaceOfStar(chart, "Tràng Sinh")).toEqual(["Tỵ"]);
    expect(palaceOfStar(chart, "Mộc Dục")).toEqual(["Ngọ"]);
  });

  it("Thiên Thương ở Nô, Thiên Sứ ở Tật theo cung chức", () => {
    expect(palaceOfStar(chart, "Thiên Thương")).toEqual([BRANCHES[chart.palaces.find((p) => p.role === "Nô Bộc")!.branch]]);
    expect(palaceOfStar(chart, "Thiên Sứ")).toEqual([BRANCHES[chart.palaces.find((p) => p.role === "Tật Ách")!.branch]]);
  });

  it("tiểu hạn nam đi thuận: tuổi Ngọ khởi Thìn, 37 tuổi (2026) về lại Thìn; đồng hạn 5 tuổi ở Phúc Đức", () => {
    expect(BRANCHES[unwrap(yearView(chart, 2026)).minorPeriodPalace.branch]).toBe("Thìn");
    expect(BRANCHES[unwrap(yearView(chart, 1991)).minorPeriodPalace.branch]).toBe("Tỵ");
    expect(unwrap(yearView(chart, 1994)).childhoodPeriodPalace?.role).toBe("Phúc Đức");
  });
});

describe("Tứ Hóa đủ 10 can", () => {
  const EXPECTED: Readonly<Record<string, string>> = {
    Giáp: "Liêm Trinh Phá Quân Vũ Khúc Thái Dương",
    Ất: "Thiên Cơ Thiên Lương Tử Vi Thái Âm",
    Bính: "Thiên Đồng Thiên Cơ Văn Xương Liêm Trinh",
    Đinh: "Thái Âm Thiên Đồng Thiên Cơ Cự Môn",
    Mậu: "Tham Lang Thái Âm Hữu Bật Thiên Cơ",
    Kỷ: "Vũ Khúc Tham Lang Thiên Lương Văn Khúc",
    Canh: "Thái Dương Vũ Khúc Thiên Đồng Thái Âm",
    Tân: "Cự Môn Thái Dương Văn Khúc Văn Xương",
    Nhâm: "Thiên Lương Tử Vi Tả Phụ Vũ Khúc",
    Quý: "Phá Quân Cự Môn Thái Âm Tham Lang",
  };
  it.each(Object.entries(EXPECTED))("can %s (an-sao.md §6)", (stem, stars) => {
    expect(transformationStars(unwrap(parseStem(stem)), DEFAULT_CHART_OPTIONS).join(" ")).toBe(stars);
  });
});

describe("render", () => {
  it("bảng lá số có đủ 12 cung và ghi chú", () => {
    const chart = lunarChart(1974, 3, 7, "Dần", "nữ");
    const text = renderChart(chart);
    expect(text).toContain("Mệnh · Bính Dần");
    expect(text).toContain("Quan Lộc (Thân) · Canh Ngọ");
    expect(text).toContain("Liêm Trinh (Miếu, Hóa Lộc)");
    expect(text.split("\n").filter((line) => line.startsWith("| ") && !line.startsWith("| Cung"))).toHaveLength(12);
    expect(renderYearView(chart, unwrap(yearView(chart, 2000)))).toContain("Tiểu hạn: cung Mệnh (Dần)");
  });
});
