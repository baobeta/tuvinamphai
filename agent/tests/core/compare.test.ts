import { describe, expect, it } from "vitest";
import { findStar } from "../../src/core/analysis/chart-query.js";
import type { Finding } from "../../src/core/analysis/finding.js";
import { elementRelation, ELEMENTS, type ElementRelationKind } from "../../src/core/calendar/five-elements.js";
import { BRANCHES, parseBranch, parseStem, STEMS } from "../../src/core/calendar/stem-branch.js";
import { buildChart } from "../../src/core/chart/build-chart.js";
import { transformationStars } from "../../src/core/chart/transformations.js";
import type { Chart, Gender } from "../../src/core/chart/types.js";
import { compareCharts, renderComparison, stemBreakTarget, type ChartComparison, type Relationship } from "../../src/core/compare/index.js";
import type { Result } from "../../src/core/result.js";

const unwrap = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const chartOf = (year: number, gender: Gender, month = 3, day = 7, hour = "Dần"): Chart =>
  unwrap(buildChart({ calendar: "lunar", date: { year, month, day, isLeapMonth: false }, hourBranch: unwrap(parseBranch(hour)), gender }));

const yearWithBranch = (name: string): number => 1984 + unwrap(parseBranch(name));
const yearWithStem = (name: string): number => 1984 + unwrap(parseStem(name));

const compare = (first: Chart, second: Chart, relationship: Relationship = "spouse"): ChartComparison =>
  unwrap(compareCharts(first, second, { relationship, labels: ["A", "B"] }));

const ids = (comparison: ChartComparison): readonly string[] => comparison.findings.map((item) => item.id);
const byId = (comparison: ChartComparison, id: string): Finding | undefined => comparison.findings.find((item) => item.id === id);

describe("can hợp (TVTH tr.6–8: Giáp–Kỷ hóa Thổ; Ất–Canh hóa Kim; Bính–Tân hóa Thủy; Đinh–Nhâm hóa Mộc; Mậu–Quý hóa Hỏa)", () => {
  it.each([
    ["Giáp", "Kỷ", "Thổ"],
    ["Ất", "Canh", "Kim"],
    ["Bính", "Tân", "Thủy"],
    ["Đinh", "Nhâm", "Mộc"],
    ["Mậu", "Quý", "Hỏa"],
  ])("%s hợp %s hóa %s", (first, second, element) => {
    const comparison = compare(chartOf(yearWithStem(first), "nam"), chartOf(yearWithStem(second), "nữ"));
    const item = byId(comparison, "can-hop");
    expect(item?.summary).toContain(`${first} hợp ${second} hóa ${element}`);
    expect(item?.polarity).toBe("tốt");
  });
});

describe("can phá (TVTH tr.6–8: Giáp phá Mậu, Ất–Kỷ, Bính–Canh, Đinh–Tân, Mậu–Nhâm, Kỷ–Quý, Canh–Giáp, Tân–Ất, Nhâm–Bính, Quý–Đinh)", () => {
  it.each([
    ["Giáp", "Mậu"],
    ["Ất", "Kỷ"],
    ["Bính", "Canh"],
    ["Đinh", "Tân"],
    ["Mậu", "Nhâm"],
    ["Kỷ", "Quý"],
    ["Canh", "Giáp"],
    ["Tân", "Ất"],
    ["Nhâm", "Bính"],
    ["Quý", "Đinh"],
  ])("%s phá %s", (breaker, target) => {
    expect(STEMS[stemBreakTarget(unwrap(parseStem(breaker)))]).toBe(target);
    const comparison = compare(chartOf(yearWithStem(target), "nam"), chartOf(yearWithStem(breaker), "nữ"));
    expect(byId(comparison, "can-pha")?.summary).toBe(`${breaker} (B) phá ${target} (A)`);
  });
});

describe("chi năm (TVTH tr.8–9)", () => {
  it.each([
    ["Tý", "Sửu"],
    ["Dần", "Hợi"],
    ["Mão", "Tuất"],
    ["Thìn", "Dậu"],
    ["Tỵ", "Thân"],
    ["Ngọ", "Mùi"],
  ])("nhị hợp %s – %s", (first, second) => {
    const comparison = compare(chartOf(yearWithBranch(first), "nam"), chartOf(yearWithBranch(second), "nữ"));
    expect(byId(comparison, "chi-lục-hợp")?.polarity).toBe("tốt");
  });

  it.each([
    ["Tý", "Ngọ"],
    ["Sửu", "Mùi"],
    ["Dần", "Thân"],
    ["Mão", "Dậu"],
    ["Thìn", "Tuất"],
    ["Tỵ", "Hợi"],
  ])("nhị xung %s – %s; NP2 tr.59–63 ghi chi xung cho vợ chồng", (first, second) => {
    const comparison = compare(chartOf(yearWithBranch(first), "nam"), chartOf(yearWithBranch(second), "nữ"));
    expect(byId(comparison, "chi-lục-xung")?.polarity).toBe("xấu");
    expect(ids(comparison)).toContain("np2-chi-xung");
    expect(ids(comparison)).not.toContain("chi-cùng-nhóm-tứ-hành-xung");
  });

  it.each([
    ["Dần", "Ngọ", "Hỏa"],
    ["Ngọ", "Tuất", "Hỏa"],
    ["Thân", "Tý", "Thủy"],
    ["Tý", "Thìn", "Thủy"],
    ["Tỵ", "Dậu", "Kim"],
    ["Dậu", "Sửu", "Kim"],
    ["Hợi", "Mão", "Mộc"],
    ["Mão", "Mùi", "Mộc"],
  ])("tam hợp %s – %s hóa %s", (first, second, element) => {
    const comparison = compare(chartOf(yearWithBranch(first), "nam"), chartOf(yearWithBranch(second), "nữ"));
    expect(byId(comparison, "chi-tam-hợp")?.summary).toContain(`hóa ${element}`);
  });

  it("Tý – Mão cùng nhóm tứ tuyệt: trung tính, không phải xung", () => {
    const item = byId(compare(chartOf(yearWithBranch("Tý"), "nam"), chartOf(yearWithBranch("Mão"), "nữ")), "chi-cùng-nhóm-tứ-hành-xung");
    expect(item?.polarity).toBe("trung tính");
  });
});

describe("ví dụ hợp tuổi vợ chồng NP2 tr.59–63 (KB 11_Chu-de-luan/04_Hon-nhan/04_Vi-du.md, ví dụ 2)", () => {
  const husbandDinhMao = chartOf(1987, "nam");

  it("chồng Đinh Mão (Hỏa), vợ Quý Mão (Kim): Quý khắc Đinh, vợ khắc chồng", () => {
    const comparison = compare(husbandDinhMao, chartOf(1963, "nữ"));
    expect(comparison.people.map((person) => person.nayin)).toEqual(["Lư Trung Hỏa", "Kim Bạch Kim"]);
    const stem = byId(comparison, "np2-can-khac");
    expect(stem?.summary).toContain("Can Quý (B) phá can Đinh (A) (vợ khắc chồng)");
    expect(stem?.certainty).toBe("interpretive");
    expect(stem?.summary).toContain("Quý (B) phá can Đinh");
    const nayin = byId(comparison, "np2-chong-khac-vo");
    expect(nayin?.variants.join(" ")).toContain("'Kim khắc Hỏa'");
    expect(nayin?.variants.join(" ")).toContain("lỗi chép");
  });

  it("chồng Đinh Mão (Hỏa), vợ Tân Mùi (Thổ): Đinh khắc Tân; Hỏa sinh Thổ không thuộc mục nào, sách ghi 'tạm'", () => {
    const comparison = compare(husbandDinhMao, chartOf(1991, "nữ"));
    expect(byId(comparison, "np2-can-khac")?.summary).toContain("Can Đinh (A) phá can Tân (B) (chồng khắc vợ)");
    const nayin = byId(comparison, "np2-nap-am-khac");
    expect(nayin?.summary).toContain("chồng sinh vợ");
    expect(nayin?.variants.join(" ")).toContain("tạm");
  });

  it("vợ sinh chồng theo nạp âm là đẹp: vợ Giáp Tý (Hải Trung Kim) – chồng Bính Tý (Giản Hạ Thủy)", () => {
    const comparison = compare(chartOf(1996, "nam"), chartOf(1984, "nữ"));
    expect(byId(comparison, "np2-vo-sinh-chong")?.polarity).toBe("tốt");
  });

  it("vợ chồng cùng giới hoặc quan hệ khác thì không áp NP2, chỉ ghi chú", () => {
    const sameGender = compare(chartOf(1987, "nam"), chartOf(1963, "nam"));
    expect(ids(sameGender).some((id) => id.startsWith("np2-"))).toBe(false);
    expect(sameGender.notes.join(" ")).toContain("một nam một nữ");
    const friends = compare(chartOf(1987, "nam"), chartOf(1963, "nữ"), "friend");
    expect(ids(friends).some((id) => id.startsWith("np2-") || id.startsWith("tinh-he-") || id === "ngu-hanh-cuc")).toBe(false);
  });
});

describe("Thái Tuế nhập quẻ (MLTC tr.985–987)", () => {
  const hostLifeAtTy = chartOf(1990, "nam", 1, 7, "Dần");
  const sisterMauThan = chartOf(1968, "nữ");

  it("lá số mẫu dựng cho Mệnh Tý", () => {
    expect(BRANCHES[hostLifeAtTy.parameters.lifePalace]).toBe("Tý");
  });

  it("ví dụ sách: em gái Mậu Thân cho Tham Lang Lộc, Thái Âm Quyền, Hữu Bật Khoa, Thiên Cơ Kỵ", () => {
    const summary = byId(compare(hostLifeAtTy, sisterMauThan, "sibling"), "nhap-que-B-A-tu-hoa")?.summary ?? "";
    for (const text of ["Tham Lang Hóa Lộc", "Thái Âm Hóa Quyền", "Hữu Bật Hóa Khoa", "Thiên Cơ Hóa Kỵ"]) expect(summary).toContain(text);
  });

  it("ví dụ tự dựng của KB: Mệnh Tý, đối phương chi Thân thuộc tam hợp Mệnh nên tính cách giống nhau", () => {
    const item = byId(compare(hostLifeAtTy, sisterMauThan, "sibling"), "nhap-que-B-A-chi");
    expect(item?.summary).toContain("tam hợp cung Mệnh");
    expect(item?.summary).toContain("tính cách giống nhau");
    expect(item?.polarity).toBe("trung tính");
  });

  it.each(STEMS.map((_, stem) => [stem]))("can %i: Hóa Kỵ vào Mệnh, Hóa Lộc vào Mệnh/tam hợp khớp vị trí sao thật", (stem) => {
    const guest = chartOf(1984 + stem, "nữ");
    const comparison = compare(hostLifeAtTy, guest);
    const [loc, , , ky] = transformationStars(stem, hostLifeAtTy.options);
    const life = hostLifeAtTy.parameters.lifePalace;
    const offset = (name: string) => (findStar(hostLifeAtTy, name)!.palace - life + 12) % 12;
    expect(ids(comparison).includes("nhap-que-B-A-ky-menh")).toBe(offset(ky) === 0);
    expect(ids(comparison).includes("nhap-que-B-A-loc-menh")).toBe([0, 4, 8].includes(offset(loc)));
  });
});

const swapLabel = (id: string): string => id.replace(/-(A|B)-(A|B)/, (_, x: string, y: string) => `-${x === "A" ? "B" : "A"}-${y === "A" ? "B" : "A"}`);

describe("đối xứng: so (a, b) và (b, a)", () => {
  const charts = [1984, 1987, 1990, 1963, 1991, 1968, 1975].flatMap((year) => [chartOf(year, "nam"), chartOf(year + 1, "nữ", 8, 15, "Ngọ")]);
  const pairs = charts.flatMap((first, i) => charts.slice(i + 1).map((second) => [first, second] as const));

  it.each(pairs.map((pair, i) => [i, pair] as const))("cặp %i: cùng tập mục và cùng nhóm sau khi đổi nhãn", (_, [first, second]) => {
    const forward = compare(first, second);
    const backward = compare(second, first);
    const polarityMap = (comparison: ChartComparison, rename: (id: string) => string) =>
      new Map(comparison.findings.map((item) => [rename(item.id), item.polarity]));
    expect(polarityMap(backward, swapLabel)).toEqual(polarityMap(forward, (id) => id));
  });

  const MIRROR: Readonly<Record<ElementRelationKind, ElementRelationKind>> = {
    "đồng hành": "đồng hành",
    sinh: "được sinh",
    "được sinh": "sinh",
    khắc: "bị khắc",
    "bị khắc": "khắc",
  };

  it.each(ELEMENTS.flatMap((a) => ELEMENTS.map((b) => [a, b] as const)))("elementRelation(%s, %s) là ảnh gương của chiều ngược", (a, b) => {
    expect(elementRelation(b, a).kind).toBe(MIRROR[elementRelation(a, b).kind]);
  });
});

describe("hồi quy sau review", () => {
  it.each([
    ["Giáp", "Kỷ"],
    ["Ất", "Canh"],
    ["Bính", "Tân"],
    ["Đinh", "Nhâm"],
    ["Mậu", "Quý"],
  ])("can hợp %s – %s không bị báo là NP2 can khắc", (first, second) => {
    for (const [husbandStem, wifeStem] of [[first, second], [second, first]] as const) {
      const comparison = compare(chartOf(yearWithStem(husbandStem), "nam"), chartOf(yearWithStem(wifeStem), "nữ"));
      expect(ids(comparison)).toContain("can-hop");
      expect(ids(comparison)).not.toContain("np2-can-khac");
      expect(byId(comparison, "can-hop")?.variants.join(" ")).toContain("khắc nhau");
    }
  });

  it("chồng 1984 Giáp, vợ 1989 Kỷ: chỉ có can hợp", () => {
    const comparison = compare(chartOf(1984, "nam"), chartOf(1989, "nữ"));
    expect(comparison.findings.filter((item) => item.id.startsWith("can-") || item.id === "np2-can-khac").map((item) => item.id)).toEqual(["can-hop"]);
  });

  it("tinh hệ MLTC (1) cần đủ hai vế; Phu Thê vô chính diệu không khớp (Quý Mão nữ – Đinh Mão nam)", () => {
    const comparison = compare(chartOf(1987, "nam"), chartOf(1963, "nữ", 5, 12, "Ngọ"));
    for (const id of ["tinh-he-A-B", "tinh-he-B-A"]) expect(byId(comparison, id)?.polarity).toBe("trung tính");
  });

  it("tinh hệ chỉ 'tốt' khi Phu Thê có chính tinh trùng Mệnh/Thân bên kia và tam phương trùng nhau", () => {
    const charts = [1963, 1975, 1984, 1987, 1990, 1991].flatMap((year) =>
      [1, 5, 9].flatMap((month) => ["Tý", "Mão", "Ngọ", "Dậu"].map((hour) => chartOf(year, month % 2 ? "nam" : "nữ", month, 10, hour))),
    );
    for (const first of charts) {
      for (const second of charts.slice(0, 12)) {
        const item = byId(compare(first, second), "tinh-he-A-B")!;
        if (item.polarity === "tốt") {
          expect(item.satisfied).toHaveLength(2);
          expect(item.missing).toHaveLength(0);
        }
      }
    }
  });

  it("lục hại là khớp theo cách hiểu vì kho không có bảng đầy đủ", () => {
    const item = byId(compare(chartOf(yearWithBranch("Tý"), "nam"), chartOf(yearWithBranch("Mùi"), "nữ")), "chi-lục-hại");
    expect(item?.certainty).toBe("interpretive");
    expect(item?.assumptions.join(" ")).toContain("không có bảng lục hại đầy đủ");
  });

  it.each([
    [1968, "Tả Phù"],
    [1971, "lỗi in"],
    [1970, "dị bản"],
    [1972, "dị bản"],
  ])("tứ hóa năm %i có ghi dị bản (%s)", (year, text) => {
    const item = byId(compare(chartOf(1990, "nam"), chartOf(year, "nữ")), "nhap-que-B-A-tu-hoa");
    expect(item?.variants.join(" ")).toContain(text);
  });
});

describe("compareCharts và render", () => {
  it("nhãn trùng thì trả lỗi thay vì ném", () => {
    const chart = chartOf(1987, "nam");
    expect(compareCharts(chart, chart, { relationship: "spouse", labels: ["A", "A"] }).ok).toBe(false);
  });

  it("render có ba nhóm, không cho điểm, liệt kê quy tắc bỏ qua", () => {
    const text = renderComparison(compare(chartOf(1987, "nam"), chartOf(1963, "nữ")));
    for (const heading of ["## Hợp", "## Xung, khắc", "## Trung tính", "## Quy tắc chưa áp dụng", "Cấm kỵ của 12 con giáp"]) expect(text).toContain(heading);
    expect(text).toContain("Không có điểm tổng");
  });

  it("mọi mục đều có nguồn", () => {
    const comparison = compare(chartOf(1987, "nam"), chartOf(1963, "nữ"));
    expect(comparison.findings.every((item) => item.source.length > 0)).toBe(true);
  });
});
