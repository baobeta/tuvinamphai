import { describe, expect, it } from "vitest";
import { BRANCHES, mod, parseBranch } from "../../src/core/calendar/stem-branch.js";
import { DEFAULT_ANALYSIS_OPTIONS } from "../../src/core/analysis/analysis-options.js";
import { lifeStageAt, natalProfile, renderNatalProfile, type NatalProfile } from "../../src/core/analysis/natal-profile.js";
import {
  BIRTH_MONTH_MLTC,
  BUREAU_AVOIDED_BRANCHES,
  DAY_HOURS,
  FAVORABLE_HOURS_BY_SEASON,
  LIFE_PARTNER_ROLES,
  NIGHT_HOURS,
  SEASON_OF_MONTH,
  SEASON_STRENGTH,
  THAI_TUE_GROUPS,
  TRIET_BY_STEM_PAIR,
  TUAN_BY_DECADE,
  VOID_ARCHETYPES_MLTC,
  YEAR_HOUR_CLASHES,
} from "../../src/core/analysis/natal-tables.js";
import { buildChart } from "../../src/core/chart/build-chart.js";
import type { Chart } from "../../src/core/chart/types.js";
import type { Element } from "../../src/core/calendar/five-elements.js";
import type { Result } from "../../src/core/result.js";

const unwrap = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const branch = (name: string): number => unwrap(parseBranch(name));

const chartOf = (year: number, month: number, day: number, hour: string, gender: "nam" | "nữ"): Chart =>
  unwrap(buildChart({ calendar: "lunar", date: { year, month, day, isLeapMonth: false }, hourBranch: branch(hour), gender }));

const hourForLifeInFirstMonth = (life: string): string => BRANCHES[mod(2 - branch(life), 12)]!;

const ids = (profile: NatalProfile): readonly string[] => profile.findings.map((item) => item.id);
const findingOf = (profile: NatalProfile, id: string) => profile.findings.find((item) => item.id === id);

describe("bảng Thân cư theo giờ sinh (spec than_cu_cung)", () => {
  const TABLE: Readonly<Record<string, string>> = {
    Tý: "Mệnh", Ngọ: "Mệnh", Sửu: "Phúc Đức", Mùi: "Phúc Đức", Dần: "Quan Lộc", Thân: "Quan Lộc",
    Mão: "Thiên Di", Dậu: "Thiên Di", Thìn: "Tài Bạch", Tuất: "Tài Bạch", Tỵ: "Phu Thê", Hợi: "Phu Thê",
  };
  it.each(Object.entries(TABLE))("giờ %s → Thân cư %s, khớp vai trò trên lá số", (hour, role) => {
    for (const month of [1, 5, 9]) {
      const profile = natalProfile(chartOf(1974, month, 7, hour, "nam"));
      expect(profile.bodyResidence.role).toBe(role);
      expect(profile.bodyResidence.consistent).toBe(true);
      expect(findingOf(profile, "than_cu_cung")?.certainty).toBe("exact");
    }
  });

  it("ví dụ TVTH tr.22: tháng 5 giờ Mùi → Mệnh Hợi, Thân Sửu cư Phúc Đức (02_Ban-menh/01_Menh-va-Than/03_Than-cu-Phuc.md)", () => {
    const profile = natalProfile(chartOf(1974, 5, 1, "Mùi", "nam"));
    expect(BRANCHES[profile.life.branch]).toBe("Hợi");
    expect(BRANCHES[profile.body.branch]).toBe("Sửu");
    expect(profile.bodyResidence.label).toBe("Thân cư Phúc Đức");
  });

  it("ví dụ tự dựng: tháng 5 giờ Tý → Thân Mệnh đồng cung ở Ngọ (02_Ban-menh/01_Menh-va-Than/02_Than-cu-Menh.md)", () => {
    const profile = natalProfile(chartOf(1974, 5, 1, "Tý", "nam"));
    expect([BRANCHES[profile.life.branch], BRANCHES[profile.body.branch]]).toEqual(["Ngọ", "Ngọ"]);
    expect(profile.bodyResidence.label).toBe("Thân cư Mệnh (Thân Mệnh đồng cung)");
  });
});

describe("chủ Mệnh, chủ Thân (spec chu_menh, chu_than)", () => {
  const LIFE_LORD: Readonly<Record<string, string>> = {
    Tý: "Tham Lang", Sửu: "Cự Môn", Dần: "Lộc Tồn", Mão: "Văn Khúc", Thìn: "Liêm Trinh", Tỵ: "Vũ Khúc",
    Ngọ: "Phá Quân", Mùi: "Vũ Khúc", Thân: "Liêm Trinh", Dậu: "Văn Khúc", Tuất: "Lộc Tồn", Hợi: "Cự Môn",
  };
  it.each(Object.entries(LIFE_LORD))("Mệnh %s → chủ Mệnh %s", (life, star) => {
    const profile = natalProfile(chartOf(1974, 1, 7, hourForLifeInFirstMonth(life), "nam"));
    expect(BRANCHES[profile.life.branch]).toBe(life);
    expect(profile.lifeLord.star).toBe(star);
    expect(profile.lifeLord.palace).toBeDefined();
    expect(findingOf(profile, "chu_menh")?.certainty).toBe("interpretive");
  });

  const BODY_LORD: Readonly<Record<string, string>> = {
    Tý: "Hỏa Tinh", Sửu: "Thiên Tướng", Dần: "Thiên Lương", Mão: "Thiên Đồng", Thìn: "Văn Xương", Tỵ: "Thiên Cơ",
    Ngọ: "Hỏa Tinh", Mùi: "Thiên Tướng", Thân: "Thiên Lương", Dậu: "Thiên Đồng", Tuất: "Văn Xương", Hợi: "Thiên Cơ",
  };
  it.each(Object.entries(BODY_LORD))("tuổi %s → chủ Thân %s", (yearBranch, star) => {
    const profile = natalProfile(chartOf(1984 + branch(yearBranch), 1, 7, "Tý", "nam"));
    expect(profile.bodyLord.star).toBe(star);
  });

  it("Mệnh Tý: chủ Mệnh Tham Lang bị MLTC đánh dấu xấu", () => {
    const profile = natalProfile(chartOf(1974, 1, 7, hourForLifeInFirstMonth("Tý"), "nam"));
    expect(findingOf(profile, "chu_menh")?.polarity).toBe("xấu");
  });

  it("Lã Thái Hậu: chủ Mệnh Lộc Tồn tại Mệnh, chủ Thân Thiên Lương ở Tử Tức Hợi (02_Ban-menh/01_Menh-va-Than/08_Sao-chu-Menh-chu-Than.md)", () => {
    const profile = natalProfile(chartOf(1974, 3, 7, "Dần", "nữ"));
    expect(profile.lifeLord).toEqual({ star: "Lộc Tồn", palace: { branch: branch("Dần"), role: "Mệnh" } });
    expect(profile.bodyLord).toEqual({ star: "Thiên Lương", palace: { branch: branch("Hợi"), role: "Tử Tức" } });
  });

  it("Kỷ Mùi Mệnh Mùi: chủ Mệnh Vũ Khúc, chủ Thân Thiên Tướng (08_Sao-chu-Menh-chu-Than.md)", () => {
    const profile = natalProfile(chartOf(1979, 8, 23, "Dần", "nam"));
    expect([profile.lifeLord.star, profile.bodyLord.star]).toEqual(["Vũ Khúc", "Thiên Tướng"]);
  });
});

describe("cục và bản mệnh (spec cuc_vs_ban_menh, cuc_ky_hanh)", () => {
  const AVOIDED: Readonly<Record<string, readonly string[]>> = {
    Hỏa: ["Tuất", "Hợi"], Thủy: ["Thìn", "Tỵ"], Thổ: ["Thìn", "Tỵ"], Kim: ["Sửu", "Dần"], Mộc: ["Thân", "Dậu"],
  };
  it.each(Object.entries(AVOIDED))("cục %s kỵ hành %j", (element, branches) => {
    expect(BUREAU_AVOIDED_BRANCHES[element as Element]).toEqual(branches);
  });

  it("NP2: Quý Hợi 1983 Đại Hải Thủy, Kim tứ cục → Cục sinh Mệnh, thượng cách, exact (02_Ban-menh/02_Ngu-hanh-ban-menh/01_Cuc-sinh-khac-ban-menh.md)", () => {
    const profile = natalProfile(chartOf(1983, 1, 1, "Sửu", "nam"));
    expect(profile.bureauVersusNatal.bureau.name).toBe("Kim tứ cục");
    expect(profile.bureauVersusNatal.nayin.name).toBe("Đại Hải Thủy");
    expect(profile.bureauVersusNatal.verdict).toBe("Cục sinh Mệnh — thượng cách");
    expect(findingOf(profile, "cuc_sinh_menh")?.certainty).toBe("exact");
  });

  it("Lã Thái Hậu: Thủy khắc Hỏa lục cục → tương khắc, interpretive, kèm cách đọc 'mệnh cục' của TVTH (01_Cuc-sinh-khac-ban-menh.md)", () => {
    const profile = natalProfile(chartOf(1974, 3, 7, "Dần", "nữ"));
    expect(profile.bureauVersusNatal.verdict).toBe("Mệnh, Cục tương khắc");
    const item = findingOf(profile, "menh_cuc_tuong_khac")!;
    expect(item.certainty).toBe("interpretive");
    expect(item.variants.join(" ")).toContain("Lã Thái Hậu");
    expect(profile.avoidedBranches).toEqual({ branches: [branch("Tuất"), branch("Hợi")], life: false, body: false });
  });

  it("Âm nam Quý Tỵ: Thổ ngũ cục, Mệnh Thìn rơi vào cung kỵ hành (13_La-so-mau/10_TVTH-Am-Nam-Qui-Ty.md)", () => {
    const profile = natalProfile(chartOf(1953, 11, 4, "Thân", "nam"));
    expect(profile.bureauVersusNatal.bureau.name).toBe("Thổ ngũ cục");
    expect(profile.avoidedBranches.life).toBe(true);
    expect(findingOf(profile, "cuc_ky_hanh")?.certainty).toBe("interpretive");
  });

  it("bản mệnh sinh cục hoặc đồng hành: verdict null, không có nhận định (sách không nêu quy tắc)", () => {
    const charts = Array.from({ length: 12 }, (_, hour) => chartOf(1974, 1, 7, BRANCHES[hour]!, "nam"));
    const neutral = charts.map((chart) => natalProfile(chart)).filter((profile) => ["đồng hành", "được sinh"].includes(profile.bureauVersusNatal.relation.kind));
    expect(neutral.length).toBeGreaterThan(0);
    for (const profile of neutral) {
      expect(profile.bureauVersusNatal.verdict).toBeNull();
      expect(ids(profile).filter((id) => id === "cuc_sinh_menh" || id === "menh_cuc_tuong_khac")).toEqual([]);
    }
  });
});

describe("sinh vượng bại tuyệt địa (spec sinh_vuong_bai_tuyet_dia)", () => {
  const TVTH: ReadonlyArray<readonly [Element, string, string, string, string]> = [
    ["Kim", "Tỵ", "Dậu", "Ngọ", "Dần"],
    ["Mộc", "Hợi", "Mão", "Tý", "Thân"],
    ["Hỏa", "Dần", "Ngọ", "Mão", "Hợi"],
    ["Thủy", "Thân", "Tý", "Dậu", "Tỵ"],
    ["Thổ", "Thân", "Tý", "Dậu", "Tỵ"],
  ];
  it.each(TVTH)("TVTH hành %s: Sinh %s, Vượng %s, Bại %s, Tuyệt %s", (element, sinh, vuong, bai, tuyet) => {
    expect(lifeStageAt(element, branch(sinh))).toBe("Sinh địa");
    expect(lifeStageAt(element, branch(vuong))).toBe("Vượng địa");
    expect(lifeStageAt(element, branch(bai))).toBe("Bại địa");
    expect(lifeStageAt(element, branch(tuyet))).toBe("Tuyệt địa");
    const others = BRANCHES.filter((name) => ![sinh, vuong, bai, tuyet].includes(name));
    expect(others.map((name) => lifeStageAt(element, branch(name)))).toEqual(Array(8).fill(null));
  });

  it("NP2 hành Thổ: Sinh Tỵ, Vượng Ngọ, Bại Mão, Tuyệt trống", () => {
    expect(["Tỵ", "Ngọ", "Mão"].map((name) => lifeStageAt("Thổ", branch(name), "NP2"))).toEqual(["Sinh địa", "Vượng địa", "Bại địa"]);
    expect(BRANCHES.map((name) => lifeStageAt("Thổ", branch(name), "NP2")).filter((label) => label === "Tuyệt địa")).toEqual([]);
  });

  it("Lã Thái Hậu: Thủy, Mệnh Dần và Thân Ngọ không thuộc bốn địa (02_Ban-menh/02_Ngu-hanh-ban-menh/03_Sinh-vuong-bai-tuyet-dia.md)", () => {
    const profile = natalProfile(chartOf(1974, 3, 7, "Dần", "nữ"));
    expect([profile.lifeStages.element, profile.lifeStages.life, profile.lifeStages.body]).toEqual(["Thủy", null, null]);
  });

  it("Nữ Canh Ngọ: Lộ Bàng Thổ, Mệnh Dậu là Bại địa theo TVTH ('sinh phùng bại địa phát không bền'), NP2 thì không (13_La-so-mau/05_TVTH-Nu-VCD-Canh-Ngo.md)", () => {
    const chart = chartOf(1990, 9, 11, "Sửu", "nữ");
    const tvth = natalProfile(chart);
    expect(BRANCHES[tvth.life.branch]).toBe("Dậu");
    expect(tvth.lifeStages.life).toBe("Bại địa");
    expect(tvth.lifeStages.variants).toEqual([{ source: "NP2 tr.8–10 (OCR)", life: null, body: null }]);
    expect(findingOf(tvth, "sinh_vuong_bai_tuyet_menh")?.certainty).toBe("interpretive");
    const np2 = natalProfile(chart, { ...DEFAULT_ANALYSIS_OPTIONS, earthLifeStages: "NP2" });
    expect(np2.lifeStages.life).toBeNull();
  });

  it("Nam Kỷ Hợi: Mộc ở Thân là Tuyệt địa; Tử Phủ (Thổ) không sinh Mộc nên quy tắc spec không ra 'Tuyệt xứ phùng sinh' dù sách gọi như vậy (13_La-so-mau/14_TVTH-Nam-Ky-Hoi.md)", () => {
    const profile = natalProfile(chartOf(1959, 7, 28, "Tý", "nam"));
    expect(BRANCHES[profile.life.branch]).toBe("Thân");
    expect(profile.lifeStages.life).toBe("Tuyệt địa");
    expect(findingOf(profile, "sinh_vuong_bai_tuyet_menh")?.certainty).toBe("exact");
    expect(ids(profile)).toContain("bai_tuyet_khong_cuu");
    expect(ids(profile)).not.toContain("tuyet_xu_phung_sinh");
  });

  it("dữ liệu thật tìm bằng vét cạn: Canh Tý 1960 tháng 1 ngày 3 giờ Dậu, Mệnh Tỵ Tuyệt địa của Thổ có Liêm Trinh (Hỏa) sinh Thổ → Tuyệt xứ phùng sinh", () => {
    const profile = natalProfile(chartOf(1960, 1, 3, "Dậu", "nam"));
    expect(profile.lifeStages.life).toBe("Tuyệt địa");
    const item = findingOf(profile, "tuyet_xu_phung_sinh")!;
    expect(item.satisfied).toContain("Liêm Trinh sinh Thổ");
  });
});

describe("mùa sinh, giờ sinh (spec mua_sinh_menh_vuong_tuong, thuan_gio_sinh, sinh_ngay_dem, nam_gio_khac)", () => {
  it.each(Object.entries({ 1: "Xuân", 2: "Xuân", 3: "Xuân", 4: "Hạ", 5: "Hạ", 6: "Hạ", 7: "Thu", 8: "Thu", 9: "Thu", 10: "Đông", 11: "Đông", 12: "Đông" }))(
    "tháng %s → mùa %s",
    (month, season) => expect(SEASON_OF_MONTH[Number(month)]).toBe(season),
  );

  it.each([
    ["Mộc", "Xuân", "Mệnh Vượng"], ["Hỏa", "Hạ", "Mệnh Vượng"], ["Kim", "Thu", "Mệnh Vượng"], ["Thủy", "Đông", "Mệnh Vượng"],
    ["Hỏa", "Xuân", "Mệnh Tướng"], ["Thổ", "Hạ", "Mệnh Tướng"], ["Thủy", "Thu", "Mệnh Tướng"], ["Mộc", "Đông", "Mệnh Tướng"],
  ])("hành %s mùa %s → %s", (element, season, label) => {
    expect(SEASON_STRENGTH).toContainEqual({ element, season, label });
  });

  it("chỉ có 8 ô mùa sinh; Kim không có mùa Tướng, Thổ không có mùa Vượng", () => {
    expect(SEASON_STRENGTH).toHaveLength(8);
    expect(SEASON_STRENGTH.filter((row) => row.element === "Kim" && row.label === "Mệnh Tướng")).toEqual([]);
    expect(SEASON_STRENGTH.filter((row) => row.element === "Thổ" && row.label === "Mệnh Vượng")).toEqual([]);
  });

  it.each(Object.entries({ Xuân: ["Dậu", "Thìn", "Tỵ"], Hạ: ["Mão", "Mùi", "Hợi"], Thu: ["Ngọ", "Thân", "Dần"], Đông: ["Sửu", "Tuất", "Tý"] }))(
    "mùa %s thuận giờ %j",
    (season, hours) => expect(FAVORABLE_HOURS_BY_SEASON[season as "Xuân"]).toEqual(hours),
  );

  it("ngày: Dần–Mùi, đêm: Thân–Sửu", () => {
    expect(DAY_HOURS).toEqual(["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"]);
    expect(NIGHT_HOURS).toEqual(["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]);
  });

  it.each([
    [["Dần", "Ngọ", "Tỵ", "Dậu"], ["Thìn", "Tuất", "Sửu", "Mùi"], "tối độc"],
    [["Dần", "Hợi", "Tý"], ["Ngọ", "Thân", "Dậu", "Hợi"], "khắc cha (đến 16 tuổi mới khỏi lo mồ côi cha)"],
    [["Thìn", "Tỵ", "Sửu", "Mùi"], ["Tý", "Ngọ", "Mão", "Tỵ", "Hợi", "Thân", "Dậu"], "khắc mẹ"],
  ])("tuổi %j giờ %j → %s", (years, hours, label) => {
    expect(YEAR_HOUR_CLASHES).toContainEqual({ years, hours, label });
  });

  it("Kỷ Mùi tháng 5 giờ Dần: Hỏa sinh mùa Hạ là Mệnh Vượng, giờ Dần không thuận (02_Ban-menh/03_Am-duong-ly/02_Mua-sinh-gio-sinh-thuan-nghich.md)", () => {
    const profile = natalProfile(chartOf(1979, 5, 12, "Dần", "nam"));
    expect(profile.season).toMatchObject({ season: "Hạ", strength: "Mệnh Vượng", favorableHour: false });
    expect(findingOf(profile, "thuan_mua_sinh")?.certainty).toBe("interpretive");
    expect(ids(profile)).not.toContain("thuan_gio_sinh");
  });

  it("Lã Thái Hậu tháng 3 giờ Dần: không thuận mùa, không thuận giờ, ban ngày, không rơi vào tổ hợp năm–giờ (02_Mua-sinh-gio-sinh-thuan-nghich.md)", () => {
    const profile = natalProfile(chartOf(1974, 3, 7, "Dần", "nữ"));
    expect(profile.season).toMatchObject({ season: "Xuân", strength: null, favorableHour: false });
    expect(profile.dayNight).toBe("ngày");
    expect(ids(profile)).not.toContain("nam_gio_khac");
    expect(ids(profile)).not.toContain("chinh_tinh_op_gio_sinh");
  });

  it("Âm nam Quý Tỵ sinh giờ Thân (đêm), Thái Âm thủ Mệnh: chính tinh ốp giờ sinh (13_La-so-mau/10_TVTH-Am-Nam-Qui-Ty.md)", () => {
    const profile = natalProfile(chartOf(1953, 11, 4, "Thân", "nam"));
    expect(profile.dayNight).toBe("đêm");
    expect(findingOf(profile, "chinh_tinh_op_gio_sinh")?.summary).toContain("Thái Âm");
  });

  it.each(Object.entries(BIRTH_MONTH_MLTC))("MLTC tháng %s có tiết và tháng thụ thai", (month, row) => {
    expect(row.conception).toMatch(/tháng \d+ (năm trước|cùng năm)/);
    expect(row.solarTerm.length).toBeGreaterThan(0);
    expect(natalProfile(chartOf(1974, Number(month), 7, "Dần", "nữ")).birthMonthMLTC).toEqual(row);
  });
});

describe("âm dương thuận lý / nghịch lý — ba tiêu chí riêng (02_Ban-menh/03_Am-duong-ly/01_Am-duong-thuan-ly-nghich-ly.md)", () => {
  const verdicts = (profile: NatalProfile) => profile.yinYang.map((method) => method.verdict);

  it("Lã Thái Hậu Giáp Dần giờ Dần Mệnh Dần: cách 1 thuận, cách 2 thuận, cách 3 chưa xác định", () => {
    expect(verdicts(natalProfile(chartOf(1974, 3, 7, "Dần", "nữ")))).toEqual(["thuận lý", "thuận lý", "chưa xác định"]);
  });

  it("Kỷ Mùi tháng 5 giờ Dần Mệnh Thìn: cách 1 thuận, cách 2 nghịch", () => {
    const profile = natalProfile(chartOf(1979, 5, 12, "Dần", "nam"));
    expect(BRANCHES[profile.life.branch]).toBe("Thìn");
    expect(verdicts(profile)).toEqual(["thuận lý", "nghịch lý", "chưa xác định"]);
  });

  it("Âm nam Kỷ Mùi tháng 8 ngày 23 giờ Dần Mệnh Mùi: cách 1 nghịch, cách 2 thuận", () => {
    const profile = natalProfile(chartOf(1979, 8, 23, "Dần", "nam"));
    expect(verdicts(profile)).toEqual(["nghịch lý", "thuận lý", "chưa xác định"]);
    expect(profile.findings.filter((item) => item.id.startsWith("am_duong_")).map((item) => item.polarity)).toEqual(["xấu", "tốt"]);
  });

  it("mỗi tiêu chí ghi nguồn riêng", () => {
    expect(natalProfile(chartOf(1974, 3, 7, "Dần", "nữ")).yinYang.map((method) => method.source)).toEqual([
      "TVTH tr.96 mục 3",
      "TVTH tr.100 mục VI.1; NP2 tr.231–237",
      "NP1 tr.111–142",
    ]);
  });
});

describe("vòng Thái Tuế (spec thai_tue_bo_tam_hop, thai_tue_duoc_thoi)", () => {
  it.each(THAI_TUE_GROUPS.map((group) => [group.index, group.stars, group.offsets] as const))("bộ %i: %j cách Thái Tuế %j", (index, stars, offsets) => {
    const expected: Record<number, readonly [readonly string[], readonly number[]]> = {
      0: [["Thái Tuế", "Quan Phù", "Bạch Hổ"], [0, 4, 8]],
      1: [["Thiếu Dương", "Tử Phù", "Phúc Đức"], [1, 5, 9]],
      2: [["Tang Môn", "Tuế Phá", "Điếu Khách"], [2, 6, 10]],
      3: [["Thiếu Âm", "Long Đức", "Trực Phù"], [3, 7, 11]],
    };
    expect([stars, offsets]).toEqual(expected[index]);
  });

  it("tuổi Mùi Mệnh Mão: Bạch Hổ, bộ Tuế – Hổ – Phù; Mệnh Dậu: Tang Môn, bộ Tang – Tuế – Điếu (06_Cac-vong-sao/01_Vong-Thai-Tue/02_Bon-bo-tam-hop-trong-vong-Thai-Tue.md)", () => {
    const atMao = natalProfile(chartOf(1979, 1, 7, hourForLifeInFirstMonth("Mão"), "nam"));
    expect([atMao.thaiTue.life.ringStar, atMao.thaiTue.life.group.name]).toEqual(["Bạch Hổ", "Tuế – Hổ – Phù"]);
    const atDau = natalProfile(chartOf(1979, 1, 7, hourForLifeInFirstMonth("Dậu"), "nam"));
    expect([atDau.thaiTue.life.ringStar, atDau.thaiTue.life.group.name]).toEqual(["Tang Môn", "Tang – Tuế – Điếu"]);
  });

  it("Lã Thái Hậu: Thái Tuế tọa Mệnh Dần, Thân Ngọ có Quan Phù cùng bộ, Tuế Phá ở Thiên Di Thân", () => {
    const profile = natalProfile(chartOf(1974, 3, 7, "Dần", "nữ"));
    expect(profile.thaiTue.thaiTueInLife).toBe(true);
    expect(profile.thaiTue.body.ringStar).toBe("Quan Phù");
    expect(profile.thaiTue.sameGroup).toBe(true);
    expect(profile.thaiTue.tuePha).toEqual({ branch: branch("Thân"), role: "Thiên Di" });
    expect(findingOf(profile, "tue_pha_thien_di")?.certainty).toBe("exact");
    expect(findingOf(profile, "thai_tue_duoc_thoi")?.summary).toContain("tàn suy");
  });

  it("Âm nam Kỷ Mùi: Mệnh Mùi có Thái Tuế và Hoa Cái → được thời cung Thổ, 'bướng nhất' (06_Cac-vong-sao/01_Vong-Thai-Tue/03_Menh-trong-vong-Thai-Tue-va-duoc-thoi.md; 13_La-so-mau/04)", () => {
    const item = findingOf(natalProfile(chartOf(1979, 8, 23, "Dần", "nam")), "thai_tue_duoc_thoi")!;
    expect(item.certainty).toBe("interpretive");
    expect(item.summary).toContain("không bao giờ sợ Tuế");
    expect(item.summary).toContain("bướng nhất");
  });

  it("ví dụ tự dựng tuổi Dậu Mệnh Dậu: Tuế Phá ở Mão là Thiên Di, Kim Kim vượng phát (03_Menh-trong-vong-Thai-Tue-va-duoc-thoi.md)", () => {
    const profile = natalProfile(chartOf(1981, 1, 7, hourForLifeInFirstMonth("Dậu"), "nam"));
    expect(profile.thaiTue.tuePha).toEqual({ branch: branch("Mão"), role: "Thiên Di" });
    expect(findingOf(profile, "thai_tue_duoc_thoi")?.summary).toContain("Kim Kim vượng phát");
  });
});

describe("Tuần Triệt (spec tuan_triet_position_check, tuan_triet_dac_dia, tuan_triet_menh_than)", () => {
  it.each(TRIET_BY_STEM_PAIR.map((row) => [row.stems.join("/"), row.branches] as const))("Triệt tuổi %s ở %j", (stems, branches) => {
    const expected: Record<string, readonly string[]> = {
      "Giáp/Kỷ": ["Thân", "Dậu"], "Ất/Canh": ["Ngọ", "Mùi"], "Bính/Tân": ["Thìn", "Tỵ"], "Đinh/Nhâm": ["Dần", "Mão"], "Mậu/Quý": ["Tý", "Sửu"],
    };
    expect(branches).toEqual(expected[stems]);
  });

  it.each(Object.entries(TUAN_BY_DECADE))("Tuần tuần %s ở %j", (decade, branches) => {
    const expected: Record<string, readonly string[]> = {
      "Giáp Tý": ["Tuất", "Hợi"], "Giáp Tuất": ["Thân", "Dậu"], "Giáp Thân": ["Ngọ", "Mùi"], "Giáp Ngọ": ["Thìn", "Tỵ"], "Giáp Thìn": ["Dần", "Mão"], "Giáp Dần": ["Tý", "Sửu"],
    };
    expect(branches).toEqual(expected[decade]);
  });

  it("vị trí Tuần Triệt trên lá số khớp bảng ở cả 60 năm hoa giáp", () => {
    for (let year = 1984; year < 2044; year++) {
      expect(natalProfile(chartOf(year, 1, 7, "Tý", "nam")).tuanTriet.matchesTables).toBe(true);
    }
  });

  it("Giáp Thìn: Tuần Dần Mão (đắc địa); Kỷ Mùi: Triệt Thân Dậu (Kim cung); Bính Tý: Tuần Thân Dậu, Triệt Thìn Tỵ (07_Tuan-Triet/01_Ban-chat-Tuan-Triet.md)", () => {
    const giapThin = natalProfile(chartOf(1964, 1, 7, "Tý", "nam"));
    expect(giapThin.tuanTriet.tuan.map((b) => BRANCHES[b])).toEqual(["Dần", "Mão"]);
    expect(findingOf(giapThin, "tuan_dac_dia")?.certainty).toBe("exact");
    const kyMui = natalProfile(chartOf(1979, 1, 7, "Tý", "nam"));
    expect(kyMui.tuanTriet.triet.map((b) => BRANCHES[b])).toEqual(["Thân", "Dậu"]);
    expect(ids(kyMui)).toContain("triet_dao_kim_cung");
    const binhTy = natalProfile(chartOf(1996, 1, 7, "Tý", "nam"));
    expect([binhTy.tuanTriet.tuan.map((b) => BRANCHES[b]), binhTy.tuanTriet.triet.map((b) => BRANCHES[b])]).toEqual([["Thân", "Dậu"], ["Thìn", "Tỵ"]]);
  });

  it("Nam Bính Thân: Tuần và Triệt cùng ở Thìn Tỵ (Thiên Di) → Tuần Triệt đồng cung (13_La-so-mau/12_TVTH-Nam-Binh-Than.md)", () => {
    const profile = natalProfile(chartOf(1956, 11, 17, "Dần", "nam"));
    expect(findingOf(profile, "tuan_triet_dong_cung")?.summary).toContain("Thìn Tỵ");
  });

  it("Nam Kỷ Hợi: Triệt án ngữ Mệnh Thân → 'Mệnh không ưa Triệt', interpretive (13_La-so-mau/14_TVTH-Nam-Ky-Hoi.md)", () => {
    const profile = natalProfile(chartOf(1959, 7, 28, "Tý", "nam"));
    expect(profile.tuanTriet.lifeTriet).toBe(true);
    const item = findingOf(profile, "tuan_triet_menh")!;
    expect(item.certainty).toBe("interpretive");
    expect(item.summary).toContain("Mệnh không ưa Triệt");
  });

  it("dữ liệu thật: Canh Tý 1960 tháng 4 ngày 1 giờ Hợi, Mệnh Ngọ Triệt, Thân Tuần → hai lời TVTH và NP1", () => {
    const profile = natalProfile(chartOf(1960, 4, 1, "Hợi", "nam"));
    expect([profile.tuanTriet.lifeTriet, profile.tuanTriet.bodyTuan]).toEqual([true, true]);
    expect(findingOf(profile, "menh_triet_than_tuan_TVTH")?.certainty).toBe("interpretive");
    expect(findingOf(profile, "tuan_triet_menh")?.summary).toContain("Mệnh Triệt Thân Tuần");
  });

  it("Mệnh Triệt Thân Tuần loại trừ Mệnh/Thân có cả hai: Bính Thân (Tuần Triệt đồng cung Thìn Tỵ) không bao giờ ra cách này", () => {
    for (let month = 1; month <= 12; month++) {
      for (const hour of BRANCHES) {
        const profile = natalProfile(chartOf(1956, month, 7, hour, "nam"));
        expect(ids(profile)).not.toContain("menh_triet_than_tuan_TVTH");
      }
    }
  });

  it("dữ liệu thật: Canh Tý 1960 tháng 4 ngày 1 giờ Sửu, Mệnh Tuần Thân Triệt nhưng Đồng Âm hãm → chưa đạt 'Cơ Nguyệt Đồng Lương sáng sủa'", () => {
    const item = findingOf(natalProfile(chartOf(1960, 4, 1, "Sửu", "nam")), "menh_tuan_than_triet")!;
    expect(item.polarity).toBe("xấu");
    expect(item.assumptions[0]).toContain("Miếu/Vượng/Đắc");
  });
});

describe("Mệnh vô chính diệu (spec menh_vo_chinh_dieu, vcd_muon_sao_MLTC, vcd_tam_khong_and_hung_tinh)", () => {
  it("Nữ Canh Ngọ: Mệnh Dậu VCD mượn Thái Dương, Thiên Lương ở Thiên Di Mão (13_La-so-mau/05_TVTH-Nu-VCD-Canh-Ngo.md)", () => {
    const profile = natalProfile(chartOf(1990, 9, 11, "Sửu", "nữ"));
    expect(profile.lifeVoid.isVoid).toBe(true);
    expect(profile.lifeVoid.borrowedFrom).toEqual({ branch: branch("Mão"), role: "Thiên Di" });
    expect(profile.lifeVoid.borrowedStars.map((star) => star.name).sort()).toEqual(["Thiên Lương", "Thái Dương"].sort());
    expect(findingOf(profile, "vcd_muon_sao_MLTC")?.summary).toContain("hao tâm tổn trí");
    expect(ids(profile)).toContain("kinh_da_vcd");
  });

  it("Mồ côi mẹ Giáp Thân: Mệnh Hợi VCD mượn Liêm Tham, có Hữu Bật, hội Song Hao và Tuyệt (13_La-so-mau/06_TVTH-Mo-coi-me-Giap-Than.md)", () => {
    const profile = natalProfile(chartOf(1944, 12, 25, "Dần", "nam"));
    expect(BRANCHES[profile.life.branch]).toBe("Hợi");
    expect(profile.lifeVoid.borrowedStars.map((star) => star.name)).toEqual(["Liêm Trinh", "Tham Lang"]);
    expect(findingOf(profile, "vcd_muon_sao_MLTC")?.summary).toContain("phúc nông cạn");
    expect(findingOf(profile, "vcd_phu_bat")?.certainty).toBe("exact");
    expect(findingOf(profile, "vcd_song_hao_tuyet")?.certainty).toBe("interpretive");
  });

  it("không tính trọng số phần trăm cho vô chính diệu: chỉ có sự kiện", () => {
    const profile = natalProfile(chartOf(1990, 9, 11, "Sửu", "nữ"));
    expect(Object.keys(profile.lifeVoid).sort()).toEqual(["borrowedFrom", "borrowedStars", "isVoid"]);
    expect(findingOf(profile, "menh_vo_chinh_dieu")?.summary).not.toMatch(/\d+ ?%/);
  });

  it("dữ liệu thật: Canh Tý 1960 tháng 10 ngày 1 giờ Thìn, Mệnh Mùi VCD có Triệt và Địa Không → đắc Tam Không (interpretive)", () => {
    const item = findingOf(natalProfile(chartOf(1960, 10, 1, "Thìn", "nam")), "vcd_dac_tam_khong")!;
    expect(item.certainty).toBe("interpretive");
    expect(item.summary).toContain("Triệt, Địa Không");
  });

  it.each(VOID_ARCHETYPES_MLTC.map((row) => [row.lifeBranches.join("|"), row.opposite.join(" "), row.key] as const))("MLTC VCD %s, đối cung %s → %s", (life, opposite, key) => {
    const spec: ReadonlyArray<readonly [string, string, string]> = [
      ["Tý|Ngọ", "Thiên Đồng Thái Âm", "kiên cường, có tài nghệ"],
      ["Sửu|Mùi", "Thái Dương Thái Âm", "Nhật nguyệt đồng lâm cách"],
      ["Sửu|Mùi", "Vũ Khúc Tham Lang", "nôn nóng, hấp tấp"],
      ["Sửu|Mùi", "Thiên Đồng Cự Môn", "khôn khéo, tình cảm trắc trở"],
      ["Dần|Thân", "Thái Dương Cự Môn", "quản tiền tốt, bảo thủ"],
      ["Dần|Thân", "Thiên Cơ Thái Âm", "hào sảng, hay bị hiểu lầm"],
      ["Dần|Thân", "Thiên Đồng Thiên Lương", "Cự Nhật củng chiếu cách (như KB ghi)"],
      ["Mão|Dậu", "Thiên Cơ Cự Môn", "tử tế; có sát kị thì nham hiểm"],
      ["Mão|Dậu", "Tử Vi Tham Lang", "thận trọng thực tế"],
      ["Mão|Dậu", "Thái Dương Thiên Lương", "hao tâm tổn trí"],
      ["Thìn|Tuất", "Thiên Cơ Thiên Lương", "ăn nói khéo; cát → doanh nhân lớn; sát kị → gian trá"],
      ["Tỵ|Hợi", "Liêm Trinh Tham Lang", "phúc nông cạn, về già sung sướng"],
    ];
    expect(spec).toContainEqual([life, opposite, key]);
  });
});

describe("Mệnh – Thân đặc biệt (spec menh_than_le_TVTH, menh_than_dong_cung_special, menh_than_phoi_hop)", () => {
  it("dữ liệu thật: Canh Tý 1960 tháng 10 ngày 1 giờ Sửu, Địa Không ở Mệnh Tuất, Địa Kiếp ở Thân Tý → Mệnh Không Thân Kiếp", () => {
    const profile = natalProfile(chartOf(1960, 10, 1, "Sửu", "nam"));
    expect(findingOf(profile, "menh_khong_than_kiep")?.certainty).toBe("interpretive");
  });

  it("nữ Mệnh tứ mộ / Dậu / Tý Ngọ có lời TVTH; nam tuổi Ngọ Mùi Mệnh Tý Sửu bất toại", () => {
    expect(findingOf(natalProfile(chartOf(1951, 11, 13, "Dần", "nữ")), "nu_menh_branch")?.summary).toBe("TVTH: khôn ngoan.");
    expect(findingOf(natalProfile(chartOf(1990, 9, 11, "Sửu", "nữ")), "nu_menh_branch")?.summary).toBe("TVTH: ra ngoài nhiều người mến.");
    const tyLife = natalProfile(chartOf(1979, 1, 7, hourForLifeInFirstMonth("Tý"), "nam"));
    expect(findingOf(tyLife, "nam_ngo_mui_menh_ty_suu")?.certainty).toBe("exact");
  });

  it("Thân Mệnh đồng cung Tý/Ngọ VCD không Hóa Lộc → 'nghèo mà thọ'", () => {
    const chart = Array.from({ length: 29 }, (_, i) => chartOf(1974, 5, i + 1, "Tý", "nam")).find((c) => c.palaces[c.parameters.lifePalace]!.stars.every((s) => s.group !== "chính tinh"))!;
    const item = findingOf(natalProfile(chart), "menh_than_dong_cung_ty_ngo_vcd")!;
    expect(item.summary).toContain("nghèo mà thọ");
  });

  it("Lã Thái Hậu Thân cư Quan Lộc: bảng phối hợp MLTC áp dụng nhưng cần người luận tự xét tốt xấu (02_Ban-menh/01_Menh-va-Than/01_Y-nghia-Menh-va-Than.md)", () => {
    const item = findingOf(natalProfile(chartOf(1974, 3, 7, "Dần", "nữ")), "menh_than_phoi_hop")!;
    expect(item.summary).toContain("phú quý vẹn toàn");
    expect(item.missing.length).toBe(1);
  });
});

describe("Mệnh nhị hợp, lục hại, ám hợp (spec nhi_hop_luc_hai_luc_xung, am_hop_loc)", () => {
  it.each(LIFE_PARTNER_ROLES.flatMap((row) => row.lifeBranches.map((life) => [life, row.sixCombination, row.sixHarm] as const)))(
    "Mệnh %s: nhị hợp %s, lục hại %s (bảng menh_role_table khớp lá số)",
    (life, combo, harm) => {
      const profile = natalProfile(chartOf(1974, 1, 7, hourForLifeInFirstMonth(life), "nam"));
      expect(findingOf(profile, "menh_nhi_hop")?.name).toBe(`Mệnh nhị hợp ${combo}`);
      expect(findingOf(profile, "menh_luc_hai")?.name).toBe(`Mệnh lục hại ${harm}`);
    },
  );

  it("NP1 Menh tr.1–7: Mệnh Tý nhị hợp Phụ Mẫu Sửu, lục hại Tật Ách Mùi (08_Quan-he-giua-cac-cung/06_Nhi-hop-luc-xung-va-am-hop.md)", () => {
    const profile = natalProfile(chartOf(1974, 1, 7, hourForLifeInFirstMonth("Tý"), "nam"));
    expect(findingOf(profile, "menh_nhi_hop")?.summary).toContain("Phụ Mẫu (Sửu)");
    expect(findingOf(profile, "menh_luc_hai")?.summary).toContain("Tật Ách (Mùi)");
    expect(findingOf(profile, "menh_luc_hai")?.summary).toContain("Tật Ách nhị hợp Mệnh");
  });

  it("dữ liệu thật: Canh Tý 1960 tháng 1 ngày 14 giờ Ngọ → Minh Lộc ám Lộc; ngày 26 giờ Dậu → Khoa minh Lộc ám", () => {
    expect(findingOf(natalProfile(chartOf(1960, 1, 14, "Ngọ", "nam")), "minh_loc_am_loc")?.summary).toContain("Tử Tức (Tỵ)");
    expect(findingOf(natalProfile(chartOf(1960, 1, 26, "Dậu", "nam")), "khoa_minh_loc_am")?.summary).toContain("Điền Trạch (Thân)");
  });
});

describe("ngũ hành cung – sao – bản mệnh (spec ngu_hanh_cung_sao_ban_menh)", () => {
  it("Lã Thái Hậu: cung Mộc sinh Liêm Trinh Hỏa nhưng Hỏa không sinh Thủy; Liêm miếu → 'nhân' (02_Ban-menh/02_Ngu-hanh-ban-menh/02_Hanh-cung-Menh-voi-ban-menh.md)", () => {
    const profile = natalProfile(chartOf(1974, 3, 7, "Dần", "nữ"));
    expect(ids(profile)).not.toContain("ngu_hanh_chuoi_tot");
    expect(ids(profile)).not.toContain("np2_dia_loi");
    expect(findingOf(profile, "np2_nhan")?.certainty).toBe("exact");
    expect(findingOf(profile, "ngu_hanh_sang_khong_hop")?.certainty).toBe("interpretive");
  });

  it("Kỷ Mùi Mệnh Thìn có Thiên Lương: TVTH (Thổ) cho 'kém tốt bớt', NP2 (Mộc) cho 'thiên thời'; các luật dựa trên hành đều interpretive vì hành có dị bản (riêng 'nhân' chỉ dựa trên độ sáng)", () => {
    const chart = chartOf(1979, 5, 12, "Dần", "nam");
    const names = (profile: NatalProfile) => profile.findings.filter((item) => item.name.includes("Thiên Lương") && item.id !== "np2_nhan");
    const tvth = names(natalProfile(chart));
    const np2 = names(natalProfile(chart, { ...DEFAULT_ANALYSIS_OPTIONS, thienLuongElement: "NP2" }));
    expect(tvth.map((item) => item.id)).toContain("ngu_hanh_kem_tot_bot");
    expect(tvth.map((item) => item.id)).not.toContain("np2_thien_thoi");
    expect(np2.map((item) => item.id)).toContain("np2_thien_thoi");
    expect([...tvth, ...np2].every((item) => item.certainty === "interpretive")).toBe(true);
  });
});

describe("render", () => {
  it("Lã Thái Hậu: markdown tiếng Việt có đủ mục chính", () => {
    const text = renderNatalProfile(natalProfile(chartOf(1974, 3, 7, "Dần", "nữ")));
    expect(text).toContain("## Hồ sơ bản mệnh · Giáp Dần · Dương Nữ");
    expect(text).toContain("Thân cư Quan Lộc (Ngọ)");
    expect(text).toContain("Chủ Mệnh: Lộc Tồn ở Mệnh (Dần)");
    expect(text).toContain("Âm dương (Phúc âm Phúc dương): chưa xác định");
    expect(text).toContain("Tuần Tý Sửu · Triệt Thân Dậu");
    expect(text).toContain("### Nhận định");
  });
});
