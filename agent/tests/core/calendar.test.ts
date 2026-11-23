import { describe, expect, it } from "vitest";
import { elementRelation, generatedBy, controlledBy } from "../../src/core/calendar/five-elements.js";
import { doubleHourOf, subtractMinutes } from "../../src/core/calendar/hours.js";
import {
  daysInLunarMonth,
  julianDayFromSolar,
  leapMonthOfYear,
  lunarToSolar,
  solarFromJulianDay,
  solarToLunar,
} from "../../src/core/calendar/lunar.js";
import { bureauFromElement, nayin } from "../../src/core/calendar/nayin.js";
import {
  branchRelations,
  clashPartner,
  fourClash,
  sixCombinationPartner,
  sixHarmPartner,
  stemCombination,
  threeSidesFourSquares,
  trine,
} from "../../src/core/calendar/relations.js";
import {
  BRANCHES,
  dayStemBranch,
  hourStemBranch,
  monthStemBranch,
  parseBranch,
  parseStemBranch,
  sexagenaryIndex,
  stemBranchName,
  tuanVoidBranches,
  yearStemBranch,
} from "../../src/core/calendar/stem-branch.js";
import { solarToLunarVietnam, lunarToSolarVietnam, timezoneNotes } from "../../src/core/calendar/vietnam-calendar.js";
import type { Result } from "../../src/core/result.js";

const unwrap = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const names = (branches: readonly number[]): string[] => branches.map((b) => BRANCHES[b]!);

describe("can chi", () => {
  it.each([
    [1984, "Giáp Tý"],
    [1974, "Giáp Dần"],
    [1979, "Kỷ Mùi"],
    [2024, "Giáp Thìn"],
    [2025, "Ất Tỵ"],
  ])("năm %i là %s", (year, expected) => {
    expect(stemBranchName(yearStemBranch(year))).toBe(expected);
  });

  it("can tháng theo Ngũ hổ độn (bảng MLTC mục 7.1)", () => {
    expect(stemBranchName(monthStemBranch(0, 1))).toBe("Bính Dần");
    expect(stemBranchName(monthStemBranch(1, 1))).toBe("Mậu Dần");
    expect(stemBranchName(monthStemBranch(4, 1))).toBe("Giáp Dần");
    expect(stemBranchName(monthStemBranch(0, 5))).toBe("Canh Ngọ");
    expect(stemBranchName(monthStemBranch(2, 12))).toBe("Tân Sửu");
    expect(stemBranchName(monthStemBranch(3, 11))).toBe("Nhâm Tý");
  });

  it("can chi ngày tính từ số ngày Julius", () => {
    expect(stemBranchName(dayStemBranch(julianDayFromSolar({ year: 2000, month: 1, day: 1 })))).toBe("Mậu Ngọ");
    expect(stemBranchName(dayStemBranch(julianDayFromSolar({ year: 2024, month: 2, day: 10 })))).toBe("Giáp Thìn");
  });

  it("can giờ theo Ngũ thử độn", () => {
    expect(stemBranchName(hourStemBranch(0, 0))).toBe("Giáp Tý");
    expect(stemBranchName(hourStemBranch(1, 0))).toBe("Bính Tý");
    expect(stemBranchName(hourStemBranch(4, 0))).toBe("Nhâm Tý");
    expect(stemBranchName(hourStemBranch(5, 2))).toBe("Bính Dần");
  });

  it("60 hoa giáp: chỉ số và parse", () => {
    expect(sexagenaryIndex(unwrap(parseStemBranch("Giáp Tý")))).toBe(0);
    expect(sexagenaryIndex(unwrap(parseStemBranch("Quý Hợi")))).toBe(59);
    expect(unwrap(parseBranch("Tí"))).toBe(0);
    expect(unwrap(parseBranch("Tị"))).toBe(5);
    expect(parseStemBranch("Giáp Sửu").ok).toBe(false);
    expect(parseStemBranch("Giáp").ok).toBe(false);
  });

  it("Tuần không theo con Giáp của năm", () => {
    expect(names(tuanVoidBranches(unwrap(parseStemBranch("Giáp Tý"))))).toEqual(["Tuất", "Hợi"]);
    expect(names(tuanVoidBranches(unwrap(parseStemBranch("Giáp Dần"))))).toEqual(["Tý", "Sửu"]);
    expect(names(tuanVoidBranches(unwrap(parseStemBranch("Kỷ Mùi"))))).toEqual(["Tý", "Sửu"]);
    expect(names(tuanVoidBranches(unwrap(parseStemBranch("Quý Hợi"))))).toEqual(["Tý", "Sửu"]);
  });
});

describe("nạp âm và cục", () => {
  it.each([
    ["Giáp Tý", "Hải Trung Kim"],
    ["Ất Sửu", "Hải Trung Kim"],
    ["Bính Dần", "Lư Trung Hỏa"],
    ["Mậu Thìn", "Đại Lâm Mộc"],
    ["Giáp Dần", "Đại Khê Thủy"],
    ["Kỷ Mùi", "Thiên Thượng Hỏa"],
    ["Tân Mùi", "Lộ Bàng Thổ"],
    ["Nhâm Tuất", "Đại Hải Thủy"],
    ["Quý Hợi", "Đại Hải Thủy"],
  ])("%s → %s", (text, expected) => {
    expect(nayin(unwrap(parseStemBranch(text))).name).toBe(expected);
  });

  it("số cục theo hành", () => {
    expect(bureauFromElement("Thủy")).toEqual({ element: "Thủy", number: 2, name: "Thủy nhị cục" });
    expect(bureauFromElement("Hỏa").name).toBe("Hỏa lục cục");
  });
});

describe("ngũ hành", () => {
  it("vòng sinh và khắc", () => {
    expect(generatedBy("Kim")).toBe("Thủy");
    expect(generatedBy("Thổ")).toBe("Kim");
    expect(controlledBy("Kim")).toBe("Mộc");
    expect(controlledBy("Thủy")).toBe("Hỏa");
  });

  it("quan hệ hai hành từ phía chủ thể", () => {
    expect(elementRelation("Mộc", "Hỏa").kind).toBe("sinh");
    expect(elementRelation("Hỏa", "Mộc").kind).toBe("được sinh");
    expect(elementRelation("Mộc", "Thổ").kind).toBe("khắc");
    expect(elementRelation("Thổ", "Mộc").kind).toBe("bị khắc");
    expect(elementRelation("Kim", "Kim").kind).toBe("đồng hành");
  });
});

describe("hợp xung", () => {
  it("tam hợp và hành của bộ", () => {
    expect(names(trine(0).branches)).toEqual(["Thân", "Tý", "Thìn"]);
    expect(trine(0).element).toBe("Thủy");
    expect(names(trine(1).branches)).toEqual(["Tỵ", "Dậu", "Sửu"]);
    expect(trine(6).element).toBe("Hỏa");
    expect(names(trine(7).branches)).toEqual(["Hợi", "Mão", "Mùi"]);
  });

  it("lục hợp, lục xung, lục hại (TVTH tr.9, NP1)", () => {
    const pairs = (partner: (b: number) => number) => BRANCHES.map((_, b) => `${BRANCHES[b]}-${BRANCHES[partner(b)]}`);
    expect(pairs(sixCombinationPartner).slice(0, 6)).toEqual(["Tý-Sửu", "Sửu-Tý", "Dần-Hợi", "Mão-Tuất", "Thìn-Dậu", "Tỵ-Thân"]);
    expect(pairs(clashPartner).slice(0, 6)).toEqual(["Tý-Ngọ", "Sửu-Mùi", "Dần-Thân", "Mão-Dậu", "Thìn-Tuất", "Tỵ-Hợi"]);
    expect(pairs(sixHarmPartner).slice(0, 6)).toEqual(["Tý-Mùi", "Sửu-Ngọ", "Dần-Tỵ", "Mão-Thìn", "Thìn-Mão", "Tỵ-Dần"]);
  });

  it("tứ hành xung", () => {
    expect(names(fourClash(2).branches)).toEqual(["Dần", "Tỵ", "Thân", "Hợi"]);
    expect(fourClash(4).name).toContain("Tứ mộ");
  });

  it("liệt kê mọi quan hệ giữa hai chi", () => {
    expect(branchRelations(2, 6).map((r) => r.kind)).toEqual(["tam hợp"]);
    expect(branchRelations(2, 8).map((r) => r.kind)).toEqual(["lục xung"]);
    expect(branchRelations(2, 5).map((r) => r.kind)).toEqual(["lục hại", "cùng nhóm tứ hành xung"]);
    expect(branchRelations(0, 1).map((r) => r.kind)).toEqual(["lục hợp"]);
    expect(branchRelations(3, 3).map((r) => r.kind)).toEqual(["đồng cung"]);
  });

  it("tam phương tứ chính và can hợp", () => {
    expect(threeSidesFourSquares(2)).toEqual({ self: 2, trines: [6, 10], opposite: 8 });
    expect(stemCombination(0)).toEqual({ partner: 5, element: "Thổ" });
    expect(stemCombination(3)).toEqual({ partner: 8, element: "Mộc" });
  });
});

describe("đổi giờ đồng hồ sang canh giờ", () => {
  it.each([
    [23, 0, "Tý"],
    [0, 30, "Tý"],
    [1, 0, "Sửu"],
    [7, 30, "Thìn"],
    [12, 0, "Ngọ"],
    [22, 59, "Hợi"],
  ])("%i:%i là giờ %s", (hour, minute, expected) => {
    expect(BRANCHES[unwrap(doubleHourOf({ hour, minute })).branch]).toBe(expected);
  });

  it("báo khi gần ranh giới canh giờ", () => {
    expect(unwrap(doubleHourOf({ hour: 8, minute: 55 }))).toMatchObject({ branch: 4, start: "07:00", end: "09:00", nearBoundary: true });
    expect(unwrap(doubleHourOf({ hour: 8, minute: 0 })).nearBoundary).toBe(false);
  });

  it("từ chối giờ sai", () => {
    expect(doubleHourOf({ hour: 24, minute: 0 }).ok).toBe(false);
    expect(doubleHourOf({ hour: 3, minute: 61 }).ok).toBe(false);
  });

  it("hiệu chỉnh giờ hành chính và báo lệch ngày", () => {
    expect(unwrap(subtractMinutes({ hour: 9, minute: 30 }, 60))).toEqual({ time: { hour: 8, minute: 30 }, dayShift: 0 });
    expect(unwrap(subtractMinutes({ hour: 0, minute: 20 }, 60))).toEqual({ time: { hour: 23, minute: 20 }, dayShift: -1 });
    expect(subtractMinutes({ hour: 1, minute: 0 }, 500).ok).toBe(false);
  });
});

describe("âm lịch Việt Nam (UTC+7)", () => {
  it.each([
    [{ year: 2024, month: 2, day: 10 }, { year: 2024, month: 1, day: 1, isLeapMonth: false }],
    [{ year: 2025, month: 1, day: 29 }, { year: 2025, month: 1, day: 1, isLeapMonth: false }],
    [{ year: 2023, month: 3, day: 22 }, { year: 2023, month: 2, day: 1, isLeapMonth: true }],
    [{ year: 2020, month: 5, day: 23 }, { year: 2020, month: 4, day: 1, isLeapMonth: true }],
    [{ year: 2025, month: 7, day: 25 }, { year: 2025, month: 6, day: 1, isLeapMonth: true }],
    [{ year: 2033, month: 12, day: 22 }, { year: 2033, month: 11, day: 1, isLeapMonth: true }],
  ])("dương %o → âm %o", (solar, lunar) => {
    expect(unwrap(solarToLunar(solar))).toEqual(lunar);
    expect(unwrap(lunarToSolar(lunar))).toEqual(solar);
  });

  it("Tết 1985: Việt Nam (UTC+7) sớm hơn Trung Quốc (UTC+8) một tháng", () => {
    expect(unwrap(solarToLunar({ year: 1985, month: 1, day: 21 }))).toEqual({ year: 1985, month: 1, day: 1, isLeapMonth: false });
    expect(unwrap(solarToLunar({ year: 1985, month: 1, day: 21 }, 8))).toEqual({ year: 1984, month: 12, day: 1, isLeapMonth: false });
    expect(unwrap(leapMonthOfYear(1985))).toBe(2);
    expect(unwrap(leapMonthOfYear(1984, 8))).toBe(10);
  });

  it("tháng nhuận của năm", () => {
    expect(unwrap(leapMonthOfYear(2023))).toBe(2);
    expect(unwrap(leapMonthOfYear(2024))).toBeNull();
  });

  it("đổi đi đổi lại khớp cho mọi ngày từ 1900 đến 2100", () => {
    const start = julianDayFromSolar({ year: 1900, month: 1, day: 1 });
    const end = julianDayFromSolar({ year: 2100, month: 12, day: 31 });
    const mismatches: number[] = [];
    for (let jd = start; jd <= end; jd += 1) {
      const solar = solarFromJulianDay(jd);
      const back = lunarToSolar(unwrap(solarToLunar(solar)));
      if (!back.ok || julianDayFromSolar(back.value) !== jd) mismatches.push(jd);
    }
    expect(mismatches).toEqual([]);
  });

  it("từ chối ngày không tồn tại", () => {
    expect(solarToLunar({ year: 2023, month: 2, day: 29 }).ok).toBe(false);
    expect(lunarToSolar({ year: 2024, month: 3, day: 1, isLeapMonth: true }).ok).toBe(false);
    const shortMonth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find((month) => unwrap(daysInLunarMonth(2024, month, false)) === 29)!;
    expect(lunarToSolar({ year: 2024, month: shortMonth, day: 30, isLeapMonth: false }).ok).toBe(false);
    expect(solarToLunar({ year: 1700, month: 1, day: 1 }).ok).toBe(false);
  });
});

describe("lịch Việt Nam theo thời kỳ (UTC+8 trước 1968, UTC+7 từ 1968)", () => {
  it("Tết Mậu Thân 1968 ở miền Bắc là 29/1/1968 theo lịch UTC+7", () => {
    expect(unwrap(solarToLunarVietnam({ year: 1968, month: 1, day: 29 }))).toEqual({
      lunar: { year: 1968, month: 1, day: 1, isLeapMonth: false },
      timezone: 7,
    });
  });

  it("trước 1968 dùng UTC+8: 28/1/1903 vẫn là 30 tháng Chạp năm 1902", () => {
    expect(unwrap(solarToLunarVietnam({ year: 1903, month: 1, day: 28 })).lunar).toEqual({ year: 1902, month: 12, day: 30, isLeapMonth: false });
    expect(unwrap(solarToLunarVietnam({ year: 1903, month: 1, day: 28 }, 7)).lunar).toEqual({ year: 1903, month: 1, day: 1, isLeapMonth: false });
  });

  it("đổi qua đổi lại khớp cho mọi ngày 1900–2100 khi dùng múi giờ lịch sử", () => {
    const start = julianDayFromSolar({ year: 1900, month: 1, day: 1 });
    const end = julianDayFromSolar({ year: 2100, month: 12, day: 31 });
    const mismatches: number[] = [];
    for (let jd = start; jd <= end; jd += 1) {
      const back = lunarToSolarVietnam(unwrap(solarToLunarVietnam(solarFromJulianDay(jd))).lunar);
      if (!back.ok || julianDayFromSolar(back.value.solar) !== jd) mismatches.push(jd);
    }
    expect(mismatches).toEqual([]);
  });

  it("ghi chú múi giờ cho người sinh trước 1968 và ở miền Nam 1968–1975", () => {
    expect(timezoneNotes({ year: 1960, month: 1, day: 1 }, 8, "historical")[0]).toContain("UTC+8");
    expect(timezoneNotes({ year: 1970, month: 1, day: 1 }, 7, "historical")[0]).toContain("Miền Nam");
    expect(timezoneNotes({ year: 1990, month: 1, day: 1 }, 7, "historical")).toEqual([]);
  });
});
