import { mod } from "../calendar/stem-branch.js";
import { flankingPalaces, threeSidesFourSquares } from "../calendar/relations.js";
import type { PalaceRole } from "../chart/palaces.js";
import type { Brightness, Chart, Palace, PlacedStar, Transformation } from "../chart/types.js";

export const MAIN_STARS = [
  "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ",
  "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân",
] as const;

export const SIX_LUCKY_STARS = ["Tả Phụ", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt"] as const;
export const SIX_MALEFIC_STARS = ["Kình Dương", "Đà La", "Địa Không", "Địa Kiếp", "Hỏa Tinh", "Linh Tinh"] as const;

export const STRONG_BRIGHTNESS: readonly Brightness[] = ["Miếu", "Vượng", "Đắc"];

const TRANSFORMATION_ALIASES: Readonly<Record<string, Transformation>> = {
  "Hóa Lộc": "Hóa Lộc",
  "Hóa Quyền": "Hóa Quyền",
  "Hóa Khoa": "Hóa Khoa",
  "Hóa Kỵ": "Hóa Kỵ",
  "Hóa Kị": "Hóa Kỵ",
};

export const asTransformation = (name: string): Transformation | undefined => TRANSFORMATION_ALIASES[name.normalize("NFC")];

export const palaceAt = (chart: Chart, branch: number): Palace => chart.palaces[mod(branch, 12)]!;

export const palaceByRole = (chart: Chart, role: PalaceRole): Palace => chart.palaces.find((palace) => palace.role === role)!;

export const lifePalace = (chart: Chart): Palace => palaceAt(chart, chart.parameters.lifePalace);
export const bodyPalace = (chart: Chart): Palace => palaceAt(chart, chart.parameters.bodyPalace);

export const starsIn = (palace: Palace): readonly PlacedStar[] => palace.stars;

export const mainStarsIn = (palace: Palace): readonly PlacedStar[] => palace.stars.filter((star) => star.group === "chính tinh");

export const hasStarIn = (palace: Palace, name: string): boolean => {
  const transformation = asTransformation(name);
  if (transformation) return palace.stars.some((star) => star.transformation === transformation);
  return palace.stars.some((star) => star.name === name);
};

export const findStar = (chart: Chart, name: string): PlacedStar | undefined =>
  chart.palaces.flatMap((palace) => palace.stars).find((star) => star.name === name);

export const palacesOfStar = (chart: Chart, name: string): readonly number[] =>
  chart.palaces.filter((palace) => hasStarIn(palace, name)).map((palace) => palace.branch);

export const brightnessOf = (chart: Chart, name: string): Brightness | undefined => findStar(chart, name)?.brightness;

export const isVoidOfMainStars = (palace: Palace): boolean => mainStarsIn(palace).length === 0;

export interface PalaceGroup {
  readonly self: Palace;
  readonly trines: readonly [Palace, Palace];
  readonly opposite: Palace;
  readonly all: readonly Palace[];
}

export function threeSidesOf(chart: Chart, branch: number): PalaceGroup {
  const squares = threeSidesFourSquares(branch);
  const self = palaceAt(chart, squares.self);
  const trines = [palaceAt(chart, squares.trines[0]), palaceAt(chart, squares.trines[1])] as const;
  const opposite = palaceAt(chart, squares.opposite);
  return { self, trines, opposite, all: [self, ...trines, opposite] };
}

export const flankingOf = (chart: Chart, branch: number): readonly [Palace, Palace] => {
  const [before, after] = flankingPalaces(branch);
  return [palaceAt(chart, before), palaceAt(chart, after)];
};

export const starsInGroup = (group: readonly Palace[], names: readonly string[]): readonly string[] =>
  names.filter((name) => group.some((palace) => hasStarIn(palace, name)));

export const isFlankedBy = (chart: Chart, branch: number, first: string, second: string): boolean => {
  const [before, after] = flankingOf(chart, branch);
  return (hasStarIn(before, first) && hasStarIn(after, second)) || (hasStarIn(before, second) && hasStarIn(after, first));
};
