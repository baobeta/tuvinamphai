import type { Element } from "./five-elements.js";
import { sexagenaryIndex, type StemBranch } from "./stem-branch.js";

const NAYIN_NAMES = [
  "Hải Trung Kim", "Lư Trung Hỏa", "Đại Lâm Mộc", "Lộ Bàng Thổ", "Kiếm Phong Kim",
  "Sơn Đầu Hỏa", "Giản Hạ Thủy", "Thành Đầu Thổ", "Bạch Lạp Kim", "Dương Liễu Mộc",
  "Tuyền Trung Thủy", "Ốc Thượng Thổ", "Tích Lịch Hỏa", "Tùng Bách Mộc", "Trường Lưu Thủy",
  "Sa Trung Kim", "Sơn Hạ Hỏa", "Bình Địa Mộc", "Bích Thượng Thổ", "Kim Bạch Kim",
  "Phú Đăng Hỏa", "Thiên Hà Thủy", "Đại Trạch Thổ", "Thoa Xuyến Kim", "Tang Đố Mộc",
  "Đại Khê Thủy", "Sa Trung Thổ", "Thiên Thượng Hỏa", "Thạch Lựu Mộc", "Đại Hải Thủy",
] as const;

export interface Nayin {
  readonly name: string;
  readonly element: Element;
}

export function nayin(stemBranch: StemBranch): Nayin {
  const name = NAYIN_NAMES[Math.floor(sexagenaryIndex(stemBranch) / 2)]!;
  return { name, element: name.split(" ").at(-1) as Element };
}

const BUREAU_NUMBERS: Readonly<Record<Element, number>> = { Thủy: 2, Mộc: 3, Kim: 4, Thổ: 5, Hỏa: 6 };
const BUREAU_NUMERALS: Readonly<Record<number, string>> = { 2: "nhị", 3: "tam", 4: "tứ", 5: "ngũ", 6: "lục" };

export interface Bureau {
  readonly element: Element;
  readonly number: number;
  readonly name: string;
}

export function bureauFromElement(element: Element): Bureau {
  const number = BUREAU_NUMBERS[element];
  return { element, number, name: `${element} ${BUREAU_NUMERALS[number]} cục` };
}
