import { mod, parseBranch } from "../calendar/stem-branch.js";
import type { Brightness, PlacedStar } from "./types.js";

export function ziweiPalace(bureauNumber: number, lunarDay: number): number {
  const quotient = Math.ceil(lunarDay / bureauNumber);
  const remainder = quotient * bureauNumber - lunarDay;
  const base = 2 + quotient - 1;
  return mod(remainder % 2 === 0 ? base + remainder : base - remainder, 12);
}

export const tianfuPalace = (ziwei: number): number => mod(4 - ziwei, 12);

const ZIWEI_GROUP: ReadonlyArray<readonly [string, number]> = [
  ["Tử Vi", 0],
  ["Thiên Cơ", -1],
  ["Thái Dương", -3],
  ["Vũ Khúc", -4],
  ["Thiên Đồng", -5],
  ["Liêm Trinh", -8],
];

const TIANFU_GROUP: ReadonlyArray<readonly [string, number]> = [
  ["Thiên Phủ", 0],
  ["Thái Âm", 1],
  ["Tham Lang", 2],
  ["Cự Môn", 3],
  ["Thiên Tướng", 4],
  ["Thiên Lương", 5],
  ["Thất Sát", 6],
  ["Phá Quân", 10],
];

const BRIGHTNESS_TABLE: Readonly<Record<string, Partial<Record<Brightness, string>>>> = {
  "Tử Vi": { Miếu: "Tý Ngọ Dần Thân", Vượng: "Thìn Tuất", Đắc: "Sửu Mùi", Bình: "Tỵ Hợi Mão Dậu" },
  "Thiên Cơ": { Miếu: "Tý Ngọ", Vượng: "Mão Dậu", Đắc: "Dần Thân", Lợi: "Thìn Tuất", Bình: "Tỵ Hợi", Hãm: "Sửu Mùi" },
  "Thái Dương": { Miếu: "Mão", Vượng: "Dần Thìn Tỵ Ngọ", Bình: "Dậu", Hãm: "Tuất Hợi Tý Sửu" },
  "Vũ Khúc": { Miếu: "Thìn Tuất Sửu Mùi", Đắc: "Mão Dậu Dần Thân", Hãm: "Tỵ Hợi" },
  "Thiên Đồng": { Miếu: "Tỵ Hợi", Vượng: "Tý Thân", Lợi: "Dần", Bình: "Mão Dậu Thìn Tuất", Hãm: "Ngọ Mùi Sửu" },
  "Liêm Trinh": { Miếu: "Dần Thân Tý Ngọ", Vượng: "Thìn Tuất Sửu Mùi", Hãm: "Tỵ Hợi Mão Dậu" },
  "Thiên Phủ": { Miếu: "Sửu Mùi Thìn Tuất Mão", Vượng: "Tý Ngọ", Đắc: "Dậu Tỵ Hợi Dần Thân" },
  "Thái Âm": { Miếu: "Hợi Tý Sửu", Vượng: "Dậu Tuất", Lợi: "Mùi Thân", Hãm: "Dần Mão Thìn Tỵ Ngọ" },
  "Tham Lang": { Miếu: "Sửu Mùi Thìn Tuất", Đắc: "Dần Thân", Bình: "Tý Ngọ", Hãm: "Mão Dậu Tỵ Hợi" },
  "Cự Môn": { Miếu: "Mão Dậu", Vượng: "Tý Ngọ Dần", Đắc: "Thân Hợi", Hãm: "Thìn Tuất Sửu Mùi Tỵ" },
  "Thiên Tướng": { Miếu: "Dần Thân", Vượng: "Tý Ngọ Thìn Tuất", Đắc: "Tỵ Hợi Sửu Mùi", Hãm: "Mão Dậu" },
  "Thiên Lương": { Miếu: "Ngọ Tuất Thìn", Vượng: "Tý Mão Dần Thân", Đắc: "Sửu Mùi", Hãm: "Tỵ Hợi Dậu" },
  "Thất Sát": { Miếu: "Dần Thân Tý Ngọ", Vượng: "Tỵ Hợi", Đắc: "Sửu Mùi", Hãm: "Mão Dậu Thìn Tuất" },
  "Phá Quân": { Miếu: "Tý Ngọ", Vượng: "Sửu Mùi", Đắc: "Thìn Tuất", Bình: "Tỵ Hợi", Hãm: "Dần Thân Mão Dậu" },
};

const branchesOf = (names: string): number[] =>
  names.split(" ").map((name) => {
    const parsed = parseBranch(name);
    return parsed.ok ? parsed.value : -1;
  });

const BRIGHTNESS_LOOKUP: ReadonlyMap<string, ReadonlyMap<number, Brightness>> = new Map(
  Object.entries(BRIGHTNESS_TABLE).map(([star, levels]) => [
    star,
    new Map(Object.entries(levels).flatMap(([level, names]) => branchesOf(names!).map((branch) => [branch, level as Brightness] as const))),
  ]),
);

export const mainStarBrightness = (star: string, branch: number): Brightness | undefined =>
  BRIGHTNESS_LOOKUP.get(star)?.get(mod(branch, 12));

export function placeMainStars(bureauNumber: number, lunarDay: number): readonly PlacedStar[] {
  const ziwei = ziweiPalace(bureauNumber, lunarDay);
  const tianfu = tianfuPalace(ziwei);
  const place = (anchor: number) => ([name, offset]: readonly [string, number]): PlacedStar => {
    const palace = mod(anchor + offset, 12);
    const brightness = mainStarBrightness(name, palace);
    return { name, group: "chính tinh", palace, ...(brightness ? { brightness } : {}) };
  };
  return [...ZIWEI_GROUP.map(place(ziwei)), ...TIANFU_GROUP.map(place(tianfu))];
}
