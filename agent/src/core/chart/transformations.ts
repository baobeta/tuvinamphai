import { mod } from "../calendar/stem-branch.js";
import type { ChartOptions, PlacedStar, Transformation } from "./types.js";

export const TRANSFORMATION_ORDER: readonly Transformation[] = ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"];

type FourStars = readonly [string, string, string, string];

const BASE_TABLE: readonly FourStars[] = [
  ["Liêm Trinh", "Phá Quân", "Vũ Khúc", "Thái Dương"],
  ["Thiên Cơ", "Thiên Lương", "Tử Vi", "Thái Âm"],
  ["Thiên Đồng", "Thiên Cơ", "Văn Xương", "Liêm Trinh"],
  ["Thái Âm", "Thiên Đồng", "Thiên Cơ", "Cự Môn"],
  ["Tham Lang", "Thái Âm", "Hữu Bật", "Thiên Cơ"],
  ["Vũ Khúc", "Tham Lang", "Thiên Lương", "Văn Khúc"],
  ["Thái Dương", "Vũ Khúc", "Thiên Đồng", "Thái Âm"],
  ["Cự Môn", "Thái Dương", "Văn Khúc", "Văn Xương"],
  ["Thiên Lương", "Tử Vi", "Tả Phụ", "Vũ Khúc"],
  ["Phá Quân", "Cự Môn", "Thái Âm", "Tham Lang"],
];

const CANH_MLTC: FourStars = ["Thái Dương", "Vũ Khúc", "Thái Âm", "Thiên Đồng"];

export function transformationStars(yearStem: number, options: ChartOptions): FourStars {
  const stem = mod(yearStem, 10);
  if (stem === 6 && options.transformationsForCanh === "MLTC") return CANH_MLTC;
  const base = BASE_TABLE[stem]!;
  if (stem === 8) return [base[0], base[1], options.khoaStarForNham, base[3]];
  return base;
}

export function applyTransformations(stars: readonly PlacedStar[], yearStem: number, options: ChartOptions): readonly PlacedStar[] {
  const targets = transformationStars(yearStem, options);
  const transformationOf = new Map(targets.map((name, i) => [name, TRANSFORMATION_ORDER[i]!]));
  return stars.map((placed) => {
    const transformation = placed.group === "Tuần Triệt" ? undefined : transformationOf.get(placed.name);
    return transformation ? { ...placed, transformation } : placed;
  });
}
