import { trineGroup } from "../calendar/relations.js";
import { mod, tuanVoidBranches } from "../calendar/stem-branch.js";
import { palaceOfRole } from "./palaces.js";
import type { ChartOptions, ChartParameters, PlacedStar } from "./types.js";

type BranchByTrine = readonly [number, number, number, number];

const byTrine = (yearBranch: number, table: BranchByTrine): number => table[trineGroup(yearBranch)]!;

const KHOI_VIET_BY_STEM: ReadonlyArray<readonly [number, number]> = [
  [1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [6, 2], [6, 2], [3, 5], [3, 5],
];
const KHOI_VIET_CANH_MLTC: readonly [number, number] = [1, 7];

const LOC_TON_BY_STEM: readonly number[] = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];

const THIEN_QUAN_PHUC_BY_STEM: ReadonlyArray<readonly [number, number]> = [
  [7, 9], [4, 8], [5, 0], [2, 11], [3, 3], [9, 2], [11, 6], [9, 5], [10, 6], [6, 5],
];

const LUU_HA_THIEN_TRU_BY_STEM: ReadonlyArray<readonly [number, number]> = [
  [9, 5], [10, 6], [7, 0], [4, 5], [5, 6], [6, 8], [8, 2], [3, 6], [11, 9], [2, 10],
];

const VAN_TINH_BY_STEM: readonly number[] = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];

const HOA_LINH_START: ReadonlyArray<readonly [number, number]> = [
  [2, 10],
  [3, 10],
  [1, 3],
  [9, 10],
];
const HOA_LINH_START_TY_DAU_SUU_TONG: readonly [number, number] = [10, 3];

export const locTonPalace = (yearStem: number): number => LOC_TON_BY_STEM[mod(yearStem, 10)]!;

export const thienMaPalace = (yearBranch: number): number => byTrine(yearBranch, [2, 11, 8, 5]);

export const trietPalaces = (yearStem: number): readonly [number, number] => {
  const first = mod(8 - 2 * mod(yearStem, 5), 12);
  return [first, first + 1];
};

export const hongLoanPalace = (yearBranch: number): number => mod(3 - yearBranch, 12);

export function khoiVietPalaces(yearStem: number, options: ChartOptions): readonly [number, number] {
  const isCanh = mod(yearStem, 10) === 6;
  return isCanh && options.khoiVietForCanh === "MLTC" ? KHOI_VIET_CANH_MLTC : KHOI_VIET_BY_STEM[mod(yearStem, 10)]!;
}

export function hoaLinhPalaces(params: ChartParameters, options: ChartOptions): { hoa: number; linh: number } {
  const yearBranch = params.year.branch;
  const useSongVariant = trineGroup(yearBranch) === 1 && options.hoaLinhForTyDauSuu === "Tống";
  const [hoaStart, linhStart] = useSongVariant ? HOA_LINH_START_TY_DAU_SUU_TONG : HOA_LINH_START[trineGroup(yearBranch)]!;
  const direction = params.forward ? 1 : -1;
  return {
    hoa: mod(hoaStart + direction * params.hour, 12),
    linh: mod(linhStart - direction * params.hour, 12),
  };
}

const star = (name: string, palace: number): PlacedStar => ({ name, group: "phụ tinh", palace: mod(palace, 12) });

export function placeMinorStars(params: ChartParameters, options: ChartOptions): readonly PlacedStar[] {
  const { year, month, day, hour, lifePalace, bodyPalace } = params;
  const stem = mod(year.stem, 10);
  const branch = year.branch;
  const monthStep = month - 1;
  const dayStep = day - 1;
  const [khoi, viet] = khoiVietPalaces(stem, options);
  const vanXuong = mod(10 - hour, 12);
  const vanKhuc = mod(4 + hour, 12);
  const taPhu = mod(4 + monthStep, 12);
  const huuBat = mod(10 - monthStep, 12);
  const locTon = locTonPalace(stem);
  const [thienQuan, thienPhuc] = THIEN_QUAN_PHUC_BY_STEM[stem]!;
  const [luuHa, thienTru] = LUU_HA_THIEN_TRU_BY_STEM[stem]!;
  const phuongCac = mod(10 - branch, 12);
  const hongLoan = hongLoanPalace(branch);
  const { hoa, linh } = hoaLinhPalaces(params, options);
  const season = Math.floor(mod(branch - 2, 12) / 3);
  const phaToaiByGroup: readonly number[] = [5, 1, 9];

  return [
    star("Thiên Khôi", khoi),
    star("Thiên Việt", viet),
    star("Văn Xương", vanXuong),
    star("Văn Khúc", vanKhuc),
    star("Ân Quang", vanXuong + dayStep - 1),
    star("Thiên Quý", vanKhuc - dayStep + 1),
    star("Thai Phụ", vanKhuc + 2),
    star("Phong Cáo", vanKhuc - 2),
    star("Tả Phụ", taPhu),
    star("Hữu Bật", huuBat),
    star("Tam Thai", taPhu + dayStep),
    star("Bát Tọa", huuBat - dayStep),
    star("Lộc Tồn", locTon),
    star("Kình Dương", locTon + 1),
    star("Đà La", locTon - 1),
    star("Quốc Ấn", locTon + 8),
    star("Đường Phù", locTon - 7),
    star("Thiên Quan", thienQuan),
    star("Thiên Phúc", thienPhuc),
    star("Lưu Hà", luuHa),
    star("Thiên Trù", thienTru),
    star("LN Văn Tinh", VAN_TINH_BY_STEM[stem]!),
    star("Thiên Mã", thienMaPalace(branch)),
    star("Đào Hoa", byTrine(branch, [9, 6, 3, 0])),
    star("Hoa Cái", byTrine(branch, [4, 1, 10, 7])),
    star("Kiếp Sát", byTrine(branch, [5, 2, 11, 8])),
    star("Lưu Tù", byTrine(branch, [0, 1, 6, 3])),
    star("Long Trì", 4 + branch),
    star("Phượng Các", phuongCac),
    star("Giải Thần", phuongCac),
    star("Thiên Khốc", 6 - branch),
    star("Thiên Hư", 6 + branch),
    star("Thiên Đức", 9 + branch),
    star("Nguyệt Đức", 5 + branch),
    star("Hồng Loan", hongLoan),
    star("Thiên Hỷ", hongLoan + 6),
    star("Thiên Tài", lifePalace + branch),
    star("Thiên Thọ", bodyPalace + branch),
    star("Cô Thần", 5 + 3 * season),
    star("Quả Tú", 1 + 3 * season),
    star("Phá Toái", phaToaiByGroup[mod(branch, 3)]!),
    star("Thiên Không", branch + 1),
    star("Thiên Khố", 2 - monthStep),
    star("Thiên Giải", 8 + monthStep),
    star("Địa Giải", 7 + monthStep),
    star("Thiên Hình", 9 + monthStep),
    star("Thiên Diêu", 1 + monthStep),
    star("Thiên Y", 1 + monthStep),
    star("Địa Kiếp", 11 + hour),
    star("Địa Không", 11 - hour),
    star("Hỏa Tinh", hoa),
    star("Linh Tinh", linh),
    star("Đẩu Quân", branch - monthStep + hour),
    star("Thiên Thương", palaceOfRole(lifePalace, "Nô Bộc")),
    star("Thiên Sứ", palaceOfRole(lifePalace, "Tật Ách")),
    star("Thiên La", 4),
    star("Địa Võng", 10),
  ];
}

export function placeTuanTriet(params: ChartParameters): readonly PlacedStar[] {
  const tuan = tuanVoidBranches(params.year);
  const triet = trietPalaces(params.year.stem);
  return [
    ...tuan.map((palace): PlacedStar => ({ name: "Tuần", group: "Tuần Triệt", palace })),
    ...triet.map((palace): PlacedStar => ({ name: "Triệt", group: "Tuần Triệt", palace: mod(palace, 12) })),
  ];
}
