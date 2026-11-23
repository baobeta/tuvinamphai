import { describe, expect, it } from "vitest";
import { BRANCHES, parseBranch } from "../../src/core/calendar/stem-branch.js";
import { DEFAULT_ANALYSIS_OPTIONS } from "../../src/core/analysis/analysis-options.js";
import { analyzePalace, elementFitOfStar, renderPalaceAnalysis, type PalaceAnalysis } from "../../src/core/analysis/palace-analysis.js";
import { AUX_STAR_ELEMENTS_TVTH_POEM, MAIN_STAR_ELEMENTS, THAI_TUE_RING_ELEMENTS, starElement } from "../../src/core/analysis/star-elements.js";
import { buildChart } from "../../src/core/chart/build-chart.js";
import type { Chart } from "../../src/core/chart/types.js";
import type { Result } from "../../src/core/result.js";

const unwrap = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const branch = (name: string): number => unwrap(parseBranch(name));

const chartOf = (year: number, month: number, day: number, hour: string, gender: "nam" | "nữ"): Chart =>
  unwrap(buildChart({ calendar: "lunar", date: { year, month, day, isLeapMonth: false }, hourBranch: branch(hour), gender }));

const analyze = (chart: Chart, at: string): PalaceAnalysis => unwrap(analyzePalace(chart, at));
const lifeOf = (chart: Chart): PalaceAnalysis => unwrap(analyzePalace(chart, chart.parameters.lifePalace));
const match = (analysis: PalaceAnalysis, id: string) => analysis.flanking.matches.find((item) => item.id === id);
const placed = (analysis: PalaceAnalysis, id: string): readonly string[] =>
  match(analysis, id)?.placements.map((item) => `${item.display}@${BRANCHES[item.branch]}`) ?? [];

const LA_THAI_HAU = chartOf(1974, 3, 7, "Dần", "nữ");

describe("đầu vào", () => {
  it("chi không hợp lệ trả Result lỗi, không ném", () => {
    expect(analyzePalace(LA_THAI_HAU, 12).ok).toBe(false);
    expect(analyzePalace(LA_THAI_HAU, -1).ok).toBe(false);
    expect(analyzePalace(LA_THAI_HAU, 1.5).ok).toBe(false);
    expect(analyzePalace(LA_THAI_HAU, "Xyz").ok).toBe(false);
  });

  it("nhận tên chi hoặc số", () => {
    expect(analyze(LA_THAI_HAU, "Dần").role).toBe("Mệnh");
    expect(unwrap(analyzePalace(LA_THAI_HAU, 6)).role).toBe("Quan Lộc");
  });
});

describe("nhị hợp, lục hại, lục xung (spec nhi_hop_luc_hai_luc_xung)", () => {
  const NHI_HOP: Readonly<Record<string, string>> = {
    Tý: "Sửu", Sửu: "Tý", Dần: "Hợi", Hợi: "Dần", Mão: "Tuất", Tuất: "Mão", Thìn: "Dậu", Dậu: "Thìn", Tỵ: "Thân", Thân: "Tỵ", Ngọ: "Mùi", Mùi: "Ngọ",
  };
  const LUC_HAI: Readonly<Record<string, string>> = {
    Tý: "Mùi", Mùi: "Tý", Sửu: "Ngọ", Ngọ: "Sửu", Dần: "Tỵ", Tỵ: "Dần", Mão: "Thìn", Thìn: "Mão", Dậu: "Tuất", Tuất: "Dậu", Thân: "Hợi", Hợi: "Thân",
  };
  const LUC_XUNG: Readonly<Record<string, string>> = {
    Tý: "Ngọ", Ngọ: "Tý", Sửu: "Mùi", Mùi: "Sửu", Dần: "Thân", Thân: "Dần", Mão: "Dậu", Dậu: "Mão", Thìn: "Tuất", Tuất: "Thìn", Tỵ: "Hợi", Hợi: "Tỵ",
  };
  it.each(BRANCHES.map((name) => [name, NHI_HOP[name]!, LUC_HAI[name]!, LUC_XUNG[name]!] as const))("%s: nhị hợp %s, lục hại %s, xung %s", (at, combo, harm, clash) => {
    const analysis = analyze(LA_THAI_HAU, at);
    expect(BRANCHES[analysis.sixCombination.branch]).toBe(combo);
    expect(BRANCHES[analysis.sixHarm.branch]).toBe(harm);
    expect(BRANCHES[analysis.clash.branch]).toBe(clash);
    const certainty = Object.fromEntries(analysis.findings.filter((item) => ["nhi_hop", "luc_hai", "luc_xung"].includes(item.id)).map((item) => [item.id, item.certainty]));
    expect(certainty).toEqual({ nhi_hop: "exact", luc_hai: "interpretive", luc_xung: "exact" });
  });
});

describe("tam phương tứ chính (spec tam_phuong_tu_chinh)", () => {
  it("gốc Tý: Thân – Tý – Thìn – Ngọ (08_Quan-he-giua-cac-cung/01_Tam-phuong-tu-chinh.md)", () => {
    const sides = analyze(LA_THAI_HAU, "Tý").threeSides;
    expect([sides.self, ...sides.trines, sides.opposite].map((side) => BRANCHES[side.branch])).toEqual(["Tý", "Thìn", "Thân", "Ngọ"]);
  });

  it("Lã Thái Hậu: Mệnh Liêm Trinh, tam hợp Quan Lộc Vũ Phủ, Tài Bạch Tử Tướng, xung chiếu Tham Lang (13_La-so-mau/01_TVTH-La-Thai-Hau.md)", () => {
    const sides = analyze(LA_THAI_HAU, "Dần").threeSides;
    const names = (side: { mainStars: readonly { name: string }[] }) => side.mainStars.map((star) => star.name).sort();
    expect(names(sides.self)).toEqual(["Liêm Trinh"]);
    expect([sides.trines[0].role, names(sides.trines[0])]).toEqual(["Quan Lộc", ["Thiên Phủ", "Vũ Khúc"]]);
    expect([sides.trines[1].role, names(sides.trines[1])]).toEqual(["Tài Bạch", ["Thiên Tướng", "Tử Vi"]]);
    expect([sides.opposite.role, names(sides.opposite)]).toEqual(["Thiên Di", ["Tham Lang"]]);
  });

  it("triều/xung từ đối cung là interpretive: Lã Thái Hậu đối cung có Văn Xương, Hữu Bật, Thiên Mã, không có lục sát", () => {
    const item = analyze(LA_THAI_HAU, "Dần").findings.find((f) => f.id === "trieu_xung")!;
    expect(item.certainty).toBe("interpretive");
    expect(item.summary).toContain("Văn Xương, Hữu Bật");
    expect(item.summary).toContain("hung tinh xung không có");
  });
});

describe("ngũ hành sao (spec star_element)", () => {
  const MAIN: Readonly<Record<string, string>> = {
    "Tử Vi": "Thổ", "Thiên Phủ": "Thổ", "Thiên Cơ": "Mộc", "Thái Dương": "Hỏa", "Liêm Trinh": "Hỏa", "Vũ Khúc": "Kim",
    "Thiên Đồng": "Thủy", "Thiên Tướng": "Thủy", "Tham Lang": "Thủy", "Phá Quân": "Thủy", "Cự Môn": "Thủy", "Thái Âm": "Thủy",
    "Thiên Lương": "Thổ", "Thất Sát": "Kim",
  };
  it.each(Object.entries(MAIN))("mặc định %s hành %s", (star, element) => {
    expect(starElement(star)?.element).toBe(element);
  });

  it("chỉ sao có dị bản mới bị đánh dấu tranh chấp", () => {
    expect(Object.keys(MAIN).filter((star) => starElement(star)?.contested).sort()).toEqual(["Thiên Lương", "Thất Sát", "Thái Âm"].sort());
    expect(Object.keys(MAIN_STAR_ELEMENTS)).toHaveLength(12);
  });

  it("lựa chọn: Thiên Lương NP2 Mộc, Thất Sát bài thơ 1 Hỏa, Thái Tuế NP1 Kim", () => {
    const options = { ...DEFAULT_ANALYSIS_OPTIONS, thienLuongElement: "NP2", thatSatElement: "TVTH bài thơ 1", thaiTueElement: "NP1" } as const;
    expect([starElement("Thiên Lương", options)?.element, starElement("Thất Sát", options)?.element, starElement("Thái Tuế", options)?.element]).toEqual(["Mộc", "Hỏa", "Kim"]);
    expect(starElement("Thái Tuế")?.element).toBe("Hỏa");
  });

  const POEM: ReadonlyArray<readonly [string, string]> = [
    ...["Hóa Khoa", "Văn Xương", "Linh Tinh", "Đà La", "Kình Dương", "Triệt", "Bạch Hổ", "Suy", "Phá Toái", "Hoa Cái", "Lâm Quan", "Đế Vượng", "Quan Đới", "Thai Phụ", "Tấu Thư"].map((s) => [s, "Kim"] as const),
    ...["Dưỡng", "Bát Tọa", "Đường Phù", "Ân Quang", "Thiên Hỷ", "Hóa Quyền", "Đào Hoa", "Giải Thần", "Tang Môn", "Tướng Quân"].map((s) => [s, "Mộc"] as const),
    ...["Thiên Hư", "Lưu Hà", "Bác Sĩ", "Tam Thai", "Long Trì", "Long Đức", "Thanh Long", "Mộc Dục", "Tử", "Hồng Loan", "Thiên Khốc", "Thiên Diêu", "Hóa Kỵ", "Thiên Sứ", "Thiên Y", "Thiên Quý", "Thiếu Âm", "Văn Khúc", "Hữu Bật", "Tràng Sinh"].map((s) => [s, "Thủy"] as const),
    ...["Thiên Thương", "Thiên Thọ", "Thiên Phúc", "Mộ", "Tả Phụ", "Địa Giải", "Quốc Ấn", "Thiên Trù", "Phượng Các", "Phúc Đức", "Bệnh Phù", "Thai", "Lộc Tồn", "Hóa Lộc", "Thiên Tài", "Tuyệt", "Thiên Khố", "Quả Tú", "Cô Thần"].map((s) => [s, "Thổ"] as const),
    ...["Thiên Khôi", "Thiên Việt", "Đại Hao", "Tiểu Hao", "Điếu Khách", "Đẩu Quân", "Địa Kiếp", "Địa Không", "Thiên Hình", "Thiên Mã", "Hỷ Thần", "Hỏa Tinh", "Thiếu Dương", "Tử Phù", "Quan Phủ", "Quan Phù", "Lực Sĩ", "Tuần", "Phục Binh", "Thiên Không", "Thiên Đức", "Nguyệt Đức", "Phi Liêm", "Kiếp Sát", "Thiên Quan", "Bệnh", "Thiên Giải", "LN Văn Tinh"].map((s) => [s, "Hỏa"] as const),
  ];
  it.each(POEM)("bài thơ TVTH: %s hành %s", (star, element) => {
    expect(starElement(star)?.element).toBe(element);
  });

  it("bảng bài thơ không trùng sao giữa các hành", () => {
    const all = Object.values(AUX_STAR_ELEMENTS_TVTH_POEM).flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it.each(Object.entries({ "Thái Tuế": "Hỏa", "Thiếu Dương": "Hỏa", "Tang Môn": "Mộc", "Thiếu Âm": "Thủy", "Quan Phù": "Hỏa", "Tử Phù": "Hỏa", "Tuế Phá": "Hỏa", "Long Đức": "Thủy", "Bạch Hổ": "Kim", "Phúc Đức": "Thổ", "Điếu Khách": "Hỏa", "Trực Phù": "Hỏa" }))(
    "bộ Thái Tuế TVTH: %s hành %s",
    (star, element) => {
      expect(THAI_TUE_RING_ELEMENTS[star]).toBe(element);
      expect(starElement(star)?.element).toBe(element);
    },
  );

  it("Trực Phù, Kiếp Sát và Linh Tinh có dị bản trong TVTH", () => {
    expect(starElement("Trực Phù")?.contested).toBe(true);
    expect(starElement("Kiếp Sát")?.contested).toBe(true);
    expect(starElement("Linh Tinh")).toMatchObject({ element: "Kim", contested: true });
  });
});

describe("ngũ hành sao với cung (spec ngu_hanh_sao_vs_cung)", () => {
  it("TVTH tr.100–101: Văn Xương (Kim) ở Ngọ (Hỏa) lạc hãm; có Thiên Cơ (Mộc) đồng cung sinh Hỏa → hóa tốt (08_Quan-he-giua-cac-cung/04_Ngu-hanh-sao-voi-cung.md)", () => {
    const alone = elementFitOfStar("Văn Xương", branch("Ngọ"), [], false);
    expect(alone.fit).toBe("lạc hãm theo ngũ hành");
    expect(alone.modifiers).toEqual([]);
    const rescued = elementFitOfStar("Văn Xương", branch("Ngọ"), ["Thiên Cơ"], false);
    expect(rescued.modifiers).toEqual(["hóa tốt (cứu): Thiên Cơ sinh hành cung"]);
    expect(elementFitOfStar("Văn Xương", branch("Ngọ"), [], true).modifiers).toEqual(["càng xấu (cung có Tuần/Triệt)"]);
  });

  it.each([
    ["Thái Âm", "Tý", "thuận"],
    ["Thái Âm", "Thìn", "lạc hãm theo ngũ hành"],
    ["Thái Dương", "Dần", "thuận"],
    ["Thái Dương", "Hợi", "lạc hãm theo ngũ hành"],
    ["Thiên Cơ", "Thân", "lạc hãm theo ngũ hành"],
  ])("đối chiếu KB 04_Ngu-hanh-sao-voi-cung.md: %s ở %s → %s", (star, at, fit) => {
    expect(elementFitOfStar(star, branch(at), [], false).fit).toBe(fit);
  });

  it("sao khắc cung hoặc sao sinh cung: không xét (null)", () => {
    expect(elementFitOfStar("Thái Âm", branch("Ngọ"), [], false).fit).toBeNull();
    expect(elementFitOfStar("Thái Dương", branch("Thìn"), [], false).fit).toBeNull();
  });

  it("Thiên Lương ở Dần: TVTH Thổ bị cung Mộc khắc; NP2 Mộc thì thuận", () => {
    expect(elementFitOfStar("Thiên Lương", branch("Dần"), [], false).fit).toBe("lạc hãm theo ngũ hành");
    expect(elementFitOfStar("Thiên Lương", branch("Dần"), [], false, { ...DEFAULT_ANALYSIS_OPTIONS, thienLuongElement: "NP2" }).fit).toBe("thuận");
  });

  it("Lã Thái Hậu: Liêm Trinh (Hỏa) ở Dần (Mộc) — cung sinh sao, thuận; độ sáng giữ theo bảng miếu hãm", () => {
    const [star] = analyze(LA_THAI_HAU, "Dần").mainStars;
    expect(star).toMatchObject({ name: "Liêm Trinh", brightness: "Miếu", transformation: "Hóa Lộc" });
    expect(star!.elementFit.fit).toBe("thuận");
  });
});

describe("giáp cung trên lá số mẫu của sách", () => {
  it("Lã Thái Hậu: Mệnh có Lộc Tồn nên Kình (Mão) Đà (Sửu) giáp — Dương Đà giáp Lộc (03_Giap-cung-xau.md)", () => {
    const life = analyze(LA_THAI_HAU, "Dần");
    expect(placed(life, "duong_da_giap_loc")).toEqual(["Kình Dương@Mão", "Đà La@Sửu"]);
    expect(match(life, "duong_da_giap_loc")?.certainty).toBe("interpretive");
    expect(match(life, "duong_da_giap_loc")?.conditionsMet).toBe(false);
    expect(life.findings.find((f) => f.id === "duong_da_giap_loc")?.breakers).toContain("cát tinh hội: Văn Xương");
  });

  it("Âm nam Kỷ Mùi: 'Hợp giáp Xương Khúc' — Văn Xương Thân, Văn Khúc Ngọ kẹp Mệnh Mùi (13_La-so-mau/04_TVTH-Am-Nam-Ky-Mui.md)", () => {
    const life = lifeOf(chartOf(1979, 8, 23, "Dần", "nam"));
    expect(life.branchName).toBe("Mùi");
    expect(placed(life, "xuong_khuc_giap")).toEqual(["Văn Xương@Thân", "Văn Khúc@Ngọ"]);
    expect(match(life, "xuong_khuc_giap")?.certainty).toBe("interpretive");
    expect(match(life, "quy_tinh_giap_menh")).toMatchObject({ label: "Quí tinh giáp Mệnh cách (cách đọc rộng)", certainty: "interpretive", conditionsMet: false });
  });

  it("Nga mi tác án Tân Mão: 'Mệnh giáp song Lộc' — Lộc Tồn Dậu, Hóa Lộc (Cự Môn) Hợi kẹp Mệnh Tuất (13_La-so-mau/09_TVTH-Nga-mi-tac-an-Tan-Mao.md)", () => {
    const life = lifeOf(chartOf(1951, 11, 13, "Dần", "nữ"));
    expect(life.branchName).toBe("Tuất");
    expect(placed(life, "song_loc_giap")).toEqual(["Lộc Tồn@Dậu", "Hóa Lộc (Cự Môn)@Hợi"]);
  });

  it("Âm nam Quý Tỵ: 'giáp Khôi Việt' — Khôi Mão, Việt Tỵ kẹp Mệnh Thìn (13_La-so-mau/10_TVTH-Am-Nam-Qui-Ty.md)", () => {
    const life = lifeOf(chartOf(1953, 11, 4, "Thân", "nam"));
    expect(placed(life, "khoi_viet_giap")).toEqual(["Thiên Khôi@Mão", "Thiên Việt@Tỵ"]);
  });

  it("Nam Bính Thân: 'giáp Khôi Việt, Thiếu Âm, Thiếu Dương' — spec chỉ có Khôi Việt; Thiếu Dương/Thiếu Âm chỉ thành cách khi có Tử Vi (Kim dư phù giá) nên không báo (13_La-so-mau/12_TVTH-Nam-Binh-Than.md)", () => {
    const chart = chartOf(1956, 11, 17, "Dần", "nam");
    const life = lifeOf(chart);
    expect(life.branchName).toBe("Tuất");
    expect(placed(life, "khoi_viet_giap")).toEqual(["Thiên Khôi@Hợi", "Thiên Việt@Dậu"]);
    const flanks = [chart.palaces[branch("Dậu")]!, chart.palaces[branch("Hợi")]!].map((p) => p.stars.map((s) => s.name));
    expect(flanks[0]).toContain("Thiếu Dương");
    expect(flanks[1]).toContain("Thiếu Âm");
    expect(match(life, "kim_du_phu_gia")).toBeUndefined();
  });
});

describe("giáp cung tìm bằng vét cạn dữ liệu sinh thật (âm lịch 1960–1962)", () => {
  const CASES: ReadonlyArray<readonly [string, number, number, number, string, "nam" | "nữ", string, readonly string[], "exact" | "interpretive"]> = [
    ["tu_phu_giap_menh", 1960, 2, 4, "Sửu", "nam", "Dần", ["Tử Vi@Sửu", "Thiên Phủ@Mão"], "interpretive"],
    ["nhat_nguyet_giap", 1960, 1, 10, "Sửu", "nam", "Sửu", ["Thái Dương@Dần", "Thái Âm@Tý"], "interpretive"],
    ["xuong_khuc_giap", 1960, 8, 1, "Dần", "nam", "Mùi", ["Văn Xương@Thân", "Văn Khúc@Ngọ"], "interpretive"],
    ["khoi_viet_giap", 1962, 1, 1, "Tuất", "nam", "Thìn", ["Thiên Khôi@Mão", "Thiên Việt@Tỵ"], "interpretive"],
    ["ta_huu_giap", 1960, 3, 1, "Dậu", "nam", "Mùi", ["Tả Phụ@Ngọ", "Hữu Bật@Thân"], "interpretive"],
    ["song_loc_giap", 1960, 1, 1, "Tỵ", "nam", "Dậu", ["Lộc Tồn@Thân", "Hóa Lộc (Thái Dương)@Tuất"], "interpretive"],
    ["khoa_quyen_loc_giap", 1960, 1, 1, "Tý", "nam", "Dần", ["Hóa Khoa (Thiên Đồng)@Sửu", "Hóa Lộc (Thái Dương)@Mão"], "interpretive"],
    ["long_phuong_giap", 1962, 1, 1, "Tý", "nam", "Mùi", ["Long Trì@Ngọ", "Phượng Các@Thân"], "interpretive"],
    ["thai_toa_giap", 1960, 1, 3, "Tý", "nam", "Mùi", ["Tam Thai@Ngọ", "Bát Tọa@Thân"], "interpretive"],
    ["kim_du_phu_gia", 1960, 1, 5, "Tý", "nam", "Dần", ["Thiếu Dương@Sửu", "Thiếu Âm@Mão"], "interpretive"],
    ["tai_am_giap_an", 1960, 1, 1, "Dậu", "nam", "Dậu", ["Thiên Lương@Tuất", "Hóa Lộc (Thái Dương)@Thân"], "interpretive"],
    ["khong_kiep_giap", 1960, 9, 1, "Tỵ", "nam", "Tỵ", ["Địa Không@Ngọ", "Địa Kiếp@Thìn"], "exact"],
    ["hoa_linh_giap", 1960, 2, 1, "Mão", "nữ", "Tý", ["Hỏa Tinh@Hợi", "Linh Tinh@Sửu"], "interpretive"],
    ["duong_da_giap_ky", 1960, 1, 1, "Sửu", "nam", "Thân", ["Kình Dương@Dậu", "Đà La@Mùi"], "interpretive"],
    ["hinh_ky_giap_an", 1961, 1, 19, "Hợi", "nam", "Tuất", ["Thiên Hình@Dậu", "Hóa Kỵ (Văn Xương)@Hợi"], "exact"],
    ["van_tinh_ngo_giap", 1960, 1, 1, "Tỵ", "nam", "Tỵ", ["Địa Không@Ngọ", "Địa Kiếp@Thìn"], "interpretive"],
    ["giap_liem_giap_sat", 1960, 1, 3, "Hợi", "nam", "Mùi", ["Liêm Trinh@Thân", "Thất Sát@Ngọ"], "exact"],
    ["than_giap", 1960, 1, 1, "Ngọ", "nam", "Thân", ["Kình Dương@Dậu", "Đà La@Mùi"], "exact"],
  ];

  it.each(CASES)("%s: %i/%i/%i giờ %s %s, cung %s", (id, year, month, day, hour, gender, at, placements, certainty) => {
    const analysis = analyze(chartOf(year, month, day, hour, gender), at);
    expect(placed(analysis, id)).toEqual(placements);
    expect(match(analysis, id)?.certainty).toBe(certainty);
    const item = analysis.findings.find((f) => f.id === id)!;
    for (const star of placements.map((p) => p.split("@")[0]!)) expect(item.summary).toContain(star);
  });

  it("Tử Phủ giáp Mệnh Dần có điều kiện: 1960/2/4 giờ Sửu đạt; 1960/1/4 giờ Tý bị sát tinh phá cách", () => {
    const met = match(analyze(chartOf(1960, 2, 4, "Sửu", "nam"), "Dần"), "tu_phu_giap_menh")!;
    expect(met.conditionsMet).toBe(true);
    expect(met.label).toBe("Tử Phủ giáp Mệnh cách — phú quý song toàn");
    const broken = match(analyze(chartOf(1960, 1, 4, "Tý", "nam"), "Dần"), "tu_phu_giap_menh")!;
    expect(broken.conditionsMet).toBe(false);
    expect(broken.label).toContain("phá cách");
  });

  it("giáp Liêm giáp Sát ở cung khác Quan Lộc thì không có lời đoán (interpretive)", () => {
    expect(match(analyze(chartOf(1960, 1, 1, "Mùi", "nam"), "Mùi"), "giap_liem_giap_sat")?.certainty).toBe("interpretive");
  });

  it("Khoa Quyền Lộc giáp kéo theo Quí tinh giáp Mệnh, interpretive vì chỉ dựa trên cặp còn mơ hồ", () => {
    const life = analyze(chartOf(1960, 1, 1, "Tý", "nam"), "Dần");
    expect(match(life, "quy_tinh_giap_menh")?.certainty).toBe("interpretive");
  });

  it("cách nêu cho Mệnh mà gặp ở cung khác thì interpretive", () => {
    const servant = analyze(chartOf(1960, 1, 1, "Sửu", "nữ"), "Tý");
    expect(servant.role).toBe("Huynh Đệ");
    expect(match(servant, "hoa_linh_giap")?.certainty).toBe("interpretive");
  });
});

describe("điều kiện của cách giáp (sửa theo phản biện)", () => {
  it("Quí tinh giáp Mệnh đọc chặt cần Thiên Phủ tại Mệnh: 1960/1/12 giờ Sửu, Phủ ở Sửu giáp Nhật Nguyệt → exact (02_Giap-cung-tot.md)", () => {
    const life = analyze(chartOf(1960, 1, 12, "Sửu", "nam"), "Sửu");
    expect(life.role).toBe("Mệnh");
    expect(match(life, "quy_tinh_giap_menh")).toMatchObject({ label: "Quí tinh giáp Mệnh cách", certainty: "exact", conditionsMet: true });
  });

  it("Mệnh không có Thiên Phủ mà giáp Tả Hữu chỉ ra cách đọc rộng, interpretive", () => {
    const life = analyze(chartOf(1960, 3, 1, "Dậu", "nam"), "Mùi");
    const item = life.findings.find((f) => f.id === "quy_tinh_giap_menh")!;
    expect(item.certainty).toBe("interpretive");
    expect(item.missing[0]).toContain("Thiên Phủ");
  });

  it("giáp tốt bị sát tinh xung phá: Tả Hữu giáp Mệnh 1960/3/1 giờ Dậu liệt kê tứ sát trong tam phương", () => {
    const life = analyze(chartOf(1960, 3, 1, "Dậu", "nam"), "Mùi");
    const hit = match(life, "ta_huu_giap")!;
    expect(hit.conditionsMet).toBe(false);
    expect(hit.label).toContain("bị sát tinh xung phá");
    const item = life.findings.find((f) => f.id === "ta_huu_giap")!;
    expect(item.breakers.length).toBeGreaterThan(0);
    expect(item.breakers.every((text) => text.endsWith("trong tam phương tứ chính"))).toBe(true);
  });

  it("Kim dư phù giá 1960/1/5 giờ Tý bị tứ sát phá, interpretive", () => {
    const hit = match(analyze(chartOf(1960, 1, 5, "Tý", "nam"), "Dần"), "kim_du_phu_gia")!;
    expect(hit).toMatchObject({ label: "Kim dư phù giá — bị tứ sát phá", certainty: "interpretive", conditionsMet: false });
  });

  it("Văn tinh ngộ giáp: 1963/9/1 giờ Hợi không có cát tinh tại cung → lời 'bần hàn' áp dụng; 1960/9/1 giờ Tỵ có cát tinh giảm", () => {
    const bare = analyze(chartOf(1963, 9, 1, "Hợi", "nam"), "Hợi");
    expect(match(bare, "van_tinh_ngo_giap")?.conditionsMet).toBe(true);
    expect(bare.findings.find((f) => f.id === "van_tinh_ngo_giap")?.missing[0]).toContain("bần hàn");
    const helped = analyze(chartOf(1960, 9, 1, "Tỵ", "nam"), "Tỵ");
    expect(match(helped, "van_tinh_ngo_giap")?.conditionsMet).toBe(false);
    expect(helped.findings.find((f) => f.id === "van_tinh_ngo_giap")?.breakers.length).toBeGreaterThan(0);
  });
});

describe("Tuần Triệt theo cung (spec tuan_triet_by_palace_role, tuan_triet_vs_main_star)", () => {
  it("Lã Thái Hậu Thiên Di Thân: Triệt, Tham Lang ưa Tuần Triệt; lời NP1/NP2 cho Thiên Di", () => {
    const travel = analyze(LA_THAI_HAU, "Thân");
    expect(travel.role).toBe("Thiên Di");
    expect([travel.tuanTriet.hasTuan, travel.tuanTriet.hasTriet]).toEqual([false, true]);
    expect(travel.tuanTriet.roleEffects.map((effect) => effect.source)).toEqual(["NP1", "NP2"]);
    expect(travel.tuanTriet.starEffects.join(" ")).toContain("Tham Lang ưa Tuần Triệt");
    expect(travel.findings.find((f) => f.id === "tuan_triet_cung")?.certainty).toBe("interpretive");
  });

  it("Lã Thái Hậu Tử Tức Hợi không có Tuần Triệt; Thiên Lương hãm ở đó (không có ghi chú Tuần Triệt)", () => {
    const children = analyze(LA_THAI_HAU, "Hợi");
    expect(children.tuanTriet).toEqual({ hasTuan: false, hasTriet: false, roleEffects: [], starEffects: [] });
  });

  it("Nam Bính Thân: Thiên Di Thìn có cả Tuần lẫn Triệt; Thất Sát không có ghi chú ưa/sợ (13_La-so-mau/12_TVTH-Nam-Binh-Than.md)", () => {
    const travel = analyze(chartOf(1956, 11, 17, "Dần", "nam"), "Thìn");
    expect([travel.tuanTriet.hasTuan, travel.tuanTriet.hasTriet]).toEqual([true, true]);
    expect(travel.findings.find((f) => f.id === "tuan_triet_cung")?.name).toBe("Tuần và Triệt án ngữ Thiên Di");
  });

  it("Nam Bính Thân: Thất Sát hãm ở Thiên Di Thìn gặp Tuần Triệt — liệt kê cả ba cách đọc trái nhau (07_Tuan-Triet/04_An-ngu-chinh-tinh-va-sao-ham.md)", () => {
    const chart = chartOf(1956, 11, 17, "Dần", "nam");
    const hits = chart.palaces
      .map((p) => unwrap(analyzePalace(chart, p.branch)))
      .filter((a) => (a.tuanTriet.hasTuan || a.tuanTriet.hasTriet) && a.mainStars.some((s) => s.brightness === "Hãm"));
    expect(hits.map((a) => a.branchName)).toEqual(["Thìn"]);
    for (const hit of hits) {
      expect(hit.findings.find((f) => f.id === "tuan_triet_cung")?.variants.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("lựa chọn tuanStrength mặc định không xét; bật thì ghi cung âm/dương", () => {
    const tuanPalace = analyze(LA_THAI_HAU, "Tý");
    expect(tuanPalace.findings.find((f) => f.id === "tuan_triet_cung")?.summary).not.toContain("Theo lựa chọn");
    const weighted = unwrap(analyzePalace(LA_THAI_HAU, "Tý", { ...DEFAULT_ANALYSIS_OPTIONS, tuanStrength: "TVTH tr.73–74: mạnh ở cung dương" }));
    expect(weighted.findings.find((f) => f.id === "tuan_triet_cung")?.summary).toContain("Tuần đang ở cung dương — mạnh");
  });
});

describe("vô chính diệu theo cung và vòng Tràng Sinh", () => {
  it("Nữ Canh Ngọ: Mệnh Dậu mượn Thái Dương, Thiên Lương từ Mão; Phu Thê Mùi VCD → NP2 'rất xấu' (13_La-so-mau/05_TVTH-Nu-VCD-Canh-Ngo.md)", () => {
    const chart = chartOf(1990, 9, 11, "Sửu", "nữ");
    const life = analyze(chart, "Dậu");
    expect(life.voidInfo.isVoid).toBe(true);
    expect(life.voidInfo.borrowedFrom).toEqual({ branch: branch("Mão"), role: "Thiên Di" });
    expect(life.voidInfo.borrowedStars.map((s) => s.name).sort()).toEqual(["Thiên Lương", "Thái Dương"].sort());
    expect(life.lifeStageStar?.star).toBe("Dưỡng");
    const spouse = analyze(chart, "Mùi");
    expect(spouse.role).toBe("Phu Thê");
    expect(spouse.findings.find((f) => f.id === "vo_chinh_dieu_theo_cung")?.summary).toBe("NP2: Phu Thê vô chính diệu rất xấu.");
  });

  it("Lã Thái Hậu: Tràng Sinh tại Mệnh, sách ưa (06_Cac-vong-sao/03_Vong-Trang-Sinh/02_Sinh-luc-tung-cung.md)", () => {
    const life = analyze(LA_THAI_HAU, "Dần");
    expect(life.lifeStageStar).toMatchObject({ star: "Tràng Sinh", favoredHere: true, avoidedHere: [] });
  });

  it("Nam Kỷ Hợi: Mệnh Thân ở cung Tuyệt — MLTC kỵ Tuyệt ở Mệnh (13_La-so-mau/14_TVTH-Nam-Ky-Hoi.md)", () => {
    const life = lifeOf(chartOf(1959, 7, 28, "Tý", "nam"));
    expect(life.lifeStageStar?.star).toBe("Tuyệt");
    expect(life.lifeStageStar?.avoidedHere).toEqual([{ source: "MLTC", label: "Mệnh" }]);
  });
});

describe("render", () => {
  it("markdown tiếng Việt cho Mệnh Lã Thái Hậu", () => {
    const text = renderPalaceAnalysis(analyze(LA_THAI_HAU, "Dần"));
    expect(text).toContain("## Cung Mệnh · Bính Dần");
    expect(text).toContain("Liêm Trinh (Miếu, Hóa Lộc) · hành Hỏa · với cung Mộc: thuận");
    expect(text).toContain("Xung chiếu: Thiên Di (Thân)");
    expect(text).toContain("Dương Đà giáp Lộc");
  });
});
