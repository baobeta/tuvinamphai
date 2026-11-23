import { nayin, bureauFromElement, type Bureau } from "../calendar/nayin.js";
import { firstMonthStem, mod } from "../calendar/stem-branch.js";

export const PALACE_ROLES = [
  "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc",
  "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ",
] as const;

export type PalaceRole = (typeof PALACE_ROLES)[number];

export const ROLE_OFFSET: Readonly<Record<PalaceRole, number>> = Object.fromEntries(
  PALACE_ROLES.map((role, i) => [role, i]),
) as Record<PalaceRole, number>;

export const monthPalace = (lunarMonth: number): number => mod(lunarMonth + 1, 12);

export const lifePalaceOf = (lunarMonth: number, hourBranch: number): number => mod(monthPalace(lunarMonth) - hourBranch, 12);
export const bodyPalaceOf = (lunarMonth: number, hourBranch: number): number => mod(monthPalace(lunarMonth) + hourBranch, 12);

export const roleOfPalace = (lifePalace: number, branch: number): PalaceRole => PALACE_ROLES[mod(branch - lifePalace, 12)]!;
export const palaceOfRole = (lifePalace: number, role: PalaceRole): number => mod(lifePalace + ROLE_OFFSET[role], 12);

export const palaceStem = (yearStem: number, branch: number): number => mod(firstMonthStem(yearStem) + mod(branch - 2, 12), 10);

export const bureauOf = (yearStem: number, lifePalace: number): Bureau =>
  bureauFromElement(nayin({ stem: palaceStem(yearStem, lifePalace), branch: lifePalace }).element);

export const isForward = (yearStem: number, gender: "nam" | "nữ"): boolean => (mod(yearStem, 2) === 0) === (gender === "nam");

export const polarityLabel = (yearStem: number, gender: "nam" | "nữ"): string =>
  `${mod(yearStem, 2) === 0 ? "Dương" : "Âm"} ${gender === "nam" ? "Nam" : "Nữ"}`;
