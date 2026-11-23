import type { Element } from "../calendar/five-elements.js";
import type { BranchName } from "../calendar/stem-branch.js";
import type { PalaceRole } from "../chart/palaces.js";

export const BODY_RESIDENCE_BY_HOUR: Readonly<Record<BranchName, PalaceRole>> = {
  Tý: "Mệnh",
  Ngọ: "Mệnh",
  Sửu: "Phúc Đức",
  Mùi: "Phúc Đức",
  Dần: "Quan Lộc",
  Thân: "Quan Lộc",
  Mão: "Thiên Di",
  Dậu: "Thiên Di",
  Thìn: "Tài Bạch",
  Tuất: "Tài Bạch",
  Tỵ: "Phu Thê",
  Hợi: "Phu Thê",
};

export const LIFE_LORD_BY_LIFE_BRANCH: Readonly<Record<BranchName, string>> = {
  Tý: "Tham Lang",
  Sửu: "Cự Môn",
  Dần: "Lộc Tồn",
  Mão: "Văn Khúc",
  Thìn: "Liêm Trinh",
  Tỵ: "Vũ Khúc",
  Ngọ: "Phá Quân",
  Mùi: "Vũ Khúc",
  Thân: "Liêm Trinh",
  Dậu: "Văn Khúc",
  Tuất: "Lộc Tồn",
  Hợi: "Cự Môn",
};

export const BODY_LORD_BY_YEAR_BRANCH: Readonly<Record<BranchName, string>> = {
  Tý: "Hỏa Tinh",
  Sửu: "Thiên Tướng",
  Dần: "Thiên Lương",
  Mão: "Thiên Đồng",
  Thìn: "Văn Xương",
  Tỵ: "Thiên Cơ",
  Ngọ: "Hỏa Tinh",
  Mùi: "Thiên Tướng",
  Thân: "Thiên Lương",
  Dậu: "Thiên Đồng",
  Tuất: "Văn Xương",
  Hợi: "Thiên Cơ",
};

export const BUREAU_AVOIDED_BRANCHES: Readonly<Record<Element, readonly [BranchName, BranchName]>> = {
  Hỏa: ["Tuất", "Hợi"],
  Thủy: ["Thìn", "Tỵ"],
  Thổ: ["Thìn", "Tỵ"],
  Kim: ["Sửu", "Dần"],
  Mộc: ["Thân", "Dậu"],
};

export type LifeStageLabel = "Sinh địa" | "Vượng địa" | "Bại địa" | "Tuyệt địa";

export interface LifeStageRow {
  readonly sinh: BranchName;
  readonly vuong: BranchName;
  readonly bai: BranchName;
  readonly tuyet: BranchName | null;
}

export const LIFE_STAGES_TVTH: Readonly<Record<Element, LifeStageRow>> = {
  Kim: { sinh: "Tỵ", vuong: "Dậu", bai: "Ngọ", tuyet: "Dần" },
  Mộc: { sinh: "Hợi", vuong: "Mão", bai: "Tý", tuyet: "Thân" },
  Hỏa: { sinh: "Dần", vuong: "Ngọ", bai: "Mão", tuyet: "Hợi" },
  Thủy: { sinh: "Thân", vuong: "Tý", bai: "Dậu", tuyet: "Tỵ" },
  Thổ: { sinh: "Thân", vuong: "Tý", bai: "Dậu", tuyet: "Tỵ" },
};

export const EARTH_LIFE_STAGES_NP2: LifeStageRow = { sinh: "Tỵ", vuong: "Ngọ", bai: "Mão", tuyet: null };

export type Season = "Xuân" | "Hạ" | "Thu" | "Đông";

export const SEASON_OF_MONTH: Readonly<Record<number, Season>> = {
  1: "Xuân", 2: "Xuân", 3: "Xuân", 4: "Hạ", 5: "Hạ", 6: "Hạ",
  7: "Thu", 8: "Thu", 9: "Thu", 10: "Đông", 11: "Đông", 12: "Đông",
};

export type SeasonStrength = "Mệnh Vượng" | "Mệnh Tướng";

export const SEASON_STRENGTH: ReadonlyArray<{ readonly element: Element; readonly season: Season; readonly label: SeasonStrength }> = [
  { element: "Mộc", season: "Xuân", label: "Mệnh Vượng" },
  { element: "Hỏa", season: "Hạ", label: "Mệnh Vượng" },
  { element: "Kim", season: "Thu", label: "Mệnh Vượng" },
  { element: "Thủy", season: "Đông", label: "Mệnh Vượng" },
  { element: "Hỏa", season: "Xuân", label: "Mệnh Tướng" },
  { element: "Thổ", season: "Hạ", label: "Mệnh Tướng" },
  { element: "Thủy", season: "Thu", label: "Mệnh Tướng" },
  { element: "Mộc", season: "Đông", label: "Mệnh Tướng" },
];

export const FAVORABLE_HOURS_BY_SEASON: Readonly<Record<Season, readonly BranchName[]>> = {
  Xuân: ["Dậu", "Thìn", "Tỵ"],
  Hạ: ["Mão", "Mùi", "Hợi"],
  Thu: ["Ngọ", "Thân", "Dần"],
  Đông: ["Sửu", "Tuất", "Tý"],
};

export const YEAR_HOUR_CLASHES: ReadonlyArray<{ readonly years: readonly BranchName[]; readonly hours: readonly BranchName[]; readonly label: string }> = [
  { years: ["Dần", "Ngọ", "Tỵ", "Dậu"], hours: ["Thìn", "Tuất", "Sửu", "Mùi"], label: "tối độc" },
  { years: ["Dần", "Hợi", "Tý"], hours: ["Ngọ", "Thân", "Dậu", "Hợi"], label: "khắc cha (đến 16 tuổi mới khỏi lo mồ côi cha)" },
  { years: ["Thìn", "Tỵ", "Sửu", "Mùi"], hours: ["Tý", "Ngọ", "Mão", "Tỵ", "Hợi", "Thân", "Dậu"], label: "khắc mẹ" },
];

export const DAY_HOURS: readonly BranchName[] = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"];
export const NIGHT_HOURS: readonly BranchName[] = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"];

export const BIRTH_MONTH_MLTC: Readonly<Record<number, { readonly conception: string; readonly solarTerm: string }>> = {
  1: { conception: "tháng 4 năm trước", solarTerm: "Lập xuân" },
  2: { conception: "tháng 5 năm trước", solarTerm: "Kinh trập" },
  3: { conception: "tháng 6 năm trước", solarTerm: "Thanh minh" },
  4: { conception: "tháng 7 năm trước", solarTerm: "Lập hạ" },
  5: { conception: "tháng 8 năm trước", solarTerm: "Mang chủng" },
  6: { conception: "tháng 9 năm trước", solarTerm: "Tiểu thử" },
  7: { conception: "tháng 10 năm trước", solarTerm: "Lập thu" },
  8: { conception: "tháng 11 năm trước", solarTerm: "Bạch lộ" },
  9: { conception: "tháng 12 năm trước", solarTerm: "Hàn lộ" },
  10: { conception: "tháng 1 cùng năm", solarTerm: "Đông chí (như sách ghi)" },
  11: { conception: "tháng 2 cùng năm", solarTerm: "Đại tuyết" },
  12: { conception: "tháng 3 cùng năm", solarTerm: "Tiểu hàn" },
};

export interface ThaiTueGroup {
  readonly index: 0 | 1 | 2 | 3;
  readonly name: string;
  readonly stars: readonly [string, string, string];
  readonly offsets: readonly [number, number, number];
}

export const THAI_TUE_GROUPS: readonly [ThaiTueGroup, ThaiTueGroup, ThaiTueGroup, ThaiTueGroup] = [
  { index: 0, name: "Tuế – Hổ – Phù", stars: ["Thái Tuế", "Quan Phù", "Bạch Hổ"], offsets: [0, 4, 8] },
  { index: 1, name: "Thiếu Dương – Tử Phù – Phúc Đức (NP2: Đào – Không – Sát)", stars: ["Thiếu Dương", "Tử Phù", "Phúc Đức"], offsets: [1, 5, 9] },
  { index: 2, name: "Tang – Tuế – Điếu", stars: ["Tang Môn", "Tuế Phá", "Điếu Khách"], offsets: [2, 6, 10] },
  { index: 3, name: "Thiếu Âm – Long Đức – Trực Phù (Âm – Long – Trực)", stars: ["Thiếu Âm", "Long Đức", "Trực Phù"], offsets: [3, 7, 11] },
];

export const THAI_TUE_IN_LIFE_BY_ELEMENT: Readonly<Record<Element, string>> = {
  Thổ: "ôn hòa kín đáo, nghĩa hiệp; 'Người Mệnh Thìn Tuất Sửu Mùi không bao giờ sợ Tuế'",
  Kim: "'lưỡng Kim là đại cát', Kim Kim vượng phát",
  Thủy: "bình, kém; NP1: cư Hợi cát ít hung nhiều",
  Hỏa: "nóng nảy; NP1: cư Ngọ 'nguy hại nhất'",
  Mộc: "NP1: tàn suy nguy khốn",
};

export const TRIET_BY_STEM_PAIR: ReadonlyArray<{ readonly stems: readonly [string, string]; readonly branches: readonly [BranchName, BranchName] }> = [
  { stems: ["Giáp", "Kỷ"], branches: ["Thân", "Dậu"] },
  { stems: ["Ất", "Canh"], branches: ["Ngọ", "Mùi"] },
  { stems: ["Bính", "Tân"], branches: ["Thìn", "Tỵ"] },
  { stems: ["Đinh", "Nhâm"], branches: ["Dần", "Mão"] },
  { stems: ["Mậu", "Quý"], branches: ["Tý", "Sửu"] },
];

export const TUAN_BY_DECADE: Readonly<Record<string, readonly [BranchName, BranchName]>> = {
  "Giáp Tý": ["Tuất", "Hợi"],
  "Giáp Tuất": ["Thân", "Dậu"],
  "Giáp Thân": ["Ngọ", "Mùi"],
  "Giáp Ngọ": ["Thìn", "Tỵ"],
  "Giáp Thìn": ["Dần", "Mão"],
  "Giáp Dần": ["Tý", "Sửu"],
};

export interface VoidArchetype {
  readonly lifeBranches: readonly BranchName[];
  readonly match: "any" | "all";
  readonly opposite: readonly string[];
  readonly key: string;
  readonly note?: string;
  readonly extra?: string;
}

export const VOID_ARCHETYPES_MLTC: readonly VoidArchetype[] = [
  { lifeBranches: ["Tý", "Ngọ"], match: "any", opposite: ["Thiên Đồng", "Thái Âm"], key: "kiên cường, có tài nghệ" },
  {
    lifeBranches: ["Sửu", "Mùi"],
    match: "all",
    opposite: ["Thái Dương", "Thái Âm"],
    key: "Nhật nguyệt đồng lâm cách",
    extra: "không sát tinh, có cát tinh",
    note: "Mùi tốt hơn Sửu; tuổi Bính, Mậu, Tân thượng cách",
  },
  { lifeBranches: ["Sửu", "Mùi"], match: "any", opposite: ["Vũ Khúc", "Tham Lang"], key: "nôn nóng, hấp tấp" },
  { lifeBranches: ["Sửu", "Mùi"], match: "all", opposite: ["Thiên Đồng", "Cự Môn"], key: "khôn khéo, tình cảm trắc trở" },
  {
    lifeBranches: ["Dần", "Thân"],
    match: "any",
    opposite: ["Thái Dương", "Cự Môn"],
    key: "quản tiền tốt, bảo thủ",
    note: "'Cự Nhật đối chiếu, thực lộc trì danh' khi hai sao miếu",
  },
  { lifeBranches: ["Dần", "Thân"], match: "any", opposite: ["Thiên Cơ", "Thái Âm"], key: "hào sảng, hay bị hiểu lầm", note: "Dần may hơn Thân" },
  {
    lifeBranches: ["Dần", "Thân"],
    match: "all",
    opposite: ["Thiên Đồng", "Thiên Lương"],
    key: "Cự Nhật củng chiếu cách (như KB ghi)",
    note: "tên cách không khớp Đồng Lương, nghi lỗi chép",
  },
  { lifeBranches: ["Mão", "Dậu"], match: "any", opposite: ["Thiên Cơ", "Cự Môn"], key: "tử tế; có sát kị thì nham hiểm" },
  {
    lifeBranches: ["Mão", "Dậu"],
    match: "any",
    opposite: ["Tử Vi", "Tham Lang"],
    key: "thận trọng thực tế",
    note: "Phủ Tướng ở tam phương → 'Phủ Tướng triều viên cách'",
  },
  { lifeBranches: ["Mão", "Dậu"], match: "any", opposite: ["Thái Dương", "Thiên Lương"], key: "hao tâm tổn trí", note: "Dậu may mắn, Mão không" },
  { lifeBranches: ["Thìn", "Tuất"], match: "any", opposite: ["Thiên Cơ", "Thiên Lương"], key: "ăn nói khéo; cát → doanh nhân lớn; sát kị → gian trá" },
  { lifeBranches: ["Tỵ", "Hợi"], match: "any", opposite: ["Liêm Trinh", "Tham Lang"], key: "phúc nông cạn, về già sung sướng" },
];

export const LIFE_PARTNER_ROLES: ReadonlyArray<{ readonly lifeBranches: readonly [BranchName, BranchName]; readonly sixCombination: PalaceRole; readonly sixHarm: PalaceRole }> = [
  { lifeBranches: ["Tý", "Ngọ"], sixCombination: "Phụ Mẫu", sixHarm: "Tật Ách" },
  { lifeBranches: ["Sửu", "Mùi"], sixCombination: "Huynh Đệ", sixHarm: "Nô Bộc" },
  { lifeBranches: ["Dần", "Thân"], sixCombination: "Tử Tức", sixHarm: "Điền Trạch" },
  { lifeBranches: ["Mão", "Dậu"], sixCombination: "Tật Ách", sixHarm: "Phụ Mẫu" },
  { lifeBranches: ["Thìn", "Tuất"], sixCombination: "Nô Bộc", sixHarm: "Huynh Đệ" },
  { lifeBranches: ["Tỵ", "Hợi"], sixCombination: "Điền Trạch", sixHarm: "Tử Tức" },
];

export const SICKNESS_VERSUS_LIFE: Readonly<Record<"tứ sinh" | "tứ bại" | "tứ mộ", string>> = {
  "tứ sinh": "Tật Ách không đả động đến cung Mệnh",
  "tứ bại": "Tật Ách nhị hợp Mệnh — bệnh tật tác động mọi mặt",
  "tứ mộ": "Tật Ách nhị hợp Phu Thê; chịu yếu tố di truyền",
};

export const FOUR_BIRTH: readonly BranchName[] = ["Dần", "Thân", "Tỵ", "Hợi"];
export const FOUR_PEAK: readonly BranchName[] = ["Tý", "Ngọ", "Mão", "Dậu"];
export const FOUR_TOMB: readonly BranchName[] = ["Thìn", "Tuất", "Sửu", "Mùi"];
