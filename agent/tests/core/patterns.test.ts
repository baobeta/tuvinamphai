import { describe, expect, it } from "vitest";
import { BRANCHES, parseBranch, type BranchName } from "../../src/core/calendar/stem-branch.js";
import { buildChart } from "../../src/core/chart/build-chart.js";
import type { Chart } from "../../src/core/chart/types.js";
import type { Certainty } from "../../src/core/analysis/finding.js";
import {
  DEFAULT_PATTERN_OPTIONS,
  PATTERN_CATALOG,
  UNSUPPORTED_PATTERNS,
  detectPatterns,
  evaluatePattern,
  renderPatterns,
} from "../../src/core/patterns/index.js";
import type { Result } from "../../src/core/result.js";

type Birth = readonly [number, number, number, BranchName, "nam" | "nữ"];

const unwrap = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const chartOf = ([year, month, day, hour, gender]: Birth): Chart =>
  unwrap(
    buildChart({ calendar: "lunar", date: { year, month, day, isLeapMonth: false }, hourBranch: unwrap(parseBranch(hour)), gender }),
  );

const detectedIds = (birth: Birth): readonly string[] => detectPatterns(chartOf(birth)).map((item) => item.id);

const DETECTED: ReadonlyArray<readonly [string, Birth, Certainty]> = [
  ["quan-than-khanh-hoi", [1984,1,1,"Sửu","nam"], "interpretive"],
  ["tu-phu-dong-cung", [2028,1,2,"Tý","nam"], "interpretive"],
  ["phu-tuong-trieu-vien", [1994,1,7,"Tý","nam"], "exact"],
  ["phu-tuong-trieu-vien", [1988,1,1,"Sửu","nam"], "interpretive"],
  ["nhat-nguyet-tinh-minh", [1993,7,6,"Thìn","nam"], "exact"],
  ["nhat-nguyet-tinh-minh", [1985,1,6,"Thìn","nam"], "interpretive"],
  ["nhat-nguyet-chieu-bich", [1986,1,2,"Mùi","nam"], "exact"],
  ["nhat-nguyet-chieu-bich", [1986,1,1,"Thìn","nam"], "interpretive"],
  ["thach-trung-an-ngoc", [2007,1,1,"Thân","nam"], "interpretive"],
  ["ma-dau-doi-kiem", [1986,1,5,"Thân","nam"], "exact"],
  ["ma-dau-doi-kiem", [1988,1,1,"Thân","nam"], "interpretive"],
  ["tham-vu-dong-hanh", [2001,12,1,"Ngọ","nam"], "exact"],
  ["tham-vu-dong-hanh", [1984,1,1,"Tỵ","nam"], "interpretive"],
  ["cu-co-mao-dau", [1986,1,1,"Hợi","nam"], "exact"],
  ["cu-co-mao-dau", [1991,1,1,"Hợi","nam"], "interpretive"],
  ["loc-ma-giao-tri", [1984,1,1,"Tý","nam"], "interpretive"],
  ["tham-hoa-tham-linh", [1991,7,1,"Sửu","nam"], "exact"],
  ["tham-hoa-tham-linh", [1991,1,1,"Tý","nam"], "interpretive"],
  ["sat-pha-liem-tham", [1986,1,1,"Tý","nam"], "interpretive"],
  ["co-nguyet-dong-luong", [1990,1,1,"Dần","nam"], "exact"],
  ["co-nguyet-dong-luong", [1987,1,1,"Tý","nam"], "interpretive"],
  ["cu-nhat-dong-cung", [1994,1,1,"Ngọ","nam"], "exact"],
  ["cu-nhat-dong-cung", [1984,1,1,"Ngọ","nam"], "interpretive"],
  ["that-sat-trieu-dau", [1990,1,1,"Thân","nam"], "exact"],
  ["that-sat-trieu-dau", [1985,1,1,"Thân","nam"], "interpretive"],
  ["tam-hoa-lien-chau", [1986,1,1,"Sửu","nam"], "exact"],
  ["tam-hoa-lien-chau", [1987,1,1,"Tý","nam"], "interpretive"],
  ["van-que-van-hoa", [1998,9,1,"Mão","nam"], "exact"],
  ["van-que-van-hoa", [1984,3,1,"Mão","nam"], "interpretive"],
  ["minh-loc-am-loc", [1985,5,2,"Mão","nam"], "exact"],
  ["minh-loc-am-loc", [1986,1,1,"Dậu","nam"], "interpretive"],
  ["tu-linh", [2010,1,1,"Tý","nam"], "interpretive"],
  ["ho-ham-kiem", [1984,6,1,"Tỵ","nam"], "interpretive"],
  ["chung-thuy-trieu-dong", [1987,1,1,"Tỵ","nam"], "interpretive"],
  ["tuyet-xu-phung-sinh", [1986,1,1,"Mão","nam"], "interpretive"],
  ["kim-du-phu-gia", [2000,1,1,"Tý","nam"], "interpretive"],
  ["nguyet-lang-thien-mon", [1989,8,2,"Tuất","nam"], "exact"],
  ["nguyet-lang-thien-mon", [1985,1,1,"Mão","nam"], "interpretive"],
  ["nhat-le-trung-thien", [1988,1,1,"Thân","nam"], "exact"],
  ["nhat-le-trung-thien", [1988,2,1,"Dậu","nam"], "interpretive"],
  ["phu-bat-cung-de", [1994,1,1,"Tuất","nam"], "exact"],
  ["phu-bat-cung-de", [1987,1,1,"Dần","nam"], "interpretive"],
  ["ta-huu-dong-cung", [1984,4,1,"Dần","nam"], "interpretive"],
  ["thien-at-quy-nhan", [1991,1,1,"Tý","nam"], "interpretive"],
  ["nhat-chieu-loi-mon", [1986,1,7,"Hợi","nam"], "exact"],
  ["nhat-chieu-loi-mon", [1985,1,1,"Hợi","nam"], "interpretive"],
  ["minh-chau-xuat-hai", [1984,1,1,"Mùi","nam"], "interpretive"],
  ["song-loc", [1987,1,1,"Tý","nam"], "exact"],
  ["song-loc", [1991,3,1,"Sửu","nam"], "interpretive"],
  ["tien-cai-hau-ma", [1985,1,1,"Dần","nam"], "interpretive"],
  ["sinh-bat-phung-thoi", [2035,1,1,"Sửu","nam"], "interpretive"],
  ["that-sinh-co-ban", [1987,1,1,"Hợi","nam"], "exact"],
  ["that-sinh-co-ban", [1987,1,1,"Ngọ","nam"], "interpretive"],
  ["quan-tu-tai-da", [1986,4,1,"Tỵ","nữ"], "interpretive"],
  ["loc-phung-luong-sat", [1986,10,1,"Ngọ","nam"], "exact"],
  ["loc-phung-luong-sat", [2025,2,1,"Tý","nam"], "interpretive"],
  ["luong-trung-hoa-cai", [1986,10,1,"Ngọ","nam"], "exact"],
  ["luong-trung-hoa-cai", [1986,10,1,"Tý","nam"], "interpretive"],
  ["ma-lac-khong-vong", [1992,1,1,"Tý","nam"], "exact"],
  ["ma-lac-khong-vong", [1985,1,1,"Mão","nam"], "interpretive"],
  ["tai-du-tu-cuu", [1985,1,1,"Tý","nam"], "interpretive"],
  ["nhat-nguyet-tang-hung", [1987,1,1,"Sửu","nam"], "interpretive"],
  ["khong-kiep-sat-hoi", [1985,2,1,"Sửu","nam"], "interpretive"],
  ["cu-phung-tu-sat", [1996,1,1,"Sửu","nam"], "interpretive"],
  ["ky-am-dong-menh-than-tat-ach", [1987,1,1,"Sửu","nam"], "interpretive"],
  ["sat-cu-tuyet-dia", [1984,1,3,"Mão","nam"], "interpretive"],
  ["linh-xuong-da-vu", [1991,1,2,"Tuất","nam"], "interpretive"],
  ["duong-da-giap-ky", [1987,1,1,"Thân","nam"], "exact"],
  ["duong-da-giap-ky", [1989,1,1,"Thân","nam"], "interpretive"],
  ["hinh-tu-giap-an", [1986,1,4,"Thân","nam"], "interpretive"],
  ["sat-cung-liem-trinh", [1985,1,1,"Sửu","nam"], "exact"],
  ["sat-cung-liem-trinh", [1986,6,2,"Sửu","nam"], "interpretive"],
  ["lo-thuong-mai-thi", [1985,1,1,"Sửu","nữ"], "interpretive"],
  ["nguyet-luong-lac-ham", [1986,1,1,"Tuất","nam"], "interpretive"],
  ["vo-dao-chi-quan", [1984,2,1,"Dần","nam"], "interpretive"],
  ["de-ngo-hung-do", [1984,1,1,"Sửu","nam"], "interpretive"],
  ["van-tinh-ngo-giap", [1990,9,1,"Tỵ","nam"], "interpretive"],
  ["van-tinh-that-vi", [1984,3,1,"Ngọ","nam"], "interpretive"],
  ["tham-xuong-tham-khuc", [1987,5,1,"Sửu","nam"], "exact"],
  ["tham-xuong-tham-khuc", [1984,1,1,"Sửu","nam"], "interpretive"],
  ["kinh-duong-doc-thu-ham", [1992,1,1,"Dần","nam"], "exact"],
  ["kinh-duong-doc-thu-ham", [1988,1,1,"Thân","nam"], "interpretive"],
  ["loc-phung-xung-pha", [1984,1,1,"Tý","nam"], "interpretive"],
];
const NEARMISS: Readonly<Record<string, Birth>> = {
  "quan-than-khanh-hoi": [1984,1,1,"Tý","nam"],
  "tu-phu-dong-cung": [1984,1,1,"Tý","nam"],
  "phu-tuong-trieu-vien": [1985,1,1,"Tý","nam"],
  "nhat-nguyet-tinh-minh": [1985,1,6,"Tý","nam"],
  "nhat-nguyet-chieu-bich": [1986,1,1,"Tý","nam"],
  "thach-trung-an-ngoc": [1991,1,1,"Sửu","nam"],
  "ma-dau-doi-kiem": [1992,1,1,"Dần","nam"],
  "tham-vu-dong-hanh": [1988,1,1,"Sửu","nam"],
  "cu-co-mao-dau": [1988,1,1,"Tỵ","nam"],
  "loc-ma-giao-tri": [1986,1,1,"Tý","nam"],
  "tham-hoa-tham-linh": [1984,1,1,"Tý","nam"],
  "sat-pha-liem-tham": [1988,1,1,"Sửu","nam"],
  "co-nguyet-dong-luong": [1984,1,1,"Tý","nam"],
  "cu-nhat-dong-cung": [1987,1,1,"Tý","nam"],
  "that-sat-trieu-dau": [1984,1,1,"Tý","nam"],
  "tam-hoa-lien-chau": [1985,1,1,"Tý","nam"],
  "minh-loc-am-loc": [1984,1,1,"Tý","nam"],
  "tu-linh": [1985,1,1,"Tý","nam"],
  "ho-ham-kiem": [1984,1,1,"Tý","nam"],
  "chung-thuy-trieu-dong": [1986,1,1,"Tý","nam"],
  "tuyet-xu-phung-sinh": [1984,1,1,"Tý","nam"],
  "kim-du-phu-gia": [1985,1,1,"Tý","nam"],
  "nguyet-lang-thien-mon": [1987,1,1,"Sửu","nam"],
  "nhat-le-trung-thien": [1987,1,1,"Sửu","nam"],
  "phu-bat-cung-de": [1985,1,1,"Tý","nam"],
  "ta-huu-dong-cung": [1984,1,1,"Dần","nam"],
  "thien-at-quy-nhan": [1985,1,1,"Tý","nam"],
  "nhat-chieu-loi-mon": [1987,1,1,"Sửu","nam"],
  "minh-chau-xuat-hai": [1987,1,1,"Tý","nam"],
  "song-loc": [1984,1,1,"Tý","nam"],
  "sinh-bat-phung-thoi": [1987,1,1,"Tý","nam"],
  "that-sinh-co-ban": [1984,1,1,"Tý","nam"],
  "quan-tu-tai-da": [1986,2,1,"Sửu","nam"],
  "loc-phung-luong-sat": [1985,2,1,"Tý","nam"],
  "luong-trung-hoa-cai": [1986,2,1,"Dần","nam"],
  "ma-lac-khong-vong": [1984,1,1,"Tý","nam"],
  "tai-du-tu-cuu": [1984,1,1,"Tý","nam"],
  "nhat-nguyet-tang-hung": [1984,1,1,"Tý","nam"],
  "khong-kiep-sat-hoi": [1984,1,1,"Tý","nam"],
  "cu-phung-tu-sat": [1984,1,1,"Tý","nam"],
  "ky-am-dong-menh-than-tat-ach": [1987,1,1,"Tý","nam"],
  "sat-cu-tuyet-dia": [1991,1,1,"Tý","nam"],
  "linh-xuong-da-vu": [1985,1,1,"Thìn","nam"],
  "duong-da-giap-ky": [1984,1,1,"Tý","nam"],
  "hinh-tu-giap-an": [1987,1,2,"Thân","nam"],
  "sat-cung-liem-trinh": [1985,1,1,"Tỵ","nam"],
  "lo-thuong-mai-thi": [1985,1,1,"Sửu","nam"],
  "nguyet-luong-lac-ham": [1987,1,1,"Sửu","nam"],
  "vo-dao-chi-quan": [1984,1,1,"Sửu","nam"],
  "de-ngo-hung-do": [1984,1,1,"Tý","nam"],
  "van-tinh-ngo-giap": [1989,1,1,"Tỵ","nam"],
  "van-tinh-that-vi": [1984,1,1,"Tý","nam"],
  "tham-xuong-tham-khuc": [1986,2,1,"Thân","nam"],
  "kinh-duong-doc-thu-ham": [1993,1,1,"Sửu","nam"],
  "loc-phung-xung-pha": [1986,1,1,"Tý","nam"],
};
const BROKEN: Readonly<Record<string, Birth>> = {
  "quan-than-khanh-hoi": [1984,1,1,"Sửu","nam"],
  "tu-phu-dong-cung": [2028,1,2,"Tý","nam"],
  "phu-tuong-trieu-vien": [1988,1,1,"Sửu","nam"],
  "nhat-nguyet-tinh-minh": [1985,1,6,"Thìn","nam"],
  "nhat-nguyet-chieu-bich": [1986,1,1,"Thìn","nam"],
  "thach-trung-an-ngoc": [2007,1,1,"Thân","nam"],
  "ma-dau-doi-kiem": [1988,1,1,"Thân","nam"],
  "tham-vu-dong-hanh": [1989,1,1,"Tỵ","nam"],
  "cu-co-mao-dau": [1991,1,1,"Hợi","nam"],
  "loc-ma-giao-tri": [1985,2,1,"Tý","nam"],
  "tham-hoa-tham-linh": [1991,1,1,"Tý","nam"],
  "sat-pha-liem-tham": [1986,1,1,"Tý","nam"],
  "co-nguyet-dong-luong": [1987,1,1,"Tý","nam"],
  "cu-nhat-dong-cung": [1984,1,1,"Ngọ","nam"],
  "that-sat-trieu-dau": [1985,1,1,"Thân","nam"],
  "tam-hoa-lien-chau": [1987,1,1,"Tý","nam"],
  "van-que-van-hoa": [1984,3,1,"Mão","nam"],
  "minh-loc-am-loc": [1986,1,1,"Dậu","nam"],
  "tu-linh": [1985,1,1,"Sửu","nữ"],
  "ho-ham-kiem": [1987,6,1,"Tỵ","nam"],
  "chung-thuy-trieu-dong": [1992,1,1,"Hợi","nam"],
  "tuyet-xu-phung-sinh": [1986,1,1,"Mão","nam"],
  "kim-du-phu-gia": [2000,1,1,"Tý","nam"],
  "nguyet-lang-thien-mon": [1985,1,1,"Mão","nam"],
  "nhat-le-trung-thien": [1988,2,1,"Dậu","nam"],
  "phu-bat-cung-de": [1987,1,1,"Dần","nam"],
  "ta-huu-dong-cung": [1984,4,1,"Dần","nam"],
  "thien-at-quy-nhan": [1991,1,1,"Tý","nam"],
  "nhat-chieu-loi-mon": [1985,1,1,"Hợi","nam"],
  "minh-chau-xuat-hai": [1984,1,1,"Mùi","nam"],
  "song-loc": [1991,1,1,"Sửu","nam"],
  "tien-cai-hau-ma": [1985,1,1,"Dần","nam"],
  "sinh-bat-phung-thoi": [1986,10,1,"Ngọ","nam"],
  "that-sinh-co-ban": [1987,1,1,"Ngọ","nam"],
  "loc-phung-luong-sat": [2025,2,1,"Tý","nam"],
  "luong-trung-hoa-cai": [1986,10,1,"Tý","nam"],
  "ma-lac-khong-vong": [1985,1,1,"Mão","nam"],
  "tai-du-tu-cuu": [1985,1,1,"Tý","nam"],
  "nhat-nguyet-tang-hung": [1987,1,1,"Sửu","nam"],
  "khong-kiep-sat-hoi": [1987,2,1,"Sửu","nam"],
  "cu-phung-tu-sat": [1996,1,1,"Sửu","nam"],
  "ky-am-dong-menh-than-tat-ach": [1987,1,1,"Sửu","nam"],
  "sat-cu-tuyet-dia": [1984,1,3,"Mão","nam"],
  "linh-xuong-da-vu": [1991,1,2,"Tuất","nam"],
  "duong-da-giap-ky": [1989,1,1,"Thân","nam"],
  "hinh-tu-giap-an": [1986,1,4,"Thân","nam"],
  "sat-cung-liem-trinh": [1985,1,1,"Sửu","nam"],
  "lo-thuong-mai-thi": [1990,12,6,"Ngọ","nam"],
  "nguyet-luong-lac-ham": [1986,1,1,"Tuất","nam"],
  "vo-dao-chi-quan": [1984,2,1,"Dần","nam"],
  "de-ngo-hung-do": [1984,1,1,"Sửu","nam"],
  "van-tinh-ngo-giap": [1991,11,14,"Tỵ","nam"],
  "van-tinh-that-vi": [1992,3,1,"Ngọ","nam"],
  "tham-xuong-tham-khuc": [1984,1,1,"Sửu","nam"],
  "kinh-duong-doc-thu-ham": [2042,1,1,"Dần","nam"],
  "loc-phung-xung-pha": [1992,1,1,"Mão","nam"],
};


const COMMON_PATTERNS = [
  "tu-phu-dong-cung",
  "tham-vu-dong-hanh",
  "cu-co-mao-dau",
  "loc-ma-giao-tri",
  "co-nguyet-dong-luong",
  "cu-nhat-dong-cung",
  "that-sat-trieu-dau",
  "tam-hoa-lien-chau",
  "song-loc",
  "thien-at-quy-nhan",
  "ta-huu-dong-cung",
  "phu-bat-cung-de",
] as const;

describe("danh mục cách cục", () => {
  it("có đủ 32 cách tốt và 26 cách xấu, mã không trùng", () => {
    expect(PATTERN_CATALOG.filter((rule) => rule.polarity === "tốt")).toHaveLength(32);
    expect(PATTERN_CATALOG.filter((rule) => rule.polarity === "xấu")).toHaveLength(26);
    expect(new Set(PATTERN_CATALOG.map((rule) => rule.id)).size).toBe(PATTERN_CATALOG.length);
  });

  it("cách chưa hỗ trợ có trong danh mục, evaluate trả null và evaluatePattern báo lý do", () => {
    const chart = chartOf([1984, 1, 1, "Tý", "nam"]);
    for (const item of UNSUPPORTED_PATTERNS) {
      const rule = PATTERN_CATALOG.find((candidate) => candidate.id === item.id)!;
      expect(rule.evaluate(chart, DEFAULT_PATTERN_OPTIONS)).toBeNull();
      const result = evaluatePattern(chart, item.id);
      expect(result.ok).toBe(false);
    }
  });

  it("mọi cách được hỗ trợ đều có lá số khớp trong bảng kiểm thử", () => {
    const supported = PATTERN_CATALOG.map((rule) => rule.id).filter((id) => !UNSUPPORTED_PATTERNS.some((item) => item.id === id));
    expect(new Set(DETECTED.map(([id]) => id))).toEqual(new Set(supported));
  });

  it("evaluatePattern báo lỗi với mã không có", () => {
    expect(evaluatePattern(chartOf([1984, 1, 1, "Tý", "nam"]), "khong-co").ok).toBe(false);
  });
});

describe("phát hiện từng cách trên lá số dựng từ ngày sinh âm lịch", () => {
  it.each(DETECTED)("%s khớp với %j (%s)", (id, birth, certainty) => {
    const found = detectPatterns(chartOf(birth)).find((item) => item.id === id);
    expect(found).toBeDefined();
    expect(found!.certainty).toBe(certainty);
    if (certainty === "interpretive") expect(found!.assumptions.length).toBeGreaterThan(0);
    else expect(found!.assumptions).toEqual([]);
  });
});

describe("near-miss và phá cách của các cách thường gặp", () => {
  it.each(COMMON_PATTERNS)("%s: lá số thiếu đúng một điều kiện không được nhận", (id) => {
    const birth = NEARMISS[id]!;
    expect(detectedIds(birth)).not.toContain(id);
    const evaluation = unwrap(evaluatePattern(chartOf(birth), id));
    expect(evaluation.matched).toBe(false);
    expect(evaluation.finding.missing).toHaveLength(1);
    expect(evaluation.finding.summary).toContain("Không thành cách");
  });

  it.each(COMMON_PATTERNS)("%s: lá số có phá cách vẫn nhận cách và liệt kê breakers", (id) => {
    const found = detectPatterns(chartOf(BROKEN[id]!)).find((item) => item.id === id);
    expect(found).toBeDefined();
    expect(found!.breakers.length).toBeGreaterThan(0);
    expect(found!.summary).toMatch(/phá cách|giảm/);
  });
});

describe("lá số mẫu trong kho tri thức (13_La-so-mau)", () => {
  it("Khổng Tử Canh Tuất, tháng 11 ngày 1 giờ Tý (TVTH, 02_TVTH-Khong-Tu): Cơ Nguyệt Đồng Lương", () => {
    const found = detectPatterns(chartOf([1970, 11, 1, "Tý", "nam"])).find((item) => item.id === "co-nguyet-dong-luong");
    expect(found?.certainty).toBe("exact");
  });

  it("Hạng Võ Đinh Mão, tháng 8 ngày 12 giờ Mão (TVTH, 03_TVTH-Hang-Vo): Cơ Nguyệt Đồng Lương và Tam Hóa triều", () => {
    expect(detectedIds([1987, 8, 12, "Mão", "nam"])).toEqual(expect.arrayContaining(["co-nguyet-dong-luong", "tam-hoa-lien-chau"]));
  });

  it("Lã Thái Hậu Giáp Dần, tháng 3 ngày 7 giờ Dần (TVTH tr.159, 01_TVTH-La-Thai-Hau): Song Lộc, Tứ Linh", () => {
    expect(detectedIds([1974, 3, 7, "Dần", "nữ"])).toEqual(expect.arrayContaining(["song-loc", "tu-linh"]));
  });

  it("Nữ VCD Canh Ngọ, tháng 9 ngày 11 giờ Sửu (TVTH, 05_TVTH-Nu-VCD-Canh-Ngo): Tiền Cái hậu Mã", () => {
    expect(detectedIds([1990, 9, 11, "Sửu", "nữ"])).toContain("tien-cai-hau-ma");
  });

  it("Âm Nam Kỷ Sửu, tháng Giêng ngày 26 giờ Ngọ (TVTH, 07_TVTH-Am-Nam-Ky-Suu): Sát Phá Liêm Tham", () => {
    expect(detectedIds([2009, 1, 26, "Ngọ", "nam"])).toContain("sat-pha-liem-tham");
  });

  it("Nga mi tác án Tân Mão, tháng 11 ngày 13 giờ Dần (TVTH tr.175, 09_TVTH-Nga-mi-tac-an-Tan-Mao): Tham Vũ, giáp song Lộc", () => {
    expect(detectedIds([2011, 11, 13, "Dần", "nữ"])).toEqual(expect.arrayContaining(["tham-vu-dong-hanh", "song-loc"]));
  });

  it("Âm Nam Quý Tỵ, tháng 11 ngày 4 giờ Thân (TVTH, 10_TVTH-Am-Nam-Qui-Ty): Cơ Nguyệt Đồng Lương", () => {
    expect(detectedIds([2013, 11, 4, "Thân", "nam"])).toContain("co-nguyet-dong-luong");
  });

  it("Nữ Cự Đồng Mậu Tuất, tháng 2 ngày 23 giờ Dần (TVTH, 13_TVTH-Nu-nhan-Cu-Dong-Mau-Tuat): Tọa quý hướng quý", () => {
    expect(detectedIds([2018, 2, 23, "Dần", "nữ"])).toContain("thien-at-quy-nhan");
  });

  it("Nam Kỷ Hợi, tháng 7 ngày 28 giờ Tý (TVTH, 14_TVTH-Nam-Ky-Hoi): Tử Phủ đồng cung", () => {
    expect(detectedIds([2019, 7, 28, "Tý", "nam"])).toContain("tu-phu-dong-cung");
  });

  it("Lưỡng Đế Giáp Thìn, tháng 5 ngày 9 giờ Dậu (TVTH tr.184, 15_TVTH-Nam-nhan-Luong-De-Giap-Thin): Sát Phá Liêm Tham, Tam Hóa", () => {
    expect(detectedIds([2024, 5, 9, "Dậu", "nam"])).toEqual(expect.arrayContaining(["sat-pha-liem-tham", "tam-hoa-lien-chau"]));
  });
});

describe("tùy chọn và trình bày", () => {
  it("chọn sách MLTC thì báo biến thể MLTC, các sách khác nằm trong variants", () => {
    const chart = chartOf([2019, 7, 28, "Tý", "nam"]);
    const evaluation = unwrap(evaluatePattern(chart, "tu-phu-dong-cung", { ...DEFAULT_PATTERN_OPTIONS, book: "MLTC" }));
    expect(evaluation.finding.summary).toContain("MLTC");
    expect(evaluation.finding.variants.some((text) => text.startsWith("TVTH"))).toBe(true);
  });

  it("evaluatePattern giải thích cả khi không khớp", () => {
    const evaluation = unwrap(evaluatePattern(chartOf(NEARMISS["song-loc"]!), "song-loc"));
    expect(evaluation.matched).toBe(false);
    expect(evaluation.finding.missing.length).toBeGreaterThan(0);
  });

  it("ngưỡng cát tinh là tùy chọn: nâng minLuckyCount thì cách MLTC giảm cách", () => {
    const chart = chartOf([2019, 7, 28, "Tý", "nam"]);
    const strict = unwrap(evaluatePattern(chart, "tu-phu-dong-cung", { ...DEFAULT_PATTERN_OPTIONS, book: "MLTC", minLuckyCount: 11 }));
    expect(strict.matched).toBe(true);
    expect(strict.finding.missing.some((text) => text.startsWith("giảm cách"))).toBe(true);
  });

  it("detectPatterns trả cách tốt trước cách xấu, renderPatterns ra markdown", () => {
    const findings = detectPatterns(chartOf([1987, 8, 12, "Mão", "nam"]));
    const firstBad = findings.findIndex((item) => item.polarity === "xấu");
    expect(findings.slice(firstBad).every((item) => item.polarity === "xấu")).toBe(true);
    const text = renderPatterns(findings);
    expect(text).toContain("### Cách tốt");
    expect(text).toContain("### Cách xấu");
    expect(text).toContain("**Cơ Nguyệt Đồng Lương**");
    expect(renderPatterns([])).toContain("Không phát hiện");
  });

  it("không làm thay đổi lá số đầu vào", () => {
    const chart = chartOf([1974, 3, 7, "Dần", "nữ"]);
    const snapshot = JSON.stringify(chart);
    detectPatterns(chart);
    expect(JSON.stringify(chart)).toBe(snapshot);
    expect(BRANCHES[chart.parameters.lifePalace]).toBe("Dần");
  });
});

const evaluationOf = (birth: Birth, id: string, options = DEFAULT_PATTERN_OPTIONS) => unwrap(evaluatePattern(chartOf(birth), id, options));

describe("hồi quy theo phản biện độc lập", () => {
  it("Tử Phủ đồng cung ở cung Thân: sát tinh trong tam phương cung Tử Phủ là phá cách, không còn exact [1985,6,13,Sửu]", () => {
    const { matched, finding } = evaluationOf([1985, 6, 13, "Sửu", "nam"], "tu-phu-dong-cung");
    expect(matched).toBe(true);
    expect(finding.certainty).toBe("interpretive");
    expect(finding.breakers.length).toBeGreaterThan(0);
  });

  it("Tử Phủ đồng cung: Hóa Kỵ trong tam phương cung Tử Phủ được liệt kê [1986,3,7,Tuất]", () => {
    const { finding } = evaluationOf([1986, 3, 7, "Tuất", "nam"], "tu-phu-dong-cung");
    expect(finding.breakers.some((text) => text.includes("Hóa Kỵ"))).toBe(true);
    expect(finding.summary).toContain("phá cách");
  });

  it("Phủ Tướng triều viên: khớp TVTH nhưng MLTC thiếu cát tinh thì ghi không hợp cách theo MLTC [1986,2,19,Sửu]", () => {
    const { matched, finding } = evaluationOf([1986, 2, 19, "Sửu", "nam"], "phu-tuong-trieu-vien");
    expect(matched).toBe(true);
    expect(finding.certainty).toBe("interpretive");
    expect(finding.missing.some((text) => text.startsWith("không hợp cách theo MLTC"))).toBe(true);
    expect(finding.assumptions.some((text) => text.startsWith("các sách khác nhau về kết luận"))).toBe(true);
  });

  it("Tham Vũ đồng hành: Vũ Khúc Hóa Kỵ đồng cung cũng là phá [1992,1,21,Mùi]", () => {
    const { finding } = evaluationOf([1992, 1, 21, "Mùi", "nam"], "tham-vu-dong-hanh");
    expect(finding.breakers.some((text) => text.startsWith("Hóa Kỵ đồng cung Tham Lang"))).toBe(true);
    expect(finding.certainty).toBe("interpretive");
  });

  it("Tham Vũ đồng hành: Đà La trong tam phương là phá cách theo nguyên tắc chung [1984,1,9,Sửu]", () => {
    const { finding } = evaluationOf([1984, 1, 9, "Sửu", "nam"], "tham-vu-dong-hanh");
    expect(finding.breakers.some((text) => text.startsWith("Đà La"))).toBe(true);
  });

  it("Tham Vũ đồng hành: Hóa Lộc ở tứ Mộ ghi mâu thuẫn TVTH/MLTC [1989,1,1,Tỵ]", () => {
    const { finding } = evaluationOf([1989, 1, 1, "Tỵ", "nam"], "tham-vu-dong-hanh");
    expect(finding.breakers.some((text) => text.includes("Hóa Lộc ở tứ Mộ"))).toBe(true);
    expect(finding.assumptions.some((text) => text.includes("sách mâu thuẫn"))).toBe(true);
  });

  it("Lộc Mã giao trì: Hóa Kỵ trong tam phương là phá (03/01) [1984,1,1,Tý]", () => {
    const { finding } = evaluationOf([1984, 1, 1, "Tý", "nam"], "loc-ma-giao-tri");
    expect(finding.breakers.some((text) => text.startsWith("Hóa Kỵ"))).toBe(true);
  });

  it("Lộc Mã giao trì nhất quán với Mã lạc không vong trên cùng lá số [1985,1,1,Mão]", () => {
    const birth: Birth = [1985, 1, 1, "Mão", "nam"];
    expect(detectedIds(birth)).toContain("ma-lac-khong-vong");
    expect(evaluationOf(birth, "loc-ma-giao-tri").finding.breakers.some((text) => text.startsWith("Mã lạc Không Vong"))).toBe(true);
  });

  it("Tả Hữu đồng cung TVTH: Địa Không trong tam phương được liệt kê, không exact [1985,4,13,Tuất]", () => {
    const { finding } = evaluationOf([1985, 4, 13, "Tuất", "nam"], "ta-huu-dong-cung");
    expect(finding.breakers.some((text) => text.startsWith("Địa Không"))).toBe(true);
    expect(finding.certainty).toBe("interpretive");
  });

  it("Thiên Ất quý nhân số 45: 'chiếu' ghi rõ cách hiểu (lá số mẫu Mậu Tuất)", () => {
    const { finding } = evaluationOf([2018, 2, 23, "Dần", "nữ"], "thien-at-quy-nhan");
    expect(finding.certainty).toBe("interpretive");
    expect(finding.assumptions.some((text) => text.startsWith("'chiếu'"))).toBe(true);
  });

  it("Nhật Nguyệt tịnh minh: Hóa Kỵ là phá cách kèm ghi chú mâu thuẫn TVTH tr.28–30 [1985,1,6,Thìn]", () => {
    const { finding } = evaluationOf([1985, 1, 6, "Thìn", "nam"], "nhat-nguyet-tinh-minh");
    expect(finding.breakers.some((text) => text.includes("Kị phá Nhật Nguyệt tịnh minh"))).toBe(true);
    expect(finding.assumptions.some((text) => text.includes("TVTH tr.28–30"))).toBe(true);
  });

  it("Nhật Nguyệt tịnh minh MLTC: tuổi ngoài Tân, Ất không hợp cách [1986,1,11,Sửu]", () => {
    const { matched, finding } = evaluationOf([1986, 1, 11, "Sửu", "nam"], "nhat-nguyet-tinh-minh", { ...DEFAULT_PATTERN_OPTIONS, book: "MLTC" });
    expect(matched).toBe(false);
    expect(finding.missing[0]).toMatch(/^tuổi Tân\/Ất/);
  });

  it("Mã đầu đới kiếm loại 2: Hỏa Linh, Tả Hữu chỉ tăng cách khi đồng cung Mệnh [1986,2,5,Dậu]", () => {
    const { finding } = evaluationOf([1986, 2, 5, "Dậu", "nam"], "ma-dau-doi-kiem");
    const boost = finding.satisfied.find((text) => text.startsWith("tăng cách: có một trong [Hỏa"));
    expect(boost).toContain("đồng cung Mệnh");
  });

  it("Sát Phá Liêm Tham: Kình Dương đắc địa ở Tuất không bị tính phá (TVTH tr.175, lá số Tân Mão)", () => {
    const { finding } = evaluationOf([2011, 11, 13, "Dần", "nữ"], "sat-pha-liem-tham");
    expect(finding.breakers.some((text) => text.startsWith("Kình Dương"))).toBe(false);
    expect(finding.breakers.some((text) => text.startsWith("Tiểu Hao") || text.startsWith("Đại Hao"))).toBe(false);
  });

  it("Song Lộc giáp Mệnh Tân Mão: Địa Không riêng lẻ không phải Lộc phùng xung phá (TVTH tr.175 'đắc cách nhất')", () => {
    const { finding } = evaluationOf([2011, 11, 13, "Dần", "nữ"], "song-loc");
    expect(finding.breakers.some((text) => text.includes("Địa Không"))).toBe(false);
  });

  it("Lộc Mã giao trì lá số Lã Thái Hậu (TVTH tr.159, 'Song Lộc ngộ Mã'): Thái Tuế gốc và Triệt ở Thiên Di không phá", () => {
    const { matched, finding } = evaluationOf([1974, 3, 7, "Dần", "nữ"], "loc-ma-giao-tri");
    expect(matched).toBe(true);
    expect(finding.breakers).toEqual([]);
    expect(finding.summary).toContain("Thành cách");
  });

  it("Tham Vũ đồng hành lá số Tân Mão (TVTH tr.175): Kình Dương đắc địa ở Tuất không bị tính phá", () => {
    const { matched, finding } = evaluationOf([2011, 11, 13, "Dần", "nữ"], "tham-vu-dong-hanh");
    expect(matched).toBe(true);
    expect(finding.breakers.some((text) => text.startsWith("Kình Dương"))).toBe(false);
  });

  it("Tuyệt xứ phùng sinh lá số Nam Kỷ Hợi (TVTH tr.182–183): Mệnh Mộc ở Thân tuyệt địa, được Tử Phủ, Khôi Việt cứu", () => {
    const { matched, finding } = evaluationOf([2019, 7, 28, "Tý", "nam"], "tuyet-xu-phung-sinh");
    expect(matched).toBe(true);
    expect(finding.certainty).toBe("interpretive");
    expect(finding.satisfied.some((text) => text.includes("Tử Vi/Thiên Phủ") || text.includes("Tam") || text.includes("sao ["))).toBe(true);
  });
});
