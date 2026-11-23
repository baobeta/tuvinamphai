import type { Element } from "../calendar/five-elements.js";
import { mod } from "../calendar/stem-branch.js";
import { locTonPalace } from "./minor-stars.js";
import type { ChartParameters, PlacedStar, StarGroup } from "./types.js";

export const BAC_SI_RING = [
  "Bác Sĩ", "Lực Sĩ", "Thanh Long", "Tiểu Hao", "Tướng Quân", "Tấu Thư",
  "Phi Liêm", "Hỷ Thần", "Bệnh Phù", "Đại Hao", "Phục Binh", "Quan Phủ",
] as const;

export const TRANG_SINH_RING = [
  "Tràng Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy",
  "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng",
] as const;

export const THAI_TUE_RING = [
  "Thái Tuế", "Thiếu Dương", "Tang Môn", "Thiếu Âm", "Quan Phù", "Tử Phù",
  "Tuế Phá", "Long Đức", "Bạch Hổ", "Phúc Đức", "Điếu Khách", "Trực Phù",
] as const;

const TRANG_SINH_START: Readonly<Record<Element, number>> = { Hỏa: 2, Mộc: 11, Kim: 5, Thủy: 8, Thổ: 8 };

export const trangSinhStart = (bureauElement: Element): number => TRANG_SINH_START[bureauElement];

const ring = (names: readonly string[], group: StarGroup, start: number, direction: 1 | -1): readonly PlacedStar[] =>
  names.map((name, i) => ({ name, group, palace: mod(start + direction * i, 12) }));

export function placeRings(params: ChartParameters): readonly PlacedStar[] {
  const direction = params.forward ? 1 : -1;
  return [
    ...ring(BAC_SI_RING, "vòng Bác Sĩ", locTonPalace(params.year.stem), direction),
    ...ring(TRANG_SINH_RING, "vòng Tràng Sinh", trangSinhStart(params.bureau.element), direction),
    ...ring(THAI_TUE_RING, "vòng Thái Tuế", params.year.branch, 1),
  ];
}
